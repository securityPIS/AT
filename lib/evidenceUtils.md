# `evidenceUtils.js`

**Tujuan:** Util evidence/file murni: metadata ikon file, normalisasi daftar evidence, seleksi evidence yang di-approve, dan validasi file upload.

Ukuran berkas ~106 baris.

## Ekspor (named)
- `getFileMeta`
- `getNormalizedEvidenceEntries`
- `getApprovedEvidenceKeys`
- `getApprovedEvidenceEntries`
- `validateEvidenceFiles`

## Dependensi
- `lucide-react`
- `./constants.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
