import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductImageDropZone from "@/components/ProductImageDropZone.jsx";
import api from "@/lib/api";
import activeIcon from "@assets/icons/SellerCentre/Active.svg";
import nonactiveIcon from "@assets/icons/SellerCentre/Nonactive.svg";

const UNITS = ["pcs", "box", "pack", "set", "bottle", "kg"];

const EMPTY_FORM = {
    name: "",
    sku: "",
    category_id: "",
    subcategory_id: "",
    description: "",
    selling_price: "0",
    minimum_purchase: "1",
    stock: "0",
    weight: "",
    unit: "",
    brand: "",
    location: "",
    length: "",
    width: "",
    height: "",
    shipping_fee_payer: "",
    status: "active",
};

/**
 * Add New Product and Edit Product. In the prototype these were two 814-line
 * HTML files differing by six lines; here `mode` is the only difference.
 */
export default function ProductForm({ mode }) {
    const editing = mode === "edit";

    const { id } = useParams();
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY_FORM);
    const [images, setImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(editing);

    useEffect(() => {
        /* Both selects are filled from GET /api/categories rather than
           hardcoded, so the ids always match what the database has. */
        api.get("/categories")
            .then(({ data }) => setCategories(data.categories ?? []))
            .catch((error) => console.error("Failed to load categories:", error));
    }, []);

    useEffect(() => {
        if (!editing) {
            return;
        }

        let cancelled = false;

        api.get(`/products/${id}`)
            .then(({ data }) => {
                if (cancelled || !data.product) {
                    return;
                }

                const product = data.product;

                setForm({
                    name: product.name ?? "",
                    sku: product.sku ?? "",
                    category_id: product.category_id ?? "",
                    subcategory_id: product.subcategory_id ?? "",
                    description: product.description ?? "",
                    selling_price: formatPrice(product.price),
                    minimum_purchase: numberValue(product.minimum_purchase),
                    stock: numberValue(product.stock),
                    weight: numberValue(product.weight),
                    unit: product.unit ?? "",
                    brand: product.brand ?? "",
                    location: product.location ?? "",
                    length: numberValue(product.length),
                    width: numberValue(product.width),
                    height: numberValue(product.height),
                    shipping_fee_payer: product.shipping_fee_payer ?? "",
                    status: product.status ?? "active",
                });

                /* The product's own images take the drop zone slots, kept as
                   { id, url } so the save can tell the API which to hold on
                   to. */
                setImages(
                    (product.images ?? []).map((image) => ({
                        id: image.id,
                        url: image.url,
                    }))
                );

                setLoading(false);
            })
            .catch((error) => {
                console.error("Failed to load the product:", error);

                // 404 covers both a missing product and somebody else's.
                alert(
                    error.response?.status === 404
                        ? "This product could not be found."
                        : "Failed to load this product."
                );

                navigate("/seller/products", { replace: true });
            });

        return () => {
            cancelled = true;
        };
    }, [editing, id, navigate]);

    const subcategories = useMemo(() => {
        const category = categories.find(
            (item) => String(item.id) === String(form.category_id)
        );

        return category?.subcategories ?? [];
    }, [categories, form.category_id]);

    function update(field) {
        return (event) =>
            setForm((current) => ({ ...current, [field]: event.target.value }));
    }

    function updatePrice(event) {
        const digits = event.target.value.replace(/\D/g, "");

        setForm((current) => ({
            ...current,
            selling_price: Number(digits || 0).toLocaleString("id-ID"),
        }));
    }

    async function save() {
        setErrors([]);
        setSaving(true);

        // multipart/form-data rather than JSON: the images are real files,
        // and JSON has nowhere to put them.
        const body = new FormData();

        Object.entries({
            ...form,
            // The input is thousand-separated; the API wants the raw number.
            selling_price: form.selling_price.replace(/\./g, ""),
        }).forEach(([field, value]) => body.append(field, value));

        if (editing) {
            /* POST, not PUT: PHP does not parse a multipart body on a real
               PUT, so Laravel is asked to spoof the method instead. */
            body.append("_method", "PUT");

            /* The images the product keeps, in card order. One the seller
               removed is simply not listed, which is how the API is told to
               delete it. */
            images
                .filter((image) => !(image instanceof File))
                .forEach((image) => body.append("existing_image_ids[]", image.id));
        }

        images
            .filter((image) => image instanceof File)
            .forEach((image) => body.append("images[]", image, image.name));

        try {
            await api.post(editing ? `/products/${id}` : "/products", body);

            navigate("/seller/products");
        } catch (error) {
            console.error("Failed to save the product:", error);

            /* Every message, not just the first: the images fail one file at
               a time, and Laravel's `message` only carries one of them. */
            const bag = error.response?.data?.errors;

            setErrors(
                bag
                    ? Object.values(bag).flat()
                    : [
                          error.response?.data?.message ??
                              "Unable to connect to the server. Please make sure Laravel is running.",
                      ]
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="sellerContent">
                <h1 className="sellerContentTitle">Edit Product</h1>
                <p className="sellerContentSubtitle">Loading product...</p>
            </main>
        );
    }

    return (
        <>
            <main className="sellerContent">
                <h1 className="sellerContentTitle">
                    {editing ? "Edit Product" : "Add New Product"}
                </h1>

                <div className="addProductContainers">
                    {/* Product Information */}
                    <section className="addProductContainer">
                        <h3 className="addProductContainerTitle">
                            Product Information
                        </h3>

                        <div className="addProductFormRow">
                            <div className="addProductFormField">
                                <label
                                    htmlFor="productName"
                                    className="addProductFormLabel"
                                >
                                    Product Name{" "}
                                    <span className="requiredMark">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="productName"
                                    className="addProductFormInput"
                                    placeholder="Enter product name"
                                    value={form.name}
                                    onChange={update("name")}
                                />
                            </div>

                            <div className="addProductFormField addProductSkuField">
                                <label
                                    htmlFor="productSku"
                                    className="addProductFormLabel"
                                >
                                    SKU / Product Code{" "}
                                    <span className="requiredMark">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="productSku"
                                    className="addProductFormInput"
                                    placeholder="Example: SNK-001"
                                    value={form.sku}
                                    onChange={update("sku")}
                                />
                            </div>
                        </div>

                        <div className="addProductFormRow">
                            <div className="addProductFormField">
                                <label
                                    htmlFor="productCategory"
                                    className="addProductFormLabel"
                                >
                                    Category <span className="requiredMark">*</span>
                                </label>

                                <select
                                    id="productCategory"
                                    className="addProductFormSelect"
                                    value={form.category_id}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            category_id: event.target.value,
                                            // The API rejects a sub category
                                            // outside the chosen category.
                                            subcategory_id: "",
                                        }))
                                    }
                                >
                                    <option value="" disabled>
                                        {categories.length
                                            ? "Select Category"
                                            : "Loading categories..."}
                                    </option>

                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="addProductFormField addProductSubCategoryField">
                                <label
                                    htmlFor="productSubCategory"
                                    className="addProductFormLabel"
                                >
                                    Sub Category
                                </label>

                                <select
                                    id="productSubCategory"
                                    className="addProductFormSelect"
                                    disabled={!subcategories.length}
                                    value={form.subcategory_id}
                                    onChange={update("subcategory_id")}
                                >
                                    <option value="" disabled>
                                        {!form.category_id
                                            ? "Select Category First"
                                            : subcategories.length
                                              ? "Select Sub Category"
                                              : "No Sub Category"}
                                    </option>

                                    {subcategories.map((subcategory) => (
                                        <option
                                            key={subcategory.id}
                                            value={subcategory.id}
                                        >
                                            {subcategory.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="addProductFormField addProductDescriptionField">
                            <label
                                htmlFor="productDescription"
                                className="addProductFormLabel"
                            >
                                Description <span className="requiredMark">*</span>
                            </label>

                            <textarea
                                id="productDescription"
                                className="addProductFormTextarea"
                                placeholder="Describe your product"
                                value={form.description}
                                onChange={update("description")}
                            />
                        </div>
                    </section>

                    {/* Product Images */}
                    <section className="addProductContainer">
                        <h3 className="addProductContainerTitle">Product Images</h3>

                        <ProductImageDropZone
                            images={images}
                            onChange={setImages}
                        />
                    </section>

                    {/* Price & Stock */}
                    <section className="addProductContainer">
                        <h3 className="addProductContainerTitle">Price &amp; Stock</h3>

                        <div className="priceStockFormRow">
                            <div className="addProductFormField">
                                <label
                                    htmlFor="sellingPrice"
                                    className="addProductFormLabel"
                                >
                                    Selling Price{" "}
                                    <span className="requiredMark">*</span>
                                </label>

                                <div className="priceInputWrapper">
                                    <span className="priceCurrency">Rp.</span>

                                    <input
                                        type="text"
                                        id="sellingPrice"
                                        className="priceInput"
                                        inputMode="numeric"
                                        value={form.selling_price}
                                        onChange={updatePrice}
                                    />
                                </div>
                            </div>

                            <div className="addProductFormField">
                                <label
                                    htmlFor="minimumPurchase"
                                    className="addProductFormLabel"
                                >
                                    Minimum Purchase
                                </label>

                                <input
                                    type="number"
                                    id="minimumPurchase"
                                    className="addProductFormInput"
                                    min="1"
                                    value={form.minimum_purchase}
                                    onChange={update("minimum_purchase")}
                                />
                            </div>

                            <div className="addProductFormField">
                                <label
                                    htmlFor="productStock"
                                    className="addProductFormLabel"
                                >
                                    Stock <span className="requiredMark">*</span>
                                </label>

                                <input
                                    type="number"
                                    id="productStock"
                                    className="addProductFormInput"
                                    min="0"
                                    value={form.stock}
                                    onChange={update("stock")}
                                />
                            </div>
                        </div>

                        <div className="priceStockFormRow">
                            <div className="addProductFormField">
                                <label
                                    htmlFor="productWeight"
                                    className="addProductFormLabel"
                                >
                                    Product Weight (gram)
                                </label>

                                <div className="weightInputWrapper">
                                    <input
                                        type="number"
                                        id="productWeight"
                                        className="weightInput"
                                        placeholder="Example: 250"
                                        min="0"
                                        value={form.weight}
                                        onChange={update("weight")}
                                    />

                                    <span className="weightUnit">g</span>
                                </div>
                            </div>

                            <div className="addProductFormField">
                                <label
                                    htmlFor="unitOfItem"
                                    className="addProductFormLabel"
                                >
                                    Unit of Item{" "}
                                    <span className="requiredMark">*</span>
                                </label>

                                <select
                                    id="unitOfItem"
                                    className="addProductFormSelect"
                                    value={form.unit}
                                    onChange={update("unit")}
                                >
                                    <option value="" disabled>
                                        Choose unit of item
                                    </option>

                                    {UNITS.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit.charAt(0).toUpperCase() +
                                                unit.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Additional Information */}
                    <section className="addProductContainer">
                        <h3 className="addProductContainerTitle">
                            Additional Information
                        </h3>

                        <div className="addProductFormField addProductFullWidthField">
                            <label
                                htmlFor="productBrand"
                                className="addProductFormLabel"
                            >
                                Brand
                            </label>

                            <input
                                type="text"
                                id="productBrand"
                                className="addProductFormInput"
                                placeholder="Example: UMKM Lokal"
                                value={form.brand}
                                onChange={update("brand")}
                            />
                        </div>

                        <div className="addProductFormField addProductFullWidthField">
                            <label
                                htmlFor="productLocation"
                                className="addProductFormLabel"
                            >
                                Location
                            </label>

                            <input
                                type="text"
                                id="productLocation"
                                className="addProductFormInput"
                                placeholder="Example: Jakarta Selatan"
                                value={form.location}
                                onChange={update("location")}
                            />
                        </div>
                    </section>

                    {/* Shipping */}
                    <section className="addProductContainer">
                        <h3 className="addProductContainerTitle">Shipping</h3>

                        <div className="shippingDimensionRow">
                            {[
                                ["productLength", "Long (cm)", "length", "20"],
                                ["productWidth", "Width (cm)", "width", "15"],
                                ["productHeight", "Height (cm)", "height", "10"],
                            ].map(([elementId, label, field, example]) => (
                                <div key={field} className="shippingDimensionField">
                                    <label
                                        htmlFor={elementId}
                                        className="addProductFormLabel"
                                    >
                                        {label}
                                    </label>

                                    <input
                                        type="number"
                                        id={elementId}
                                        className="addProductFormInput"
                                        placeholder={`Example: ${example}`}
                                        min="0"
                                        step="0.01"
                                        value={form[field]}
                                        onChange={update(field)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="shippingFeeField">
                            <label
                                htmlFor="shippingFee"
                                className="addProductFormLabel"
                            >
                                Shipping Fee <span className="requiredMark">*</span>
                            </label>

                            <select
                                id="shippingFee"
                                className="addProductFormSelect"
                                value={form.shipping_fee_payer}
                                onChange={update("shipping_fee_payer")}
                            >
                                <option value="" disabled>
                                    Choose shipping fee
                                </option>

                                <option value="buyer">Borne by buyer</option>
                                <option value="seller">Borne by seller</option>
                            </select>
                        </div>
                    </section>

                    {/* Product Status */}
                    <section className="addProductContainer">
                        <h3 className="addProductContainerTitle">Product Status</h3>

                        <div className="productStatusButtons">
                            <button
                                type="button"
                                className={
                                    form.status === "active"
                                        ? "productStatusButton active"
                                        : "productStatusButton"
                                }
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        status: "active",
                                    }))
                                }
                            >
                                <img
                                    src={activeIcon}
                                    alt=""
                                    className="productStatusButtonIcon"
                                />

                                <span className="productStatusButtonText">Active</span>
                            </button>

                            <button
                                type="button"
                                className={
                                    form.status === "nonactive"
                                        ? "productStatusButton nonActive"
                                        : "productStatusButton"
                                }
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        status: "nonactive",
                                    }))
                                }
                            >
                                <img
                                    src={nonactiveIcon}
                                    alt=""
                                    className="productStatusButtonIcon"
                                />

                                <span className="productStatusButtonText">
                                    Nonactive
                                </span>
                            </button>
                        </div>
                    </section>

                    {errors.length > 0 && (
                        <p className="addProductFormError">{errors.join("\n")}</p>
                    )}
                </div>
            </main>

            {/* Save & Publish Bar */}
            <div className="savePublishBar">
                <Link to="/seller/products" className="savePublishCancelButton">
                    Cancel
                </Link>

                <button
                    type="button"
                    className="savePublishButton"
                    disabled={saving}
                    onClick={save}
                >
                    {saving
                        ? editing
                            ? "Saving..."
                            : "Publishing..."
                        : editing
                          ? "Save Changes"
                          : "Save & Publish"}
                </button>
            </div>
        </>
    );
}

/* "9000000.00" -> "9.000.000", the way the price input's own handler leaves
   it. Kept out of format.js: this one is an input value, not display text. */
function formatPrice(value) {
    return Number(value ?? 0).toLocaleString("id-ID");
}

/** A number field shows "" for null, and "321.00" is not what a seller typed. */
function numberValue(value) {
    return value === null || value === undefined ? "" : String(Number(value));
}
