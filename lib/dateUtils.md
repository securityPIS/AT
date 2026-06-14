# `dateUtils.js`

**Tujuan:** Util tanggal & waktu murni (tanpa state React). Catatan: beberapa fungsi memanggil fungsi lain di file yang sama (mis. formatDateIndo -> parseDateValue, toDateInputString -> toDateInputValue). Arrow `const` tidak di-hoist, jadi JANGAN memisah pasangan caller+callee ke file berbeda — aman selama tetap satu file karena baru dipanggil saat runtime.

Ukuran berkas ~161 baris.

## Ekspor (named)
- `getCurrentDateTime`
- `formatLogTimeLabel`
- `parseActivityTimestamp`
- `formatDateIndo`
- `parseDateValue`
- `toDateInputString`
- `toDateInputValue`
- `toLocalDateKey`
- `getDateRangeKeys`
- `addDays`
- `diffDays`
- `getTimelinePercent`
- `getTimelineMarkerPlacement`
- `formatTimelineLabel`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
