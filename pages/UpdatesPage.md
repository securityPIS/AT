# `pages/UpdatesPage.jsx` — Halaman "Update & Koordinasi"

Halaman entri **Update non-task** (Meeting, Koordinasi, Email, WhatsApp) dengan
tracking status + LOG progres. Dirender di **area Main Task** (`activePage === 'jobtask'`)
saat `jobtaskTab === 'updates'` (toggle Task ⇄ Update). Presentasional penuh —
semua data & handler via props dari `app.jsx`.

## Props
| Prop | Kegunaan |
|------|----------|
| `jobtaskTab`, `setJobtaskTab` | State toggle Task ⇄ Update (bar toggle di header). |
| `updates` | Daftar Update ternormalisasi & terurut (dari `updates` useMemo di `app.jsx`). |
| `openUpdateModal(update?)` | Buka modal buat/edit Update. |
| `openUpdateDetail(update)` | Buka `UpdateDetailModal` (detail + LOG). |
| `handleDeleteUpdate(id)` | Hapus Update (tombol di kartu). |
| `UserAvatar` | Komponen avatar. |

## Dependensi
- `lib/updateUtils.js`: `getUpdateCategoryMeta`, `getUpdateStatusMeta`, `getLatestUpdateEntry`.
- Ikon lucide: `MessageSquarePlus`, `Plus`, `Home`, `Clock`, `Trash2`.
