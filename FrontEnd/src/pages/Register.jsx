import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFooter from "@/components/AuthFooter";
import PasswordInput from "@/components/PasswordInput";
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
        password_confirmation: "",
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const update = (field) => (event) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
    };

    async function handleSubmit(event) {
        event.preventDefault();

        if (form.password !== form.password_confirmation) {
            setErrors({
                password_confirmation: "Konfirmasi password tidak cocok.",
            });
            return;
        }

        setSubmitting(true);
        setErrors({});

        const { ok, errors: responseErrors } = await register(form);

        setSubmitting(false);

        if (!ok) {
            setErrors(responseErrors);
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

            <div className="registerContainer">
                <h1 className="registerTitle">Create Your Account</h1>

                <h3 className="registerSubtitle">
                    Let&rsquo;s get started with UMKMify
                </h3>

                <form id="registerForm" onSubmit={handleSubmit} noValidate>
                    <div className="registerFormGrid">
                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Username</h3>

                            <input
                                type="text"
                                className="registerFormInput"
                                placeholder="Create your username"
                                value={form.username}
                                onChange={update("username")}
                                autoComplete="username"
                                tabIndex={1}
                                required
                            />

                            {errors.username && (
                                <p className="authFieldError">
                                    {errors.username}
                                </p>
                            )}
                        </div>

                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Password</h3>

                            <PasswordInput
                                wrapperClass="registerPasswordWrapper"
                                inputClass="registerFormInput"
                                toggleClass="registerPasswordToggle"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={update("password")}
                                autoComplete="new-password"
                                tabIndex={3}
                                required
                            />

                            {errors.password && (
                                <p className="authFieldError">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="registerFormField">
                            <h3 className="registerFormLabel">Email</h3>

                            <input
                                type="email"
                                className="registerFormInput"
                                placeholder="Enter your email address"
                                value={form.email}
                                onChange={update("email")}
                                autoComplete="email"
                                tabIndex={2}
                                required
                            />

                            {errors.email && (
                                <p className="authFieldError">{errors.email}</p>
                            )}
                        </div>

                        <div className="registerFormField">
                            <h3 className="registerFormLabel">
                                Re-enter Password
                            </h3>

                            <PasswordInput
                                wrapperClass="registerPasswordWrapper"
                                inputClass="registerFormInput"
                                toggleClass="registerPasswordToggle"
                                placeholder="Re-enter your password"
                                value={form.password_confirmation}
                                onChange={update("password_confirmation")}
                                autoComplete="new-password"
                                tabIndex={4}
                                required
                            />

                            {errors.password_confirmation && (
                                <p className="authFieldError">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>
                    </div>

                    {errors.form && (
                        <p className="authFormError">{errors.form}</p>
                    )}

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
