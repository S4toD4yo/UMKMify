import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthFooter from "@/components/AuthFooter";
import PasswordInput from "@/components/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { useBodyClass } from "@/hooks/useBodyClass";
import decoration from "@assets/images/Something.png";
import logo from "@assets/images/Logo - Orange.svg";

export default function Login() {
    useBodyClass("loginAuthBody");

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ identifier: "", password: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const update = (field) => (event) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});

        const { ok, errors: responseErrors } = await login(form);

        setSubmitting(false);

        if (!ok) {
            setErrors(responseErrors);
            return;
        }

        // Send the user back where they were headed before the redirect.
        navigate(location.state?.from ?? "/", { replace: true });
    }

    return (
        <>
            <div className="Decoration">
                <img src={decoration} alt="" className="Decoration" />
            </div>

            <div className="loginLogo">
                <img src={logo} alt="UMKMify" className="theLogo" />

                <p className="logoDescription">
                    Breaking Digital Boundaries, Elevating Local Business.
                </p>
            </div>

            <form className="loginContainer" onSubmit={handleSubmit} noValidate>
                <h1 className="loginTitle">Welcome Back!</h1>

                <p className="loginSubtitle">
                    Login to continue your journey with UMKMify
                </p>

                <div className="loginFormField">
                    <h3 className="loginFormLabel">Username or email address</h3>

                    <input
                        type="text"
                        className="loginFormInput"
                        placeholder="Enter your username or email address"
                        value={form.identifier}
                        onChange={update("identifier")}
                        autoComplete="username"
                        tabIndex={1}
                        required
                    />

                    {errors.identifier && (
                        <p className="authFieldError">{errors.identifier}</p>
                    )}
                </div>

                <div className="loginFormField">
                    <div className="loginPasswordLabel">
                        <h3 className="loginFormLabel">Password</h3>

                        <Link to="/coming-soon" className="forgotPassword">
                            Forgot Password?
                        </Link>
                    </div>

                    <PasswordInput
                        wrapperClass="loginPasswordWrapper"
                        inputClass="loginFormInput"
                        toggleClass="loginPasswordToggle"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={update("password")}
                        autoComplete="current-password"
                        tabIndex={2}
                        required
                    />

                    {errors.password && (
                        <p className="authFieldError">{errors.password}</p>
                    )}
                </div>

                {errors.form && <p className="authFormError">{errors.form}</p>}

                <button
                    type="submit"
                    className="loginSignInButton"
                    tabIndex={3}
                    disabled={submitting}
                >
                    {submitting ? "Signing In..." : "Sign In"}
                </button>

                <p className="loginSignUpText">
                    Don&apos;t have an account?{" "}
                    <Link to="/register" className="loginSignUpLink">
                        Sign Up
                    </Link>{" "}
                    now
                </p>
            </form>

            <AuthFooter />
        </>
    );
}
