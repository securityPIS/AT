# `NewTaskModal.jsx`

**Tujuan:** Modal buat/edit project (main task) beserta opsi template subtask dan penautan event.

Ukuran berkas ~98 baris.

## Ekspor
- **default**: `NewTaskModal`

## Props

| Prop | Keterangan |
|------|------------|
| `activePicUsers` | State / nilai turunan dari `app.jsx`. |
| `addNewTask` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `editingMainTaskId` | State / nilai turunan dari `app.jsx`. |
| `newEventEndDate` | State / nilai turunan dari `app.jsx`. |
| `newEventLocation` | State / nilai turunan dari `app.jsx`. |
| `newEventStartDate` | State / nilai turunan dari `app.jsx`. |
| `newTaskDeadline` | State / nilai turunan dari `app.jsx`. |
| `newTaskDesc` | State / nilai turunan dari `app.jsx`. |
| `newTaskIsEvent` | State / nilai turunan dari `app.jsx`. |
| `newTaskPic` | State / nilai turunan dari `app.jsx`. |
| `newTaskTitle` | State / nilai turunan dari `app.jsx`. |
| `selectedTemplateId` | State / nilai turunan dari `app.jsx`. |
| `setNewEventEndDate` | Setter untuk state `newEventEndDate`. |
| `setNewEventLocation` | Setter untuk state `newEventLocation`. |
| `setNewEventStartDate` | Setter untuk state `newEventStartDate`. |
| `setNewTaskDeadline` | Setter untuk state `newTaskDeadline`. |
| `setNewTaskDesc` | Setter untuk state `newTaskDesc`. |
| `setNewTaskIsEvent` | Setter untuk state `newTaskIsEvent`. |
| `setNewTaskPic` | Setter untuk state `newTaskPic`. |
| `setNewTaskTitle` | Setter untuk state `newTaskTitle`. |
| `setSelectedTemplateId` | Setter untuk state `selectedTemplateId`. |
| `setShowNewTaskModal` | Setter untuk state `showNewTaskModal`. |
| `taskTemplates` | State / nilai turunan dari `app.jsx`. |
| `tasks` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<NewTaskModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
