import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { toFormErrors } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import arrowLeftIcon from "@assets/icons/SellerCentre/ArrowLeft.svg";
import logo from "@assets/images/Logo - White Background.svg";
import placeholderIcon from "@assets/icons/SellerCentre/Image.svg";

const EMPTY_ADDRESS = {
    recipient_name: "",
    phone: "",
    address_line: "",
    address_line_2: "",
    province: "",
    city: "",
    postal_code: "",
};

/**
 * Nothing here posts a price. The page shows what things cost, but the API
 * recomputes every number from the database when the order is placed — a
 * total in a request body is a total the shopper can edit.
 */
export default function Checkout() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const productId = params.get("product");
    const quantityParam = params.get("qty") ?? "";

    const [data, setData] = useState(null);
    const [state, setState] = useState("Loading checkout...");

    const [shippingMethodId, setShippingMethodId] = useState(null);
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const [addressId, setAddressId] = useState(null);
    const [address, setAddress] = useState(EMPTY_ADDRESS);

    const [error, setError] = useState("");
    const [placing, setPlacing] = useState(false);

    useEffect(() => {
        if (!productId) {
            setState("No product was selected.");
            return;
        }

        let cancelled = false;

        api.get("/checkout", {
            params: { product_id: productId, quantity: quantityParam },
        })
            .then(({ data: payload }) => {
                if (cancelled) {
                    return;
                }

                if (!payload.item?.quantity) {
                    setState("This product is out of stock.");
                    return;
                }

                setData(payload);

                // Preselected so the summary has a total to show on arrival.
                setShippingMethodId(payload.shipping_methods?.[0]?.id ?? null);
                setPaymentMethodId(payload.payment_methods?.[0]?.id ?? null);

                // The API sorts the default address first.
                setAddressId(payload.addresses?.[0]?.id ?? null);

                setState(null);
            })
            .catch((requestError) => {
                if (cancelled) {
                    return;
                }

                console.error("Failed to load the checkout:", requestError);

                const status = requestError.response?.status;

                if (status === 404) {
                    setState("This product is no longer available.");
                    return;
                }

                setState(
                    requestError.response
                        ? "Failed to load the checkout."
                        : "Unable to reach the server. Please make sure Laravel is running."
                );
            });

        return () => {
            cancelled = true;
        };
    }, [productId, quantityParam]);

    /* Recomputed on the page purely so the shopper can see the courier they
       picked change the total. */
    const totals = useMemo(() => {
        if (!data) {
            return null;
        }

        const shipping = data.shipping_methods?.find(
            (method) => method.id === shippingMethodId
        );

        const subtotal = Number(data.item.price) * data.item.quantity;
        const shippingFee = Number(shipping?.fee ?? 0);
        const discount = Number(data.discount_amount) || 0;
        const serviceFee = Number(data.service_fee) || 0;

        return {
            subtotal,
            shippingFee,
            discount,
            serviceFee,
            total: subtotal - discount + shippingFee + serviceFee,
        };
    }, [data, shippingMethodId]);

    async function placeOrder() {
        setError("");
        setPlacing(true);

        const payload = {
            product_id: data.item.product_id,
            quantity: data.item.quantity,
            shipping_method_id: shippingMethodId,
            payment_method_id: paymentMethodId,
            ...(addressId ? { address_id: addressId } : address),
        };

        try {
            const { data: result } = await api.post("/orders", payload);

            navigate("/purchases", {
                replace: true,
                state: { placed: result.order?.order_number },
            });
        } catch (requestError) {
            console.error("Failed to place the order:", requestError);

            /* Stock can run out between opening the page and pressing the
               button, so these are shown rather than swallowed. */
            const errors = toFormErrors(requestError);

            setError(Object.values(errors).join("\n"));
        } finally {
            setPlacing(false);
        }
    }

    function updateAddress(field) {
        return (event) =>
            setAddress((current) => ({ ...current, [field]: event.target.value }));
    }

    return (
        <>
            {/* Checkout Navbar */}
            <nav className="sellerNavbar">
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

                <Link to="/" className="sellerNavbarLogoLink">
                    <img src={logo} alt="UMKMify" className="sellerNavbarLogo" />
                </Link>

                <p className="sellerNavbarTitle">Checkout</p>
            </nav>

            <main className="checkoutPage">
                {state ? (
                    <p className="checkoutPageState">{state}</p>
                ) : (
                    <>
                        {/* Shipping Address */}
                        <section className="checkoutSection checkoutShippingAddress">
                            <h2 className="checkoutSectionTitle">Shipping Address</h2>

                            {/* Only shown once the shopper has an address saved */}
                            {data.addresses.length > 0 && (
                                <div className="checkoutField">
                                    <label
                                        className="checkoutLabel"
                                        htmlFor="checkoutSavedAddress"
                                    >
                                        Saved Address
                                    </label>

                                    <select
                                        id="checkoutSavedAddress"
                                        className="checkoutSelect"
                                        value={addressId ?? ""}
                                        onChange={(event) =>
                                            setAddressId(
                                                event.target.value
                                                    ? Number(event.target.value)
                                                    : null
                                            )
                                        }
                                    >
                                        {data.addresses.map((saved) => (
                                            <option key={saved.id} value={saved.id}>
                                                {`${saved.label} — ${saved.recipient_name}, ${saved.address_line}, ${saved.city}`}
                                            </option>
                                        ))}

                                        <option value="">Use a new address</option>
                                    </select>
                                </div>
                            )}

                            {!addressId && (
                                <div className="checkoutAddressForm">
                                    <div className="checkoutFieldRow">
                                        <div className="checkoutField">
                                            <label className="checkoutLabel">
                                                Recipient Name{" "}
                                                <span className="requiredMark">*</span>
                                            </label>

                                            <input
                                                type="text"
                                                className="checkoutInput"
                                                placeholder="Nama penerima"
                                                value={address.recipient_name}
                                                onChange={updateAddress("recipient_name")}
                                            />
                                        </div>

                                        <div className="checkoutField">
                                            <label className="checkoutLabel">
                                                Phone{" "}
                                                <span className="requiredMark">*</span>
                                            </label>

                                            <input
                                                type="tel"
                                                className="checkoutInput"
                                                placeholder="08xxxxxxxxxx"
                                                value={address.phone}
                                                onChange={updateAddress("phone")}
                                            />
                                        </div>
                                    </div>

                                    <div className="checkoutField">
                                        <label className="checkoutLabel">
                                            Address{" "}
                                            <span className="requiredMark">*</span>
                                        </label>

                                        <input
                                            type="text"
                                            className="checkoutInput"
                                            placeholder="Jalan, nomor rumah"
                                            value={address.address_line}
                                            onChange={updateAddress("address_line")}
                                        />
                                    </div>

                                    <div className="checkoutField">
                                        <label className="checkoutLabel">
                                            Address Detail
                                        </label>

                                        <input
                                            type="text"
                                            className="checkoutInput"
                                            placeholder="Patokan, blok, nomor unit"
                                            value={address.address_line_2}
                                            onChange={updateAddress("address_line_2")}
                                        />
                                    </div>

                                    <div className="checkoutFieldRow">
                                        <div className="checkoutField">
                                            <label className="checkoutLabel">
                                                Province{" "}
                                                <span className="requiredMark">*</span>
                                            </label>

                                            <input
                                                type="text"
                                                className="checkoutInput"
                                                placeholder="Jawa Timur"
                                                value={address.province}
                                                onChange={updateAddress("province")}
                                            />
                                        </div>

                                        <div className="checkoutField">
                                            <label className="checkoutLabel">
                                                City{" "}
                                                <span className="requiredMark">*</span>
                                            </label>

                                            <input
                                                type="text"
                                                className="checkoutInput"
                                                placeholder="Ngawi"
                                                value={address.city}
                                                onChange={updateAddress("city")}
                                            />
                                        </div>

                                        <div className="checkoutField">
                                            <label className="checkoutLabel">
                                                Postal Code{" "}
                                                <span className="requiredMark">*</span>
                                            </label>

                                            <input
                                                type="text"
                                                className="checkoutInput"
                                                placeholder="63211"
                                                value={address.postal_code}
                                                onChange={updateAddress("postal_code")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Product Details */}
                        <section className="checkoutSection checkoutProductDetails">
                            <h2 className="checkoutSectionTitle">Detail Produk</h2>

                            <div className="checkoutItem">
                                <span
                                    className={
                                        data.item.image
                                            ? "checkoutItemImage"
                                            : "checkoutItemImage isEmpty"
                                    }
                                >
                                    <img
                                        src={data.item.image ?? placeholderIcon}
                                        alt=""
                                    />
                                </span>

                                <span className="checkoutItemText">
                                    <p className="checkoutItemName">
                                        {data.item.name}
                                    </p>

                                    <p className="checkoutItemMeta">
                                        {[
                                            data.item.store,
                                            `${data.item.quantity} ${data.item.unit ?? ""} × ${formatRupiah(data.item.price)}`.trim(),
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>

                                    <p className="checkoutItemSubtotal">
                                        {formatRupiah(data.item.subtotal)}
                                    </p>
                                </span>
                            </div>
                        </section>

                        {/* Shipping Methods */}
                        <section className="checkoutSection checkoutShippingMethods">
                            <h2 className="checkoutSectionTitle">Shipping Methods</h2>

                            <div className="checkoutOptions">
                                {data.shipping_methods.map((method) => (
                                    <label
                                        key={method.id}
                                        className={
                                            method.id === shippingMethodId
                                                ? "checkoutOption selected"
                                                : "checkoutOption"
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="checkoutShipping"
                                            value={method.id}
                                            checked={method.id === shippingMethodId}
                                            onChange={() =>
                                                setShippingMethodId(method.id)
                                            }
                                        />

                                        <span className="checkoutOptionText">
                                            <span className="checkoutOptionName">
                                                {method.name}
                                            </span>

                                            <span className="checkoutOptionMeta">
                                                {formatRupiah(method.fee)}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Payment Methods */}
                        <section className="checkoutSection checkoutPaymentMethods">
                            <h2 className="checkoutSectionTitle">Payment Methods</h2>

                            <div className="checkoutOptions">
                                {data.payment_methods.map((method) => (
                                    <label
                                        key={method.id}
                                        className={
                                            method.id === paymentMethodId
                                                ? "checkoutOption selected"
                                                : "checkoutOption"
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="checkoutPayment"
                                            value={method.id}
                                            checked={method.id === paymentMethodId}
                                            onChange={() =>
                                                setPaymentMethodId(method.id)
                                            }
                                        />

                                        <span className="checkoutOptionText">
                                            <span className="checkoutOptionName">
                                                {method.name}
                                            </span>

                                            <span className="checkoutOptionMeta">
                                                {method.type}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Payment Details */}
                        <section className="checkoutSection checkoutPaymentDetails">
                            <h2 className="checkoutSectionTitle">Payment Details</h2>

                            <dl className="checkoutSummary">
                                <dt>Subtotal</dt>
                                <dd>{formatRupiah(totals.subtotal)}</dd>

                                {totals.discount > 0 && (
                                    <>
                                        <dt>Discount</dt>
                                        <dd>- {formatRupiah(totals.discount)}</dd>
                                    </>
                                )}

                                <dt>Shipping Fee</dt>
                                <dd>{formatRupiah(totals.shippingFee)}</dd>

                                <dt>Service Fee</dt>
                                <dd>{formatRupiah(totals.serviceFee)}</dd>

                                <dt className="checkoutSummaryTotal">Total</dt>
                                <dd className="checkoutSummaryTotal">
                                    {formatRupiah(totals.total)}
                                </dd>
                            </dl>

                            <p className="checkoutError">{error}</p>

                            <button
                                type="button"
                                className="checkoutPlaceOrderButton"
                                disabled={placing}
                                onClick={placeOrder}
                            >
                                {placing ? "Placing Order..." : "Place Order"}
                            </button>
                        </section>
                    </>
                )}
            </main>
        </>
    );
}
