# Migrations tidak dipakai

Skema UMKMify dipegang oleh `umkmify.sql` di root repository — file itu satu-satunya
sumber kebenaran. Migration bawaan Laravel (`create_users_table`, `create_cache_table`,
`create_jobs_table`) sengaja dihapus karena bentrok dengan tabel di sana.

Untuk menyiapkan database:

```bash
mysql -u root umkmify < ../umkmify.sql
```

Kalau ada perubahan skema, ubah `umkmify.sql`, lalu impor ulang. Jangan
menambahkan migration di folder ini kecuali keputusan itu ditinjau ulang.
