# `lib/updateUtils.js` — Util fitur "Update & Koordinasi"

Fungsi murni (tanpa React) untuk entitas **Update**: entri non-task (Meeting,
Koordinasi, Email, WhatsApp) yang punya **status** bertingkat dan **LOG progres**
(`entries`).

## Ekspor

| Fungsi | Kegunaan |
|--------|----------|
| `normalizeUpdate(update)` | Isi default field update (`category`, `status`, `entries: []`, dll) agar aman dirender. |
| `getUpdateCategoryMeta(category)` | Metadata kategori (`{ label, icon, badgeClass, chipClass }`) dari `UPDATE_CATEGORY_META`. Fallback `default`. |
| `getUpdateStatusMeta(status)` | Metadata status (`{ label, badge, text, dot }`) dari `UPDATE_STATUS_META`. Fallback `default`. |
| `getLatestUpdateEntry(update)` | Entri LOG terbaru (elemen terakhir `entries`) untuk ringkasan "sampai mana". |

## Dependensi
- `UPDATE_CATEGORY_META`, `UPDATE_STATUS_META` dari `lib/constants.js`.

## Bentuk data
`entries` adalah array `{ text, user, status, timestamp }` — 1 elemen = 1 baris LOG.
Server (`Code.gs` `handleAddUpdateEntry`) meng-append ke akhir array di bawah
`withScriptLock` untuk menghindari lost-update.
