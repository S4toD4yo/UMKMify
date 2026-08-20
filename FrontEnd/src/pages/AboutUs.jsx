import WhyChoose from "@/components/WhyChoose.jsx";
import sellerImage from "@assets/images/UMKMseller.png";
import groupImage from "@assets/images/Group of UMKM Seller.png";
import missionIcon from "@assets/icons/AboutUs/Mission.svg";
import visionIcon from "@assets/icons/AboutUs/Vision.svg";
import checklistIcon from "@assets/icons/AboutUs/Checklist.svg";

const MISSION_VISION = [
    {
        icon: missionIcon,
        alt: "Mission",
        title: "Our Mission",
        description:
            "To provide user friendly technology that helps UMKM increase sales, improve operational efficiency, and stay competitive in the digital era.",
        points: [
            "Support the digital transformation of UMKM across Indonesia.",
            "Provide a secure and user friendly marketplace platform.",
            "Build a mutually beneficial business ecosystem.",
        ],
    },
    {
        icon: visionIcon,
        alt: "Vision",
        title: "Our Vision",
        description:
            "To become the leading digital platform that empowers Indonesian UMKM to grow without limits.",
        points: [
            "Build a digitally empowered Indonesia.",
            "Connect UMKM with more customers.",
            "Drive local economic growth.",
        ],
    },
];

export default function AboutUs() {
    return (
        <>
            {/* About Us Content */}
            <main className="aboutUsPage">
                <section className="aboutUsText">
                    <h1 className="aboutUsTitle">About Us</h1>

                    <h2 className="aboutUsSubtitle">
                        A digital platform that empowers local UMKM to grow and reach
                        more customers.
                    </h2>

                    <p className="aboutUsDescription">
                        UMKMify is designed to help micro, small, and medium
                        enterprises embrace digital transformation with ease,
                        security, and efficiency.
                    </p>
                </section>
            </main>

            {/* About Us Image */}
            <div className="aboutUsImageContainer">
                <img
                    src={sellerImage}
                    alt="About UMKMify"
                    className="aboutUsImage"
                />
            </div>

            {/* About Us Section */}
            <section className="aboutUsSection">
                <h1 className="aboutUsSectionTitle">Our Mission &amp; Vision</h1>

                <div className="missionVisionCards">
                    {MISSION_VISION.map((card) => (
                        <div key={card.title} className="missionVisionCard">
                            <div className="missionVisionHeader">
                                <img
                                    src={card.icon}
                                    alt={card.alt}
                                    className="missionVisionCardIcon"
                                />

                                <div className="missionVisionCardContent">
                                    <h2 className="missionVisionCardTitle">
                                        {card.title}
                                    </h2>

                                    <p className="missionVisionCardDescription">
                                        {card.description}
                                    </p>
                                </div>
                            </div>

                            <div className="missionVisionList">
                                {card.points.map((point) => (
                                    <div key={point} className="missionVisionListItem">
                                        <img
                                            src={checklistIcon}
                                            alt=""
                                            className="missionVisionListIcon"
                                        />

                                        <p className="missionVisionListText">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <WhyChoose />
            </section>

            {/* About Us Additional Content */}
            <section className="aboutUsAdditional">
                <h1 className="aboutUsAdditionalTitle">
                    Together with UMKM, We Can Help Local Businesses Reach the Next
                    Level.
                </h1>

                <p className="aboutUsAdditionalDescription">
                    We believe that UMKM are the backbone of Indonesia&apos;s economy.
                    Together, let&apos;s grow, innovate, and embrace digital
                    transformation for a brighter future.
                </p>
            </section>

            <div className="aboutUsAdditionalImageContainer">
                <img src={groupImage} alt="" className="aboutUsAdditionalImage" />
            </div>
        </>
    );
}
