import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import placeholderIcon from "@assets/icons/SellerCentre/Image.svg";

export default function Product() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [state, setState] = useState("Loading product...");
    const [activeImage, setActiveImage] = useState(0);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        let cancelled = false;

        setState("Loading product...");
        setProduct(null);
        setActiveImage(0);

        api.get(`/catalog/products/${id}`)
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }

                if (!data.product) {
                    setState("Failed to load this product.");
                    return;
                }

                setProduct(data.product);
                setState(null);
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }

                console.error("Failed to load the product:", error);

                /* 404 also covers a product that was taken off sale, which is
                   deliberate: a shopper has no business seeing an unlisted
                   product either way. */
                if (error.response?.status === 404) {
                    setState("This product is no longer available.");
                    return;
                }

                setState(
                    error.response
                        ? "Failed to load this product."
                        : "Unable to reach the server. Please make sure Laravel is running."
                );
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (product) {
            document.title = `${product.name} | UMKMify`;
        }
    }, [product]);

    /* The bounds come from the product, not from the markup: `minimum_purchase`
       is the floor the seller set and `stock` is the ceiling, so the page
       cannot offer more than there is. Stock wins when the two disagree. */
    const { stock, floor, soldOut } = useMemo(() => {
        const inStock = Number(product?.stock) || 0;
        const minimum = Math.max(1, Number(product?.minimum_purchase) || 1);

        return {
            stock: inStock,
            floor: inStock <= 0 ? 0 : Math.min(minimum, inStock),
            soldOut: inStock <= 0,
        };
    }, [product]);

    useEffect(() => {
        setQuantity(floor);
    }, [floor]);

    if (state) {
        return (
            <main className="productPage">
                <p className="productPageState">{state}</p>
            </main>
        );
    }

    const images = product.images ?? [];
    const price = Number(product.price) || 0;

    function step(direction) {
        setQuantity((current) =>
            Math.min(stock, Math.max(floor, current + direction))
        );
    }

    function buyNow() {
        /* Checkout needs a signed in shopper — it reads their saved addresses
           and writes an order against their account. */
        if (!user) {
            navigate("/login");
            return;
        }

        navigate(`/checkout?product=${product.id}&qty=${quantity}`);
    }

    return (
        <main className="productPage">
            {/* Product Detail */}
            <div className="productDetail">
                {/* Product Gallery */}
                <section className="productGallery">
                    {/* One image has nothing to switch between. */}
                    {images.length > 1 && (
                        <div className="productGalleryThumbs">
                            {images.map((image, index) => (
                                <button
                                    key={image.id}
                                    className={
                                        index === activeImage
                                            ? "productGalleryThumb active"
                                            : "productGalleryThumb"
                                    }
                                    type="button"
                                    aria-label={`Show image ${index + 1}`}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img src={image.url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Product Image */}
                    <div
                        className={
                            images.length
                                ? "productGalleryMain"
                                : "productGalleryMain isEmpty"
                        }
                    >
                        <img
                            src={images[activeImage]?.url ?? placeholderIcon}
                            alt={images.length ? product.name : ""}
                        />
                    </div>
                </section>

                {/* Product Summary */}
                <section className="productSummary">
                    <h2 className="productDetailName">{product.name}</h2>

                    <p className="productDetailSold">
                        {Number(product.sold) || 0} Terjual
                    </p>

                    <h1 className="productDetailPrice">
                        {formatRupiah(product.price)}
                    </h1>

                    {/* Product Purchase */}
                    <div className="productDetailPurchase">
                        {/* Quantity */}
                        <div className="productQuantity">
                            <button
                                className="productQuantityButton"
                                type="button"
                                disabled={soldOut || quantity <= floor}
                                onClick={() => step(-1)}
                            >
                                -
                            </button>

                            <p className="productQuantityValue">{quantity}</p>

                            <button
                                className="productQuantityButton"
                                type="button"
                                disabled={soldOut || quantity >= stock}
                                onClick={() => step(1)}
                            >
                                +
                            </button>
                        </div>

                        {/* Total Price */}
                        <div className="productTotalPrice">
                            <p className="productTotalPriceLabel">Total Harga</p>

                            <p className="productTotalPriceValue">
                                {formatRupiah(price * quantity)}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="productDetailActions">
                            {/* The cart has no table in umkmify.sql yet, so
                                there is nowhere to hold an item. */}
                            <button
                                className="productAddToCartButton"
                                type="button"
                                disabled={soldOut}
                                onClick={() => navigate("/coming-soon")}
                            >
                                Add to Cart
                            </button>

                            <button
                                className="productBuyNowButton"
                                type="button"
                                disabled={soldOut}
                                onClick={buyNow}
                            >
                                Buy it now
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
