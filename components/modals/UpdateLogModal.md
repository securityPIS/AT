# `components/modals/UpdateLogModal.jsx` — Modal "+ Update" ke LOG project

Dibuka lewat tombol **"+ Update"** di sebelah tombol **"+ Tambah"** (subtask) pada
detail Job Task. Berisi textarea catatan update + upload **gambar** (preview thumbnail,
bisa banyak). Saat dikirim, hasilnya dicatat ke **tab LOG** project sebagai entri
`action: 'update_posted'` (message = catatan, documents = gambar dengan `isImage: true`).

## Props
`activeTaskTitle`, `updateLogText`/`setUpdateLogText`, `updateLogFiles`/`setUpdateLogFiles`,
`handleUpdateLogFileSelection`, `submitUpdateLog`, `updateLogUploading`, `setShowUpdateLogModal`.

## Alur (di `app.jsx`)
`openUpdateLogModal` → isi form → `submitUpdateLog`: upload tiap gambar via
`api.uploadFile` (dapat `url` thumbnail Drive), lalu `logTaskActivity({ task: activeTask,
action: 'update_posted', message, documents })`. Entri tampil di tab Log
(`JobTaskPage.jsx`), gambar dirender inline sebagai thumbnail.

## Dependensi
- Ikon lucide: `ImagePlus`, `MessageSquarePlus`, `X`.
- Metadata action `update_posted` di `ACTIVITY_LOG_ACTION_META` (`lib/constants.js`).
