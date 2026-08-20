/**
 * orders.html in the prototype was the navbar and sidebar with nothing
 * between them.
 *
 * The data exists — checkout already writes `seller_orders` and
 * `order_items` — but there is no endpoint that reads them from the seller's
 * side yet, and no design for the page. Both are the next thing to build
 * here rather than something to guess at.
 */
export default function Orders() {
    return (
        <main className="sellerContent">
            <h1 className="sellerContentTitle">Orders</h1>

            <p className="sellerContentSubtitle">
                This feature is under development.
            </p>
        </main>
    );
}
