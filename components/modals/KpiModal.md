# `KpiModal.jsx`

**Tujuan:** Modal tambah/edit indikator KPI.

Ukuran berkas ~19 baris.

## Ekspor
- **default**: `KpiModal`

## Props

| Prop | Keterangan |
|------|------------|
| `editingKPI` | State / nilai turunan dari `app.jsx`. |
| `handleSaveKPI` | Handler aksi (didefinisikan di `app.jsx`). |
| `kpiForm` | State / nilai turunan dari `app.jsx`. |
| `setKpiForm` | Setter untuk state `kpiForm`. |
| `setShowKPIModal` | Setter untuk state `showKPIModal`. |

> Props dioper dari `app.jsx`. Cari baris render `<KpiModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`
- `../../lib/constants.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
