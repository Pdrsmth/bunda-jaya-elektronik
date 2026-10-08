# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi ke **Bunda Jaya Elektronik**! 🎉

## Cara Berkontribusi

1. **Fork** repository ini.
2. Buat branch baru dari `main`:
   ```bash
   git checkout -b fitur/nama-fitur
   ```
3. Lakukan perubahan dengan commit yang jelas (lihat format di bawah).
4. **Push** ke fork kamu, lalu buka **Pull Request**.

## Format Commit

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
tipe(scope): deskripsi singkat

Contoh:
feat(pos): tambah diskon persen di kasir
fix(stok): perbaiki double-increment saat pembelian
docs(readme): tambah screenshot dashboard
refactor(api): sederhanakan validasi transaksi
```

Tipe yang dipakai: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Standar Kode

- **PHP**: PSR-12, indent 4 spasi. Semua query pakai **prepared statement** (PDO).
- **JavaScript**: ES modules, indent 2 spasi. Data dari server/user wajib lewat `esc()` sebelum masuk `innerHTML`.
- **Keamanan**: jangan pernah commit kredensial, password, atau API key. Kredensial lokal cukup di `api/config/database.php` (tidak ikut push kalau pakai `.env`).

## Melapor Bug

Buka **Issues** dengan format:

- **Judul**: `[BUG] deskripsi singkat`
- **Isi**: langkah reproduksi, hasil yang diharapkan, hasil aktual, screenshot (kalau ada).

## Kode Etik

Bersikap sopan dan konstruktif dalam diskusi. PR yang baik menjelaskan *kenapa* perubahan itu perlu, bukan cuma *apa* yang diubah.
