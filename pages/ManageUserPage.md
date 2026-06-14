# `ManageUserPage.jsx`

**Tujuan:** Halaman Manage User (khusus PIC): daftar pengguna & toggle status aktif.

Ukuran berkas ~29 baris.

## Ekspor
- **default**: `ManageUserPage`

## Props

| Prop | Keterangan |
|------|------------|
| `users` | State / nilai turunan dari `app.jsx`. |
| `UserAvatar` | State / nilai turunan dari `app.jsx`. |
| `handleOpenUserDetail` | Handler aksi (didefinisikan di `app.jsx`). |
| `toggleUserStatus` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `setShowAddUserModal` | Setter untuk state `showAddUserModal`. |

> Props dioper dari `app.jsx`. Cari baris render `<ManageUserPage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
