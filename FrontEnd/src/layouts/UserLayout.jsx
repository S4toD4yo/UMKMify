import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer.jsx";
import Navbar from "@/components/Navbar.jsx";

/**
 * Navbar and footer around every shopper page. In the prototype each HTML
 * file carried its own copy of both.
 */
export default function UserLayout() {
    return (
        <>
            <Navbar />

            <Outlet />

            <Footer />
        </>
    );
}
