# `UserDetailModal.jsx`

**Tujuan:** Modal detail pengguna dengan aksi edit/hapus.

Ukuran berkas ~31 baris.

## Ekspor
- **default**: `UserDetailModal`

## Props

| Prop | Keterangan |
|------|------------|
| `handleDeleteUser` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleOpenEditUser` | Handler aksi (didefinisikan di `app.jsx`). |
| `selectedUser` | State / nilai turunan dari `app.jsx`. |
| `setShowUserDetailModal` | Setter untuk state `showUserDetailModal`. |

> Props dioper dari `app.jsx`. Cari baris render `<UserDetailModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../UserAvatar.jsx`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
