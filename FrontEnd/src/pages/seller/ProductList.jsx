import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import pencilIcon from "@assets/icons/SellerCentre/PencilSimple.svg";
import trashIcon from "@assets/icons/SellerCentre/Trash.svg";
import placeholderIcon from "@assets/icons/SellerCentre/Image.svg";

const EMPTY_SUMMARY = {
    total: 0,
    published: 0,
    draft: 0,
    out_of_stock: 0,
    need_restock: 0,
};

const SUMMARY_CARDS = [
    { key: "total", label: "Total Products" },
    { key: "published", label: "Active Product" },
    { key: "draft", label: "Nonactive" },
    { key: "out_of_stock", label: "Out of Stock" },
    { key: "need_restock", label: "Need to Restock" },
];

const EMPTY_MESSAGE = "No products yet. Use Add New Product to list your first one.";

/**
 * The Status column reads `status` and `stock` together, so one product only
 * ever carries one badge. Nonactive wins over both stock readings on purpose:
 * an unlisted product is not on sale, so warning about its stock would be a
 * false alarm.
 */
function statusBadge(product) {
    if (!product.is_published) {
        return { label: "Nonactive", className: "nonactive" };
    }

    if (product.stock_status === "out_of_stock") {
        return { label: "Out of Stock", className: "outOfStock" };
    }

    if (product.stock_status === "low_stock") {
        return { label: "Need to Restock", className: "needRestock" };
    }

    return { label: "Active", className: "active" };
}

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [state, setState] = useState("Loading your products...");
    const [deleting, setDeleting] = useState(null);

    const load = useCallback(async () => {
        setState("Loading your products...");

        try {
            const { data } = await api.get("/products");

            setSummary(data.summary ?? EMPTY_SUMMARY);
            setProducts(data.products ?? []);
            setState(data.products?.length ? null : EMPTY_MESSAGE);
        } catch (error) {
            console.error("Failed to load products:", error);

            setProducts([]);

            setState(
                error.response
                    ? (error.response.data?.message ?? "Failed to load your products.")
                    : "Unable to reach the server. Please make sure Laravel is running."
            );
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function remove(product) {
        if (
            !window.confirm(
                `Delete "${product.name}"? This cannot be undone from here.`
            )
        ) {
            return;
        }

        setDeleting(product.id);

        try {
            const { data } = await api.delete(`/products/${product.id}`);

            const left = products.filter((row) => row.id !== product.id);

            setProducts(left);

            // The API sends the recounted cards back, so the summary stays
            // right without a second round trip.
            setSummary(data.summary ?? EMPTY_SUMMARY);
            setState(left.length ? null : EMPTY_MESSAGE);
        } catch (error) {
            console.error("Failed to delete product:", error);

            alert(
                error.response?.data?.message ?? "Failed to delete this product."
            );
        } finally {
            setDeleting(null);
        }
    }

    return (
        <main className="sellerContent">
            <h1 className="sellerContentTitle">Product List</h1>

            <p className="sellerContentSubtitle">
                Everything you have listed, newest first.
            </p>

            <div className="productListSummary">
                {SUMMARY_CARDS.map((card) => (
                    <div key={card.key} className="productListSummaryContainer">
                        <p className="productListSummaryTitle">{card.label}</p>

                        <h3 className="productListSummaryValue">
                            {summary[card.key] ?? 0}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="productList">
                <div className="productListHeader">
                    <p>Product</p>
                    <p>SKU</p>
                    <p>Price</p>
                    <p>Stock</p>
                    <p>Status</p>
                    <p>Created Date</p>
                    <p></p>
                </div>

                <div className="productListBody">
                    {state ? (
                        <p className="productListState">{state}</p>
                    ) : (
                        products.map((product) => {
                            const status = statusBadge(product);

                            return (
                                <div key={product.id} className="productListRow">
                                    <div className="productListProduct">
                                        {product.primary_image ? (
                                            <img
                                                src={product.primary_image}
                                                alt=""
                                                className="productListProductImage"
                                            />
                                        ) : (
                                            <span className="productListProductImage productListProductImageEmpty">
                                                <img src={placeholderIcon} alt="" />
                                            </span>
                                        )}

                                        <p title={product.name}>{product.name}</p>
                                    </div>

                                    <p>{product.sku}</p>
                                    <p>{formatRupiah(product.price)}</p>
                                    <p>{Number(product.stock) || 0}</p>

                                    <span
                                        className={`productListStatus ${status.className}`}
                                    >
                                        {status.label}
                                    </span>

                                    <p>{formatDate(product.created_at)}</p>

                                    <div className="productListActions">
                                        <Link
                                            to={`/seller/products/${product.id}/edit`}
                                            className="productListActionButton"
                                            title={`Edit ${product.name}`}
                                        >
                                            <img src={pencilIcon} alt="Edit" />
                                        </Link>

                                        <button
                                            className="productListActionButton"
                                            type="button"
                                            title={`Delete ${product.name}`}
                                            disabled={deleting === product.id}
                                            onClick={() => remove(product)}
                                        >
                                            <img src={trashIcon} alt="Delete" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
