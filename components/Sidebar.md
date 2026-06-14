# `Sidebar.jsx`

**Tujuan:** Sidebar navigasi: drawer mobile + overlay, tombol pindah halaman, dan logout.

Ukuran berkas ~55 baris.

## Ekspor
- **default**: `Sidebar`

## Props

| Prop | Keterangan |
|------|------------|
| `activePage` | State / nilai turunan dari `app.jsx`. |
| `handleLogout` | Handler aksi (didefinisikan di `app.jsx`). |
| `isSidebarOpen` | Flag boolean kondisi UI. |
| `navigateTo` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `setIsSidebarOpen` | Setter untuk state `isSidebarOpen`. |
| `userRole` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx` (cari baris `<Sidebar ... />`).

## Dependensi
- `lucide-react`

## Catatan maintenance
- Hasil refactor ronde 2 dari `app.jsx` (lihat `SYSTEM_MAP.md`).
- Komponen presentasional — state & handler tetap di `app.jsx`.
