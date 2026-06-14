# `EditUserModal.jsx`

**Tujuan:** Modal edit data pengguna (khusus PIC).

Ukuran berkas ~65 baris.

## Ekspor
- **default**: `EditUserModal`

## Props

| Prop | Keterangan |
|------|------------|
| `editUserAvatarFile` | State / nilai turunan dari `app.jsx`. |
| `editUserAvatarPreview` | State / nilai turunan dari `app.jsx`. |
| `editUserForm` | State / nilai turunan dari `app.jsx`. |
| `events` | State / nilai turunan dari `app.jsx`. |
| `handleAvatarFileSelection` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleUpdateUser` | Handler aksi (didefinisikan di `app.jsx`). |
| `isSavingUser` | Flag boolean kondisi UI. |
| `setEditUserForm` | Setter untuk state `editUserForm`. |
| `setShowEditUserModal` | Setter untuk state `showEditUserModal`. |

> Props dioper dari `app.jsx`. Cari baris render `<EditUserModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../../lib/constants.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
