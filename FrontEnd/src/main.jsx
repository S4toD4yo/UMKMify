import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App.jsx";
import { AuthProvider } from "@/lib/AuthProvider";
import "@/index.css";
// The hand-written prototype stylesheet — the auth pages reuse its classes.
import "@assets/styles.css";
import "@assets/authFeedback.css";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
