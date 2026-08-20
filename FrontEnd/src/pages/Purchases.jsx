import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { formatDateTime, formatRupiah, titleCase } from "@/lib/format";
import placeholderIcon from "@assets/icons/SellerCentre/Image.svg";

/* Schema.md's fulfillment lifecycle, in the order it runs. `null` is the
   "everything" tab. */
const TABS = [
    { status: null, label: "All", key: "total" },
    { status: "pending", label: "Pending", key: "pending" },
    { status: "processing", label: "Processing", key: "processing" },
    { status: "shipped", label: "Shipped", key: "shipped" },
    { status: "completed", label: "Completed", key: "completed" },
    { status: "cancelled", label: "Cancelled", key: "cancelled" },
];

const EMPTY_SUMMARY = {
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
};

export default function Purchases() {
    const location = useLocation();

    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [activeStatus, setActiveStatus] = useState(null);
    const [state, setState] = useState("Loading your purchases...");

    // Set by Checkout after a successful order, so the shopper lands on a
    // confirmation instead of an unexplained new row.
    const placed = location.state?.placed;

    const load = useCallback(async () => {
        setState("Loading your purchases...");

        try {
            const { data } = await api.get("/orders", {
                params: activeStatus ? { status: activeStatus } : {},
            });

            /* Counts come from the whole history, not the filtered rows, so a
               tab keeps saying what is behind it while another one is open. */
            setSummary(data.summary ?? EMPTY_SUMMARY);
            setOrders(data.orders ?? []);

            setState(
                data.orders?.length
                    ? null
                    : activeStatus
                      ? "No orders in this status yet."
                      : "You have not bought anything yet."
            );
        } catch (error) {
            console.error("Failed to load purchases:", error);

            setOrders([]);

            setState(
                error.response
                    ? "Failed to load your purchases."
                    : "Unable to reach the server. Please make sure Laravel is running."
            );
        }
    }, [activeStatus]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <main className="purchasesPage">
            <h1 className="purchasesTitle">My Purchases</h1>

            {placed && (
                <p className="purchasesPlaced">
                    Order {placed} placed successfully.
                </p>
            )}

            {/* Status Tabs */}
            <div className="purchasesTabs">
                {TABS.map((tab) => (
                    <button
                        key={tab.label}
                        type="button"
                        className={
                            tab.status === activeStatus
                                ? "purchasesTab active"
                                : "purchasesTab"
                        }
                        onClick={() => setActiveStatus(tab.status)}
                    >
                        {tab.label} ({summary[tab.key] ?? 0})
                    </button>
                ))}
            </div>

            {state ? (
                <p className="purchasesState">{state}</p>
            ) : (
                <div className="purchasesList">
                    {orders.map((order) => (
                        <PurchaseCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </main>
    );
}

function PurchaseCard({ order }) {
    const shipping = order.shipping ?? {};

    const shipTo = [
        shipping.recipient_name,
        shipping.address,
        shipping.city,
        shipping.province,
        shipping.postal_code,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <article className="purchaseCard">
            <div className="purchaseCardHeader">
                <p className="purchaseCardNumber">{order.order_number}</p>

                <p className="purchaseCardDate">
                    {formatDateTime(order.placed_at)}
                </p>

                {order.payment && (
                    <span className={`purchaseBadge ${order.payment.status}`}>
                        {`${order.payment.method ?? "Payment"} · ${titleCase(order.payment.status)}`}
                    </span>
                )}

                <span className={`purchaseBadge ${order.status}`}>
                    {titleCase(order.status)}
                </span>
            </div>

            {(order.stores ?? []).map((store) => (
                <div key={store.id} className="purchaseStore">
                    <p className="purchaseStoreName">
                        {store.store ?? "UMKMify Seller"}
                    </p>

                    <p className="purchaseStoreMeta">
                        {[store.shipping_method, titleCase(store.status)]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>

                    {(store.items ?? []).map((item) => (
                        <PurchaseItem key={item.id} item={item} />
                    ))}
                </div>
            ))}

            <div className="purchaseCardFooter">
                <p className="purchaseCardShipping">{shipTo}</p>

                <p className="purchaseCardTotalLabel">Total</p>

                <p className="purchaseCardTotal">
                    {formatRupiah(order.total_amount)}
                </p>
            </div>
        </article>
    );
}

function PurchaseItem({ item }) {
    const body = (
        <>
            <span
                className={
                    item.image ? "purchaseItemImage" : "purchaseItemImage isEmpty"
                }
            >
                <img src={item.image ?? placeholderIcon} alt="" />
            </span>

            <span className="purchaseItemText">
                <p className="purchaseItemName">{item.name}</p>

                <p className="purchaseItemMeta">
                    {[item.sku, `${item.quantity} × ${formatRupiah(item.unit_price)}`]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
            </span>

            <p className="purchaseItemSubtotal">{formatRupiah(item.subtotal)}</p>
        </>
    );

    /* Only a product still on sale gets a link. Delisted ones stay on the
       receipt but lead nowhere, because the product page would 404. */
    return item.still_listed ? (
        <Link to={`/product/${item.product_id}`} className="purchaseItem">
            {body}
        </Link>
    ) : (
        <div className="purchaseItem">{body}</div>
    );
}
