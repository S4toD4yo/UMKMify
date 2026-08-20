import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFooter from "@/components/AuthFooter.jsx";
import PasswordInput from "@/components/PasswordInput.jsx";
import { useAuth } from "@/hooks/useAuth";
import { useBodyClass } from "@/hooks/useBodyClass";
import logo from "@assets/images/Logo - Orange.svg";

export default function Register() {
    useBodyClass("registerAuthBody");

    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmation: "",
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    function update(field) {
        return (event) =>
            setForm((current) => ({ ...current, [field]: event.target.value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setErrors({});

        /* Caught here rather than at the API: the two fields are right next
           to each other, and a round trip to be told they differ is a poor
           way to find out. */
        if (form.password !== form.confirmation) {
            setErrors({
                password_confirmation: "Password confirmation does not match.",
            });

            return;
        }

        setSubmitting(true);

        const result = await register({
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            password_confirmation: form.confirmation,
        });

        setSubmitting(false);

        if (!result.ok) {
            setErrors(result.errors);
            return;
        }

        navigate("/", { replace: true });
    }

    return (
        <>
            <div className="registerBranding">
                <img src={logo} alt="UMKMify" className="registerLogo" />

                <h3 className="registerBrandingTitle">
                    Breaking Digital Boundaries, Elevating Local Business.
                </h3>
            </div>

            {/* Register Container */}
            <div className="registerContainer">
                <h1 className="registerTitle">Create Your Account</h1>

                <h3 className="registerSubtitle">Let’s get started with UMKMify</h3>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="registerFormGrid">
                        {/* Username */}
                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Username</h3>

                            <input
                                type="text"
                                className="registerFormInput"
                                placeholder="Create your username"
                                autoComplete="username"
                                tabIndex={1}
                                value={form.username}
                                onChange={update("username")}
                            />

                            <p className="authFieldError">{errors.username ?? ""}</p>
                        </div>

                        {/* Password */}
                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Password</h3>

                            <PasswordInput
                                wrapperClass="registerPasswordWrapper"
                                inputClass="registerFormInput"
                                toggleClass="registerPasswordToggle"
                                placeholder="Enter your password"
                                autoComplete="new-password"
                                tabIndex={3}
                                value={form.password}
                                onChange={update("password")}
                            />

                            <p className="authFieldError">{errors.password ?? ""}</p>
                        </div>

                        {/* Email */}
                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Email</h3>

                            <input
                                type="email"
                                className="registerFormInput"
                                placeholder="Enter your email address"
                                autoComplete="email"
                                tabIndex={2}
                                value={form.email}
                                onChange={update("email")}
                            />

                            <p className="authFieldError">{errors.email ?? ""}</p>
                        </div>

                        {/* Re-enter Password */}
                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Re-enter Password</h3>

                            <PasswordInput
                                wrapperClass="registerPasswordWrapper"
                                inputClass="registerFormInput"
                                toggleClass="registerPasswordToggle"
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                tabIndex={4}
                                value={form.confirmation}
                                onChange={update("confirmation")}
                            />

                            <p className="authFieldError">
                                {errors.password_confirmation ?? ""}
                            </p>
                        </div>
                    </div>

                    <p className="authFormError">{errors.form ?? ""}</p>

                    <button
                        type="submit"
                        className="registerSignUpButton"
                        tabIndex={5}
                        disabled={submitting}
                    >
                        {submitting ? "Signing Up..." : "Sign Up"}
                    </button>
                </form>

                <p className="registerSignInText">
                    Already have an account?{" "}
                    <Link to="/login" className="registerSignInLink">
                        Sign In
                    </Link>{" "}
                    now
                </p>
            </div>

            <AuthFooter style={{ marginTop: "64px" }} />
        </>
    );
}
