# `DonutChart.jsx`

**Tujuan:** Donut/pie chart sederhana berbasis SVG untuk ringkasan jumlah subtask di Dashboard. Menerima data: [{ label, value, color }].

Ukuran berkas ~29 baris.

## Ekspor
- **default**: `DonutChart`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
