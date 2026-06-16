# Diagnosis & Troubleshooting — Action Tracker Telegram Bot

Dokumen ini mencatat seluruh masalah yang dihadapi saat membangun integrasi
**Telegram Bot + AI** pada Action Tracker (backend Google Apps Script),
beserta akar masalah dan solusinya — supaya siapa pun yang membaca bisa
memahami persoalannya dari awal.

> **Status terkini (14 Jun 2026)**: webhook berfungsi, chat bebas ("hallo") dijawab
> AI. Backend AI sudah dipindah dari Gemini ke **Ollama Cloud** (`gemma4:31b-cloud`).
> Masalah aktif: `/help` dan slash command lain **no response** — perbaikan sudah
> di commit `323e54b`, menunggu di-deploy (lihat Masalah #10).

---

## 1. Arsitektur Singkat

```
Telegram  ──(webhook POST)──▶  Google Apps Script Web App (doPost)
                                      │
                                      ├─ handleTelegramUpdate()  → dispatch perintah
                                      ├─ slash command (/start, /help, /login, ...)
                                      ├─ teks bebas → Ollama Cloud API (gemma4:31b-cloud)
                                      └─ data → Google Sheets (tasks, subtasks, users, ...)
```

- **Backend**: Google Apps Script (GAS), file `Code.gs`.
- **Database**: Google Sheets.
- **AI**: Ollama Cloud (`https://ollama.com/api/chat`, model `gemma4:31b-cloud`).
- **Rahasia** (`TELEGRAM_BOT_TOKEN`, `OLLAMA_API_KEY`) disimpan di
  **Script Properties**, TIDAK pernah ditulis ke kode/Git.

**Konsep penting GAS:**
- URL `/exec` = versi yang sudah **di-deploy** (publik). Inilah yang dipakai webhook.
- URL `/dev` = versi editor (butuh login Google). **Tidak boleh** untuk webhook.
- **Save ≠ Deploy.** Menyimpan kode di editor TIDAK otomatis meng-update web app.
  Kode baru baru aktif setelah **Deploy → Manage deployments → ✏️ Edit → New version → Deploy**.

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
  - Muncul error `Fungsi skrip tidak ditemukan: doGet` → **akses anonim OK**.
  - Diminta login/pilih akun Google → akses masih salah, ulangi solusi di atas.

### Masalah #5 — Bot kirim pesan "welcome" berulang-ulang (flood)
- **Gejala**: setelah 302 diperbaiki, bot membalas pesan selamat datang
  berkali-kali tanpa henti.
- **Akar masalah (dua lapis)**:
  1. **Backlog**: selama webhook 302, Telegram menumpuk update yang gagal
     terkirim (`pending_update_count` sempat 17). Saat webhook akhirnya jalan,
     semua backlog dikirim sekaligus.
  2. **Retry loop**: Telegram mengirim ulang update yang sama bila webhook
     lambat membalas (GAS lambat saat `initSheets` + panggil AI). Setiap
     pengiriman ulang = satu balasan lagi.
- **Solusi**:
  1. `tgDropPendingUpdates()` — buang antrian lama + pasang ulang webhook.
  2. **Dedup `update_id`** di `handleTelegramUpdate()` via `CacheService`
     (TTL 10 menit): update yang sudah diproses di-skip bila Telegram mengirim ulang.

### Masalah #6 — Chat bebas minta `/login` terus
- **Gejala**: kirim teks bebas, bot balas "Belum login".
- **Akar masalah**: by design, AI hanya aktif untuk user terautentikasi.
- **Solusi (atas permintaan pemilik)**: tambah **mode tamu** —
  tanpa login, AI menjawab pertanyaan umum & cara pakai
  (`buildGeminiGuestPrompt()`, dipanggil tanpa tools). Untuk lihat data
  task / update / create tetap diarahkan `/login`.

### Masalah #7 — Syntax error setelah Save
- **Gejala**: `SyntaxError: Unexpected token '}' line: 1914`.
- **Akar masalah**: kurung penutup `)` pada `return ( ... )` di
  `buildGeminiGuestPrompt()` tidak ada.
- **Solusi**: tambahkan `)` penutup. Diverifikasi dengan `node --check`.

### Masalah #8 — Kuota Gemini Free Tier habis
- **Gejala**:
  ```
  ⚠️ Gagal menghubungi Gemini: You exceeded your current quota...
  Quota exceeded — limit: 20, model: gemini-2.5-flash
  Please retry in 58.7s
  ```
- **Akar masalah**: API key Gemini free tier punya batas request per menit/hari.
  Banyaknya testing (terutama saat retry-flood) menghabiskan kuota.
- **Solusi**: ganti backend AI ke Ollama Cloud (lihat Masalah #9).

### Masalah #9 — Pindah dari Gemini ke Ollama Cloud
- **Latar belakang**: pindah atas permintaan pemilik setelah kuota Gemini habis.
- **Perubahan kode** (commit `31a1ef9`):
  - `callGemini()` → `callAI()` memanggil `https://ollama.com/api/chat`.
  - API key dibaca dari Script Property `OLLAMA_API_KEY`.
  - Model dari Script Property `OLLAMA_MODEL` (default `gemma4:31b-cloud`).
  - Format tools dikonversi ke gaya OpenAI: `{ type:'function', function:{...} }`.
  - Respons function call dibaca dari `message.tool_calls`.
- **Script Properties baru yang dibutuhkan**:
  - `OLLAMA_API_KEY` — API key Ollama Cloud.
  - `OLLAMA_MODEL` — (opsional) default `gemma4:31b-cloud`.
- **Catatan penting — tool calling**:
  Fitur update/create via bahasa natural bergantung pada **tool calling**.
  Model Gemma umumnya **tidak mendukung tool calling** di Ollama. Jika model
  tidak merespons dengan `tool_calls`, fitur update/create via AI tidak berfungsi
  (slash command `/done`, `/update`, dll. tetap berfungsi penuh sebagai fallback).
  Untuk tool calling penuh, pertimbangkan model seperti `qwen3` atau `llama3.1`.

### Masalah #10 — `/help` dan slash command no response ← AKTIF
- **Gejala**: kirim `/help` → bot tidak membalas sama sekali (padahal teks bebas
  "hallo" dijawab AI dengan baik).
- **Akar masalah**: `tgCmdHelp()` mengembalikan teks dengan Markdown bermasalah:
  - `_(bot akan...)_` — pola italic ini **ditolak parser Telegram**, `sendMessage`
    gagal dengan error "can't parse entities".
  - Fallback plain text juga gagal karena mengirim teks **yang sama** (masih
    mengandung `*`, `` ` ``, `_`), sehingga Telegram juga menolak.
- **Perbaikan** (commit `323e54b`):
  1. Help text disederhanakan: hapus backtick command dan `_(...)_` italic.
  2. Fallback strip **semua** karakter Markdown sebelum kirim ulang plain text.
- **Status**: kode sudah di commit dan push. **Belum aktif sampai di-deploy.**
- **Langkah deploy**:
  1. Paste `Code.gs` terbaru (commit `323e54b`) ke editor → **Save** (Ctrl+S).
  2. **Deploy → Manage deployments → ✏️ Edit → New version → Deploy**.
  3. Pastikan **Who has access = Anyone** tetap terpilih.

---

## 3. Checklist Verifikasi (urutan benar)

1. **Kode terbaru di editor** — commit `323e54b`. Cek ada fungsi
   `buildGeminiGuestPrompt`, `tgDropPendingUpdates`, `callAI`, dan dedup
   `update_id` di `handleTelegramUpdate`.
2. **Save** (Ctrl+S) — tidak boleh ada error merah.
3. **Deploy** → Manage deployments → ✏️ Edit → **New version** →
   **Who has access = Anyone** → **Deploy**.
4. Run **`tgDropPendingUpdates`** dari editor (buang backlog + reset webhook).
5. Run **`tgDiag`** — pastikan:
   - `getMe` → `ok:true`
   - `sendMessage` → `ok:true`
   - `getWebhookInfo` → `pending_update_count` kecil/0, tidak ada `last_error` baru.
6. Di Telegram: `/help` → harus balas. Teks bebas → dijawab AI.

---

## 4. Fungsi Diagnostik di `Code.gs`

| Fungsi | Guna |
|--------|------|
| `tgDiag()` | Cek token (getMe), kirim pesan tes, cek status webhook. Jalankan dari editor. |
| `registerTelegramWebhook()` | Daftarkan webhook ke URL `/exec` (baca `WEB_APP_URL`). |
| `tgDropPendingUpdates()` | Buang antrian update lama lalu pasang ulang webhook. |

**Script Properties yang dibutuhkan:**

| Property | Keterangan |
|----------|-----------|
| `TELEGRAM_BOT_TOKEN` | Token dari BotFather |
| `OLLAMA_API_KEY` | API key Ollama Cloud |
| `OLLAMA_MODEL` | (opsional) default `gemma4:31b-cloud` |
| `WEB_APP_URL` | URL `/exec` deployment aktif |
| `DIAG_CHAT_ID` | (opsional) chat id untuk pesan tes `tgDiag` |

---

## 5. Catatan Keamanan ⚠️

- Token bot Telegram & API key (Gemini dan Ollama) **sempat dibagikan di chat**
  saat troubleshooting. **Sangat disarankan me-rotate keduanya**:
  - Telegram: BotFather → `/revoke` → token baru → update `TELEGRAM_BOT_TOKEN`.
  - Ollama: buat API key baru di dashboard Ollama → update `OLLAMA_API_KEY`.
- Rahasia **hanya** boleh di Script Properties, **tidak pernah** di kode/Git.
