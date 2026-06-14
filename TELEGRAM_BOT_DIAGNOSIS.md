# Diagnosis & Troubleshooting — Action Tracker Telegram Bot

Dokumen ini mencatat seluruh masalah yang dihadapi saat membangun integrasi
**Telegram Bot + Gemini AI** pada Action Tracker (backend Google Apps Script),
beserta akar masalah dan solusinya — supaya siapa pun yang membaca bisa
memahami persoalannya dari awal.

---

## 1. Arsitektur Singkat

```
Telegram  ──(webhook POST)──▶  Google Apps Script Web App (doPost)
                                      │
                                      ├─ handleTelegramUpdate()  → dispatch perintah
                                      ├─ slash command (/start, /help, /login, ...)
                                      ├─ teks bebas → Gemini API (gemini-2.5-flash)
                                      └─ data → Google Sheets (tasks, subtasks, users, ...)
```

- **Backend**: Google Apps Script (GAS), file `Code.gs`.
- **Database**: Google Sheets.
- **AI**: Gemini API v1beta (`gemini-2.5-flash`) dengan Function Calling.
- **Rahasia** (`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`) disimpan di
  **Script Properties**, TIDAK pernah ditulis ke kode/Git.

**Konsep penting GAS:**
- URL `/exec` = versi yang sudah **di-deploy** (publik). Inilah yang dipakai webhook.
- URL `/dev` = versi editor (butuh login Google). **Tidak boleh** untuk webhook.
- **Save ≠ Deploy.** Menyimpan kode di editor TIDAK otomatis meng-update web app.
  Kode baru baru aktif setelah **Deploy → New version**.

---

## 2. Kronologi Masalah & Solusi

### Masalah #1 — Webhook 404 "Not Found"
- **Gejala**: setWebhook gagal, balasan 404.
- **Akar masalah**: URL token ditulis dengan kurung kurawal literal, mis.
  `bot{TOKEN}/setWebhook`.
- **Solusi**: hapus `{` `}`, gunakan token apa adanya: `bot<token>/setWebhook`.

### Masalah #2 — Webhook 401 / URL `/dev`
- **Gejala**: webhook menunjuk ke URL `/dev`, Telegram dapat 401 Unauthorized.
- **Akar masalah**: `registerTelegramWebhook()` mengambil
  `ScriptApp.getService().getUrl()` yang saat dijalankan dari editor
  mengembalikan URL `/dev`.
- **Solusi**: fungsi diperbaiki agar membaca Script Property `WEB_APP_URL`
  (URL `/exec`) lebih dulu, dan **menolak** (throw error) jika URL bukan `/exec`.

### Masalah #3 — Bot diam setelah `/start` sempat membalas
- **Gejala**: `/start` membalas sekali, lalu perintah lain tidak direspons.
- **Akar masalah**: deployment masih versi lama (kode baru belum di-deploy).
- **Solusi**: **Deploy → New version** setelah setiap perubahan kode.

### Masalah #4 — 302 "Moved Temporarily" (paling lama)
- **Gejala**: `getWebhookInfo` menunjukkan
  `last_error_message: "Wrong response from the webhook: 302 Moved Temporarily"`.
  Bot tidak menerima pesan apa pun.
- **Akar masalah**: deployment Web App **"Who has access"** diset
  **"Anyone with Google account"**, bukan **"Anyone"**. Akibatnya permintaan
  anonim dari Telegram di-redirect ke halaman login Google (302).
- **Solusi**:
  1. Deploy → Manage deployments → ✏️ Edit deployment yang URL-nya **sama**
     dengan yang terdaftar di webhook.
  2. **Who has access → "Anyone"** (anonim, BUKAN "Anyone with Google account").
  3. Deploy (New version) — URL tidak berubah, webhook tidak perlu diset ulang.
- **Cara verifikasi pasti**: buka URL `/exec` di **jendela Incognito**.
  - Muncul error `Fungsi skrip tidak ditemukan: doGet` → **akses anonim OK**
    (permintaan masuk ke script tanpa diminta login). Ini hasil yang BENAR,
    karena script memang hanya punya `doPost`, bukan `doGet`.
  - Diminta login/pilih akun Google → akses masih salah, ulangi solusi di atas.

### Masalah #5 — Bot kirim pesan "welcome" berulang-ulang (flood)
- **Gejala**: setelah 302 diperbaiki, bot membalas pesan selamat datang
  berkali-kali tanpa henti.
- **Akar masalah (dua lapis)**:
  1. **Backlog**: selama webhook 302, Telegram menumpuk update yang gagal
     terkirim (`pending_update_count` sempat 17). Saat webhook akhirnya jalan,
     semua backlog dikirim sekaligus.
  2. **Retry loop**: Telegram **mengirim ulang update yang sama** bila webhook
     lambat membalas (GAS lambat saat `initSheets` + panggil Gemini). Setiap
     pengiriman ulang = satu balasan lagi.
- **Solusi**:
  1. `tgDropPendingUpdates()` — `deleteWebhook?drop_pending_updates=true` lalu
     pasang ulang webhook, untuk membuang antrian lama.
  2. **Dedup `update_id`** di `handleTelegramUpdate()` menggunakan
     `CacheService` (TTL 10 menit): update yang sudah diproses akan di-skip
     bila Telegram mengirim ulang. Ini menghentikan retry-flood secara permanen.

### Masalah #6 — Chat bebas minta `/login` terus
- **Gejala**: kirim teks bebas, bot balas "Belum login".
- **Akar masalah**: by design, Gemini hanya aktif untuk user terautentikasi.
- **Solusi (atas permintaan pemilik)**: tambah **mode tamu** —
  tanpa login, Gemini bisa menjawab pertanyaan umum & cara pakai
  (`buildGeminiGuestPrompt()`, dipanggil **tanpa tools**). Untuk lihat data
  task / update / create tetap diarahkan `/login`. Tidak ada data task yang
  bocor ke user anonim.

### Masalah #7 — Syntax error setelah Save
- **Gejala**: `SyntaxError: Unexpected token '}' line: 1914`.
- **Akar masalah**: kurung penutup `)` pada `return ( ... )` di
  `buildGeminiGuestPrompt()` tidak ada.
- **Solusi**: tambahkan `)` penutup. Diverifikasi dengan `node --check`.

---

## 3. Masalah Saat Ini — Kuota Gemini Free Tier Habis ✅ (bot sudah jalan)

> **Catatan**: munculnya error ini justru menandakan **webhook & Gemini sudah
> berfungsi**. Masalah konektivitas (302/flood) sudah selesai.

- **Gejala**:
  ```
  ⚠️ Gagal menghubungi Gemini: You exceeded your current quota...
  Quota exceeded for metric:
  generativelanguage.googleapis.com/generate_content_free_tier_requests,
  limit: 20, model: gemini-2.5-flash
  Please retry in 58.7s
  ```
- **Akar masalah**: API key Gemini memakai **free tier** yang dibatasi jumlah
  request (per menit / per hari). Banyaknya testing — terutama saat
  retry-flood kemarin yang memanggil Gemini berkali-kali — menghabiskan kuota.
- **Indikasi reset**: `Please retry in ~59s` menunjukkan ini batas **per menit**
  (RPM), yang reset tiap menit. Jika yang tertabrak batas **harian** (RPD),
  reset baru terjadi keesokan hari (waktu Pasifik / PT).

### Opsi Solusi

| Opsi | Cara | Catatan |
|------|------|---------|
| **A. Tunggu reset** | Beri jeda ~1 menit antar pesan | Gratis. Cukup bila hanya batas per menit. |
| **B. Aktifkan billing** | Google AI Studio → enable pay-as-you-go pada project | Naikkan RPM/RPD drastis. Paling andal untuk produksi. |
| **C. Ganti model** | Pakai model dengan limit free lebih longgar | Lihat kuota terbaru di https://ai.google.dev/gemini-api/docs/rate-limits |
| **D. Hemat panggilan** | Pakai slash command untuk aksi rutin; Gemini hanya untuk natural language | Dedup `update_id` sudah mengurangi panggilan ganda. |

### Catatan teknis
- Model di kode: `gemini-2.5-flash` (lihat `callGemini()` di `Code.gs`).
- Untuk ganti model, ubah segmen `models/gemini-2.5-flash:generateContent`
  pada URL di `callGemini()`.
- Error kuota sudah ditangani rapi: bot menampilkan pesan jelas, tidak crash.

---

## 4. Checklist Verifikasi (urutan benar)

1. **Kode terbaru ada di editor** — cek fungsi `buildGeminiGuestPrompt`,
   `tgDropPendingUpdates`, dan dedup `update_id` di `handleTelegramUpdate`.
2. **Save** (Ctrl+S).
3. **Deploy → Manage deployments → ✏️ Edit → New version**, pastikan
   **Who has access = Anyone** → **Deploy**.
4. Run **`tgDropPendingUpdates`** dari editor (buang backlog + reset webhook).
5. Run **`tgDiag`** — pastikan:
   - `getMe` → `ok:true`
   - `sendMessage` → `ok:true`
   - `getWebhookInfo` → tidak ada `last_error` baru, `pending_update_count` kecil/0.
6. Di Telegram: `/help` (harus balas), lalu teks bebas (dijawab AI bila kuota ada).

---

## 5. Fungsi Diagnostik di `Code.gs`

| Fungsi | Guna |
|--------|------|
| `tgDiag()` | Cek token (getMe), kirim pesan tes, cek status webhook. Jalankan dari editor. |
| `registerTelegramWebhook()` | Daftarkan webhook ke URL `/exec` (baca `WEB_APP_URL`), dengan `drop_pending_updates`. |
| `tgDropPendingUpdates()` | Buang antrian update lama lalu pasang ulang webhook. |

**Script Properties yang dibutuhkan:**
- `TELEGRAM_BOT_TOKEN` — token dari BotFather.
- `GEMINI_API_KEY` — API key Gemini.
- `WEB_APP_URL` — URL `/exec` deployment aktif.
- `DIAG_CHAT_ID` — (opsional) chat id untuk pesan tes `tgDiag`.

---

## 6. Catatan Keamanan ⚠️

- Token bot & API key Gemini **sempat dibagikan di chat** saat troubleshooting.
  **Sangat disarankan me-rotate keduanya**:
  - Telegram: BotFather → `/revoke` → token baru → update `TELEGRAM_BOT_TOKEN`.
  - Gemini: Google AI Studio → hapus key lama, buat baru → update `GEMINI_API_KEY`.
- Rahasia **hanya** boleh di Script Properties, **tidak pernah** di kode/Git.
