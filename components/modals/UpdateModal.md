# `components/modals/UpdateModal.jsx` — Buat/Edit meta Update

Form buat/edit **meta** satu Update: judul, kategori, status, deskripsi.
LOG progres (`entries`) TIDAK diatur di sini — lihat `UpdateDetailModal.jsx`.

## Props
`editingUpdate` (null = mode buat), `updateForm`, `setUpdateForm`,
`handleSaveUpdate`, `setShowUpdateModal`.

## Dependensi
- `lib/constants.js`: `UPDATE_CATEGORY_ORDER/META`, `UPDATE_STATUS_ORDER/META`.
- Ikon lucide: `Save`, `X`.
