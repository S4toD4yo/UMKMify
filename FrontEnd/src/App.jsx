import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ComingSoon from "@/pages/ComingSoon.jsx";
import Home from "@/pages/Home.jsx";
import Login from "@/pages/Login.jsx";
import Register from "@/pages/Register.jsx";

/**
 * Keeps signed-in users away from the auth pages.
 */
function GuestOnly({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coming-soon" element={<ComingSoon />} />

            <Route
                path="/login"
                element={
                    <GuestOnly>
                        <Login />
                    </GuestOnly>
                }
            />

            <Route
                path="/register"
                element={
                    <GuestOnly>
                        <Register />
                    </GuestOnly>
                }
            />
        </Routes>
    );
}
