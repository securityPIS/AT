# `EventModal.jsx`

**Tujuan:** Modal tambah/edit event kalender beserta peserta.

Ukuran berkas ~67 baris.

## Ekspor
- **default**: `EventModal`

## Props

| Prop | Keterangan |
|------|------------|
| `activeUsers` | State / nilai turunan dari `app.jsx`. |
| `editingEvent` | State / nilai turunan dari `app.jsx`. |
| `eventForm` | State / nilai turunan dari `app.jsx`. |
| `handleSaveEvent` | Handler aksi (didefinisikan di `app.jsx`). |
| `setEventForm` | Setter untuk state `eventForm`. |
| `setShowEventModal` | Setter untuk state `showEventModal`. |
| `taskById` | State / nilai turunan dari `app.jsx`. |
| `toggleEventParticipant` | Fungsi aksi (didefinisikan di `app.jsx`). |

> Props dioper dari `app.jsx`. Cari baris render `<EventModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../UserAvatar.jsx`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
