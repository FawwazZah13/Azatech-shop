# Azatech Shop

Aplikasi Online Shop sederhana untuk mengelola produk, pelanggan, dan transaksi penjualan (order management). Satu order dapat berisi lebih dari satu produk. Dibuat sebagai Technical Test Medior Fullstack Developer.

Repository ini berisi dua service yang berdiri sendiri:

| Folder | Isi |
|---|---|
| `backend/` | REST API (Laravel 13, Sanctum, PostgreSQL) |
| `frontend/` | Aplikasi web (Next.js App Router, React 19, TypeScript) |
| `docs/` | Postman collection (`azatech-shop.postman_collection.json`) |

## Tech Stack dan Alasannya

**Backend (Track B)**

| Komponen | Pilihan | Alasan |
|---|---|---|
| Framework | Laravel 13, PHP 8.5 | Struktur yang jelas (Form Request, Resource, Eloquent), cocok untuk CRUD dan aturan bisnis berlapis |
| Database | PostgreSQL 17 | Mendukung `decimal` presisi, `SELECT ... FOR UPDATE`, dan advisory lock yang dipakai untuk keamanan stok dan nomor order |
| Autentikasi | Laravel Sanctum (API token) | Sesuai soal Track B, sederhana, token bisa dicabut saat logout |
| Validasi | Form Request | Validasi terpisah dari controller |
| Testing | Pest | Sintaks ringkas, mudah dibaca |

**Frontend**

| Komponen | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Sesuai soal; hanya dipakai sebagai UI, seluruh logika bisnis ada di backend |
| Data fetching | TanStack Query | Cache, state loading/error, dan refetch otomatis setelah data berubah |
| Styling | Tailwind CSS | Cepat dan konsisten, mudah dibuat responsive |

## Akun Login (dari seeder)

| Email | Password |
|---|---|
| `admin@azatech.id` | `password` |

## Setup dari Nol

Prasyarat: PHP 8.3+ (dengan ekstensi `pdo_pgsql`, `bcmath`, `mbstring`), Composer 2, Node.js 24+, PostgreSQL 15+.

**1. Clone dan siapkan database**

```bash
git clone https://github.com/FawwazZah13/Azatech-shop.git
cd Azatech-shop
createdb -U postgres azatech_shop
```

**2. Backend**

```bash
cd backend
composer install
cp .env.example .env        # Windows CMD: copy .env.example .env
```

Buka `backend/.env`, sesuaikan `DB_PORT`, `DB_USERNAME`, dan `DB_PASSWORD` dengan PostgreSQL Anda, lalu:

```bash
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API berjalan di `http://127.0.0.1:8000/api`.

**3. Frontend** (terminal kedua)

```bash
cd frontend
npm install
cp .env.example .env.local  # Windows CMD: copy .env.example .env.local
npm run dev
```

Buka `http://localhost:3000` lalu login dengan akun di atas.

Seeder membuat: 1 user admin, 20 produk (3 di antaranya stok < 5), 15 customer, dan 30 order yang tersebar dalam 30 hari terakhir. Seeder aman dijalankan ulang (tidak menggandakan data).

## Menjalankan Test

Test memakai database terpisah supaya data asli tidak tersentuh.

```bash
createdb -U postgres azatech_shop_test
cd backend
php artisan test
```

Koneksi database test diatur di `backend/phpunit.xml` (database `azatech_shop_test`). Sesuaikan host, port, user, dan password di file tersebut dengan PostgreSQL Anda sebelum menjalankan test.

Cakupan test:
- Order sukses dan stok berkurang, total dihitung di server
- Stok tidak cukup (422) dan tidak ada stok yang berubah
- Validasi input gagal, produk dobel dalam satu order
- Akses tanpa token (401)
- `price` dan `total_amount` dari client diabaikan
- CRUD produk dan pelanggan, search, sort, pagination
- Soft delete: riwayat order tetap menampilkan produk yang sudah dihapus; pelanggan yang dihapus tidak bisa dipesan
- Snapshot harga (`unit_price`) tidak berubah saat harga produk diubah
- Filter riwayat order (rentang tanggal dan pelanggan)
- Ringkasan dashboard

Pemeriksaan frontend: `npm run lint` dan `npm run build` di folder `frontend`.

## Dokumentasi API

Postman collection ada di `docs/azatech-shop.postman_collection.json`. Cara memakai:

1. Import file ke Postman.
2. Jalankan **Auth > Login**; token tersimpan otomatis ke variabel collection.
3. Jalankan **Customers > List Customers** agar `existing_customer_id` terisi, lalu request Orders bisa dipakai.

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/auth/login` | POST | Login, mengembalikan token |
| `/api/auth/logout` | POST | Mencabut token yang sedang dipakai |
| `/api/auth/me` | GET | Profil user yang login |
| `/api/products` | GET | List (`page`, `per_page`, `search`, `sort`) |
| `/api/products/{id}` | GET / PUT / DELETE | Detail / ubah / soft delete |
| `/api/products` | POST | Tambah produk (`product_code` opsional) |
| `/api/customers` | GET / POST | List (`page`, `search`) / tambah |
| `/api/customers/{id}` | GET / PUT / DELETE | Detail / ubah / soft delete |
| `/api/orders` | GET | List (`from`, `to`, `customer_id`, `page`) |
| `/api/orders/{id}` | GET | Detail order beserta item |
| `/api/orders` | POST | Buat transaksi penjualan |
| `/api/dashboard/summary` | GET | Ringkasan dashboard |

Semua endpoint selain login wajib memakai header `Authorization: Bearer <token>`. Format `sort` produk: `name`, `price`, `stock`; awalan `-` berarti menurun (mis. `-price`).

Format response seragam:

```json
{ "success": true, "message": "OK", "data": [], "meta": { "page": 1, "per_page": 10, "total": 57, "total_pages": 6 } }
```

```json
{ "success": false, "message": "Stok tidak mencukupi", "errors": { "items.1.quantity": ["Stok Hydrococo 150ml tersisa 3, diminta 5"] } }
```

Status code yang dipakai: 200, 201, 401, 404, 422, 500.

## Logika Aplikasi

### Alur pembuatan order

Seluruh logika ada di `backend/app/Services/OrderService.php`, dipakai bersama oleh API dan seeder.

1. **Validasi request** (`StoreOrderRequest`): pelanggan harus ada dan belum dihapus, minimal satu item, produk tidak boleh dobel, jumlah bilangan bulat ≥ 1. Field `price` dan `total` dari client tidak ada di aturan sehingga diabaikan.
2. **Satu database transaction** membungkus semua langkah berikut. Kalau ada yang gagal, semuanya dibatalkan (rollback).
3. **Kunci baris produk** dengan `SELECT ... FOR UPDATE`, diurutkan berdasarkan `id` agar dua order bersamaan tidak saling menunggu (deadlock).
4. **Validasi stok semua item** sebelum menulis apa pun. Error dari semua item dikumpulkan sekaligus dengan kunci `items.{index}.quantity`, sehingga frontend bisa menandai baris yang bermasalah.
5. **Buat order**, lalu untuk setiap item: `unit_price` disalin dari harga produk saat itu (snapshot), `subtotal = unit_price × quantity`, dan stok dikurangi.
6. **Total** dijumlahkan di server lalu disimpan ke `total_amount`.

### Penanganan stok

- Stok tidak bisa negatif: kolom `unsigned` di database, divalidasi di service, dan dikunci selama transaksi sehingga dua pembeli tidak bisa sama-sama "menghabiskan" stok yang sama.
- Satu item gagal berarti seluruh order gagal dan **tidak ada stok yang berkurang** (diuji otomatis).

### Hal teknis lain

- **Uang** memakai `decimal` di database dan fungsi `bcmath` (`bcmul`, `bcadd`) di PHP, bukan float, supaya tidak ada selisih pembulatan.
- **Nomor order** berformat `INV-YYYYMMDD-XXXX`, urutan reset tiap hari. Pembuatan nomor dilindungi PostgreSQL advisory lock agar dua request bersamaan tidak mendapat nomor yang sama; kolom juga `unique` sebagai jaring pengaman.
- **Kode produk** dibuat otomatis (`P0001`, `P0002`, ...) bila tidak diisi, dari nomor tertinggi **termasuk produk yang sudah dihapus**, sehingga kode bekas tidak pernah dipakai ulang dan riwayat order tidak ambigu. Kode juga boleh diisi manual.
- **Soft delete** pada produk dan pelanggan. Relasi di order memakai `withTrashed()`, jadi riwayat tetap utuh. Foreign key memakai `RESTRICT` untuk mencegah penghapusan fisik.
- **Dashboard** dihitung dengan query agregasi SQL di backend; frontend hanya menampilkan.

### Frontend

- `src/lib/api.ts` adalah satu-satunya pintu ke backend: menempel token, menormalkan error (`ApiError` membawa `errors` per field), dan otomatis kembali ke `/login` saat menerima 401 (token kedaluwarsa atau dicabut).
- Proteksi route lewat `AuthGuard` di route group `(app)`; halaman `/login` berada di luar grup.
- Form order: baris produk dinamis, subtotal dan total dihitung dalam sen (bilangan bulat) di browser hanya sebagai perkiraan. Angka resmi dari server. Error server dipetakan ke baris yang bermasalah.
- Format Rupiah (`Rp 12.000`) dan tanggal Indonesia memakai `Intl` dengan locale `id-ID`, zona waktu `Asia/Jakarta`.

## Struktur Database

Mengikuti acuan soal. Tambahan di luar acuan:

| Tambahan | Alasan |
|---|---|
| Index `products.product_name`, `customers.customer_name` | Mempercepat search dan sort nama |
| Index `orders.order_date`, `orders.customer_id`, `order_items.order_id`, `order_items.product_id` | Filter riwayat order dan query produk terlaris |
| `personal_access_tokens` | Tabel token bawaan Sanctum |

## Asumsi

- Hanya ada satu peran (admin); belum ada pembedaan hak akses (status 403 belum terpakai).
- Order tidak bisa diubah atau dibatalkan setelah dibuat (tidak ada pengembalian stok).
- Hapus berhasil membalas `200` dengan pesan (bukan `204`) agar format response tetap seragam.
- Kode produk bekas tidak dipakai ulang (lihat di atas).
- Zona waktu aplikasi `Asia/Jakarta` (`APP_TIMEZONE` di `.env`).
- Nilai stok di seeder: stok seluruh produk dinaikkan sementara agar 30 order seed tidak gagal, lalu 3 produk pertama diatur ke stok 1-4 agar peringatan stok menipis punya data.

## Keterbatasan dan Rencana Perbaikan

- Token disimpan di `localStorage` (rentan terhadap XSS). Perbaikan: cookie `httpOnly` lewat Sanctum SPA authentication.
- Sanctum tidak memakai refresh token dan masa berlaku token belum dibatasi. Perbaikan: atur `expiration` di `config/sanctum.php` dan kebijakan pembaruan token.
- Dropdown pelanggan dan produk di form order memuat maksimal 100 data. Perbaikan: combobox dengan pencarian ke server.
- Belum ada pembatalan order dan pengembalian stok.
- Konfigurasi koneksi database test masih ada di `phpunit.xml`. Perbaikan: pindahkan ke file lokal yang tidak di-commit.
- Belum ada test frontend (Vitest + Testing Library atau Playwright), Docker Compose, GitHub Actions, grafik penjualan, dan export CSV (bagian bonus).
- Peringatan keamanan dari `composer audit` perlu ditinjau berkala.

## AI Usage

Tools yang dipakai: **Claude (Anthropic)** sebagai asisten pemandu pengerjaan.

Dipakai untuk:
- Panduan langkah demi langkah dan pemecahan masalah setup lingkungan (PHP, PostgreSQL, PATH).
- Merancang struktur backend dan frontend serta menulis draf kode awal (migration, model, service order, controller, Form Request, komponen React, test).
- Menjelaskan konsep di balik kode (transaksi, penguncian baris, soft delete, TanStack Query) dan menyusun draf README ini.

