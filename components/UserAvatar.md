# `UserAvatar.jsx`

**Tujuan:** Menampilkan avatar pengguna; fallback ke avatar inisial (ui-avatars.com) bila photoURL kosong/gagal dimuat.

Ukuran berkas ~31 baris.

## Ekspor
- **default**: `UserAvatar`

## Dependensi
- `react`
- `../lib/avatarUtils.js` (`normalizeAvatarUrl` — ubah URL Drive lama agar tampil di `<img>`)

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
