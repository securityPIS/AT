# `EditProfileModal.jsx`

**Tujuan:** Modal edit profil pengguna sendiri (data diri, avatar, ganti password).

Ukuran berkas ~165 baris.

## Ekspor
- **default**: `EditProfileModal`

## Props

| Prop | Keterangan |
|------|------------|
| `closeEditProfileModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `handleAvatarFileSelection` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleUpdateOwnProfile` | Handler aksi (didefinisikan di `app.jsx`). |
| `isSavingProfile` | Flag boolean kondisi UI. |
| `profileAvatarFile` | State / nilai turunan dari `app.jsx`. |
| `profileAvatarPreview` | State / nilai turunan dari `app.jsx`. |
| `profileForm` | State / nilai turunan dari `app.jsx`. |
| `profilePasswordForm` | State / nilai turunan dari `app.jsx`. |
| `setProfileForm` | Setter untuk state `profileForm`. |
| `setProfilePasswordForm` | Setter untuk state `profilePasswordForm`. |

> Props dioper dari `app.jsx`. Cari baris render `<EditProfileModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../../lib/constants.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
