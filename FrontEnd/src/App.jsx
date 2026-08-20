import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SellerLayout from "@/layouts/SellerLayout.jsx";
import UserLayout from "@/layouts/UserLayout.jsx";
import AboutUs from "@/pages/AboutUs.jsx";
import Cart from "@/pages/Cart.jsx";
import Checkout from "@/pages/Checkout.jsx";
import ComingSoon from "@/pages/ComingSoon.jsx";
import ContactUs from "@/pages/ContactUs.jsx";
import Home from "@/pages/Home.jsx";
import Login from "@/pages/Login.jsx";
import NotFound from "@/pages/NotFound.jsx";
import Product from "@/pages/Product.jsx";
import Purchases from "@/pages/Purchases.jsx";
import Register from "@/pages/Register.jsx";
import Dashboard from "@/pages/seller/Dashboard.jsx";
import Orders from "@/pages/seller/Orders.jsx";
import ProductForm from "@/pages/seller/ProductForm.jsx";
import ProductList from "@/pages/seller/ProductList.jsx";

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

/**
 * Everything that reads or writes against the signed-in account: checkout,
 * purchases and the whole Seller Centre.
 */
function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return null;
    }

    // Where they were headed, so login can send them back after.
    return user ? (
        children
    ) : (
        <Navigate to="/login" replace state={{ from: location }} />
    );
}

export default function App() {
    return (
        <Routes>
            {/* Shopper pages: navbar and footer come from the layout. */}
            <Route element={<UserLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/cart" element={<Cart />} />

                <Route
                    path="/purchases"
                    element={
                        <RequireAuth>
                            <Purchases />
                        </RequireAuth>
                    }
                />
            </Route>

            {/* Checkout carries its own slim navbar and no footer. */}
            <Route
                path="/checkout"
                element={
                    <RequireAuth>
                        <Checkout />
                    </RequireAuth>
                }
            />

            {/* Seller Centre: navbar and sidebar from the layout. */}
            <Route
                path="/seller"
                element={
                    <RequireAuth>
                        <SellerLayout />
                    </RequireAuth>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm mode="create" />} />

                <Route
                    path="products/:id/edit"
                    element={<ProductForm mode="edit" />}
                />
            </Route>

            {/* The auth pages style <body> themselves and carry no navbar. */}
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

            <Route path="/coming-soon" element={<ComingSoon />} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}
