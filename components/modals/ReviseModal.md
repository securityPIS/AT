# `ReviseModal.jsx`

**Tujuan:** Modal pemberian catatan revisi pada subtask.

Ukuran berkas ~18 baris.

## Ekspor
- **default**: `ReviseModal`

## Props

| Prop | Keterangan |
|------|------------|
| `handleSendRevision` | Handler aksi (didefinisikan di `app.jsx`). |
| `reviseComment` | State / nilai turunan dari `app.jsx`. |
| `setReviseComment` | Setter untuk state `reviseComment`. |
| `setShowReviseModal` | Setter untuk state `showReviseModal`. |
| `subtaskToRevise` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<ReviseModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
