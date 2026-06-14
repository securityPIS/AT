# `AddUserModal.jsx`

**Tujuan:** Modal tambah pengguna baru (khusus PIC).

Ukuran berkas ~58 baris.

## Ekspor
- **default**: `AddUserModal`

## Props

| Prop | Keterangan |
|------|------------|
| `events` | State / nilai turunan dari `app.jsx`. |
| `handleAddUser` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleAvatarFileSelection` | Handler aksi (didefinisikan di `app.jsx`). |
| `isSavingUser` | Flag boolean kondisi UI. |
| `newUserAvatarFile` | State / nilai turunan dari `app.jsx`. |
| `newUserAvatarPreview` | State / nilai turunan dari `app.jsx`. |
| `newUserForm` | State / nilai turunan dari `app.jsx`. |
| `setNewUserForm` | Setter untuk state `newUserForm`. |
| `setShowAddUserModal` | Setter untuk state `showAddUserModal`. |
| `setShowPassword` | Setter untuk state `showPassword`. |
| `showPassword` | Flag boolean kondisi UI. |

> Props dioper dari `app.jsx`. Cari baris render `<AddUserModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../../lib/constants.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
