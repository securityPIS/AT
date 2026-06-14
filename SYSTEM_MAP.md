# SYSTEM MAP — Action Tracker

Peta/indeks seluruh berkas frontend. **Mulai dari sini** saat debugging atau
maintenance untuk tahu file mana yang harus dibuka.

Aplikasi: React + Vite + Tailwind + lucide-react. Backend: Google Apps Script
(`Code.gs`) diakses lewat `googleScript.js`.

---

## 1. Arsitektur singkat

```
index.jsx  ──renders──>  app.jsx  (App: ORCHESTRATOR — semua state & handler)
                              │
        ┌─────────────────────┼───────────────────────────┐
        │ props (state+handler+helper di-drilling)         │
        ▼                                                   ▼
   pages/*.jsx  (halaman, lazy-loaded)        components/modals/*.jsx (14 modal)
        │                                                   │
        └───────────────── import ──────────────────┐      │
                                                     ▼      ▼
                          lib/*.js (util murni)  +  components/UserAvatar/DonutChart
                                                     │
                                              googleScript.js → Code.gs (backend)
```

- **`app.jsx`** memegang **satu-satunya** sumber state (≈98 `useState`, 21 `useMemo`,
  13 `useEffect`, ≈64 handler). Lihat [`app.md`](./app.md).
- **Halaman & modal** bersifat *presentasional*: terima data lewat **props**,
  panggil handler lewat **props**. Tidak menyimpan state data sendiri.
- **`lib/`** berisi fungsi murni (tanpa React) — aman dipakai di mana saja.

---

## 2. Inventori berkas

| Berkas | Baris | Tujuan |
|--------|------:|--------|
| `index.jsx` | 55 | Entry point React + `ErrorBoundary`. |
| `app.jsx` | 2655 | **Orchestrator**: state, efek, handler, komposisi halaman & modal. Lihat `app.md`. |
| `googleScript.js` | 141 | Klien API (`api`, `generateUniqueId`) ke Google Apps Script. |
| `Code.gs` | 874 | Backend Apps Script (sheet, auth, upload Drive). |
| **lib/** | | **Util murni (tanpa React)** |
| `lib/constants.js` | 221 | Konstanta & data default (DEFAULT_*, COMPANY_OPTIONS, KPI_GROUPS, ACTIVITY_LOG_ACTION_META, monthNames, form kosong). |
| `lib/dateUtils.js` | 161 | Util tanggal/waktu & posisi timeline Gantt. |
| `lib/taskUtils.js` | 150 | Status proyek, progress, badge deadline, merge snapshot subtask, metadata event. |
| `lib/evidenceUtils.js` | 106 | Metadata ikon file, normalisasi & seleksi evidence, validasi upload. |
| **components/** | | **Komponen kecil reusable** |
| `components/UserAvatar.jsx` | 30 | Avatar pengguna (fallback inisial). |
| `components/DonutChart.jsx` | 29 | Donut chart SVG untuk Dashboard. |
| **components/modals/** | | **14 modal (eager, via `index.js` barrel)** |
| `components/modals/UserTaskDetailModal.jsx` | 162 | Detail subtask + upload evidence + approve/revise. |
| `components/modals/EvidenceModal.jsx` | 59 | Lapor/perbaiki pekerjaan (file/link/catatan). |
| `components/modals/ReviseModal.jsx` | 18 | Catatan revisi subtask. |
| `components/modals/NewTaskModal.jsx` | 98 | Buat/edit project + template + tautan event. |
| `components/modals/SubtaskModal.jsx` | 29 | Tambah/edit subtask. |
| `components/modals/EditProfileModal.jsx` | 165 | Edit profil sendiri (data, avatar, password). |
| `components/modals/AddUserModal.jsx` | 58 | Tambah user (PIC). |
| `components/modals/EditUserModal.jsx` | 65 | Edit user (PIC). |
| `components/modals/UserDetailModal.jsx` | 31 | Detail user + edit/hapus. |
| `components/modals/KpiModal.jsx` | 19 | Tambah/edit KPI. |
| `components/modals/EventModal.jsx` | 67 | Tambah/edit event + peserta. |
| `components/modals/EventDetailModal.jsx` | 112 | Detail event + task tertaut. |
| `components/modals/ConfirmationDialog.jsx` | 55 | Dialog konfirmasi generik. |
| `components/modals/TemplateModal.jsx` | 59 | Tambah/edit template task. |
| **pages/** | | **Halaman (lazy-loaded kecuali Login)** |
| `pages/JobTaskPage.jsx` | 706 | Halaman utama: list Main Task + detail subtask (List/Gantt/Log). |
| `pages/LoginPage.jsx` | 172 | Login & registrasi mandiri. |
| `pages/UserTaskPage.jsx` | 144 | Subtask milik user yang login. |
| `pages/DashboardPage.jsx` | 38 | Statistik & donut chart. |
| `pages/FilePage.jsx` | 59 | Daftar evidence ter-approve. |
| `pages/KpiPage.jsx` | 58 | Master KPI per perspektif. |
| `pages/CoePage.jsx` | 215 | Calendar of Events. |
| `pages/ManageUserPage.jsx` | 29 | Manage user (PIC). |
| `pages/TemplateTaskPage.jsx` | 60 | Daftar template task. |

> Setiap berkas `.jsx`/`.js` punya pasangan `.md` di sebelahnya berisi penjelasan
> props & dependensi lebih rinci.

---

## 3. "Saya mau ubah X → buka berkas Y"

| Saya mau… | Buka |
|-----------|------|
| Ubah perhitungan **progress / status** project | `lib/taskUtils.js` |
| Ubah format **tanggal** atau posisi bar **Gantt** | `lib/dateUtils.js` |
| Ubah aturan **validasi file / ikon file** evidence | `lib/evidenceUtils.js` |
| Ubah **data default / opsi perusahaan / grup KPI** | `lib/constants.js` |
| Ubah tampilan **halaman Job Task** (list/gantt/log) | `pages/JobTaskPage.jsx` |
| Ubah tampilan **modal evidence / approve** | `components/modals/UserTaskDetailModal.jsx`, `EvidenceModal.jsx` |
| Ubah form **buat project** | `components/modals/NewTaskModal.jsx` |
| Ubah halaman **Dashboard / File / KPI / Calendar** | `pages/DashboardPage.jsx` / `FilePage.jsx` / `KpiPage.jsx` / `CoePage.jsx` |
| Ubah **login / registrasi** | `pages/LoginPage.jsx` |
| Ubah **avatar** atau **donut chart** | `components/UserAvatar.jsx` / `components/DonutChart.jsx` |
| Ubah **logika data, polling, auth, timer logout, handler** | `app.jsx` (lihat `app.md`) |
| Ubah **panggilan backend / endpoint** | `googleScript.js` (+ `Code.gs`) |
| Ubah **sidebar / header / panel notifikasi** | `app.jsx` (bagian `return`) |

---

## 4. State & handler penting (semua di `app.jsx`)

- **Data:** `taskDocs`, `subtaskDocs`, `users`, `kpis`, `events`, `taskTemplates`,
  `notifications`, `activityLogs` → diturunkan jadi `tasks`, `activeTask`,
  `dashboardStats`, `userByName`, `ganttData` via `useMemo`.
- **Auth:** `isLoggedIn`, `currentUser`, `userRole` + `handleLogin` / `handleLogout`
  + timer inactivity (`useEffect`).
- **Navigasi:** `activePage` + `navigateTo()`.
- **Modal:** tiap modal punya pasangan `showXModal` (boolean) + state form terkait.
- **Aksi data:** `addNewTask`, `saveSubtask`, `deleteSubtask`, `submitEvidence`,
  `approveSubtask`, `handleSendRevision`, `handleSaveEvent`, `handleSaveKPI`,
  `handleSaveTemplate`, `handleAddUser`, `handleUpdateUser`, … (semua memanggil `api.*`).

---

## 5. Konvensi

- **Tambah halaman:** `pages/NamaPage.jsx` → `lazy()`-import di `app.jsx` →
  render `{activePage === 'nama' && <NamaPage .../>}`.
- **Tambah modal:** `components/modals/NamaModal.jsx` → daftarkan di
  `components/modals/index.js` → render `{showNama && <NamaModal .../>}`.
- **Tambah util murni:** taruh di `lib/` (JANGAN di `app.jsx`).
- **File berisi JSX → `.jsx`; util tanpa JSX → `.js`.**
- Komponen menerima **semua** data/aksi lewat **props** dari `app.jsx`
  (jangan fetch atau simpan state data di dalam komponen halaman/modal).

---

## 6. Verifikasi setelah perubahan

```bash
npm install      # sekali saja
npm run build    # WAJIB hijau — deteksi import/JSX rusak paling cepat
npm run dev      # uji manual; ikuti SMOKETEST.md
```
