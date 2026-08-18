import { useEffect } from "react";

/**
 * The prototype styles the auth pages through a class on <body>
 * (.loginAuthBody / .registerAuthBody), so routes have to set it themselves.
 */
export function useBodyClass(className) {
    useEffect(() => {
        if (!className) {
            return;
        }

        document.body.classList.add(className);

        return () => document.body.classList.remove(className);
    }, [className]);
}
