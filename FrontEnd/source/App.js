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

setupLoginForm();
setupRegisterForm();