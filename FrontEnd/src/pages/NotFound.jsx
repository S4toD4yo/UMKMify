import { Link } from "react-router-dom";
import logo from "@assets/images/Logo - Orange.svg";

/**
 * Replaces the catch-all that used to send every unknown path to Coming Soon.
 * That was fine while most pages were still HTML; now a path that does not
 * exist really is a mistake, and saying so is more useful than promising a
 * page that was never planned.
 *
 * The prototype's error404.html was an empty file, so this is the first
 * version with anything in it.
 */
export default function NotFound() {
    return (
        <main className="simplePage">
            <img src={logo} alt="UMKMify" className="simplePageLogo" />

            <h1 className="simplePageCode">404</h1>

            <h2 className="simplePageTitle">Page not found</h2>

            <p className="simplePageText">
                The page you are looking for does not exist, or it has moved.
            </p>

            <Link to="/" className="simplePageButton">
                Back to Homepage
            </Link>
        </main>
    );
}
