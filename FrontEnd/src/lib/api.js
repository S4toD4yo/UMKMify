import axios from "axios";

const TOKEN_KEY = "umkmify.token";

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

// In development VITE_API_URL is empty and requests go through the Vite proxy
// defined in vite.config.js. In production it points at the Railway backend.
//
// Auth uses Sanctum bearer tokens rather than cookies: the frontend (Vercel)
// and the API (Railway) sit on different domains, where cookie-based SPA auth
// needs shared-domain cookies we do not have.
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? ""}/api`,
    headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
    const token = tokenStore.get();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/**
 * Turn a Laravel 422 response into a flat { field: message } object, and any
 * other failure into a single message under `form`.
 */
export function toFormErrors(error) {
    const data = error.response?.data;

    if (data?.errors) {
        return Object.fromEntries(
            Object.entries(data.errors).map(([field, messages]) => [
                field,
                messages[0],
            ])
        );
    }

    if (data?.message) {
        return { form: data.message };
    }

    return { form: "Tidak bisa terhubung ke server. Coba lagi sebentar." };
}

export default api;
