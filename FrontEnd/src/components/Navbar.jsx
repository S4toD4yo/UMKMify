import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@assets/images/Logo - White Background.svg";
import houseIcon from "@assets/icons/Navbar/House.svg";
import infoIcon from "@assets/icons/Navbar/Info.svg";
import phoneIcon from "@assets/icons/Navbar/Phone.svg";
import searchIcon from "@assets/icons/magnifyinGlass.svg";

const NAV_LINKS = [
    { to: "/", label: "Home", icon: houseIcon, end: true },
    { to: "/about-us", label: "About Us", icon: infoIcon },
    { to: "/contact-us", label: "Contact", icon: phoneIcon },
];

/**
 * The shopper navbar. In the prototype the profile menu was swapped in by
 * setupNavbarAuthentication() once /auth/me answered; here the auth context
 * already knows, so it is just a branch.
 */
export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            {/* Navbar Left */}
            <div className="navbarLeft">
                <Link to="/">
                    <img src={logo} alt="UMKMify" className="navbarLogo" />
                </Link>
            </div>

            {/* Navbar Right */}
            <div className="navbarRight">
                <div className="navbarNavigation">
                    {NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                isActive ? "navButton active" : "navButton"
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <img
                                        src={link.icon}
                                        alt=""
                                        className={
                                            isActive
                                                ? "navButtonIcon active"
                                                : "navButtonIcon"
                                        }
                                    />
                                    <span>{link.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Search Bar — not wired to anything yet, same as the prototype. */}
                <div className="searchBar">
                    <img src={searchIcon} alt="" className="searchIcon" />

                    <input
                        type="text"
                        className="searchInput"
                        placeholder="Search products..."
                    />
                </div>

                {/* Authentication */}
                <div className="navbarAuth">
                    {user ? (
                        <div className="profileMenu">
                            <a
                                className="profileButton"
                                aria-label="Open profile"
                                title={user.username}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </a>

                            <div className="profileDropdown">
                                <Link to="/purchases" className="profileDropdownItem">
                                    Purchases
                                </Link>

                                <Link to="/cart" className="profileDropdownItem">
                                    Cart
                                </Link>

                                <Link
                                    to="/seller"
                                    className="profileDropdownItem"
                                >
                                    Seller Centre
                                </Link>

                                <button
                                    type="button"
                                    className="profileDropdownItem signOut"
                                    onClick={logout}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login" className="signInButton">
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
