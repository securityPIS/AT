# `components/modals/UpdateDetailModal.jsx` — Detail Update + LOG progres

Menampilkan header satu Update (kategori, status, judul, deskripsi), **timeline LOG**
dari `entries` (terbaru di atas), dan form **"Tambah update"** (textarea + pilih status).
Tiap submit memanggil `handleAddUpdateEntry` → `api.addUpdateEntry` (append di server).
Ada tombol Edit (buka `UpdateModal`) & Hapus. Semua user login boleh memakai.

## Props
`selectedUpdate` (= `activeUpdate`), `currentUser`, `updateEntryText`/`setUpdateEntryText`,
`updateEntryStatus`/`setUpdateEntryStatus`, `handleAddUpdateEntry`, `openUpdateModal`,
`handleDeleteUpdate`, `setShowUpdateDetailModal`, `UserAvatar`.

## Dependensi
- `lib/constants.js`: `UPDATE_STATUS_ORDER/META`.
- `lib/updateUtils.js`: `getUpdateCategoryMeta`, `getUpdateStatusMeta`.
- Ikon lucide: `X`, `Edit2`, `Trash2`, `Send`, `History`.
