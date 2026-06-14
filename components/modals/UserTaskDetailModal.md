# `UserTaskDetailModal.jsx`

**Tujuan:** Modal detail subtask dari halaman User Task: riwayat bukti & catatan, form upload evidence, dan aksi approve/revise oleh PIC.

Ukuran berkas ~162 baris.

## Ekspor
- **default**: `UserTaskDetailModal`

## Props

| Prop | Keterangan |
|------|------------|
| `approvalEvidenceSelection` | State / nilai turunan dari `app.jsx`. |
| `approveSubtask` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `currentUser` | State / nilai turunan dari `app.jsx`. |
| `evidenceFiles` | State / nilai turunan dari `app.jsx`. |
| `evidenceLink` | State / nilai turunan dari `app.jsx`. |
| `evidenceText` | State / nilai turunan dari `app.jsx`. |
| `handleEvidenceFileSelection` | Handler aksi (didefinisikan di `app.jsx`). |
| `openReviseModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `selectedSubtask` | State / nilai turunan dari `app.jsx`. |
| `setActivePage` | Setter untuk state `activePage`. |
| `setApprovalEvidenceSelection` | Setter untuk state `approvalEvidenceSelection`. |
| `setEvidenceFiles` | Setter untuk state `evidenceFiles`. |
| `setEvidenceLink` | Setter untuk state `evidenceLink`. |
| `setEvidenceText` | Setter untuk state `evidenceText`. |
| `setExpandedSubtasks` | Setter untuk state `expandedSubtasks`. |
| `setSelectedTaskId` | Setter untuk state `selectedTaskId`. |
| `setShowMobileDetail` | Setter untuk state `showMobileDetail`. |
| `setShowUserTaskDetailModal` | Setter untuk state `showUserTaskDetailModal`. |
| `submitEvidence` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `userByName` | State / nilai turunan dari `app.jsx`. |
| `userRole` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<UserTaskDetailModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../UserAvatar.jsx`
- `../../lib/evidenceUtils.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
