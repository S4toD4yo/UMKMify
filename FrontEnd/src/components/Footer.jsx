import { Link } from "react-router-dom";
import logo from "@assets/images/Logo - Orange.svg";

/* Category and Products have no page yet, so they land on Coming Soon like
   the rest of the unbuilt links. */
const MENU_LINKS = [
    { to: "/", label: "Homepage" },
    { to: "/coming-soon", label: "Category" },
    { to: "/coming-soon", label: "Products" },
    { to: "/about-us", label: "About Us" },
    { to: "/contact-us", label: "Contact Us" },
];

const HELP_LINKS = [
    "How to Shop",
    "Payment",
    "Shipping",
    "Returns & Refunds",
    "FAQ",
];

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footerContent">
                <div className="footerLeft">
                    <img src={logo} alt="UMKMify" className="footerLogo" />

                    <p className="footerDescription">
                        A digital platform that empowers local UMKM to grow and reach
                        more customers.
                    </p>
                </div>

                {/* Menu */}
                <div className="footerMenu">
                    <h3 className="footerMenuTitle">Menu</h3>

                    <nav className="footerMenuLinks">
                        {MENU_LINKS.map((link) => (
                            <Link key={link.label} to={link.to}>
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Help */}
                <div className="footerHelp">
                    <h3 className="footerHelpTitle">Help</h3>

                    <nav className="footerHelpLinks">
                        {HELP_LINKS.map((label) => (
                            <Link key={label} to="/coming-soon">
                                {label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Information */}
                <div className="footerInformation">
                    <h3 className="footerInformationTitle">Information</h3>

                    <nav className="footerInformationLinks">
                        <Link to="/about-us">About Us</Link>
                    </nav>
                </div>
            </div>

            {/* Copyright */}
            <div className="footerCopyright">
                <p className="footerCopyrightText">
                    &copy; 2026 UMKMify. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
