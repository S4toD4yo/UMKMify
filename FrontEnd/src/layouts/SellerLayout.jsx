import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import arrowLeftIcon from "@assets/icons/SellerCentre/ArrowLeft.svg";
import houseIcon from "@assets/icons/SellerCentre/House.svg";
import notepadIcon from "@assets/icons/SellerCentre/Notepad.svg";
import packageIcon from "@assets/icons/SellerCentre/Package.svg";
import logo from "@assets/images/Logo - White Background.svg";

/**
 * Seller Centre navbar and sidebar. In the prototype every seller page kept
 * its own copy of both, with the active states hard-coded per file — here the
 * route decides them.
 */
export default function SellerLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Products has no page of its own: it is a heading over the submenu.
    const productsOpen = location.pathname.startsWith("/seller/products");
    const addingProduct = location.pathname === "/seller/products/new";

    return (
        <>
            <nav className="sellerNavbar">
                {/* Back Button */}
                <Link
                    to="/"
                    className="sellerNavbarBack"
                    aria-label="Back to Homepage"
                    title="Back to Homepage"
                >
                    <img
                        src={arrowLeftIcon}
                        alt=""
                        className="sellerNavbarBackIcon"
                    />
                </Link>

                <Link to="/seller" className="sellerNavbarLogoLink">
                    <img src={logo} alt="UMKMify" className="sellerNavbarLogo" />
                </Link>

                <p className="sellerNavbarTitle">Seller Centre</p>

                {/* Profile */}
                <div className="sellerNavbarAuth">
                    {user ? (
                        <div className="sellerProfileMenu">
                            <a
                                className="sellerProfileButton"
                                aria-label="Open profile"
                                title={user.username}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </a>

                            <div className="sellerProfileDropdown">
                                <button
                                    type="button"
                                    className="sellerSignOutButton"
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
            </nav>

            {/* Seller Side Navbar */}
            <aside className="sellerSideNavbar">
                <nav className="sellerSideNavbarMenu">
                    <NavLink
                        to="/seller"
                        end
                        className={({ isActive }) =>
                            isActive
                                ? "sellerSideNavbarButton active"
                                : "sellerSideNavbarButton"
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <img
                                    src={houseIcon}
                                    alt=""
                                    className="sellerSideNavbarIcon"
                                />

                                <h3
                                    className={
                                        isActive
                                            ? "sellerSideNavbarText active"
                                            : "sellerSideNavbarText"
                                    }
                                >
                                    Dashboard
                                </h3>
                            </>
                        )}
                    </NavLink>

                    <NavLink
                        to="/seller/orders"
                        className={({ isActive }) =>
                            isActive
                                ? "sellerSideNavbarButton active"
                                : "sellerSideNavbarButton"
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <img
                                    src={notepadIcon}
                                    alt=""
                                    className="sellerSideNavbarIcon"
                                />

                                <h3
                                    className={
                                        isActive
                                            ? "sellerSideNavbarText active"
                                            : "sellerSideNavbarText"
                                    }
                                >
                                    Orders
                                </h3>
                            </>
                        )}
                    </NavLink>

                    <div
                        className={
                            productsOpen
                                ? "sellerSideNavbarButton active"
                                : "sellerSideNavbarButton"
                        }
                    >
                        <img
                            src={packageIcon}
                            alt=""
                            className="sellerSideNavbarIcon"
                        />

                        <h3
                            className={
                                productsOpen
                                    ? "sellerSideNavbarText active"
                                    : "sellerSideNavbarText"
                            }
                        >
                            Products
                        </h3>
                    </div>

                    {/* Product Submenu. Editing a product belongs to Product
                        List, so anything under /seller/products that is not
                        the new-product form keeps that entry lit. */}
                    <div className="sellerProductSubmenu">
                        <Link
                            to="/seller/products"
                            className={
                                productsOpen && !addingProduct
                                    ? "sellerProductSubmenuLink active"
                                    : "sellerProductSubmenuLink"
                            }
                        >
                            <span>・</span>
                            Product List
                        </Link>

                        <Link
                            to="/seller/products/new"
                            className={
                                addingProduct
                                    ? "sellerProductSubmenuLink active"
                                    : "sellerProductSubmenuLink"
                            }
                        >
                            <span>・</span>
                            Add New Product
                        </Link>
                    </div>
                </nav>

                {/* Footer */}
                <p className="sellerSideNavbarFooter">
                    &copy; 2026 UMKMify. All rights reserved.
                </p>
            </aside>

            <Outlet />
        </>
    );
}
