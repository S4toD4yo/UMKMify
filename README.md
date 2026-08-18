# UMKMify

Marketplace untuk UMKM Indonesia. Frontend dan backend berjalan sebagai dua
aplikasi terpisah.

```
UMKMify/
├── FrontEnd/          React 19 + Vite 6 + Tailwind v4
│   ├── src/           kode React (komponen, halaman, layout, lib)
│   └── source/        prototipe HTML/CSS lama + semua aset (font, ikon, gambar)
├── BackEnd/           Laravel 12 REST API + Sanctum
├── umkmify.sql        skema MySQL (lihat Schema.md)
├── Architecture.md    stack teknologi
└── Design.md          design system
```

## Prasyarat

| Tool     | Versi terpasang |
| -------- | --------------- |
| Node     | 24.x            |
| PHP      | 8.5             |
| Composer | 2.10            |
| MySQL    | 8.4 (Laragon)   |

## Menjalankan secara lokal

Nyalakan MySQL dulu (Laragon → Start All), lalu buka dua terminal.

Backend — http://127.0.0.1:8000

```bash
cd BackEnd && php artisan serve
```

Frontend — http://localhost:5173

```bash
cd FrontEnd && npm run dev
```

Vite mem-proxy `/api/*` ke `127.0.0.1:8000`, jadi tidak ada masalah CORS saat
development. Cek koneksi lewat http://localhost:5173/api/health.

### Alternatif: prototipe HTML lewat Apache

Halaman HTML di `FrontEnd/source/pages/` juga bisa dibuka langsung dari Apache
(Laragon), misalnya:

```
http://localhost/projects/UMKMify/FrontEnd/source/pages/User/login.html
```

Login dan register di halaman itu memanggil API lewat `fetch` di `App.js` —
tidak ada proxy, jadi originnya (`http://localhost`) harus terdaftar di
`FRONTEND_URL` pada `BackEnd/.env`. Nilainya boleh berisi beberapa origin
dipisah koma.

Kedua versi memakai endpoint, token, dan `authFeedback.css` yang sama.

## Setup pertama kali

```bash
cd FrontEnd && npm install
```

```bash
cd BackEnd && composer install && cp .env.example .env && php artisan key:generate
```

Impor skema database:

```bash
mysql -u root umkmify < umkmify.sql
```

`umkmify.sql` adalah satu-satunya sumber kebenaran untuk skema — migration
Laravel tidak dipakai dan `database/migrations/` sengaja dikosongkan. Kalau
skema berubah, ubah `umkmify.sql` lalu impor ulang. Tabel `personal_access_tokens`
milik Sanctum sudah ikut di dalam file itu.

Model `User` mengikuti kolom di sana: identitas akun memakai `username`, bukan
`name`. Reset password di luar lingkup proyek — link "Forgot Password?" di
halaman login mengarah ke halaman Coming Soon, jadi tabel `password_reset_tokens`
memang sengaja tidak ada di `umkmify.sql`.

## Environment

`BackEnd/.env` — koneksi MySQL, `FRONTEND_URL` (dipakai untuk CORS dan Sanctum).
`FrontEnd/.env` — `VITE_API_URL`; biarkan kosong di development agar proxy Vite
yang dipakai, isi dengan URL Railway saat production.

Session, cache, dan queue memakai driver `file`/`sync` supaya tidak perlu tabel
tambahan di luar `umkmify.sql`.

## Deployment

Frontend ke Vercel dengan root directory `FrontEnd/` — konfigurasinya sudah ada
di `FrontEnd/vercel.json` (SPA rewrite ke `index.html`).

Backend ke Railway dengan root directory `BackEnd/` — `nixpacks.toml` menjalankan
cache config/route/view, `railway.json` memakai `/api/health` sebagai healthcheck.
Set `APP_KEY`, `APP_ENV=production`, `DB_*`, dan `FRONTEND_URL` di Railway.
