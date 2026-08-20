import { useState } from "react";
import { useNavigate } from "react-router-dom";
import emailIcon from "@assets/icons/ContactUs/Email.svg";
import phoneIcon from "@assets/icons/ContactUs/Phone.svg";
import locationIcon from "@assets/icons/ContactUs/Location.svg";

const WAYS = [
    {
        icon: emailIcon,
        tone: "contactUsWayBlue",
        title: "Email",
        text: "support@umkmify.co.id",
    },
    {
        icon: phoneIcon,
        tone: "contactUsWayOrange",
        title: "Phone Number / WhatsApp",
        text: "+62 895-3227-8115",
        href: "https://api.whatsapp.com/send/?phone=%2B6289532278115&text&type=phone_number&app_absent=0",
    },
    {
        icon: locationIcon,
        tone: "contactUsWayBlue",
        title: "Office Location",
        text: "BINUS @Alam Sutera",
        href: "https://maps.app.goo.gl/RdPxARvVEefM1Tup9",
    },
];

const SUBJECTS = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "feedback", label: "Feedback" },
    { value: "partnership", label: "Partnership" },
];

export default function ContactUs() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    function update(field) {
        return (event) =>
            setForm((current) => ({ ...current, [field]: event.target.value }));
    }

    return (
        <main className="contactUsPage">
            <section className="contactUsIntro">
                <h1 className="contactUsTitle">Contact Us</h1>

                <p className="contactUsDescription">
                    We&apos;re here to help! Have any questions, suggestions, or need
                    assistance? Contact us using the form below or through the contact
                    information provided.
                </p>
            </section>

            <div className="contactUsContainers">
                {/* Ways To Connect Us */}
                <section className="contactUsContainer">
                    <h1 className="contactUsContainerTitle">Ways To Connect Us</h1>

                    <div className="contactUsWays">
                        {WAYS.map((way) => (
                            <div
                                key={way.title}
                                className={`contactUsWay ${way.tone}`}
                            >
                                <img
                                    src={way.icon}
                                    alt=""
                                    className="contactUsWayIcon"
                                />

                                <div className="contactUsWayContent">
                                    <h2 className="contactUsWayTitle">{way.title}</h2>

                                    {way.href ? (
                                        <a
                                            href={way.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="contactUsWayDescription"
                                        >
                                            {way.text}
                                        </a>
                                    ) : (
                                        <p className="contactUsWayDescription">
                                            {way.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Send Message */}
                <section className="sendMessageContainer">
                    <h1 className="sendMessageTitle">Send Message</h1>

                    <div className="contactFormRow">
                        <div className="contactFormField">
                            <h3 className="contactFormLabel">Full Name</h3>

                            <input
                                type="text"
                                className="contactFormInput"
                                placeholder="Enter your full name"
                                value={form.name}
                                onChange={update("name")}
                            />
                        </div>

                        <div className="contactFormField">
                            <h3 className="contactFormLabel">Email Address</h3>

                            <input
                                type="email"
                                className="contactFormInput"
                                placeholder="Enter your email address"
                                value={form.email}
                                onChange={update("email")}
                            />
                        </div>
                    </div>

                    <div className="contactFormSubject">
                        <h3 className="contactFormLabel">Subject</h3>

                        <select
                            className="contactFormSelect"
                            value={form.subject}
                            onChange={update("subject")}
                        >
                            <option value="" disabled>
                                Select a message subject
                            </option>

                            {SUBJECTS.map((subject) => (
                                <option key={subject.value} value={subject.value}>
                                    {subject.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="contactFormMessage">
                        <h3 className="contactFormLabel">Message</h3>

                        <textarea
                            className="contactFormTextarea"
                            placeholder="Enter your message here..."
                            value={form.message}
                            onChange={update("message")}
                        />
                    </div>

                    {/* umkmify.sql has a `contact_messages` table, but nothing
                        reads or writes it yet: the prototype's button was an
                        <a href="#"> that went nowhere. Until there is an
                        endpoint, this says so plainly instead. */}
                    <button
                        type="button"
                        className="contactFormButton"
                        onClick={() => navigate("/coming-soon")}
                    >
                        Send Message
                    </button>
                </section>
            </div>
        </main>
    );
}
