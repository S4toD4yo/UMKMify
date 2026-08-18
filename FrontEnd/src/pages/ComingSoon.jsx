import { Link } from "react-router-dom";

/**
 * Placeholder. The prototype's Error/comingSoon.html is still empty, so this
 * is a stub to keep the "Forgot Password?" link from landing nowhere.
 */
export default function ComingSoon() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-h2 font-bold text-ink">Coming Soon</h1>

            <p className="max-w-md text-ink/70">
                Fitur ini belum tersedia.
            </p>

            <Link to="/login" className="font-semibold text-primary hover:underline">
                Kembali ke halaman masuk
            </Link>
        </main>
    );
}
