# `JobTaskPage.jsx`

**Tujuan:** Halaman utama Job Task: daftar Main Task (aside kiri) + panel detail project & subtask (main kanan) dengan tiga mode tampilan List/Gantt/Log.

Ukuran berkas ~706 baris.

## Ekspor
- **default**: `JobTaskPage`

## Props

| Prop | Keterangan |
|------|------------|
| `activeTask` | State / nilai turunan dari `app.jsx`. |
| `activeTaskActivityLog` | State / nilai turunan dari `app.jsx`. |
| `applyGanttPreset` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `canManageActiveTaskSubtasks` | Flag boolean kondisi UI. |
| `currentUser` | State / nilai turunan dari `app.jsx`. |
| `deleteSubtask` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `eventByLinkedTaskId` | State / nilai turunan dari `app.jsx`. |
| `eventByTitle` | State / nilai turunan dari `app.jsx`. |
| `events` | State / nilai turunan dari `app.jsx`. |
| `expandedSubtasks` | State / nilai turunan dari `app.jsx`. |
| `ganttData` | State / nilai turunan dari `app.jsx`. |
| `ganttRangeEnd` | State / nilai turunan dari `app.jsx`. |
| `ganttRangePreset` | State / nilai turunan dari `app.jsx`. |
| `ganttRangeStart` | State / nilai turunan dari `app.jsx`. |
| `ganttShowCompleted` | State / nilai turunan dari `app.jsx`. |
| `ganttTooltip` | State / nilai turunan dari `app.jsx`. |
| `ganttZoomLevel` | State / nilai turunan dari `app.jsx`. |
| `handleDeleteMainTask` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleEditMainTask` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleGanttTooltipMove` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleOpenUserTaskDetail` | Handler aksi (didefinisikan di `app.jsx`). |
| `handleTaskClick` | Handler aksi (didefinisikan di `app.jsx`). |
| `isActiveTaskOwnerPic` | Flag boolean kondisi UI. |
| `isMainTaskDetailExpanded` | Flag boolean kondisi UI. |
| `isSidebarCollapsed` | Flag boolean kondisi UI. |
| `maintaskFilter` | State / nilai turunan dari `app.jsx`. |
| `openAddSubtaskModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openCoeCalendarForEvent` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openEditSubtaskModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openEventModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openEvidenceModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openNewTaskModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openReviseModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `selectedTaskId` | State / nilai turunan dari `app.jsx`. |
| `setGanttRangeEnd` | Setter untuk state `ganttRangeEnd`. |
| `setGanttRangePreset` | Setter untuk state `ganttRangePreset`. |
| `setGanttRangeStart` | Setter untuk state `ganttRangeStart`. |
| `setGanttShowCompleted` | Setter untuk state `ganttShowCompleted`. |
| `setGanttTooltip` | Setter untuk state `ganttTooltip`. |
| `setGanttZoomLevel` | Setter untuk state `ganttZoomLevel`. |
| `setIsMainTaskDetailExpanded` | Setter untuk state `isMainTaskDetailExpanded`. |
| `setIsSidebarCollapsed` | Setter untuk state `isSidebarCollapsed`. |
| `setMaintaskFilter` | Setter untuk state `maintaskFilter`. |
| `setShowGanttFilters` | Setter untuk state `showGanttFilters`. |
| `setShowMobileDetail` | Setter untuk state `showMobileDetail`. |
| `setViewMode` | Setter untuk state `viewMode`. |
| `showGanttFilters` | Flag boolean kondisi UI. |
| `showMobileDetail` | Flag boolean kondisi UI. |
| `tasks` | State / nilai turunan dari `app.jsx`. |
| `toggleSubtask` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `userByName` | State / nilai turunan dari `app.jsx`. |
| `userRole` | State / nilai turunan dari `app.jsx`. |
| `viewMode` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<JobTaskPage ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../components/UserAvatar.jsx`
- `../lib/constants.js`
- `../lib/dateUtils.js`
- `../lib/taskUtils.js`
- `../lib/evidenceUtils.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
