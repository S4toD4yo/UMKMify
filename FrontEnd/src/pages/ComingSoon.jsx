import { Link } from "react-router-dom";
import logo from "@assets/images/Logo - Orange.svg";

/**
 * Where every unbuilt feature lands. The prototype's comingSoon.html was an
 * empty file, so this is the first version with anything in it.
 */
export default function ComingSoon() {
    return (
        <main className="simplePage">
            <img src={logo} alt="UMKMify" className="simplePageLogo" />

            <h1 className="simplePageTitle">Coming Soon</h1>

            <p className="simplePageText">
                This part of UMKMify is still being built. Thank you for your
                patience.
            </p>

            <Link to="/" className="simplePageButton">
                Back to Homepage
            </Link>
        </main>
    );
}
