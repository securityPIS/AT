# `Header.jsx`

**Tujuan:** Header atas: tombol menu, judul, lonceng + panel notifikasi, dan menu profil (Edit Profile / Logout).

Ukuran berkas ~134 baris.

## Ekspor
- **default**: `Header`

## Props

| Prop | Keterangan |
|------|------------|
| `currentUser` | State / nilai turunan dari `app.jsx`. |
| `getNotificationTimeLabel` | Helper (pengambil nilai). |
| `handleLogout` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleNotificationClick` | Handler aksi (didefinisikan di `app.jsx`). |
| `markAllNotificationsAsRead` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `myNotifications` | State / nilai turunan dari `app.jsx`. |
| `openEditProfileModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `profileMenuRef` | React ref (dipasang via `ref=`). |
| `setShowNotificationsPanel` | Setter untuk state `showNotificationsPanel`. |
| `setShowProfileMenu` | Setter untuk state `showProfileMenu`. |
| `showNotificationsPanel` | Flag boolean kondisi UI. |
| `showProfileMenu` | Flag boolean kondisi UI. |
| `toggleSidebar` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `unreadNotificationsCount` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx` (cari baris `<Header ... />`).

## Dependensi
- `lucide-react`
- `./UserAvatar.jsx`

## Catatan maintenance
- Hasil refactor ronde 2 dari `app.jsx` (lihat `SYSTEM_MAP.md`).
- Komponen presentasional — state & handler tetap di `app.jsx`.
