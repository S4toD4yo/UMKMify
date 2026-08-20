import { Link } from "react-router-dom";
import handbagIcon from "@assets/icons/Homepage/Handbag.svg";

/**
 * cart.html in the prototype was the navbar and nothing else.
 *
 * It cannot be more than this yet: umkmify.sql has `orders`, `order_items`
 * and `payments`, but no cart table, so there is nowhere to hold an item
 * between picking it and paying for it. Buy it now on the product page skips
 * the cart entirely and goes straight to checkout.
 */
export default function Cart() {
    return (
        <main className="simplePage">
            <img src={handbagIcon} alt="" className="simplePageIcon" />

            <h1 className="simplePageTitle">Your Cart</h1>

            <p className="simplePageText">
                The cart is not open yet. For now, Buy it now on a product page takes
                you straight to checkout.
            </p>

            <Link to="/" className="simplePageButton">
                Browse Products
            </Link>
        </main>
    );
}
