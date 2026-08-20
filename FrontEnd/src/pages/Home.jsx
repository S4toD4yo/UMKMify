import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WhyChoose from "@/components/WhyChoose.jsx";
import api from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import banner from "@assets/images/Welcome Banner.png";
import squaresIcon from "@assets/icons/Homepage/SquaresFour.svg";
import handbagIcon from "@assets/icons/Homepage/Handbag.svg";
import placeholderIcon from "@assets/icons/SellerCentre/Image.svg";
import electronicsIcon from "@assets/icons/Category/Electronics.svg";
import fashionIcon from "@assets/icons/Category/Fashion.svg";
import beautyIcon from "@assets/icons/Category/Beauty.svg";
import plantsIcon from "@assets/icons/Category/Plants.svg";
import healthIcon from "@assets/icons/Category/Health.svg";
import accessoriesIcon from "@assets/icons/Category/Accessories.svg";
import hobbiesIcon from "@assets/icons/Category/Hobbies.svg";
import moreIcon from "@assets/icons/Category/More.svg";

const CATEGORIES = [
    { label: "Electronics", icon: electronicsIcon },
    { label: "Fashion", icon: fashionIcon },
    { label: "Beauty", icon: beautyIcon },
    { label: "Plants", icon: plantsIcon },
    { label: "Health", icon: healthIcon },
    { label: "Accessories", icon: accessoriesIcon },
    { label: "Hobbies", icon: hobbiesIcon },
    { label: "More", icon: moreIcon },
];


export default function Home() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        let cancelled = false;

        api.get("/catalog/products")
            .then(({ data }) => {
                if (!cancelled) {
                    setProducts(data.products ?? []);
                }
            })
            .catch((error) => {
                // The empty state below is already the right thing to show, so
                // a failure needs nothing beyond a note in the console.
                console.error("Failed to load the latest products:", error);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="homePage">
            <section className="homeBanner">
                <img
                    src={banner}
                    alt="Homepage Banner"
                    className="homeBannerImage"
                />
            </section>

            {/* Popular Category */}
            <section className="popularCategory">
                <img className="popularCategoryIcon" src={squaresIcon} alt="" />

                <h1 className="popularCategoryTitle">Popular Category</h1>
            </section>

            <div className="popularCategoryCards">
                {CATEGORIES.map((category) => (
                    <Link
                        key={category.label}
                        to="/coming-soon"
                        className="popularCategoryCard"
                    >
                        <img
                            src={category.icon}
                            alt={category.label}
                            className="popularCategoryCardIcon"
                        />

                        <span className="popularCategoryCardTitle">
                            {category.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Latest Products */}
            <section className="latestProduct">
                <img className="latestProductIcon" src={handbagIcon} alt="" />

                <h1 className="latestProductTitle">Latest Product</h1>
            </section>

            {products.length > 0 ? (
                <div className="latestProductGrid">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            to={`/product/${product.id}`}
                            className="latestProductCard"
                        >
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt=""
                                    className="latestProductCardImage"
                                />
                            ) : (
                                <span className="latestProductCardImage latestProductCardImageEmpty">
                                    <img src={placeholderIcon} alt="" />
                                </span>
                            )}

                            <div className="latestProductCardBody">
                                <h3
                                    className="latestProductCardName"
                                    title={product.name}
                                >
                                    {product.name}
                                </h3>

                                <p className="latestProductCardPrice">
                                    {formatRupiah(product.price)}
                                </p>

                                {(product.store || product.location) && (
                                    <p className="latestProductCardMeta">
                                        {product.store || product.location}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                /* Still the fallback when nothing is listed yet, or when the
                   API cannot be reached. */
                <>
                    <h2 className="latestProductEmpty">
                        This website is waiting for its first product to be listed.
                    </h2>

                    <Link to="/seller/products/new" className="latestProductButton">
                        Be the first to list a product on this website!
                    </Link>
                </>
            )}

            <WhyChoose />
        </main>
    );
}
