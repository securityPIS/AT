# `avatarUtils.js`

**Tujuan:** Util murni untuk menampilkan avatar dari Google Drive. Mengubah URL Drive (`uc?export=...`, `file/d/<id>`, `open?id=<id>`) menjadi URL endpoint `thumbnail` yang bisa di-embed langsung di tag `<img>`. URL non-Drive (dicebear, ui-avatars, `blob:` preview) dikembalikan apa adanya.

Ukuran berkas ~33 baris.

## Latar belakang
Google Drive tidak lagi menyajikan URL `uc?export=download|view` sebagai gambar yang bisa di-hotlink (di-redirect ke halaman peringatan), sehingga avatar hasil upload gagal tampil. Endpoint `https://drive.google.com/thumbnail?id=<id>&sz=w1000` masih menyajikan byte gambar. Backend (`Code.gs > handleUploadFile`) juga sudah mengembalikan format ini untuk upload baru; util ini menangani data lama yang masih tersimpan dengan format URL usang.

## Ekspor (named)
- `extractDriveFileId` — ambil fileId dari berbagai bentuk URL Drive.
- `normalizeAvatarUrl` — ubah URL Drive menjadi URL thumbnail (idempotent; aman untuk URL non-Drive).

## Dependensi
- (tidak ada)

## Catatan maintenance
- Dipakai di `components/UserAvatar.jsx` (menyalur ke hampir semua tampilan avatar) serta preview "avatar saat ini" di `EditProfileModal.jsx` & `EditUserModal.jsx`.
