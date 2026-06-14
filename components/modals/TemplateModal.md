# `TemplateModal.jsx`

**Tujuan:** Modal tambah/edit template task beserta baris-baris subtask.

Ukuran berkas ~59 baris.

## Ekspor
- **default**: `TemplateModal`

## Props

| Prop | Keterangan |
|------|------------|
| `activeUsers` | State / nilai turunan dari `app.jsx`. |
| `addTemplateSubtaskRow` | Fungsi aksi (didefinisikan di `app.jsx`). |
| `editingTemplate` | State / nilai turunan dari `app.jsx`. |
| `handleSaveTemplate` | Handler aksi (didefinisikan di `app.jsx`). |
| `removeTemplateSubtaskRow` | State / nilai turunan dari `app.jsx`. |
| `setShowTemplateModal` | Setter untuk state `showTemplateModal`. |
| `setTemplateForm` | Setter untuk state `templateForm`. |
| `templateForm` | State / nilai turunan dari `app.jsx`. |
| `updateTemplateSubtaskRow` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<TemplateModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
