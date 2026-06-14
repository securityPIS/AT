# `FilePage.jsx`

**Tujuan:** Halaman File: daftar seluruh evidence yang sudah di-approve, dengan pencarian.

Ukuran berkas ~59 baris.

## Ekspor
- **default**: `FilePage`

## Props

| Prop | Keterangan |
|------|------------|
| `fileSearch` | State / nilai turunan dari `app.jsx`. |
| `setFileSearch` | Setter untuk state `fileSearch`. |
| `tasks` | State / nilai turunan dari `app.jsx`. |
| `getFileMeta` | Helper murni (lib). |
| `getApprovedEvidenceEntries` | Helper murni (lib). |

> Props dioper dari `app.jsx`. Cari baris render `<FilePage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
