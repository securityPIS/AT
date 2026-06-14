# `UserTaskPage.jsx`

**Tujuan:** Halaman User Tasks: daftar subtask yang ditugaskan ke pengguna yang login.

Ukuran berkas ~144 baris.

## Ekspor
- **default**: `UserTaskPage`

## Props

| Prop | Keterangan |
|------|------------|
| `userTaskSearch` | State / nilai turunan dari `app.jsx`. |
| `setUserTaskSearch` | Setter untuk state `userTaskSearch`. |
| `filteredUserTasks` | State / nilai turunan dari `app.jsx`. |
| `currentUser` | State / nilai turunan dari `app.jsx`. |
| `handleOpenUserTaskDetail` | Handler aksi (didefinisikan di `app.jsx`). |
| `formatDateIndo` | State / nilai turunan dari `app.jsx`. |
| `users` | State / nilai turunan dari `app.jsx`. |
| `UserAvatar` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<UserTaskPage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
