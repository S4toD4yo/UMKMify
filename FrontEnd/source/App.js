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
/* Purchases                                                               */
/* ----------------------------------------------------------------------- */

/* purchases.html — the shopper's own order history. Signed in only: the API
   scopes orders to whoever placed them. */

/* Schema.md's fulfillment lifecycle, in the order it runs. `null` is the
   "everything" tab. */
const PURCHASE_TABS = [
    { status: null, label: "All", key: "total" },
    { status: "pending", label: "Pending", key: "pending" },
    { status: "processing", label: "Processing", key: "processing" },
    { status: "shipped", label: "Shipped", key: "shipped" },
    { status: "completed", label: "Completed", key: "completed" },
    { status: "cancelled", label: "Cancelled", key: "cancelled" },
];

// "20 Aug 2026, 19:04" — an order needs the time as well as the day.
function formatOrderDate(value) {
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
    }) + ", " + date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// "pending" -> "Pending", for the badge.
function titleCase(value) {
    const text = String(value || "");

    return text.charAt(0).toUpperCase() + text.slice(1);
}

function purchaseItemMarkup(item) {
    const name = escapeHtml(item.name);

    const image = item.image
        ? `<span class="purchaseItemImage"><img src="${escapeHtml(item.image)}" alt=""></span>`
        : `<span class="purchaseItemImage isEmpty"><img src="../../assets/icons/SellerCentre/Image.svg" alt=""></span>`;

    const meta = [
        item.sku,
        `${item.quantity} × ${formatRupiah(item.unit_price)}`,
    ].filter(Boolean).join(" · ");

    const body = `
        ${image}

        <span class="purchaseItemText">
            <p class="purchaseItemName">${name}</p>
            <p class="purchaseItemMeta">${escapeHtml(meta)}</p>
        </span>

        <p class="purchaseItemSubtotal">${formatRupiah(item.subtotal)}</p>
    `;

    /* Only a product still on sale gets a link. Delisted ones stay on the
       receipt but lead nowhere, because the product page would 404. */
    return item.still_listed
        ? `<a href="product.html?id=${item.product_id}" class="purchaseItem">${body}</a>`
        : `<div class="purchaseItem">${body}</div>`;
}

function purchaseCardMarkup(order) {
    const stores = (order.stores || [])
        .map((store) => {
            const meta = [store.shipping_method, titleCase(store.status)]
                .filter(Boolean)
                .join(" · ");

            return `
                <div class="purchaseStore">
                    <p class="purchaseStoreName">${escapeHtml(store.store || "UMKMify Seller")}</p>
                    <p class="purchaseStoreMeta">${escapeHtml(meta)}</p>

                    ${(store.items || []).map(purchaseItemMarkup).join("")}
                </div>
            `;
        })
        .join("");

    const payment = order.payment;

    const paymentBadge = payment
        ? `<span class="purchaseBadge ${escapeHtml(payment.status)}">${escapeHtml(
            `${payment.method || "Payment"} · ${titleCase(payment.status)}`
        )}</span>`
        : "";

    const shipping = order.shipping || {};

    const shipTo = [
        shipping.recipient_name,
        shipping.address,
        shipping.city,
        shipping.province,
        shipping.postal_code,
    ].filter(Boolean).join(", ");

    return `
        <article class="purchaseCard">

            <div class="purchaseCardHeader">
                <p class="purchaseCardNumber">${escapeHtml(order.order_number)}</p>
                <p class="purchaseCardDate">${escapeHtml(formatOrderDate(order.placed_at))}</p>

                ${paymentBadge}

                <span class="purchaseBadge ${escapeHtml(order.status)}">${escapeHtml(titleCase(order.status))}</span>
            </div>

            ${stores}

            <div class="purchaseCardFooter">
                <p class="purchaseCardShipping">${escapeHtml(shipTo)}</p>

                <p class="purchaseCardTotalLabel">Total</p>
                <p class="purchaseCardTotal">${formatRupiah(order.total_amount)}</p>
            </div>

        </article>
    `;
}

function setupPurchases() {
    const list = document.getElementById("purchasesList");
    const state = document.getElementById("purchasesState");
    const tabs = document.getElementById("purchasesTabs");

    if (!list || !state) {
        return;
    }

    let activeStatus = null;

    function showState(message) {
        list.innerHTML = "";

        state.hidden = false;
        state.textContent = message;
    }

    /* Counts come from the whole history, not from the filtered rows, so a
       tab keeps saying what is behind it while another one is open. */
    function renderTabs(summary) {
        if (!tabs) {
            return;
        }

        tabs.innerHTML = PURCHASE_TABS
            .map((tab) => `
                <button
                    type="button"
                    class="purchasesTab${tab.status === activeStatus ? " active" : ""}"
                    data-status="${tab.status ?? ""}"
                >
                    ${escapeHtml(tab.label)} (${summary[tab.key] ?? 0})
                </button>
            `)
            .join("");

        tabs.querySelectorAll(".purchasesTab").forEach((button) => {
            button.addEventListener("click", () => {
                activeStatus = button.dataset.status || null;
                loadOrders();
            });
        });
    }

    async function loadOrders() {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        showState("Loading your purchases...");

        const query = activeStatus ? `?status=${encodeURIComponent(activeStatus)}` : "";

        let response;

        try {
            response = await fetch(`${API_BASE}/orders${query}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Failed to load purchases:", error);

            showState("Unable to reach the server. Please make sure Laravel is running.");

            return;
        }

        if (response.status === 401) {
            tokenStore.clear();
            window.location.href = "login.html";
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error("Failed to load purchases:", data);

            showState(data.message || "Failed to load your purchases.");

            return;
        }

        renderTabs(data.summary || {});

        const orders = data.orders || [];

        if (!orders.length) {
            showState(
                activeStatus
                    ? "No orders in this status yet."
                    : "You have not bought anything yet."
            );

            return;
        }

        state.hidden = true;
        list.innerHTML = orders.map(purchaseCardMarkup).join("");
    }

    loadOrders();
}


/* ----------------------------------------------------------------------- */
/* Checkout                                                                */
/* ----------------------------------------------------------------------- */

/* checkout.html, reached from Buy it now. Signed in only: it reads the
   shopper's saved addresses and writes an order against their account.

   Nothing here posts a price. The page shows what things cost, but the API
   recomputes every number from the database when the order is placed —
   a total in a request body is a total the shopper can edit. */

/* The choice the page is currently holding, read back when Place Order is
   pressed. */
const checkoutSelection = {
    productId: null,
    quantity: 1,
    shippingMethodId: null,
    paymentMethodId: null,
    addressId: null,
};

function checkoutOptionMarkup(name, option, meta, checked) {
    return `
        <label class="checkoutOption${checked ? " selected" : ""}">
            <input
                type="radio"
                name="${name}"
                value="${option.id}"
                ${checked ? "checked" : ""}
            >

            <span class="checkoutOptionText">
                <span class="checkoutOptionName">${escapeHtml(option.name)}</span>
                ${meta ? `<span class="checkoutOptionMeta">${escapeHtml(meta)}</span>` : ""}
            </span>
        </label>
    `;
}

/* The radios are real inputs so the keyboard works; the class only carries
   the selected look. */
function bindCheckoutOptions(container, onChange) {
    container.querySelectorAll("input[type=radio]").forEach((radio) => {
        radio.addEventListener("change", () => {
            container.querySelectorAll(".checkoutOption").forEach((option) => {
                option.classList.toggle(
                    "selected",
                    option.contains(radio) && radio.checked
                );
            });

            onChange(Number(radio.value));
        });
    });
}

function renderCheckoutItem(item) {
    const slot = document.getElementById("checkoutItem");

    if (!slot) {
        return;
    }

    const image = item.image
        ? `<span class="checkoutItemImage"><img src="${escapeHtml(item.image)}" alt=""></span>`
        : `<span class="checkoutItemImage isEmpty"><img src="../../assets/icons/SellerCentre/Image.svg" alt=""></span>`;

    const meta = [
        item.store,
        `${item.quantity} ${item.unit || ""} × ${formatRupiah(item.price)}`.trim(),
    ].filter(Boolean).join(" · ");

    slot.innerHTML = `
        ${image}

        <span class="checkoutItemText">
            <p class="checkoutItemName">${escapeHtml(item.name)}</p>
            <p class="checkoutItemMeta">${escapeHtml(meta)}</p>
            <p class="checkoutItemSubtotal">${formatRupiah(item.subtotal)}</p>
        </span>
    `;
}

/* Recomputed on the page purely so the shopper can see the courier they
   picked change the total. The order's real total is worked out server side. */
function renderCheckoutSummary(data) {
    const summary = document.getElementById("checkoutSummary");

    if (!summary) {
        return;
    }

    const shipping = (data.shipping_methods || [])
        .find((method) => method.id === checkoutSelection.shippingMethodId);

    const subtotal = Number(data.item.price) * checkoutSelection.quantity;
    const shippingFee = Number(shipping ? shipping.fee : 0);
    const discount = Number(data.discount_amount) || 0;
    const serviceFee = Number(data.service_fee) || 0;

    const rows = [
        ["Subtotal", formatRupiah(subtotal)],
        ["Shipping Fee", formatRupiah(shippingFee)],
        ["Service Fee", formatRupiah(serviceFee)],
    ];

    if (discount > 0) {
        rows.splice(1, 0, ["Discount", "- " + formatRupiah(discount)]);
    }

    summary.innerHTML = rows
        .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
        .join("") + `
            <dt class="checkoutSummaryTotal">Total</dt>
            <dd class="checkoutSummaryTotal">${formatRupiah(
                subtotal - discount + shippingFee + serviceFee
            )}</dd>
        `;
}

/* The saved address picker, plus the form it hides and shows. "Use a new
   address" is always an option, because a shopper's first order has nothing
   to pick from. */
function renderCheckoutAddresses(addresses) {
    const field = document.getElementById("checkoutSavedAddressField");
    const select = document.getElementById("checkoutSavedAddress");
    const form = document.getElementById("checkoutAddressForm");

    if (!field || !select || !form) {
        return;
    }

    if (!addresses.length) {
        checkoutSelection.addressId = null;
        return;
    }

    select.innerHTML = addresses
        .map((address) => `
            <option value="${address.id}">
                ${escapeHtml(`${address.label} — ${address.recipient_name}, ${address.address_line}, ${address.city}`)}
            </option>
        `)
        .join("") + '<option value="">Use a new address</option>';

    // The API sorts the default one first.
    checkoutSelection.addressId = addresses[0].id;

    field.hidden = false;
    form.hidden = true;

    select.addEventListener("change", () => {
        checkoutSelection.addressId = select.value ? Number(select.value) : null;

        form.hidden = checkoutSelection.addressId !== null;
    });
}

function readCheckoutAddressForm() {
    const value = (id) => document.getElementById(id).value.trim();

    return {
        recipient_name: value("checkoutRecipientName"),
        phone: value("checkoutPhone"),
        address_line: value("checkoutAddressLine"),
        address_line_2: value("checkoutAddressLine2"),
        province: value("checkoutProvince"),
        city: value("checkoutCity"),
        postal_code: value("checkoutPostalCode"),
    };
}

function showCheckoutState(message) {
    const state = document.getElementById("checkoutPageState");

    document.querySelectorAll(".checkoutSection").forEach((section) => {
        section.hidden = true;
    });

    if (state) {
        state.hidden = false;
        state.textContent = message;
    }
}

async function setupCheckout() {
    const state = document.getElementById("checkoutPageState");

    if (!state) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product");

    if (!productId) {
        showCheckoutState("No product was selected.");
        return;
    }

    const token = tokenStore.get();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const quantity = params.get("qty") || "";

    let response;

    try {
        response = await fetch(
            `${API_BASE}/checkout?product_id=${encodeURIComponent(productId)}&quantity=${encodeURIComponent(quantity)}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch (error) {
        console.error("Failed to load the checkout:", error);

        showCheckoutState(
            "Unable to reach the server. Please make sure Laravel is running."
        );

        return;
    }

    if (response.status === 401) {
        tokenStore.clear();
        window.location.href = "login.html";
        return;
    }

    if (response.status === 404) {
        showCheckoutState("This product is no longer available.");
        return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.item) {
        console.error("Failed to load the checkout:", data);

        showCheckoutState(data.message || "Failed to load the checkout.");

        return;
    }

    if (!data.item.quantity) {
        showCheckoutState("This product is out of stock.");
        return;
    }

    checkoutSelection.productId = data.item.product_id;
    checkoutSelection.quantity = data.item.quantity;

    const shippingMethods = data.shipping_methods || [];
    const paymentMethods = data.payment_methods || [];

    // Preselected so the summary has a total to show on arrival.
    checkoutSelection.shippingMethodId = shippingMethods.length ? shippingMethods[0].id : null;
    checkoutSelection.paymentMethodId = paymentMethods.length ? paymentMethods[0].id : null;

    renderCheckoutAddresses(data.addresses || []);
    renderCheckoutItem(data.item);

    const shippingSlot = document.getElementById("checkoutShippingOptions");
    const paymentSlot = document.getElementById("checkoutPaymentOptions");

    if (shippingSlot) {
        shippingSlot.innerHTML = shippingMethods
            .map((method, index) => checkoutOptionMarkup(
                "checkoutShipping",
                method,
                formatRupiah(method.fee),
                index === 0
            ))
            .join("");

        bindCheckoutOptions(shippingSlot, (id) => {
            checkoutSelection.shippingMethodId = id;
            renderCheckoutSummary(data);
        });
    }

    if (paymentSlot) {
        paymentSlot.innerHTML = paymentMethods
            .map((method, index) => checkoutOptionMarkup(
                "checkoutPayment",
                method,
                method.type,
                index === 0
            ))
            .join("");

        bindCheckoutOptions(paymentSlot, (id) => {
            checkoutSelection.paymentMethodId = id;
        });
    }

    renderCheckoutSummary(data);

    state.hidden = true;

    document.querySelectorAll(".checkoutSection").forEach((section) => {
        section.hidden = false;
    });

    setupPlaceOrder(data);
}

function setupPlaceOrder(data) {
    const button = document.getElementById("checkoutPlaceOrder");
    const errorSlot = document.getElementById("checkoutError");

    if (!button) {
        return;
    }

    button.addEventListener("click", async () => {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        if (errorSlot) {
            errorSlot.textContent = "";
        }

        const payload = {
            product_id: checkoutSelection.productId,
            quantity: checkoutSelection.quantity,
            shipping_method_id: checkoutSelection.shippingMethodId,
            payment_method_id: checkoutSelection.paymentMethodId,
        };

        if (checkoutSelection.addressId) {
            payload.address_id = checkoutSelection.addressId;
        } else {
            Object.assign(payload, readCheckoutAddressForm());
        }

        button.disabled = true;
        button.textContent = "Placing Order...";

        try {
            const response = await fetch(`${API_BASE}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => ({}));

            if (response.status === 401) {
                tokenStore.clear();
                window.location.href = "login.html";
                return;
            }

            if (!response.ok) {
                console.error("Failed to place the order:", result);

                /* Stock can run out between opening the page and pressing
                   the button, so these are shown on the page rather than
                   swallowed. */
                if (errorSlot) {
                    errorSlot.textContent = validationMessage(
                        result,
                        "Failed to place your order."
                    );
                } else {
                    alert(validationMessage(result, "Failed to place your order."));
                }

                return;
            }

            alert(
                `Order placed successfully!\nOrder number: ${result.order.order_number}`
            );

            window.location.href = "purchases.html";

        } catch (error) {
            console.error("Failed to connect to Laravel API:", error);

            if (errorSlot) {
                errorSlot.textContent =
                    "Unable to connect to the server. Please make sure Laravel is running.";
            }

        } finally {
            button.disabled = false;
            button.textContent = "Place Order";
        }
    });
}


/* ----------------------------------------------------------------------- */
/* Product Page                                                            */
/* ----------------------------------------------------------------------- */

/* product.html, reached from a homepage card. Public like the homepage, so
   no token goes with the request.

   The markup is a static mockup with placeholder content, and every hook
   below is a class already in it — nothing here adds ids or restructures the
   page, so restyling it stays safe. */

/* The gallery, wired over however many images the product actually has: the
   mockup draws three thumbnails, a real product has one to five. */
function renderProductGallery(product) {
    const main = document.querySelector(".productGalleryMain");
    const thumbs = document.querySelector(".productGalleryThumbs");

    if (!main) {
        return;
    }

    const images = product.images || [];
    const name = escapeHtml(product.name);

    // Listing a photo is optional, so this really does happen.
    if (!images.length) {
        main.classList.add("isEmpty");
        main.innerHTML = '<img src="../../assets/icons/SellerCentre/Image.svg" alt="">';

        if (thumbs) {
            thumbs.innerHTML = "";
        }

        return;
    }

    main.classList.remove("isEmpty");

    function showImage(index) {
        main.innerHTML = `<img src="${escapeHtml(images[index].url)}" alt="${name}">`;

        if (!thumbs) {
            return;
        }

        thumbs.querySelectorAll(".productGalleryThumb").forEach((thumb, position) => {
            thumb.classList.toggle("active", position === index);
        });
    }

    if (thumbs) {
        // One image has nothing to switch between, so it gets no thumbnails.
        thumbs.innerHTML = images.length > 1
            ? images
                .map((image, index) => `
                    <button
                        class="productGalleryThumb"
                        type="button"
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
    }

    showImage(0);
}

/* The quantity stepper and the Total Harga that follows it.

   The bounds come from the product, not from the markup: `minimum_purchase`
   is the floor the seller set, and `stock` is the ceiling, so the page cannot
   offer more than there is. */
function setupProductQuantity(product) {
    const value = document.querySelector(".productQuantityValue");
    const total = document.querySelector(".productTotalPriceValue");
    const buttons = [...document.querySelectorAll(".productQuantityButton")];

    const actions = [
        document.querySelector(".productAddToCartButton"),
        document.querySelector(".productBuyNowButton"),
    ].filter(Boolean);

    if (!value) {
        return;
    }

    const stock = Number(product.stock) || 0;
    const minimum = Math.max(1, Number(product.minimum_purchase) || 1);
    const price = Number(product.price) || 0;

    /* Sold out is its own state: there is no quantity to pick, so the
       stepper and both actions go dead rather than offering a purchase the
       stock cannot cover. */
    const soldOut = stock <= 0;

    // A minimum above the remaining stock is the seller's to fix; until then
    // the ceiling wins, because stock is the harder limit of the two.
    const floor = soldOut ? 0 : Math.min(minimum, stock);

    let quantity = floor;

    function render() {
        value.textContent = quantity;

        if (total) {
            total.textContent = formatRupiah(price * quantity);
        }

        // The mockup's two buttons are minus then plus, in that order.
        const [minus, plus] = buttons;

        if (minus) {
            minus.disabled = soldOut || quantity <= floor;
        }

        if (plus) {
            plus.disabled = soldOut || quantity >= stock;
        }

        actions.forEach((action) => {
            action.disabled = soldOut;
        });
    }

    buttons.forEach((button, index) => {
        button.addEventListener("click", () => {
            if (soldOut) {
                return;
            }

            quantity += index === 0 ? -1 : 1;
            quantity = Math.min(stock, Math.max(floor, quantity));

            render();
        });
    });

    render();
}

/* Buy it now goes straight to the checkout with what the shopper picked.
   Add to Cart still cannot: umkmify.sql has orders but no cart table, so
   there is nowhere to put a held item. */
function setupProductPurchaseActions(product) {
    const addToCart = document.querySelector(".productAddToCartButton");
    const buyNow = document.querySelector(".productBuyNowButton");

    if (addToCart) {
        addToCart.addEventListener("click", () => {
            if (addToCart.disabled) {
                return;
            }

            window.location.href = "../Error/comingSoon.html";
        });
    }

    if (buyNow) {
        buyNow.addEventListener("click", () => {
            if (buyNow.disabled) {
                return;
            }

            /* Checkout needs a signed in shopper — it reads their saved
               addresses and writes an order against their account. */
            if (!tokenStore.get()) {
                window.location.href = "login.html";
                return;
            }

            const quantity =
                document.querySelector(".productQuantityValue")?.textContent.trim() || "1";

            window.location.href =
                `checkout.html?product=${product.id}&qty=${encodeURIComponent(quantity)}`;
        });
    }
}

function renderProductDetail(product) {
    document.title = `${product.name} | UMKMify`;

    const name = document.querySelector(".productDetailName");
    const price = document.querySelector(".productDetailPrice");
    const sold = document.querySelector(".productDetailSold");

    // textContent throughout: this is seller input on a public page.
    if (name) {
        name.textContent = product.name;
    }

    if (price) {
        price.textContent = formatRupiah(product.price);
    }

    if (sold) {
        sold.textContent = `${Number(product.sold) || 0} Terjual`;
    }

    renderProductGallery(product);
    setupProductQuantity(product);
    setupProductPurchaseActions(product);
}

/* Loading and error both replace the detail block, so the page never sits
   there showing the mockup's placeholder content as if it were real. */
function showProductPageState(message) {
    const detail = document.querySelector(".productDetail");

    if (!detail) {
        return;
    }

    detail.innerHTML = `<p class="productPageState">${escapeHtml(message)}</p>`;
}

async function setupProductDetail() {
    const detail = document.querySelector(".productDetail");

    if (!detail) {
        return;
    }

    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) {
        showProductPageState("No product was selected.");
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

        showProductPageState(
            "Unable to reach the server. Please make sure Laravel is running."
        );

        return;
    }

    // 404 also covers a product that was taken off sale, which is deliberate:
    // a shopper has no business seeing an unlisted product either way.
    if (response.status === 404) {
        showProductPageState("This product is no longer available.");
        return;
    }

    if (!response.ok) {
        console.error("Failed to load the product:", response.status);

        showProductPageState("Failed to load this product.");

        return;
    }

    const data = await response.json().catch(() => ({}));

    if (!data.product) {
        showProductPageState("Failed to load this product.");
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

setupCheckout();

setupPurchases();

setupProductList();

setupAuthPageGuard();