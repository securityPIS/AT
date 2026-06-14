# `KpiPage.jsx`

**Tujuan:** Halaman Master KPI: daftar indikator KPI dikelompokkan per perspektif.

Ukuran berkas ~58 baris.

## Ekspor
- **default**: `KpiPage`

## Props

| Prop | Keterangan |
|------|------------|
| `KPI_GROUPS` | State / nilai turunan dari `app.jsx`. |
| `kpisByGroup` | State / nilai turunan dari `app.jsx`. |
| `expandedKPIGroups` | State / nilai turunan dari `app.jsx`. |
| `toggleKPIGroup` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `openKPIModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `handleDeleteKPI` | Handler aksi (didefinisikan di `app.jsx`). |

> Props dioper dari `app.jsx`. Cari baris render `<KpiPage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
