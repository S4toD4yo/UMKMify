# UMKMify 🛍️🇮🇩

> **Platform E-Commerce Modern untuk Pemberdayaan Produk UMKM Indonesia**

UMKMify adalah platform marketplace dan katalog digital yang menghubungkan pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) dengan konsumen secara luas. Platform ini dirancang dengan arsitektur decoupled modern: RESTful API berbasis Laravel yang tangguh serta antarmuka pengguna berbasis React + Vite yang responsif, cepat, dan intuitif.

---

## Technology Stack

Berdasarkan arsitektur proyek, berikut adalah susunan teknologi yang digunakan:

| Layer | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **FrontEnd** | **React + Vite**<br>**Tailwind CSS** | Single Page Application (SPA) modern, cepat, modular, dan styling utilitas responsif. |
| **BackEnd** | **Laravel 12** | RESTful API backend, middleware auth, validasi request, dan ORM Eloquent. |
| **Database** | **MySQL** | Relational Database Management System untuk integritas data transaksional. |
| **Deployment** | **Vercel** (FrontEnd)<br>**Railway** (BackEnd) | Continuous deployment, serverless hosting frontend & containerized cloud backend. |
| **Version Control** | **Git**<br>**GitHub** | Manajemen kontrol versi, kolaborasi tim, dan CI/CD pipeline. |

---

## Deployment

* **FrontEnd (Vercel):** Terintegrasi langsung dengan repository GitHub. `vercel.json` telah dikonfigurasi untuk menangani rewrite rute SPA.
* **BackEnd (Railway):** Menggunakan `nixpacks.toml` dan `railway.json` untuk build PHP runtime, migration otomatis, dan penyediaan database MySQL Cloud.

---

## Fitur Utama

### Sisi Pembeli (Customer / User)
* **Katalog Produk & Kategori:** Eksplorasi produk UMKM dengan filter kategori (*Accessories, Beauty, Electronics, Fashion, Health, Hobbies, Plants*, dll).
* **Pencarian & Detail Produk:** Pencarian produk interaktif dengan galeri foto, spesifikasi, dan ulasan rating.
* **Keranjang Belanja & Checkout:** Pengelolaan item keranjang dan simulasi pemesanan produk.
* **Riwayat Pesanan (*Purchases*):** Pelacakan status transaksi dan daftar pembelian.
* **Informasi & Bantuan:** Halaman *About Us*, *Contact Us*, serta jaminan transparansi transaksi UMKM.

### Sisi Penjual (Seller Centre)
* **Seller Dashboard:** Statistik ringkasan toko dan performa penjualan produk UMKM.
* **Manajemen Produk (CRUD):** Tambah produk baru, edit detail produk, atur stok, harga, dan multi-upload foto produk.
* **Manajemen Pesanan (*Orders*):** Pemantauan dan pengelolaan pesanan masuk dari pembeli.
* **Manajemen Toko (*Store Profile*):** Pengaturan identitas dan profil toko.

### Autentikasi & Keamanan
* **Laravel Sanctum Token Authentication:** Manajemen session & token API yang aman.
* **Role-Based Access Control (RBAC):** Pemisahan hak akses antara User/Buyer dan UMKM Seller.
* **Validasi Data Form Requests:** Validasi input ketat untuk registrasi, login, dan modul katalog produk.

---

## Struktur Direktori Proyek

```plaintext
UMKMify/
├── BackEnd/                    # Laravel 12 RESTful API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # AuthController, ProductController, CatalogController, CategoryController
│   │   │   └── Requests/Api/      # Form Requests Validation
│   │   └── Models/                # User, Store, Product, ProductImage, Category, Role
│   ├── database/
│   │   ├── migrations/            # Skema migrasi database
│   │   └── seeders/               # CategorySeeder, DatabaseSeeder
│   ├── routes/
│   │   └── api.php                # Endpoint API RESTful
│   ├── nixpacks.toml              # Konfigurasi Railway Deployment
│   └── railway.json
│
├── FrontEnd/                   # React + Vite Client & Assets
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # Custom React Hooks (useAuth, useBodyClass)
│   │   ├── lib/                   # API Axios/Fetch client & AuthProvider
│   │   └── App.jsx
│   ├── source/                    # Wireframes, pages prototype & SVG assets
│   ├── vercel.json                # Konfigurasi Vercel Deployment
│   └── vite.config.js
│
├── Architecture.md             # Dokumentasi arsitektur sistem
├── Schema.md                   # Skema dan relasi tabel database
├── umkmify.sql                 # Database dump / SQL schema
└── README.md                   # Dokumentasi utama proyek
```

---

## Panduan Instalasi & Menjalankan Lokal

Pastikan Anda telah menginstal kebutuhan berikut di sistem lokal Anda:
* **PHP >= 8.2** & **Composer**
* **Node.js >= 18.x** & **npm**
* **MySQL Database Server**

### 1. Setup BackEnd (Laravel 12)

```bash
# Masuk ke direktori BackEnd
cd BackEnd

# Install dependency PHP
composer install

# Salin konfigurasi environment
cp .env.example .env

# Generate Application Key
php artisan key:generate

# Konfigurasikan koneksi database di file .env:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=umkmify
# DB_USERNAME=root
# DB_PASSWORD=

# Jalankan migrasi dan seeder database
php artisan migrate --seed

# Hubungkan symbolic link storage (untuk upload gambar)
php artisan storage:link

# Jalankan server API backend
php artisan serve
```
Backend API akan berjalan di: `http://127.0.0.1:8000`

---

### 2. Setup FrontEnd (React + Vite)

```bash
# Masuk ke direktori FrontEnd (buka terminal baru)
cd FrontEnd

# Install dependency Node
npm install

# Salin konfigurasi environment
cp .env.example .env

# Sesuaikan VITE_API_BASE_URL di .env jika diperlukan:
# VITE_API_BASE_URL=http://127.0.0.1:8000/api

# Jalankan server pengembangan
npm run dev
```
Aplikasi FrontEnd akan berjalan di: `http://localhost:5173`

---

## Endpoint Ringkasan API (`/api`)

| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Pendaftaran akun baru | Public |
| `POST` | `/api/login` | Login & generate token Sanctum | Public |
| `POST` | `/api/logout` | Logout & revoke token | Authenticated |
| `GET` | `/api/catalog` | Daftar katalog produk publik | Public |
| `GET` | `/api/catalog/{id}` | Detail produk & seller | Public |
| `GET` | `/api/categories` | Daftar kategori produk | Public |
| `GET` | `/api/seller/products` | Daftar produk milik toko seller | Seller |
| `POST` | `/api/seller/products` | Tambah produk baru beserta foto | Seller |
| `PUT` | `/api/seller/products/{id}`| Perbarui data produk | Seller |
| `DELETE`| `/api/seller/products/{id}`| Hapus produk | Seller |

---
