# Business Requirements Document (BRD)
## Aplikasi **Action Tracker**

| | |
|---|---|
| **Nama Dokumen** | Business Requirements Document — Action Tracker |
| **Versi** | 1.0 |
| **Tanggal** | 30 Juni 2026 |
| **Status** | Draft untuk Review |
| **Fokus Dokumen** | Logika & proses bisnis (bukan implementasi teknis) |

> Dokumen ini mendeskripsikan **kebutuhan dan logika bisnis** aplikasi Action Tracker.
> Pembahasan sengaja **tidak menyentuh tech stack** (framework, database, hosting, dsb.)
> dan hanya berbicara tentang *apa* yang dilakukan sistem dari sudut pandang bisnis,
> *siapa* yang melakukannya, dan *aturan* apa yang berlaku.

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Organisasi membutuhkan satu sistem terpusat untuk **merencanakan, mendelegasikan,
memantau, dan mempertanggungjawabkan** pelaksanaan pekerjaan lintas departemen.
Pengelolaan tugas yang tersebar di spreadsheet, chat, dan email menyebabkan:
- progres pekerjaan sulit dipantau secara real-time,
- bukti penyelesaian (evidence) tidak terdokumentasi rapi,
- akuntabilitas (siapa mengerjakan apa, kapan, dan apakah sudah disetujui) menjadi kabur,
- tidak ada jejak audit atas perubahan dan keputusan.

**Action Tracker** hadir sebagai *single source of truth* untuk siklus hidup pekerjaan:
dari pembuatan proyek, pembagian subtugas, pengumpulan bukti, hingga persetujuan akhir,
lengkap dengan dashboard pemantauan, kalender kegiatan, repositori dokumen,
manajemen KPI, dan jejak aktivitas.

### 1.2 Tujuan Bisnis
| Kode | Tujuan |
|------|--------|
| BG-1 | Memastikan setiap pekerjaan punya **penanggung jawab (PIC)** dan **pelaksana (assignee)** yang jelas. |
| BG-2 | Memberikan **visibilitas progres** proyek dan beban kerja tim secara real-time. |
| BG-3 | Menstandarkan alur **submit bukti → review → approve/revisi** sehingga pekerjaan tidak dianggap selesai tanpa persetujuan. |
| BG-4 | Menyimpan **bukti penyelesaian** (file/tautan/catatan) secara terpusat dan dapat ditelusuri. |
| BG-5 | Menyediakan **jejak audit** atas setiap aktivitas penting pada proyek. |
| BG-6 | Menghubungkan eksekusi pekerjaan dengan **KPI organisasi** dan **kalender kegiatan**. |
| BG-7 | Mempercepat pembuatan proyek berulang melalui **template tugas**. |

### 1.3 Ruang Lingkup

**Termasuk dalam ruang lingkup (In-Scope):**
- Manajemen pengguna & peran (registrasi, aktivasi, profil).
- Manajemen proyek (main task) dan subtugas (subtask).
- Alur kerja bukti, review, persetujuan, dan revisi.
- Pemantauan dashboard & beban kerja tim.
- Kalender kegiatan (Calendar of Events) dan kaitannya dengan proyek.
- Master KPI berbasis perspektif.
- Template tugas.
- Repositori file/evidence.
- Notifikasi dan jejak aktivitas (audit log).

**Di luar ruang lingkup (Out-of-Scope):**
- Modul keuangan/akuntansi, payroll, atau procurement.
- Integrasi dengan sistem HR/ERP eksternal.
- Manajemen anggaran proyek dan penagihan.
- Pelaporan statutori/regulasi.
- Tech stack, arsitektur sistem, dan keputusan infrastruktur (di luar fokus BRD ini).

---

## 2. Pemangku Kepentingan & Peran Pengguna

### 2.1 Peran Pengguna
Sistem mengenal **dua peran fungsional**:

| Peran | Deskripsi | Kemampuan Utama |
|-------|-----------|-----------------|
| **PIC (Person In Charge)** | Penanggung jawab proyek / pemilik pekerjaan. Berperan sebagai manajer/koordinator. | Membuat & mengelola proyek, menambah/mengubah/menghapus subtugas, **menyetujui atau meminta revisi** bukti, mengelola pengguna, KPI, template, dan event. |
| **Assignee** | Pelaksana tugas / anggota tim. | Melihat subtugas yang ditugaskan kepadanya, **mengirim bukti** penyelesaian, menindaklanjuti permintaan revisi, mengelola profil sendiri. |

> **Aturan kepemilikan:** Hanya **PIC yang menjadi pemilik** suatu proyek (PIC == pengguna login)
> yang boleh mengelola subtugas dan menyetujui/merevisi bukti pada proyek tersebut.
> Peran Assignee tidak memiliki akses ke menu Manage User.

### 2.2 Atribut Pengguna
Setiap pengguna memiliki: nama, email (unik, identitas login), peran (PIC/Assignee),
departemen, perusahaan, nomor telepon, foto/avatar, dan **status keaktifan**
(`Active`/`Inactive`).

### 2.3 Dukungan Multi-Perusahaan
Pengguna dapat berasal dari beberapa entitas perusahaan dalam satu grup
(mis. perusahaan induk dan anak perusahaan). Atribut **perusahaan** melekat pada profil
pengguna untuk keperluan identifikasi dan pengelompokan.

---

## 3. Glosarium / Definisi Istilah

| Istilah | Definisi |
|---------|----------|
| **Main Task / Project / Proyek** | Unit pekerjaan tingkat atas. Memiliki judul, deskripsi, PIC, tenggat (deadline), progres, dan dapat ditandai sebagai *event*. |
| **Subtask / Subtugas** | Pekerjaan turunan dari proyek, ditugaskan ke satu assignee, dengan tenggat, status, bukti, dan komentar sendiri. |
| **Evidence / Bukti** | Bukti penyelesaian pekerjaan: berupa **file**, **tautan (link)**, dan/atau **catatan**. |
| **PIC** | Person In Charge — penanggung jawab proyek. |
| **Assignee** | Penerima penugasan subtugas. |
| **Approve** | Tindakan PIC menyetujui bukti subtugas sehingga subtugas dinyatakan selesai. |
| **Revisi** | Tindakan PIC mengembalikan subtugas ke assignee untuk diperbaiki, disertai catatan. |
| **KPI** | Key Performance Indicator, dikelompokkan dalam perspektif organisasi. |
| **Event** | Agenda/kegiatan dalam kalender, bertipe internal atau external, dapat dikaitkan ke proyek. |
| **Template Tugas** | Kumpulan subtugas standar yang dapat dipakai ulang saat membuat proyek baru. |
| **Notifikasi** | Pesan otomatis kepada pengguna terkait perubahan yang relevan baginya. |
| **Activity Log** | Jejak audit aktivitas penting per proyek. |

---

## 4. Entitas Bisnis Utama

```
Pengguna (PIC / Assignee)
    │ membuat / memiliki
    ▼
Proyek (Main Task) ──── dapat ditandai sebagai ───► Event (Kalender)
    │ terdiri dari
    ▼
Subtugas (Subtask) ──── menghasilkan ───► Evidence (file/link/catatan)
    │ memicu
    ├──► Notifikasi (ke PIC / Assignee terkait)
    └──► Activity Log (audit per proyek)

KPI (per perspektif)        Template Tugas (subtask siap pakai)
```

| Entitas | Atribut Bisnis Penting |
|---------|------------------------|
| **Pengguna** | nama, email, peran, departemen, perusahaan, telepon, avatar, status (Active/Inactive). |
| **Proyek** | judul, deskripsi, PIC, deadline, progres (%), penanda event. |
| **Subtugas** | judul, deskripsi, assignee, tanggal mulai, deadline, status, daftar bukti, daftar komentar, waktu pembaruan terakhir. |
| **Evidence** | nama, jenis (file/link/catatan), serta penanda bukti mana yang **disetujui** PIC. |
| **KPI** | judul indikator, perspektif/grup. |
| **Event** | judul, tanggal mulai & selesai, lokasi, tipe (internal/external), peserta, kaitan ke proyek. |
| **Template Tugas** | nama template, daftar subtugas standar (judul, assignee opsional, offset deadline). |
| **Notifikasi** | penerima, jenis, prioritas, judul, pesan, target navigasi, status baca. |
| **Activity Log** | proyek terkait, subtugas, jenis aksi, aktor, pesan, dokumen, waktu. |

---

## 5. Siklus Hidup Status (State Lifecycle)

### 5.1 Status Subtugas
Setiap subtugas berada pada salah satu dari empat status:

| Status (internal) | Label Tampilan | Makna Bisnis |
|-------------------|----------------|--------------|
| `pending` | **READY** | Subtugas dibuat & ditugaskan; assignee belum mengirim bukti. |
| `waiting_review` | **REVIEW** | Assignee telah mengirim bukti; menunggu keputusan PIC. |
| `revision` | **REVISE** | PIC mengembalikan untuk diperbaiki; menunggu assignee mengirim ulang. |
| `completed` | **COMPLETED** | PIC menyetujui bukti; subtugas selesai. |

**Diagram transisi status subtugas:**
```
        (dibuat/ditugaskan)
                │
                ▼
            ┌─────────┐   assignee kirim bukti    ┌───────────────┐
            │ PENDING │ ─────────────────────────►│ WAITING_REVIEW │
            └─────────┘                            └───────────────┘
                ▲                                     │         │
                │                       PIC approve   │         │ PIC minta revisi
                │                                     ▼         ▼
                │                              ┌───────────┐  ┌──────────┐
                │   assignee kirim ulang bukti │ COMPLETED │  │ REVISION │
                └──────────────────────────────┘           └──┘          │
                                  ▲                                       │
                                  └───────────────────────────────────────┘
                                          (assignee kirim ulang → WAITING_REVIEW)
```

### 5.2 Status Proyek (Diturunkan Otomatis dari Subtugas)
Status proyek **tidak diatur manual**, melainkan dihitung dari status subtugasnya
dengan urutan prioritas berikut (dievaluasi dari atas):

| Prioritas | Status Proyek | Kondisi Pemicu |
|-----------|---------------|----------------|
| 1 | **REVISE** | Ada minimal satu subtugas berstatus `revision`. |
| 2 | **REVIEW** | Ada minimal satu subtugas `waiting_review` (dan tidak ada revisi). |
| 3 | **COMPLETED** | **Semua** subtugas `completed`. |
| 4 | **SUBMITTED** | Kondisi default (mis. masih ada `pending`) atau proyek belum punya subtugas. |

### 5.3 Perhitungan Progres Proyek
Progres = **(jumlah subtugas `completed` ÷ total subtugas) × 100%**, dibulatkan.
Proyek tanpa subtugas memiliki progres 0%. Progres dihitung ulang otomatis setiap kali
status subtugas berubah.

---

## 6. Proses Bisnis Inti (Core Workflows)

### 6.1 Registrasi & Aktivasi Pengguna
1. Calon pengguna mendaftar mandiri (nama, email, password, peran, departemen, perusahaan, telepon).
2. Sistem menolak email yang **sudah terdaftar**.
3. Akun baru dibuat dengan status **`Inactive`** secara default.
4. Pengguna **tidak dapat login** selama berstatus Inactive; sistem mengarahkan untuk menghubungi PIC.
5. **PIC mengaktifkan** akun (mengubah status menjadi `Active`) melalui menu Manage User.
6. Setelah aktif, pengguna dapat login.

> **Business rule:** Pendaftaran mandiri tidak otomatis memberi akses — diperlukan
> **persetujuan/aktivasi PIC** sebagai kontrol gerbang (gatekeeping).

### 6.2 Pembuatan & Pengelolaan Proyek (oleh PIC)
1. PIC membuat proyek: judul, deskripsi, **PIC penanggung jawab**, deadline.
2. Opsional: proyek dapat dibuat **dari template** sehingga subtugas standar otomatis terbentuk.
3. Opsional: proyek dapat **ditandai sebagai Event**, sehingga otomatis muncul sebagai
   event **internal** di kalender (dan terhapus dari kalender bila penanda dilepas).
4. PIC menambah subtugas: judul, assignee, tanggal mulai, deadline, deskripsi.
5. PIC dapat mengubah/menghapus subtugas; perubahan memicu notifikasi ke assignee terkait.

### 6.3 Alur Eksekusi: Bukti → Review → Approve/Revisi (Alur Utama)
Ini adalah **proses bisnis paling inti** dari Action Tracker.

```
ASSIGNEE                         SISTEM                          PIC
   │  buka subtugas (READY/REVISE)                                │
   │  lampirkan bukti (file/link/catatan)                         │
   │─────────────────────────────►│                              │
   │                              │ status → WAITING_REVIEW       │
   │                              │ catat log "evidence_submitted"│
   │                              │ kirim notifikasi ────────────►│ "Subtask menunggu review"
   │                              │                              │ buka & tinjau bukti
   │                              │                   ┌──────────┤
   │                              │      APPROVE      │          │ REVISI
   │                              │◄──────────────────┘          │
   │                              │ status → COMPLETED            │◄── PIC pilih bukti yg disetujui
   │                              │ catat log "subtask_approved"  │     + wajib ≥1 bukti
   │            notifikasi ◄───────│ "Subtask di-approve"          │
   │                              │                              │
   │                              │      atau REVISI ────────────►│ tulis catatan revisi (wajib)
   │                              │ status → REVISION             │
   │                              │ catat log "revision_requested"│
   │  notifikasi ◄─────────────────│ "Subtask direvisi"            │
   │  (ulangi: kirim bukti lagi)   │                              │
```

**Rincian aturan pada alur ini:**
- Saat **submit bukti**, assignee **wajib** menyertakan minimal **satu** dari: file, tautan, atau catatan.
- Submit memerlukan **konfirmasi** eksplisit dari assignee.
- Saat **approve**, PIC **wajib memilih minimal satu bukti** yang disetujui; bukti yang dipilih
  inilah yang nantinya tampil di repositori File.
- Subtugas tanpa bukti **tidak dapat di-approve**.
- Saat **meminta revisi**, PIC **wajib mengisi catatan revisi**.
- Setiap aksi (submit/approve/revisi) memicu **notifikasi** ke pihak yang relevan dan
  **mencatat jejak audit** pada proyek.

### 6.4 Pemantauan (Dashboard)
PIC/anggota memantau melalui Dashboard yang menampilkan:
- **Ringkasan angka:** total proyek, total subtugas, jumlah menunggu review, jumlah perlu revisi.
- **Distribusi status** subtugas (Completed / Review / Revision / Pending).
- **Progres per proyek** beserta deadline dan PIC.
- **Beban kerja tim:** per anggota, jumlah subtugas selesai vs total ditugaskan.

### 6.5 Repositori File (File Manager)
- Menampilkan **hanya bukti yang telah disetujui (approved)** PIC, dikelompokkan per proyek.
- Mendukung file (dokumen/gambar) maupun tautan, dengan pencarian berdasarkan nama bukti/subtugas.
- Berfungsi sebagai arsip resmi hasil pekerjaan yang sudah tervalidasi.

### 6.6 Kalender Kegiatan (Calendar of Events)
- Menampilkan event dalam **tampilan kalender bulanan** dan **tampilan daftar**.
- Event bertipe **internal** atau **external**, memiliki tanggal mulai–selesai, lokasi, dan peserta.
- Event dapat **dikaitkan ke proyek**; dari event pengguna dapat membuka proyek terkait, dan sebaliknya.
- Proyek yang ditandai sebagai event otomatis menghasilkan event internal yang tersinkron.

### 6.7 Master KPI
- KPI dikelola dalam **empat perspektif** (kerangka Balanced Scorecard):
  **FINANCE, CUSTOMER FOCUS, INTERNAL PROCESS, LEARNING & GROWTH**.
- PIC dapat menambah, mengubah, dan menghapus indikator, serta mengelompokkannya per perspektif.

### 6.8 Template Tugas
- PIC mendefinisikan template berisi daftar subtugas standar (judul, assignee opsional, offset deadline).
- Saat membuat proyek dari template, subtugas otomatis dibuat; **deadline subtugas dihitung
  mundur** dari deadline proyek berdasarkan offset hari pada template.

### 6.9 Notifikasi
- Notifikasi dikirim ke penerima yang relevan untuk peristiwa: bukti menunggu review,
  subtugas direvisi, subtugas di-approve, subtugas dibuat/diubah/dihapus.
- Setiap notifikasi memiliki **prioritas** (mis. high/medium) dan **target navigasi** sehingga
  pengguna dapat langsung membuka subtugas yang dimaksud.
- Pengguna dapat menandai notifikasi terbaca satu per satu atau seluruhnya.

### 6.10 Jejak Aktivitas (Activity Log / Audit Trail)
- Setiap proyek memiliki **tab LOG** yang merekam aktivitas penting:
  proyek dibuat/diperbarui, subtugas dibuat/diperbarui/dihapus, bukti dikirim,
  revisi diminta, subtugas di-approve.
- Setiap entri mencatat **aktor, waktu, dan ringkasan aksi**; judul subtugas disimpan sebagai
  snapshot agar riwayat tetap terbaca meski subtugas telah dihapus.

---

## 7. Kebutuhan Fungsional (Functional Requirements)

### 7.1 Modul Pengguna & Akses
| Kode | Kebutuhan |
|------|-----------|
| FR-U1 | Sistem menyediakan registrasi mandiri dengan email unik. |
| FR-U2 | Akun baru berstatus Inactive dan tidak bisa login sampai diaktifkan PIC. |
| FR-U3 | Pengguna login menggunakan email & password. |
| FR-U4 | PIC dapat menambah, mengubah, mengaktif/menonaktifkan, dan menghapus pengguna. |
| FR-U5 | Pengguna dapat mengelola profil sendiri (data diri, avatar, ganti password). |
| FR-U6 | Sistem otomatis mengakhiri sesi (logout) setelah periode tidak aktif. |

### 7.2 Modul Proyek & Subtugas
| Kode | Kebutuhan |
|------|-----------|
| FR-P1 | PIC dapat membuat, mengubah, dan menghapus proyek. |
| FR-P2 | Proyek dapat dibuat dari template tugas. |
| FR-P3 | Proyek dapat ditandai sebagai event dan tersinkron ke kalender. |
| FR-P4 | PIC dapat menambah, mengubah, dan menghapus subtugas serta menugaskannya ke assignee. |
| FR-P5 | Sistem menghitung status & progres proyek otomatis dari status subtugas. |
| FR-P6 | Menghapus proyek menghapus seluruh subtugasnya (cascade). |
| FR-P7 | Tersedia tampilan daftar, Gantt (timeline), dan Log pada detail proyek. |

### 7.3 Modul Alur Bukti & Persetujuan
| Kode | Kebutuhan |
|------|-----------|
| FR-E1 | Assignee dapat mengirim bukti berupa file, tautan, dan/atau catatan. |
| FR-E2 | Pengiriman bukti mengubah status subtugas menjadi *waiting_review* dan menotifikasi PIC. |
| FR-E3 | PIC dapat menyetujui subtugas dengan memilih bukti yang disetujui (≥1). |
| FR-E4 | PIC dapat meminta revisi dengan catatan wajib, mengubah status menjadi *revision*. |
| FR-E5 | Approve mengubah status menjadi *completed* dan menotifikasi assignee. |
| FR-E6 | Bukti yang disetujui muncul di repositori File. |

### 7.4 Modul Pendukung
| Kode | Kebutuhan |
|------|-----------|
| FR-S1 | Dashboard menampilkan ringkasan status, progres proyek, dan beban kerja tim. |
| FR-S2 | Kalender menampilkan event (kalender & daftar) dan kaitannya dengan proyek. |
| FR-S3 | Master KPI dikelola per perspektif. |
| FR-S4 | Template tugas dapat dibuat, diubah, dan dipakai ulang. |
| FR-S5 | Notifikasi dikirim per peristiwa dan dapat ditandai terbaca. |
| FR-S6 | Activity log merekam aktivitas penting per proyek. |

---

## 8. Aturan Bisnis (Business Rules)

| Kode | Aturan |
|------|--------|
| BR-1 | Email pengguna harus **unik**; satu email = satu akun. |
| BR-2 | Akun baru selalu **Inactive** dan harus diaktifkan PIC sebelum bisa login. |
| BR-3 | Hanya **PIC pemilik proyek** yang boleh mengelola subtugas dan menyetujui/merevisi bukti proyek tersebut. |
| BR-4 | Menu **Manage User** hanya dapat diakses peran **PIC**. |
| BR-5 | **Deadline subtugas tidak boleh melewati deadline proyek** induknya. |
| BR-6 | **Tanggal mulai subtugas tidak boleh melewati deadline proyek** maupun deadline subtugas itu sendiri. |
| BR-7 | Pengiriman bukti **wajib** menyertakan minimal satu: file, tautan, atau catatan. |
| BR-8 | Subtugas **tanpa bukti tidak dapat di-approve**. |
| BR-9 | Saat approve, PIC **wajib memilih minimal satu bukti** yang disetujui. |
| BR-10 | Permintaan revisi **wajib** disertai catatan. |
| BR-11 | Status & progres proyek **diturunkan otomatis** dari subtugas, tidak diatur manual. |
| BR-12 | Status proyek mengikuti prioritas: **REVISE > REVIEW > COMPLETED > SUBMITTED**. |
| BR-13 | Hanya bukti **berstatus disetujui** yang ditampilkan di repositori File. |
| BR-14 | Menandai proyek sebagai event membuat/menyinkronkan event **internal**; melepas tanda menghapus event internal terkait. |
| BR-15 | Setiap aksi pada subtugas memicu **notifikasi** ke pihak relevan dan **mencatat jejak audit**. |
| BR-16 | Deadline subtugas dari template dihitung **mundur** dari deadline proyek sesuai offset hari template. |
| BR-17 | Sesi pengguna berakhir otomatis setelah periode **tidak aktif** demi keamanan. |

### 8.1 Batasan Validasi Berkas (Business Constraints)
| Objek | Batasan |
|-------|---------|
| **Bukti (evidence)** | Jenis file yang diperbolehkan: dokumen (PDF, Word, Excel, CSV, PowerPoint) dan gambar (JPG/PNG). Ukuran maksimum per file dibatasi. |
| **Avatar pengguna** | Hanya gambar (JPG/PNG) dengan batas ukuran lebih kecil. |

> *Catatan: nilai ambang ukuran/jenis bersifat parameter konfigurasi bisnis dan dapat
> disesuaikan; dokumen ini menyatakan keberadaan aturannya, bukan implementasinya.*

---

## 9. Asumsi & Ketergantungan

**Asumsi:**
- Setiap proyek memiliki tepat satu PIC sebagai penanggung jawab.
- Setiap subtugas ditugaskan ke tepat satu assignee.
- Pengguna memiliki email valid sebagai identitas login.
- PIC bertanggung jawab melakukan kurasi/aktivasi akun baru.

**Ketergantungan:**
- Ketersediaan media penyimpanan untuk file bukti & avatar.
- Disiplin pengguna dalam mengunggah bukti yang sahih dan relevan.

---

## 10. Kebutuhan Non-Fungsional (Perspektif Bisnis)

| Aspek | Harapan Bisnis |
|-------|----------------|
| **Akuntabilitas** | Setiap perubahan penting tertelusuri melalui activity log (siapa, kapan, apa). |
| **Keamanan akses** | Pemisahan kewenangan PIC vs Assignee; akun harus aktif untuk login; sesi berakhir otomatis saat idle. |
| **Ketepatan data** | Status & progres selalu konsisten dengan kondisi subtugas terkini. |
| **Kemudahan pakai** | Notifikasi memandu pengguna langsung ke item yang membutuhkan tindakan. |
| **Ketertelusuran dokumen** | Bukti final tersimpan terpusat dan mudah ditemukan kembali. |

---

## 11. Lampiran — Ringkasan Modul & Fungsi Bisnis

| Modul | Fungsi Bisnis Utama | Akses |
|-------|---------------------|-------|
| **Jobtask** | Kelola proyek & subtugas; tinjau/approve/revisi; lihat List, Gantt, Log. | PIC (kelola), semua (lihat) |
| **User Task** | Daftar subtugas milik pengguna login; kirim bukti & tindak lanjut revisi. | Semua |
| **Calendar of Event** | Kelola & lihat agenda kegiatan; kaitkan ke proyek. | PIC (kelola), semua (lihat) |
| **File** | Repositori bukti yang telah disetujui. | Semua |
| **Dashboard** | Statistik proyek, distribusi status, beban kerja tim. | Semua |
| **Manage User** | Kelola pengguna & aktivasi akun. | **PIC saja** |
| **KPI** | Master indikator kinerja per perspektif. | PIC (kelola), semua (lihat) |
| **Template Task** | Kelola template subtugas siap pakai. | PIC (kelola), semua (lihat) |
| **Notifikasi & Profil** | Lonceng notifikasi; kelola profil sendiri. | Semua |

---

*Akhir dokumen.*
