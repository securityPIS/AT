# Smoke Test — Action Tracker

Checklist verifikasi setelah deploy fitur **tab LOG**, **fix evidence**, dan **normalisasi subtasks** (sheet terpisah + LockService).

**Login default** (hasil seeding):
- PIC: `budi.s@pertamina.com` / `Pertamina123!`
- Assignee: `siti.a@pertamina.com` / `Pertamina123!`

> 💡 **Sebelum mulai**: di Google Sheets buka **File → Version history → Name current version** sebagai titik rollback.

**Prioritas kalau waktu terbatas: A → C → F** (integritas data, bug evidence, konkurensi).

---

## A. Migrasi & integritas data (PALING KRITIKAL)

- [ ] Buka app, hard refresh (`Ctrl+Shift+R`), login sebagai PIC.
- [ ] Di spreadsheet, muncul tab baru **`subtasks`** dan terisi baris. **Jumlah baris = total subtask semua project.**
- [ ] Buka tiap project → semua subtask tampil **sama persis** seperti sebelum migrasi (judul, assignee, status, deadline).
- [ ] Riwayat bukti/komentar lama di tiap subtask masih ada (klik subtask untuk expand).
- [ ] Angka **progress** tiap project masih benar (mis. project dengan 1 dari 3 selesai = 33%).
- [ ] Tab `tasks` kolom `subtasks` lama masih ada isinya (backup beku — jangan dihapus dulu).

## B. Subtask CRUD (jalur tulis baru per-baris)

- [ ] **Tambah** subtask baru → muncul instan, dan **muncul 1 baris baru** di sheet `subtasks` dengan `parentId` benar.
- [ ] **Edit** subtask (ganti judul/assignee/deadline) → baris di sheet ter-update, **bukan** baris baru.
- [ ] Tambah subtask di **Project A**, lalu cek **Project B** → subtask A **tidak** nyasar ke B (parentId benar).
- [ ] Buat **project baru dari template** → project + semua subtask template muncul sebagai baris terpisah di sheet `subtasks`.

## C. Alur evidence & review (termasuk bug fix)

- [ ] Login **Assignee**, buka subtask `pending`/`revision` miliknya → **Lapor** → upload **file** + isi **link** + catatan → kirim.
- [ ] ⚠️ **Hard refresh** setelah kirim → **bukti masih ada** (status `waiting_review`). *(Ini bug yang di-fix — dulu hilang setelah refresh.)*
- [ ] File evidence bisa diklik & terbuka (Google Drive).
- [ ] Login **PIC**, subtask itu → **Review** → pilih evidence → **Approve** → status `completed`, **progress project naik**.
- [ ] Coba juga **Revise** subtask lain → status `revision`, komentar revisi muncul, assignee dapat notifikasi.

## D. Tab LOG (timeline riwayat)

- [ ] Buka project → tab **Log** → timeline tampil: tanggal di atas (group per hari), garis kiri, kartu di kanan.
- [ ] Aksi di bagian B & C (tambah/edit/hapus/bukti/revisi/approve) **muncul sebagai entri log** dengan nama pelaku & jam benar.
- [ ] Entri evidence menampilkan **chip dokumen** yang bisa diklik.
- [ ] Hard refresh → entri log **tetap ada** (cek tab `logs` di spreadsheet terisi).
- [ ] Ganti project lain → tab balik ke List (reset), log sesuai project yang dibuka.

## E. Hapus & cascade

- [ ] **Hapus 1 subtask** → baris hilang dari sheet `subtasks`, progress project ter-update, baris subtask **lain tetap utuh**.
- [ ] **Hapus 1 main task** (PIC) → task hilang **dan semua baris subtask-nya** ikut hilang dari sheet `subtasks` (tidak ada baris yatim).

## F. Konkurensi / lost-update

- [ ] Buka project sama di **2 browser/tab**. Di tab-1 edit **Subtask X**, di tab-2 edit **Subtask Y** (berbeda), simpan hampir bersamaan.
- [ ] Refresh keduanya → **kedua perubahan selamat**. *(Dulu salah satu tertimpa.)*

## G. Mobile / responsif

- [ ] Buka di HP atau DevTools (viewport ~375px) → tab **Log**: kartu full-width, **tanpa horizontal scroll**, chip dokumen ter-wrap/truncate, garis timeline rapi di kiri.
- [ ] List & Gantt juga tetap nyaman di mobile.

## H. Regresi area lain pemakai data subtask

- [ ] **Gantt**: subtask muncul dengan tanggal benar.
- [ ] **Dashboard**: statistik/progress agregat masih masuk akal.
- [ ] **User Tasks** (halaman tugas saya): subtask milik user tampil, bisa buka detail & submit dari sana.
- [ ] **Notifikasi**: klik notifikasi subtask → mengarah ke subtask yang benar.

---

## Jika ada yang gagal

Catat dan laporkan:
1. Aksi apa yang dilakukan + role yang dipakai (PIC/Assignee).
2. Pesan error / `alert` yang muncul.
3. Error merah di DevTools → tab **Console** (screenshot bila ada).
4. Kondisi data di sheet terkait (`subtasks` / `tasks` / `logs`).

## Rollback (bila fatal)

1. Google Sheets → File → Version history → restore versi bernama yang dibuat sebelum test.
2. Redeploy `Code.gs` versi sebelumnya di Apps Script (Deploy → Manage deployments → pilih versi lama).
3. Revert commit frontend di git lalu push ke `main` (Vercel auto-deploy ulang).

Catatan: kolom `tasks.subtasks` legacy sengaja dipertahankan sebagai backup beku. Setelah aplikasi stabil beberapa minggu, kolom ini boleh dikosongkan manual untuk menghemat sel.
