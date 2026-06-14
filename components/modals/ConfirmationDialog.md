# `ConfirmationDialog.jsx`

**Tujuan:** Dialog konfirmasi generik (mis. konfirmasi hapus) berbasis state confirmationDialog.

Ukuran berkas ~55 baris.

## Ekspor
- **default**: `ConfirmationDialog`

## Props

| Prop | Keterangan |
|------|------------|
| `closeConfirmationDialog` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `confirmationDialog` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<ConfirmationDialog ... />` di `app.jsx`.

## Dependensi
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
