function setupPasswordToggle(inputId, toggleId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const passwordToggle = document.getElementById(toggleId);
    const passwordIcon = document.getElementById(iconId);

    if (!passwordInput || !passwordToggle || !passwordIcon) {
        return;
    }

    passwordToggle.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";

        passwordIcon.src = isPassword
            ? "../../assets/icons/EyeSlash.svg"
            : "../../assets/icons/Eye.svg";

        passwordToggle.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
}

setupPasswordToggle(
    "loginPassword",
    "loginPasswordToggle",
    "loginPasswordIcon"
);

setupPasswordToggle(
    "registerPassword",
    "registerPasswordToggle",
    "registerPasswordIcon"
);

setupPasswordToggle(
    "registerConfirmPassword",
    "registerConfirmPasswordToggle",
    "registerConfirmPasswordIcon"
);

/* ----------------------------------------------------------------------- */
/* Authentication                                                          */
/* ----------------------------------------------------------------------- */

// The pages are served by Apache on http://localhost while the API runs on
// artisan serve, so requests are cross-origin. The origin is whitelisted in
// BackEnd/config/cors.php via FRONTEND_URL. Swap this for the Railway URL
// when deploying.
const API_BASE = "http://127.0.0.1:8000/api";

const TOKEN_KEY = "umkmify.token";

const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Clear every error slot inside a form.
 */
function clearErrors(form) {
    form.querySelectorAll(".authFieldError, .authFormError").forEach((slot) => {
        slot.textContent = "";
    });
}

/**
 * Paint a Laravel error bag into the matching slots. Anything without a slot
 * of its own falls back to the form-level message.
 */
function showErrors(form, errors, fieldSlots) {
    const leftovers = [];

    Object.entries(errors).forEach(([field, message]) => {
        const slot = fieldSlots[field] && document.getElementById(fieldSlots[field]);

        if (slot) {
            slot.textContent = message;
        } else {
            leftovers.push(message);
        }
    });

    if (leftovers.length) {
        const formSlot = form.querySelector(".authFormError");

        if (formSlot) {
            formSlot.textContent = leftovers.join(" ");
        }
    }
}

/**
 * POST JSON and normalise both Laravel's 422 bag and network failures into
 * a single { ok, data, errors } shape.
 */
async function postJson(path, payload) {
    let response;

    try {
        response = await fetch(API_BASE + path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });
    } catch {
        return {
            ok: false,
            errors: {
                _form: "Don't forget to run the Laravel development server.",
            },
        };
    }

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
        return { ok: true, data };
    }

    if (data.errors) {
        return {
            ok: false,
            errors: Object.fromEntries(
                Object.entries(data.errors).map(([field, messages]) => [
                    field,
                    messages[0],
                ])
            ),
        };
    }

    if (response.status === 429) {
        return {
            ok: false,
            errors: {
                _form: "Too many attempts. Wait a moment and try again.",
            },
        };
    }

    return {
        ok: false,
        errors: {
            _form: data.message || "An error occurred.",
        },
    };
}

/**
 * Run an auth request with the submit button locked while it is in flight.
 */
async function submitAuth(form, button, busyLabel, request) {
    const originalLabel = button.textContent.trim();

    button.disabled = true;
    button.textContent = busyLabel;

    try {
        return await request();
    } finally {
        button.disabled = false;
        button.textContent = originalLabel;
    }
}

function setupLoginForm() {
    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginSubmit");

    if (!form || !button) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearErrors(form);

        const payload = {
            identifier: document.getElementById("loginIdentifier").value.trim(),
            password: document.getElementById("loginPassword").value,
        };

        const result = await submitAuth(form, button, "Signing In...", () =>
            postJson("/auth/login", payload)
        );

        if (!result.ok) {
            showErrors(form, result.errors, {
                identifier: "loginIdentifierError",
                password: "loginPasswordError",
            });
            return;
        }

        tokenStore.set(result.data.token);
        window.location.href = "./homePage.html";
    });
}

function setupRegisterForm() {
    const form = document.getElementById("registerForm");
    const button = document.getElementById("registerSubmit");

    if (!form || !button) {
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearErrors(form);

        const password = document.getElementById("registerPassword").value;
        const confirmation = document.getElementById("registerConfirmPassword").value;

        if (password !== confirmation) {
            document.getElementById("registerConfirmPasswordError").textContent =
                "Password confirmation does not match.";
            return;
        }

        const payload = {
            username: document.getElementById("registerUsername").value.trim(),
            email: document.getElementById("registerEmail").value.trim(),
            password,
            password_confirmation: confirmation,
        };

        const result = await submitAuth(form, button, "Signing Up...", () =>
            postJson("/auth/register", payload)
        );

        if (!result.ok) {
            showErrors(form, result.errors, {
                username: "registerUsernameError",
                email: "registerEmailError",
                password: "registerPasswordError",
                password_confirmation: "registerConfirmPasswordError",
            });
            return;
        }

        tokenStore.set(result.data.token);
        window.location.href = "./homePage.html";
    });
}

/* ----------------------------------------------------------------------- */
/* Navbar Authentication                                                   */
/* ----------------------------------------------------------------------- */

async function setupNavbarAuthentication() {
    const navbarAuth = document.getElementById("navbarAuth");

    if (!navbarAuth) {
        return;
    }

    const token = tokenStore.get();

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            tokenStore.clear();
            return;
        }

        const data = await response.json();
        const user = data.user;

        if (!user) {
            return;
        }

        const username = user.username || "User";
        const initial = username.charAt(0).toUpperCase();

        navbarAuth.innerHTML = `
            <div class="profileMenu">
                <a
                    class="profileButton"
                    aria-label="Open profile"
                    title="${username}"
                >
                    ${initial}
                </a>

                <div class="profileDropdown">
                    <a
                        href="purchases.html"
                        class="profileDropdownItem"
                    >
                        Purchases
                    </a>

                    <a
                        href="cart.html"
                        class="profileDropdownItem"
                    >
                        Cart
                    </a>

                    <a
                        href="../Seller/dashboard.html"
                        class="profileDropdownItem"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Seller Centre
                    </a>

                    <button
                        type="button"
                        class="profileDropdownItem signOut"
                        id="signOutButton"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        `;

        setupSignOut();
    } catch (error) {
        console.error("Failed to load authenticated user:", error);
    }
}

/* ----------------------------------------------------------------------- */
/* Seller Navbar Authentication                                            */
/* ----------------------------------------------------------------------- */

async function setupSellerNavbarAuthentication() {
    const sellerNavbarAuth = document.getElementById("sellerNavbarAuth");

    if (!sellerNavbarAuth) {
        return;
    }

    const token = tokenStore.get();

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            tokenStore.clear();
            return;
        }

        const data = await response.json();
        const user = data.user;

        if (!user) {
            return;
        }

        const username = user.username || "User";
        const initial = username.charAt(0).toUpperCase();

        sellerNavbarAuth.innerHTML = `
            <div class="sellerProfileMenu">

                <a
                    class="sellerProfileButton"
                    aria-label="Open profile"
                    title="${username}"
                >
                    ${initial}
                </a>

                <div class="sellerProfileDropdown">

                    <button
                        type="button"
                        class="sellerSignOutButton"
                        id="sellerSignOutButton"
                    >
                        Sign Out
                    </button>

                </div>

            </div>
        `;

        setupSellerSignOut();

    } catch (error) {
        console.error(
            "Failed to load Seller Centre authentication:",
            error
        );
    }
}

/* ----------------------------------------------------------------------- */
/* List Product Button                                                     */
/* ----------------------------------------------------------------------- */

function setupListProductButton() {
    const listProductButton = document.getElementById("listProductButton");

    if (!listProductButton) {
        return;
    }

    const token = tokenStore.get();
    
    // Testing
    // console.log("List Product Button:", listProductButton);
    // console.log("Authentication Token:", token);

    if (token) {
        listProductButton.href = "../Seller/newProduct.html";
        // console.log("User is authenticated. Redirecting to Seller Centre.");
    } else {
        listProductButton.href = "login.html";
        // console.log("User is not authenticated. Redirecting to Login.");
    }

    // console.log("Final Button URL:", listProductButton.href);
}

// Sign Out Button

async function setupSignOut() {
    const signOutButton = document.getElementById("signOutButton");

    if (!signOutButton) {
        return;
    }

    signOutButton.addEventListener("click", async () => {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        signOutButton.disabled = true;
        signOutButton.textContent = "Signing Out...";

        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Failed to sign out:", error);
        } finally {
            tokenStore.clear();
            window.location.href = "homePage.html";
        }
    });
}

// Seller Sign Out

async function setupSellerSignOut() {
    const signOutButton = document.getElementById("sellerSignOutButton");

    if (!signOutButton) {
        return;
    }

    signOutButton.addEventListener("click", async () => {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        signOutButton.disabled = true;
        signOutButton.textContent = "Signing Out...";

        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Failed to sign out:", error);
        } finally {
            tokenStore.clear();
            window.location.href = "../User/homePage.html";
        }
    });
}

/* ----------------------------------------------------------------------- */
/* Authentication Page Guard                                               */
/* ----------------------------------------------------------------------- */

async function setupAuthPageGuard() {
    const currentPage = window.location.pathname.toLowerCase();

    const isLoginPage = currentPage.endsWith("/login.html");
    const isRegisterPage = currentPage.endsWith("/register.html");

    if (!isLoginPage && !isRegisterPage) {
        return;
    }

    const token = tokenStore.get();

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            window.location.href = "./homePage.html";
            return;
        }

        tokenStore.clear();
    } catch (error) {
        console.error(
            "Failed to verify authentication state:",
            error
        );
    }
}


/* ----------------------------------------------------------------------- */
/* Product Image Drop Zone                                                 */
/* ----------------------------------------------------------------------- */

/* What the five drop zone cards are showing, shared with the save buttons
   so they can put it in the multipart request. Only ever mutated in place,
   never reassigned, so every side keeps seeing the same array.

   An entry is either a File the seller just picked, or — on Edit Product —
   an { id, url } for an image the product already has on the server. */
const selectedProductImages = [];

/* Set by setupProductImageUpload(), so Edit Product can repaint the cards
   after dropping the product's own images into the array. */
let renderProductImageCards = null;

/* Matches `images.*` => max:2048 on the API side, and the "Max 2MB" note
   printed inside the drop zone. */
const MAX_PRODUCT_IMAGE_BYTES = 2 * 1024 * 1024;

function setupProductImageUpload() {
    const dropZone = document.getElementById("productImageDropZone");
    const fileInput = document.getElementById("productImageInput");
    const imageCards = document.querySelectorAll(".productImageCard");

    if (!dropZone || !fileInput || !imageCards.length) {
        return;
    }

    const productImages = selectedProductImages;

    function renderImageCards() {
        imageCards.forEach((card, index) => {
            const image = productImages[index];

            if (!image) {
                card.innerHTML = `
                    <img
                        src="../../assets/icons/SellerCentre/Image.svg"
                        alt=""
                        class="productImageCardIcon"
                    >
                `;

                return;
            }

            // A File has to be turned into a URL; an image already on the
            // server came with one.
            const imageUrl = image instanceof File
                ? URL.createObjectURL(image)
                : image.url;

            card.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="Product image ${index + 1}"
                    class="productImageCardPreview"
                >
            `;
        });
    }

    renderProductImageCards = renderImageCards;

    function addImages(files) {
        const imageFiles = Array.from(files)
            .filter((file) => file.type.startsWith("image/"));

        // Caught here rather than after the whole form has been filled in and
        // the API rejects the upload.
        const tooLarge = imageFiles
            .filter((file) => file.size > MAX_PRODUCT_IMAGE_BYTES);

        if (tooLarge.length) {
            alert(
                "These images are larger than 2MB and were skipped:\n" +
                tooLarge.map((file) => file.name).join("\n")
            );
        }

        const accepted = imageFiles
            .filter((file) => file.size <= MAX_PRODUCT_IMAGE_BYTES);

        const remainingSlots = imageCards.length - productImages.length;

        productImages.push(
            ...accepted.slice(0, remainingSlots)
        );

        renderImageCards();
    }

    /* Click to Upload */
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    /* File Picker */
    fileInput.addEventListener("change", () => {
        addImages(fileInput.files);

        fileInput.value = "";
    });

    /* Drag Over */
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();

        dropZone.classList.add("dragover");
    });

    /* Drag Leave */
    dropZone.addEventListener("dragleave", (event) => {
        if (!dropZone.contains(event.relatedTarget)) {
            dropZone.classList.remove("dragover");
        }
    });

    /* Drop */
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();

        dropZone.classList.remove("dragover");

        addImages(event.dataTransfer.files);
    });

    /* Remove Image */
    imageCards.forEach((card, index) => {
        card.addEventListener("click", () => {
            if (!productImages[index]) {
                return;
            }

            productImages.splice(index, 1);

            renderImageCards();
        });
    });
}

// Price Decimal
const sellingPriceInput = document.getElementById("sellingPrice");

if (sellingPriceInput) {
    sellingPriceInput.addEventListener("input", () => {
        let value = sellingPriceInput.value.replace(/\D/g, "");

        if (value === "") {
            value = "0";
        }

        sellingPriceInput.value = Number(value).toLocaleString("id-ID");
    });
}

/* ----------------------------------------------------------------------- */
/* Product Categories                                                      */
/* ----------------------------------------------------------------------- */

/* Both selects are filled from GET /api/categories rather than hardcoded in
   the markup, so the ids always match what the database actually has. */

/* Resolves once the selects are filled. Edit Product waits on it before
   preselecting, otherwise it would be setting a value on an empty select. */
let productCategoriesReady = null;

/* Set by setupProductCategories(): picks a category and, once that category's
   sub categories have been built, the sub category under it. Stays null when
   the categories request fails. */
let selectProductCategory = null;

async function setupProductCategories() {
    const categorySelect = document.getElementById("productCategory");
    const subcategorySelect = document.getElementById("productSubCategory");

    if (!categorySelect || !subcategorySelect) {
        return;
    }

    /* Clears a select back to a single disabled placeholder. */
    function resetSelect(select, placeholder, disabled) {
        select.innerHTML = "";

        const option = document.createElement("option");

        option.value = "";
        option.selected = true;
        option.disabled = true;
        option.textContent = placeholder;

        select.appendChild(option);
        select.disabled = disabled;
    }

    /* textContent, not innerHTML: category names are data, and "Belts &
       Wallets" has to stay readable either way. */
    function addOption(select, value, label) {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = label;

        select.appendChild(option);
    }

    let categories = [];

    try {
        const response = await fetch(`${API_BASE}/categories`, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Categories request failed: ${response.status}`);
        }

        const data = await response.json();

        categories = data.categories || [];
    } catch (error) {
        console.error("Failed to load categories:", error);

        resetSelect(categorySelect, "Failed to load categories", false);
        resetSelect(subcategorySelect, "Select Category First", true);

        return;
    }

    resetSelect(categorySelect, "Select Category", false);

    categories.forEach((category) => {
        addOption(categorySelect, category.id, category.name);
    });

    /* The API rejects a sub category that does not sit under the chosen
       category, so the options are rebuilt on every change. */
    function renderSubcategories(categoryId) {
        const category = categories.find(
            (item) => String(item.id) === String(categoryId)
        );

        const subcategories = category ? category.subcategories : [];

        if (!subcategories.length) {
            resetSelect(subcategorySelect, "No Sub Category", true);
            return;
        }

        resetSelect(subcategorySelect, "Select Sub Category", false);

        subcategories.forEach((subcategory) => {
            addOption(subcategorySelect, subcategory.id, subcategory.name);
        });
    }

    categorySelect.addEventListener("change", () => {
        renderSubcategories(categorySelect.value);
    });

    selectProductCategory = (categoryId, subcategoryId) => {
        if (!categoryId) {
            return;
        }

        categorySelect.value = String(categoryId);

        // Not fired by setting .value, so the sub categories are built by hand.
        renderSubcategories(categoryId);

        if (subcategoryId) {
            subcategorySelect.value = String(subcategoryId);
        }
    };
}


/* ----------------------------------------------------------------------- */
/* Product Status                                                          */
/* ----------------------------------------------------------------------- */

function setupProductStatus() {
    const statusButtons = document.querySelectorAll(".productStatusButton");

    if (!statusButtons.length) {
        return;
    }

    statusButtons.forEach((button) => {
        button.addEventListener("click", () => {

            statusButtons.forEach((statusButton) => {
                statusButton.classList.remove(
                    "active",
                    "nonActive"
                );
            });

            const status = button.dataset.status;

            if (status === "active") {
                button.classList.add("active");
            }

            if (status === "nonactive") {
                button.classList.add("nonActive");
            }
        });
    });
}

/* A 422 comes back as { message, errors: { field: [...] } }, where `message`
   is only the first error plus "(and 3 more errors)". Listing them all
   matters most for the images, which fail one file at a time. */
function validationMessage(data, fallback) {
    if (data && data.errors) {
        return Object.values(data.errors)
            .flat()
            .join("\n");
    }

    return (data && data.message) || fallback || "Failed to save product.";
}

/* Add New Product and Edit Product are the same form, so both read it the
   same way and the two cannot drift apart. */
function readProductForm() {
    return {
        name: document.getElementById("productName").value.trim(),
        sku: document.getElementById("productSku").value.trim(),

        // Left as the raw select value. An untouched select reads "",
        // which the API turns into null; Number("") would send 0, and
        // there is no category 0.
        category_id:
            document.getElementById("productCategory").value,

        subcategory_id:
            document.getElementById("productSubCategory").value,

        description:
            document.getElementById("productDescription").value.trim(),

        selling_price:
            document
                .getElementById("sellingPrice")
                .value
                .replace(/\./g, ""),

        minimum_purchase:
            document.getElementById("minimumPurchase").value,

        stock:
            document.getElementById("productStock").value,

        weight:
            document.getElementById("productWeight").value,

        unit:
            document.getElementById("unitOfItem").value,

        brand:
            document.getElementById("productBrand").value.trim(),

        location:
            document.getElementById("productLocation").value.trim(),

        length:
            document.getElementById("productLength").value,

        width:
            document.getElementById("productWidth").value,

        height:
            document.getElementById("productHeight").value,

        shipping_fee_payer:
            document.getElementById("shippingFee").value,

        status:
            document.querySelector(".productStatusButton.active")
                ? "active"
                : "nonactive",
    };
}

// Save & Publish
function setupSavePublish() {
    // Edit Product wears the same bar, so the two are told apart by data-mode.
    const button = document.querySelector('.savePublishButton[data-mode="create"]');

    if (!button) {
        return;
    }

    button.addEventListener("click", async () => {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        const fields = readProductForm();

        // multipart/form-data rather than JSON: the product images are real
        // files, and JSON has nowhere to put them.
        const form = new FormData();

        Object.entries(fields).forEach(([field, value]) => {
            form.append(field, value);
        });

        // Nothing but Files here: a brand new product has no server-side
        // images to keep.
        selectedProductImages
            .filter((image) => image instanceof File)
            .forEach((image) => {
                form.append("images[]", image, image.name);
            });

        console.log(
            "Product Payload:",
            fields,
            `${selectedProductImages.length} image(s)`
        );

        button.disabled = true;
        button.textContent = "Publishing...";

        try {
            const response = await fetch(
                `${API_BASE}/products`,
                {
                    method: "POST",

                    headers: {
                        // Content-Type is left out on purpose: the browser
                        // has to set it so the multipart boundary goes with
                        // it.
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },

                    body: form,
                }
            );

            const data = await response.json().catch(() => ({}));

            console.log("Product Response:", data);

            if (!response.ok) {
                console.error(
                    "Failed to publish product:",
                    data
                );

                alert(validationMessage(data, "Failed to publish product."));

                return;
            }

            alert("Product published successfully!");

            window.location.href = "productList.html";

        } catch (error) {

            console.error(
                "Failed to connect to Laravel API:",
                error
            );

            alert(
                "Unable to connect to the server. Please make sure Laravel is running."
            );

        } finally {

            button.disabled = false;
            button.textContent = "Save & Publish";

        }
    });
}

/* ----------------------------------------------------------------------- */
/* Product Page                                                            */
/* ----------------------------------------------------------------------- */

/* product.html, reached from a homepage card. Public like the homepage, so
   no token goes with the request. */

/* Only the rows the seller actually filled in are shown: half of these are
   nullable columns, and an empty row reads as missing information rather
   than as "not applicable". */
function productDetailFacts(product) {
    const dimensions = [product.length, product.width, product.height];

    const hasDimensions = dimensions.every(
        (value) => value !== null && value !== undefined && value !== ""
    );

    return [
        ["Category", product.category],
        ["Sub Category", product.subcategory],
        ["Brand", product.brand],
        ["Minimum Purchase", product.minimum_purchase
            ? `${product.minimum_purchase} ${product.unit || ""}`.trim()
            : null],
        ["Unit", product.unit],
        ["Weight", product.weight ? `${Number(product.weight)} g` : null],
        ["Dimensions", hasDimensions
            ? dimensions.map(Number).join(" × ") + " cm"
            : null],
        ["Shipping Fee", product.shipping_fee_payer
            ? `Borne by ${product.shipping_fee_payer}`
            : null],
        ["Location", product.location],
    ].filter(([, value]) => value !== null && value !== undefined && value !== "");
}

/* The same three readings the Product List badges use, worded for a shopper
   rather than for the seller. */
function productDetailStock(stock) {
    const count = Number(stock) || 0;

    if (count <= 0) {
        return { label: "Out of stock", className: "outOfStock" };
    }

    if (count < 10) {
        return { label: `Only ${count} left in stock`, className: "lowStock" };
    }

    return { label: `${count} in stock`, className: "" };
}

function renderProductGallery(product) {
    const main = document.getElementById("productGalleryMain");
    const thumbs = document.getElementById("productGalleryThumbs");

    const images = product.images || [];

    if (!images.length) {
        main.classList.add("isEmpty");
        main.innerHTML = '<img src="../../assets/icons/SellerCentre/Image.svg" alt="">';
        thumbs.innerHTML = "";

        return;
    }

    const name = escapeHtml(product.name);

    function showImage(index) {
        main.innerHTML = `<img src="${escapeHtml(images[index].url)}" alt="${name}">`;

        thumbs.querySelectorAll(".productGalleryThumb").forEach((thumb, position) => {
            thumb.classList.toggle("active", position === index);
        });
    }

    // A single image has nothing to switch between, so it gets no thumbnails.
    thumbs.innerHTML = images.length > 1
        ? images
            .map((image, index) => `
                <button
                    type="button"
                    class="productGalleryThumb"
                    data-image-index="${index}"
                    aria-label="Show image ${index + 1}"
                >
                    <img src="${escapeHtml(image.url)}" alt="">
                </button>
            `)
            .join("")
        : "";

    thumbs.querySelectorAll(".productGalleryThumb").forEach((thumb) => {
        thumb.addEventListener("click", () => {
            showImage(Number(thumb.dataset.imageIndex));
        });
    });

    showImage(0);
}

function renderProductDetail(product) {
    document.title = `${product.name} | UMKMify`;

    const categoryPath = [product.category, product.subcategory]
        .filter(Boolean)
        .join(" · ");

    document.getElementById("productDetailCategory").textContent = categoryPath;
    document.getElementById("productDetailName").textContent = product.name;
    document.getElementById("productDetailPrice").textContent = formatRupiah(product.price);

    const stock = productDetailStock(product.stock);
    const stockSlot = document.getElementById("productDetailStock");

    stockSlot.textContent = stock.label;
    stockSlot.className = `productDetailStock ${stock.className}`.trim();

    document.getElementById("productDetailFacts").innerHTML = productDetailFacts(product)
        .map(([label, value]) => `
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
        `)
        .join("");

    const store = product.store || "UMKMify Seller";

    document.getElementById("productDetailSellerInitial").textContent =
        store.charAt(0).toUpperCase();

    document.getElementById("productDetailSellerName").textContent = store;
    document.getElementById("productDetailSellerLocation").textContent =
        product.location || "Indonesia";

    renderProductGallery(product);

    /* textContent, not innerHTML: the description is whatever the seller
       typed, and the CSS keeps its line breaks. */
    const description = document.getElementById("productDescription");

    if (product.description) {
        document.getElementById("productDescriptionText").textContent = product.description;
        description.hidden = false;
    }

    document.getElementById("productPageState").hidden = true;
    document.getElementById("productDetail").hidden = false;
}

async function setupProductDetail() {
    const detail = document.getElementById("productDetail");
    const state = document.getElementById("productPageState");

    if (!detail || !state) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) {
        state.textContent = "No product was selected.";
        return;
    }

    let response;

    try {
        response = await fetch(`${API_BASE}/catalog/products/${productId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });
    } catch (error) {
        console.error("Failed to load the product:", error);

        state.textContent =
            "Unable to reach the server. Please make sure Laravel is running.";

        return;
    }

    // 404 also covers a product that was taken off sale, which is deliberate:
    // a shopper has no business seeing an unlisted product either way.
    if (response.status === 404) {
        state.textContent = "This product is no longer available.";
        return;
    }

    if (!response.ok) {
        console.error("Failed to load the product:", response.status);

        state.textContent = "Failed to load this product.";

        return;
    }

    const data = await response.json().catch(() => ({}));

    if (!data.product) {
        state.textContent = "Failed to load this product.";
        return;
    }

    renderProductDetail(data.product);
}


/* ----------------------------------------------------------------------- */
/* Latest Products                                                         */
/* ----------------------------------------------------------------------- */

/* The Latest Product section on the homepage. Open to signed out visitors,
   so this calls the public catalogue endpoint and sends no token. */

function latestProductCardMarkup(product) {
    const name = escapeHtml(product.name);

    /* Listing a photo is optional on Add New Product, so a card without one
       falls back to the same icon the seller's drop zone uses. */
    const image = product.image
        ? `<img
                src="${escapeHtml(product.image)}"
                alt=""
                class="latestProductCardImage"
            >`
        : `<span class="latestProductCardImage latestProductCardImageEmpty">
                <img src="../../assets/icons/SellerCentre/Image.svg" alt="">
            </span>`;

    // Whichever of the two the seller filled in; both are optional columns.
    const meta = product.store || product.location || "";

    return `
        <a href="product.html?id=${product.id}" class="latestProductCard">
            ${image}

            <div class="latestProductCardBody">
                <h3 class="latestProductCardName" title="${name}">${name}</h3>

                <p class="latestProductCardPrice">${formatRupiah(product.price)}</p>

                ${meta ? `<p class="latestProductCardMeta">${escapeHtml(meta)}</p>` : ""}
            </div>
        </a>
    `;
}

async function setupLatestProducts() {
    const grid = document.getElementById("latestProductGrid");
    const emptyState = document.getElementById("latestProductEmptyState");

    if (!grid) {
        return;
    }

    let response;

    try {
        response = await fetch(`${API_BASE}/catalog/products`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });
    } catch (error) {
        console.error("Failed to load the latest products:", error);

        // The empty state is already on the page, so a failure just leaves
        // the homepage looking the way it did before anything was listed.
        return;
    }

    if (!response.ok) {
        console.error("Failed to load the latest products:", response.status);
        return;
    }

    const data = await response.json().catch(() => ({}));
    const products = data.products || [];

    if (!products.length) {
        return;
    }

    grid.innerHTML = products.map(latestProductCardMarkup).join("");
    grid.hidden = false;

    if (emptyState) {
        emptyState.hidden = true;
    }
}


/* ----------------------------------------------------------------------- */
/* Edit Product                                                            */
/* ----------------------------------------------------------------------- */

/* editProduct.html is newProduct.html with a different title and a Save
   Changes button, so everything the Add New Product form already sets up —
   the drop zone, the category selects, the status buttons, the price
   formatting — works here untouched. This only fills the form in from
   GET /api/products/{id} and posts it back with `_method=PUT`. */

// A number field shows "" for null, and "321.00" is not what a seller typed.
function fillNumberInput(id, value) {
    const input = document.getElementById(id);

    if (!input) {
        return;
    }

    input.value = value === null || value === undefined ? "" : Number(value);
}

function fillProductForm(product) {
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productSku").value = product.sku || "";
    document.getElementById("productDescription").value = product.description || "";

    // Thousand separated, the way the input's own listener would leave it.
    document.getElementById("sellingPrice").value =
        Number(product.price || 0).toLocaleString("id-ID");

    fillNumberInput("minimumPurchase", product.minimum_purchase);
    fillNumberInput("productStock", product.stock);
    fillNumberInput("productWeight", product.weight);
    fillNumberInput("productLength", product.length);
    fillNumberInput("productWidth", product.width);
    fillNumberInput("productHeight", product.height);

    document.getElementById("productBrand").value = product.brand || "";
    document.getElementById("productLocation").value = product.location || "";

    document.getElementById("unitOfItem").value = product.unit || "";
    document.getElementById("shippingFee").value = product.shipping_fee_payer || "";

    /* The same two classes setupProductStatus() toggles, and the same ones
       readProductForm() reads back. */
    const statusButtons = document.querySelectorAll(".productStatusButton");

    statusButtons.forEach((button) => {
        button.classList.remove("active", "nonActive");

        if (button.dataset.status !== product.status) {
            return;
        }

        button.classList.add(
            product.status === "active" ? "active" : "nonActive"
        );
    });

    /* The product's own images take the drop zone slots. They are kept as
       { id, url } so the save can tell the API which ones to hold on to. */
    selectedProductImages.length = 0;

    (product.images || []).forEach((image) => {
        selectedProductImages.push({ id: image.id, url: image.url });
    });

    if (renderProductImageCards) {
        renderProductImageCards();
    }
}

function setupEditProduct() {
    const button = document.querySelector('.savePublishButton[data-mode="edit"]');

    if (!button) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    // Reached without an id there is nothing to edit, so send them back to
    // the list rather than showing an empty form that cannot be saved.
    if (!productId) {
        window.location.href = "productList.html";
        return;
    }

    async function loadProduct() {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        button.disabled = true;
        button.textContent = "Loading...";

        let response;

        try {
            response = await fetch(`${API_BASE}/products/${productId}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Failed to load product:", error);

            alert(
                "Unable to connect to the server. Please make sure Laravel is running."
            );

            return;
        } finally {
            button.disabled = false;
            button.textContent = "Save Changes";
        }

        if (response.status === 401) {
            tokenStore.clear();
            window.location.href = "../User/login.html";
            return;
        }

        // 404 covers both a product that does not exist and one belonging to
        // another seller: the API does not tell the two apart on purpose.
        if (response.status === 404) {
            alert("This product could not be found.");
            window.location.href = "productList.html";
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Failed to load product:", data);

            alert(data.message || "Failed to load this product.");

            return;
        }

        const product = data.product;

        if (!product) {
            return;
        }

        fillProductForm(product);

        /* Last, and awaited: the selects are filled by a request of their
           own, and setting .value before the options exist does nothing. */
        await productCategoriesReady;

        if (selectProductCategory) {
            selectProductCategory(product.category_id, product.subcategory_id);
        }
    }

    button.addEventListener("click", async () => {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        const form = new FormData();

        /* POST, not PUT: PHP does not parse a multipart body on a real PUT,
           so Laravel is asked to spoof the method instead. */
        form.append("_method", "PUT");

        Object.entries(readProductForm()).forEach(([field, value]) => {
            form.append(field, value);
        });

        /* The images the product keeps, in the order the cards are in. An
           image the seller removed is simply not listed, which is how the
           API is told to delete it. */
        selectedProductImages
            .filter((image) => !(image instanceof File))
            .forEach((image) => {
                form.append("existing_image_ids[]", image.id);
            });

        selectedProductImages
            .filter((image) => image instanceof File)
            .forEach((image) => {
                form.append("images[]", image, image.name);
            });

        button.disabled = true;
        button.textContent = "Saving...";

        try {
            const response = await fetch(`${API_BASE}/products/${productId}`, {
                method: "POST",

                headers: {
                    // Content-Type is left out on purpose: the browser has to
                    // set it so the multipart boundary goes with it.
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },

                body: form,
            });

            const data = await response.json().catch(() => ({}));

            if (response.status === 401) {
                tokenStore.clear();
                window.location.href = "../User/login.html";
                return;
            }

            if (!response.ok) {
                console.error("Failed to save product:", data);

                alert(validationMessage(data, "Failed to save changes."));

                return;
            }

            alert("Product updated successfully!");

            window.location.href = "productList.html";

        } catch (error) {
            console.error("Failed to connect to Laravel API:", error);

            alert(
                "Unable to connect to the server. Please make sure Laravel is running."
            );

        } finally {
            button.disabled = false;
            button.textContent = "Save Changes";
        }
    });

    loadProduct();
}

/* ----------------------------------------------------------------------- */
/* Product List                                                            */
/* ----------------------------------------------------------------------- */

/* Product names, SKUs and image paths are seller input and the rows are built
   as HTML, so everything that comes back from the API goes through here. */
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[character]));
}

/* `price` is decimal(15,2) and arrives as a string ("9000000.00"). The form
   only ever takes whole rupiah, so the cents are dropped. */
function formatRupiah(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "Rp 0";
    }

    return "Rp " + amount.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

// "20 Aug 2026", matching the Created Date column in the design.
function formatProductDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function renderProductSummary(summary) {
    const slots = {
        productSummaryTotal: summary.total,
        productSummaryPublished: summary.published,
        productSummaryDraft: summary.draft,
        productSummaryOutOfStock: summary.out_of_stock,
        productSummaryNeedRestock: summary.need_restock,
    };

    Object.entries(slots).forEach(([id, value]) => {
        const slot = document.getElementById(id);

        if (slot) {
            slot.textContent = value ?? 0;
        }
    });
}

/* The Status column reads `status` and `stock` together, so one product only
   ever carries one badge:

     Nonactive        the product is not listed, and its stock says nothing
     Out of Stock     listed, stock 0
     Need to Restock  listed, stock below Product::LOW_STOCK_THRESHOLD
     Active           listed, stocked

   Nonactive wins over both stock readings on purpose: an unlisted product is
   not on sale, so warning about its stock would be a false alarm. */
function productStatusBadge(product) {
    if (!product.is_published) {
        return { label: "Nonactive", className: "nonactive" };
    }

    if (product.stock_status === "out_of_stock") {
        return { label: "Out of Stock", className: "outOfStock" };
    }

    if (product.stock_status === "low_stock") {
        return { label: "Need to Restock", className: "needRestock" };
    }

    return { label: "Active", className: "active" };
}

function productRowMarkup(product) {
    /* No image yet is a real case: the drop zone on Add New Product is
       optional, so fall back to the same icon it uses. */
    const thumbnail = product.primary_image
        ? `<img
                src="${escapeHtml(product.primary_image)}"
                alt=""
                class="productListProductImage"
            >`
        : `<span class="productListProductImage productListProductImageEmpty">
                <img src="../../assets/icons/SellerCentre/Image.svg" alt="">
            </span>`;

    // The API decides the stock bucket; this only paints it.
    const status = productStatusBadge(product);

    const name = escapeHtml(product.name);

    return `
        <div class="productListRow" data-product-id="${product.id}">
            <div class="productListProduct">
                ${thumbnail}
                <p title="${name}">${name}</p>
            </div>

            <p>${escapeHtml(product.sku)}</p>
            <p>${formatRupiah(product.price)}</p>
            <p>${Number(product.stock) || 0}</p>

            <span class="productListStatus ${status.className}">${status.label}</span>

            <p>${formatProductDate(product.created_at)}</p>

            <div class="productListActions">
                <a
                    href="editProduct.html?id=${product.id}"
                    class="productListActionButton"
                    title="Edit ${name}"
                >
                    <img
                        src="../../assets/icons/SellerCentre/PencilSimple.svg"
                        alt="Edit"
                    >
                </a>

                <button
                    class="productListActionButton"
                    type="button"
                    data-action="delete"
                    title="Delete ${name}"
                >
                    <img
                        src="../../assets/icons/SellerCentre/Trash.svg"
                        alt="Delete"
                    >
                </button>
            </div>
        </div>
    `;
}

// Loading, empty and error all share one centred line inside the table.
function showProductListState(body, message) {
    body.innerHTML = `<p class="productListState">${escapeHtml(message)}</p>`;
}

const PRODUCT_LIST_EMPTY =
    "No products yet. Use Add New Product to list your first one.";

function setupProductList() {
    const body = document.getElementById("productListBody");

    if (!body) {
        return;
    }

    async function loadProducts() {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        showProductListState(body, "Loading your products...");

        let response;

        try {
            response = await fetch(`${API_BASE}/products`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Failed to load products:", error);

            showProductListState(
                body,
                "Unable to reach the server. Please make sure Laravel is running."
            );

            return;
        }

        if (response.status === 401) {
            tokenStore.clear();
            window.location.href = "../User/login.html";
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Failed to load products:", data);

            showProductListState(
                body,
                data.message || "Failed to load your products."
            );

            return;
        }

        renderProductSummary(data.summary || {});

        const products = data.products || [];

        if (!products.length) {
            showProductListState(body, PRODUCT_LIST_EMPTY);
            return;
        }

        body.innerHTML = products.map(productRowMarkup).join("");
    }

    /* Delegated: the rows are replaced wholesale on every load, so binding
       per button would mean rebinding every time. */
    body.addEventListener("click", async (event) => {
        const button = event.target.closest('[data-action="delete"]');

        if (!button) {
            return;
        }

        const row = button.closest(".productListRow");
        const productId = row && row.dataset.productId;

        if (!productId) {
            return;
        }

        const name = row.querySelector(".productListProduct p").textContent;

        if (!window.confirm(`Delete "${name}"? This cannot be undone from here.`)) {
            return;
        }

        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/products/${productId}`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error("Failed to delete product:", data);

                alert(data.message || "Failed to delete this product.");

                button.disabled = false;

                return;
            }

            row.remove();

            // The API sends the recounted cards back, so the summary stays
            // right without a second round trip.
            renderProductSummary(data.summary || {});

            if (!body.querySelector(".productListRow")) {
                showProductListState(body, PRODUCT_LIST_EMPTY);
            }

        } catch (error) {
            console.error("Failed to delete product:", error);

            alert(
                "Unable to connect to the server. Please make sure Laravel is running."
            );

            button.disabled = false;
        }
    });

    loadProducts();
}

setupSavePublish();

setupProductStatus();

productCategoriesReady = setupProductCategories();

setupProductImageUpload();

setupEditProduct();

setupLoginForm();
setupRegisterForm();

setupNavbarAuthentication();
setupSellerNavbarAuthentication();

setupListProductButton();

setupLatestProducts();

setupProductDetail();

setupProductList();

setupAuthPageGuard();