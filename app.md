# `app.jsx` — Orchestrator Utama

**Tujuan:** Komponen `App()` adalah pusat aplikasi Action Tracker. Setelah refactor,
`app.jsx` **tidak lagi memuat semua tampilan**, melainkan berperan sebagai *orchestrator*:
memegang seluruh **state**, **efek samping**, dan **handler**, lalu menyusun (compose)
komponen-komponen halaman & modal yang sudah dipecah ke folder lain.

Ukuran: ~2482 baris (sebelumnya 5169 baris dalam satu file).

> Untuk peta lengkap seluruh berkas, lihat [`SYSTEM_MAP.md`](./SYSTEM_MAP.md).

## Apa yang MASIH ada di `app.jsx`

| Bagian | Jumlah | Keterangan |
|--------|--------|------------|
| `useState` | ~98 | Seluruh state aplikasi (data, auth, UI, modal, form) |
| `useEffect` | ~13 | Efek samping: seeding DB, polling data 15s, timer inactivity, sinkronisasi |
| `useMemo` | ~21 | Nilai turunan: `tasks`, `activeTask`, `userByName`, `dashboardStats`, `ganttData`, dll. |
| Handler | ~64 | Fungsi aksi: `handleLogin`, `saveSubtask`, `addNewTask`, `approveSubtask`, dll. |

> `return` App() kini ramping: hanya mengompose `<Sidebar/>`, `<Header/>`,
> halaman aktif, dan modal — tanpa markup besar inline.

## Apa yang SUDAH dipindah keluar

| Tujuan | Lokasi |
|--------|--------|
| Konstanta & data default | `lib/constants.js` |
| Util tanggal | `lib/dateUtils.js` |
| Util task/subtask/status | `lib/taskUtils.js` |
| Util evidence/file | `lib/evidenceUtils.js` |
| Komponen kecil | `components/UserAvatar.jsx`, `components/DonutChart.jsx` |
| Shell layout (loading, sidebar, header) | `components/LoadingScreen.jsx`, `components/Sidebar.jsx`, `components/Header.jsx` |
| 14 modal | `components/modals/*.jsx` (barrel: `components/modals/index.js`) |
| Halaman | `pages/*.jsx` (termasuk `JobTaskPage.jsx`, `LoginPage.jsx`) |

## Pola arsitektur (WAJIB dipahami sebelum mengubah)

1. **Single source of truth.** Semua state hidup di `App()`. Halaman & modal
   **tidak** menyimpan state data sendiri — mereka menerima lewat **props**
   (pola *prop-drilling*) dan memanggil handler dari props.
2. **Lazy loading.** Halaman diimpor via `React.lazy` + `<Suspense>`.
   Modal diimpor eager via barrel `components/modals/index.js`.
3. **Render kondisional.** Halaman: `{activePage === 'x' && <XPage .../>}`.
   Modal: `{showXModal && <XModal .../>}`.
4. **Alur data:** `googleScript.js` (`api`) → `useEffect` fetch → `useState` →
   `useMemo` (turunan) → diteruskan ke pages/modals lewat props.

## Cara menambah fitur

- **Halaman baru:** buat `pages/NamaPage.jsx`, `lazy()`-import di `app.jsx`,
  tambah tombol nav + blok `{activePage === 'nama' && ...}`.
- **Modal baru:** buat `components/modals/NamaModal.jsx`, tambah ke
  `components/modals/index.js`, render `{showNama && <NamaModal .../>}`.
- **Util murni baru:** taruh di `lib/` (jangan di `app.jsx`).

## Backend

`googleScript.js` mengekspor objek `api` (pembungkus `fetch` ke Google Apps Script,
lihat `Code.gs`) dan `generateUniqueId`. Semua operasi simpan/hapus/ambil data
melewati `api.*`.
