# `DashboardPage.jsx`

**Tujuan:** Halaman Dashboard: ringkasan statistik task & donut chart status subtask.

Ukuran berkas ~38 baris.

## Ekspor
- **default**: `DashboardPage`

## Props

| Prop | Keterangan |
|------|------------|
| `dashboardStats` | State / nilai turunan dari `app.jsx`. |
| `tasks` | State / nilai turunan dari `app.jsx`. |
| `DonutChart` | State / nilai turunan dari `app.jsx`. |
| `UserAvatar` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<DashboardPage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
