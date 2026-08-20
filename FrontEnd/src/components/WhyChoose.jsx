import logo from "@assets/images/Logo - White Background.svg";
import originalIcon from "@assets/icons/Homepage/originalUMKM.svg";
import safeIcon from "@assets/icons/Homepage/safeTransaction.svg";
import supportIcon from "@assets/icons/Homepage/supportUMKM.svg";

const REASONS = [
    {
        icon: originalIcon,
        title: "UMKM Original Products",
        description: "All the products coming from trusted UMKM in Indonesia.",
    },
    {
        icon: safeIcon,
        title: "Safe Transaction",
        description: "Secure payment system and guaranteed data protection.",
    },
    {
        icon: supportIcon,
        title: "Support Local Business",
        description:
            "Every purchase supports local UMKM in reaching the next level.",
    },
];

/**
 * The "Why Choose UMKMify?" block. homePage.html and aboutUs.html each carried
 * their own copy of it; this is the one both now use.
 */
export default function WhyChoose() {
    return (
        <>
            <section className="whyChoose">
                <h1 className="whyChooseTitle">Why Choose</h1>

                <img src={logo} alt="" className="whyChooseIcon" />

                <h1 className="whyChooseQuestion">?</h1>
            </section>

            <div className="whyChooseCards">
                {REASONS.map((reason) => (
                    <div key={reason.title} className="whyChooseCard">
                        <img src={reason.icon} alt="" className="whyChooseCardIcon" />

                        <div className="whyChooseCardContent">
                            <h3 className="whyChooseCardTitle">{reason.title}</h3>

                            <p className="whyChooseCardDescription">
                                {reason.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
