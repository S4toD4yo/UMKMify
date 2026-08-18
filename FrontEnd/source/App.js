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