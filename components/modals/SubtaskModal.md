# `SubtaskModal.jsx`

**Tujuan:** Modal tambah/edit subtask.

Ukuran berkas ~29 baris.

## Ekspor
- **default**: `SubtaskModal`

## Props

| Prop | Keterangan |
|------|------------|
| `activeTask` | State / nilai turunan dari `app.jsx`. |
| `activeUsers` | State / nilai turunan dari `app.jsx`. |
| `editingSubtaskId` | State / nilai turunan dari `app.jsx`. |
| `isSavingSubtask` | Flag boolean kondisi UI. |
| `saveSubtask` | State / nilai turunan dari `app.jsx`. |
| `setShowSubtaskModal` | Setter untuk state `showSubtaskModal`. |
| `setSubtaskFormAssignee` | Setter untuk state `subtaskFormAssignee`. |
| `setSubtaskFormDeadline` | Setter untuk state `subtaskFormDeadline`. |
| `setSubtaskFormDescription` | Setter untuk state `subtaskFormDescription`. |
| `setSubtaskFormStartDate` | Setter untuk state `subtaskFormStartDate`. |
| `setSubtaskFormTitle` | Setter untuk state `subtaskFormTitle`. |
| `subtaskFormAssignee` | State / nilai turunan dari `app.jsx`. |
| `subtaskFormDeadline` | State / nilai turunan dari `app.jsx`. |
| `subtaskFormDescription` | State / nilai turunan dari `app.jsx`. |
| `subtaskFormStartDate` | State / nilai turunan dari `app.jsx`. |
| `subtaskFormTitle` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<SubtaskModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../../lib/taskUtils.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
