import { motion } from "framer-motion";
import logo from "@assets/images/Logo - Default.svg";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
            <motion.img
                src={logo}
                alt="UMKMify"
                className="h-20"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            />

            <h1 className="text-h1 font-bold text-ink">
                Selamat datang di <span className="text-primary">UMKMify</span>
            </h1>

            <p className="max-w-xl text-lg text-ink/70">
                Stack sudah siap: React + Vite + Tailwind di depan, Laravel 12 +
                MySQL di belakang. Halaman prototipe HTML masih tersimpan di{" "}
                <code className="rounded bg-primary-soft px-1.5 py-0.5">
                    FrontEnd/source/pages
                </code>
                .
            </p>

            <a
                href="/api/health"
                className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-dark"
            >
                Cek koneksi API
            </a>
        </main>
    );
}
