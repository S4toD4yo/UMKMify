import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthFooter from "@/components/AuthFooter.jsx";
import PasswordInput from "@/components/PasswordInput.jsx";
import { useAuth } from "@/hooks/useAuth";
import { useBodyClass } from "@/hooks/useBodyClass";
import decoration from "@assets/images/Something.png";
import logo from "@assets/images/Logo - Orange.svg";

export default function Login() {
    // .loginAuthBody in the prototype stylesheet paints the whole page.
    useBodyClass("loginAuthBody");

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // RequireAuth records where the shopper was headed before being bounced.
    const destination = location.state?.from
        ? location.state.from.pathname + location.state.from.search
        : "/";

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setErrors({});
        setSubmitting(true);

        const result = await login({ identifier: identifier.trim(), password });

        setSubmitting(false);

        if (!result.ok) {
            setErrors(result.errors);
            return;
        }

        navigate(destination, { replace: true });
    }

    return (
        <>
            {/* Decoration Stuff */}
            <div className="Decoration">
                <img src={decoration} alt="" className="Decoration" />
            </div>

            {/* Logo and Text */}
            <div className="loginLogo">
                <img src={logo} alt="UMKMify" className="theLogo" />

                <p className="logoDescription">
                    Breaking Digital Boundaries, Elevating Local Business.
                </p>
            </div>

            {/* Login Container */}
            <form className="loginContainer" onSubmit={handleSubmit} noValidate>
                <h1 className="loginTitle">Welcome Back!</h1>

                <p className="loginSubtitle">
                    Login to continue your journey with UMKMify
                </p>

                {/* Username or Email Address */}
                <div className="loginFormField">
                    <h3 className="loginFormLabel">Username or email address</h3>

                    <input
                        type="text"
                        name="identifier"
                        className="loginFormInput"
                        placeholder="Enter your username or email address"
                        autoComplete="username"
                        tabIndex={1}
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                    />

                    <p className="authFieldError">{errors.identifier ?? ""}</p>
                </div>

                {/* Password */}
                <div className="loginFormField">
                    <div className="loginPasswordLabel">
                        <h3 className="loginFormLabel">Password</h3>

                        {/* Password reset is out of scope for the project. */}
                        <Link to="/coming-soon" className="forgotPassword">
                            Forgot Password?
                        </Link>
                    </div>

                    <PasswordInput
                        wrapperClass="loginPasswordWrapper"
                        inputClass="loginFormInput"
                        toggleClass="loginPasswordToggle"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        tabIndex={2}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />

                    <p className="authFieldError">{errors.password ?? ""}</p>
                </div>

                <p className="authFormError">{errors.form ?? ""}</p>

                {/* Sign In */}
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
