# `EventDetailModal.jsx`

**Tujuan:** Modal detail event: info, peserta, task tertaut, dan aksi edit/hapus.

Ukuran berkas ~112 baris.

## Ekspor
- **default**: `EventDetailModal`

## Props

| Prop | Keterangan |
|------|------------|
| `handleDeleteEvent` | Handler aksi (didefinisikan di `app.jsx`). |
| `navigateTo` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openEventModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `selectedEventDetail` | State / nilai turunan dari `app.jsx`. |
| `setSelectedTaskId` | Setter untuk state `selectedTaskId`. |
| `setShowEventDetailModal` | Setter untuk state `showEventDetailModal`. |
| `tasks` | State / nilai turunan dari `app.jsx`. |
| `userByName` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<EventDetailModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../UserAvatar.jsx`
- `../../lib/dateUtils.js`
- `../../lib/taskUtils.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
