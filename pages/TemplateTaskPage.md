# `TemplateTaskPage.jsx`

**Tujuan:** Halaman Template Task: daftar template subtask yang bisa dipakai saat buat project.

Ukuran berkas ~60 baris.

## Ekspor
- **default**: `TemplateTaskPage`

## Props

| Prop | Keterangan |
|------|------------|
| `taskTemplates` | State / nilai turunan dari `app.jsx`. |
| `openTemplateModal` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `handleDeleteTemplate` | Handler aksi (didefinisikan di `app.jsx`). |

> Props dioper dari `app.jsx`. Cari baris render `<TemplateTaskPage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
