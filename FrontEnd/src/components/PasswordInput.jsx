import { useState } from "react";
import eyeIcon from "@assets/icons/Eye.svg";
import eyeSlashIcon from "@assets/icons/EyeSlash.svg";

/**
 * The show/hide password control from the prototype (App.js), as a component.
 * `wrapperClass` and `toggleClass` differ between the login and register
 * pages, so both are passed in.
 */
export default function PasswordInput({
    wrapperClass,
    inputClass,
    toggleClass,
    ...inputProps
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={wrapperClass}>
            <input
                {...inputProps}
                type={visible ? "text" : "password"}
                className={inputClass}
            />

            <button
                type="button"
                className={toggleClass}
                onClick={() => setVisible((shown) => !shown)}
                aria-label={visible ? "Hide password" : "Show password"}
                tabIndex={-1}
            >
                <img src={visible ? eyeSlashIcon : eyeIcon} alt="" />
            </button>
        </div>
    );
}
