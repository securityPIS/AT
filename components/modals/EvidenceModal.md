# `EvidenceModal.jsx`

**Tujuan:** Modal pelaporan/perbaikan pekerjaan: upload file, link, dan catatan evidence.

Ukuran berkas ~59 baris.

## Ekspor
- **default**: `EvidenceModal`

## Props

| Prop | Keterangan |
|------|------------|
| `evidenceFiles` | State / nilai turunan dari `app.jsx`. |
| `evidenceLink` | State / nilai turunan dari `app.jsx`. |
| `evidenceText` | State / nilai turunan dari `app.jsx`. |
| `evidenceUploading` | State / nilai turunan dari `app.jsx`. |
| `handleEvidenceFileSelection` | Handler aksi (didefinisikan di `app.jsx`). |
| `selectedSubtask` | State / nilai turunan dari `app.jsx`. |
| `setEvidenceFiles` | Setter untuk state `evidenceFiles`. |
| `setEvidenceLink` | Setter untuk state `evidenceLink`. |
| `setEvidenceText` | Setter untuk state `evidenceText`. |
| `setShowEvidenceModal` | Setter untuk state `showEvidenceModal`. |
| `submitEvidence` | Fungsi aksi (didefinisikan di `app.jsx`). |

> Props dioper dari `app.jsx`. Cari baris render `<EvidenceModal ... />` di `app.jsx`.

## Dependensi
- `lucide-react`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
