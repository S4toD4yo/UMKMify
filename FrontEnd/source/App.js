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

/* The files picked in the drop zone, shared with Save & Publish so it can
   put them in the multipart request. Only ever mutated in place, never
   reassigned, so both sides keep seeing the same array. */
const selectedProductImages = [];

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

            const imageUrl = URL.createObjectURL(image);

            card.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="Product image ${index + 1}"
                    class="productImageCardPreview"
                >
            `;
        });
    }

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
    categorySelect.addEventListener("change", () => {
        const category = categories.find(
            (item) => String(item.id) === categorySelect.value
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
    });
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
function validationMessage(data) {
    if (data && data.errors) {
        return Object.values(data.errors)
            .flat()
            .join("\n");
    }

    return (data && data.message) || "Failed to publish product.";
}

// Save & Publish
function setupSavePublish() {
    const button = document.querySelector(".savePublishButton");

    if (!button) {
        return;
    }

    button.addEventListener("click", async () => {
        const token = tokenStore.get();

        if (!token) {
            window.location.href = "../User/login.html";
            return;
        }

        const fields = {
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

        // multipart/form-data rather than JSON: the product images are real
        // files, and JSON has nowhere to put them.
        const form = new FormData();

        Object.entries(fields).forEach(([field, value]) => {
            form.append(field, value);
        });

        selectedProductImages.forEach((image) => {
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

                alert(validationMessage(data));

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
                    href="../Error/comingSoon.html"
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

setupProductCategories();

setupProductImageUpload();

setupLoginForm();
setupRegisterForm();

setupNavbarAuthentication();
setupSellerNavbarAuthentication();

setupListProductButton();

setupProductList();

setupAuthPageGuard();