import { useCallback, useEffect, useMemo, useState } from "react";
import api, { tokenStore, toFormErrors } from "@/lib/api";
import { AuthContext } from "@/lib/authContext";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(Boolean(tokenStore.get()));

    // Restore the session on a hard refresh: a token in localStorage only
    // counts as signed in once the API confirms it is still valid.
    useEffect(() => {
        if (!tokenStore.get()) {
            return;
        }

        let cancelled = false;

        api.get("/auth/me")
            .then(({ data }) => {
                if (!cancelled) {
                    setUser(data.user);
                }
            })
            .catch(() => tokenStore.clear())
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const authenticate = useCallback(async (endpoint, payload) => {
        try {
            const { data } = await api.post(endpoint, payload);

            tokenStore.set(data.token);
            setUser(data.user);

            return { ok: true, errors: {} };
        } catch (error) {
            return { ok: false, errors: toFormErrors(error) };
        }
    }, []);

    const login = useCallback(
        (payload) => authenticate("/auth/login", payload),
        [authenticate]
    );

    const register = useCallback(
        (payload) => authenticate("/auth/register", payload),
        [authenticate]
    );

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // The token is being discarded either way.
        }

        tokenStore.clear();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
