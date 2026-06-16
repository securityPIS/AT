# 📨 Rencana Implementasi: Notifikasi Telegram (Semua User & Semua Notifikasi)

> Status: **RENCANA** — belum diimplementasikan. Dokumen ini adalah blueprint sebelum
> menulis kode. Bot: [`@taskonewbot`](https://t.me/taskonewbot).

## 1. Tujuan

Setiap kali sebuah notifikasi dibuat di Action Tracker (mis. ada subtask baru
di-assign ke user), bot Telegram langsung mengirim pesan ke user yang bersangkutan.

**Contoh:** User A meng-assign subtask ke User B → bot Telegram langsung mengirim
pesan ke User B: _"🔔 Ada task baru yang ditugaskan untukmu."_

Berlaku untuk **semua user** dan **semua tipe notifikasi** yang sudah ada.

## 2. Cakupan Notifikasi

Semua tipe notifikasi yang saat ini sudah dipicu aplikasi akan otomatis ikut
terkirim ke Telegram (karena kita hook di satu titik pusat — lihat Bagian 4):

| Tipe (`type`)            | Kapan terjadi                          | Ikon |
|--------------------------|----------------------------------------|------|
| `subtask_assigned`       | Subtask baru di-assign ke user         | 📥   |
| `subtask_reassigned`     | Assignee subtask diganti               | 🔄   |
| `subtask_updated`        | Detail subtask diubah                  | ✏️   |
| `subtask_waiting_review` | Assignee submit evidence (menunggu PIC)| 👀   |
| `subtask_revision`       | PIC minta revisi                       | ↩️   |
| `subtask_approved`       | PIC menyetujui evidence                | ✅   |
| `subtask_deleted`        | Subtask dihapus                        | 🗑️   |

## 3. Arsitektur

```
User A assign subtask
        │
        ▼
app.jsx → createNotifications()        ← TIDAK perlu diubah
        │
        ▼
api.createNotifications()  (googleScript.js)
        │
        ▼
Code.gs → handleCreateNotifications()  ← TITIK HOOK (server-side)
        │
        ├── saveRow('notifications', ...)      (sudah ada)
        └── notifyTelegram(notif)              (BARU)
                  │
                  ▼
        Telegram Bot API (sendMessage) → chat user
```

### Kenapa di backend (`Code.gs`), bukan frontend?

1. **Keamanan token.** `TELEGRAM_BOT_TOKEN` disimpan di **Apps Script Script
   Properties**, tidak pernah masuk ke repo, file `.env`, maupun bundle frontend.
   Token di frontend bisa diintip siapa pun lewat DevTools.
2. **Cakupan penuh dengan satu perubahan.** Semua notifikasi sudah melewati
   `handleCreateNotifications`. Satu hook di sana = ketujuh tipe notifikasi
   langsung tercakup tanpa menyentuh banyak call-site di `app.jsx`.
3. **Andal.** Pengiriman terjadi di server tempat data disimpan.

## 4. Perubahan pada `Code.gs`

### 4.1 Skema sheet `users`
- Tambah kolom **`telegramChatId`** pada array schema `users`
  (saat ini: `['id', 'name', 'email', 'password', 'role', 'department', 'company', 'phone', 'photoURL', 'status']`).
- Bump `SCHEMA_VERSION` dari `v4` → `v5`. Migrasi `ensureColumns()` yang sudah ada
  akan menambahkan kolom baru ke sheet lama secara otomatis.

### 4.2 Fungsi baru

```js
// Kirim 1 pesan ke Telegram. Dibungkus muteHttpExceptions supaya tidak melempar.
function sendTelegramMessage(chatId, text) { ... }

// Ambil chatId user dari recipientUserId, format pesan per type, lalu kirim.
function notifyTelegram(notification) { ... }

// Dipanggil time-driven trigger tiap 1 menit: baca pesan masuk via getUpdates,
// proses linking (lihat Bagian 5), dan simpan offset update terakhir.
function pollTelegramUpdates() { ... }

// Simpan chatId ke baris user (dipakai oleh pollTelegramUpdates).
function linkTelegramChat(userIdOrEmail, chatId) { ... }

// Dijalankan SEKALI manual di editor Apps Script untuk memasang trigger 1 menit.
function setupTelegramTrigger() { ... }
```

### 4.3 Modifikasi `handleCreateNotifications`

```js
function handleCreateNotifications(notificationsList) {
  for (var i = 0; i < notificationsList.length; i++) {
    saveRow('notifications', notificationsList[i]);
    try {
      notifyTelegram(notificationsList[i]);   // BARU
    } catch (e) {
      // Jangan pernah patahkan alur utama hanya karena Telegram gagal.
    }
  }
  return notificationsList;
}
```

> **Prinsip:** kegagalan Telegram (token salah, user belum link, API down)
> **tidak boleh** merusak penyimpanan notifikasi in-app. Semua dibungkus try/catch.

### 4.4 Format pesan (HTML Telegram)

```
🔔 Task Baru Ditugaskan

📋 <judul subtask>
📁 Project: <nama parent task>
👤 Oleh: <actorName>
⚡ Prioritas: High

Buka Action Tracker untuk melihat detail.
```

Judul & ikon menyesuaikan `type` (lihat tabel Bagian 2). Isi diambil dari field
notifikasi yang sudah ada: `title`, `message`, `actorName`, `priority`, `meta`.

## 5. Linking Akun: User Chat dengan Bot

Telegram tidak bisa mengirim pesan ke user kecuali user sudah memulai percakapan
dengan bot dan kita tahu `chat_id`-nya. Alur yang dipilih: **user chat langsung
dengan bot.**

### Alur user
1. User membuka [`@taskonewbot`](https://t.me/taskonewbot) di Telegram dan menekan **Start**.
2. Bot membalas: _"Halo! Untuk menghubungkan akun, balas pesan ini dengan **email
   terdaftar** kamu di Action Tracker."_
3. User mengetik emailnya (mis. `budi@example.com`).
4. Dalam ≤1 menit, `pollTelegramUpdates()` membaca pesan via `getUpdates`,
   mencocokkan email ke baris di sheet `users` (case-insensitive), menyimpan
   `chat_id` ke kolom `telegramChatId`, lalu bot membalas _"✅ Akun terhubung!
   Kamu akan menerima notifikasi di sini."_
5. Jika email tidak ditemukan, bot membalas _"❌ Email tidak ditemukan. Coba lagi."_

### Catatan teknis
- **Polling, bukan webhook.** Apps Script Web App sudah dipakai untuk API aplikasi
  (dengan cek `API_SECRET`). Memakai polling `getUpdates` lewat time-driven trigger
  membuat endpoint API tetap bersih & aman.
- **Delay hanya saat linking** (sekali per user, ≤1 menit). Pengiriman notifikasi
  tetap **instan** karena bersifat outbound (`sendMessage`) dan sinkron di
  `handleCreateNotifications`.
- **Offset update** disimpan di Script Properties (`TELEGRAM_LAST_UPDATE_ID`) agar
  pesan tidak diproses dua kali.

## 6. Perubahan Frontend (opsional, mempermudah user)

- Di **EditProfileModal** / halaman profil: tampilkan status
  _"Telegram: Terhubung ✅"_ atau _"Belum terhubung"_ (berdasarkan ada/tidaknya
  `telegramChatId`).
- Tombol **"Hubungkan Telegram"** → membuka `https://t.me/taskonewbot`.
- (Opsional) tombol **"Putuskan"** → mengosongkan `telegramChatId`.

> Bagian ini opsional. Tanpa UI pun, user tetap bisa linking dengan langsung chat
> ke bot. UI hanya memperhalus pengalaman.

## 7. Langkah Manual (di luar kode — perlu dilakukan di konsol Google)

1. **Set Script Property.** Apps Script Editor → Project Settings → Script Properties:
   - `TELEGRAM_BOT_TOKEN` = `<token dari @BotFather>`
2. **Pasang trigger.** Jalankan fungsi `setupTelegramTrigger()` sekali dari editor
   Apps Script (Run). Fungsi ini memasang time-driven trigger 1 menit untuk
   `pollTelegramUpdates`. (Akan disediakan + panduannya.)
3. **Re-deploy Web App.** Karena `Code.gs` berubah, deploy ulang
   (Deploy → Manage deployments → Edit → New version).
4. **Linking tiap user.** Setiap user start bot & kirim email sekali (Bagian 5).

> ⚠️ **Keamanan token:** token bot **tidak akan** ditulis ke file mana pun di repo.
> Karena token sempat dibagikan di chat, sebaiknya **regenerate** lewat @BotFather
> dan pakai token baru di Script Properties.

## 8. File yang Akan Disentuh (saat implementasi)

| File / Lokasi | Perubahan |
|---|---|
| `Code.gs` | +`sendTelegramMessage`, `notifyTelegram`, `pollTelegramUpdates`, `linkTelegramChat`, `setupTelegramTrigger`; ubah `handleCreateNotifications`; +kolom `telegramChatId`; bump `SCHEMA_VERSION` → `v5` |
| `components/modals/EditProfileModal.jsx` (opsional) | status + tombol "Hubungkan Telegram" |
| `app.jsx` (opsional) | state/aksi pendukung tombol Telegram |
| Apps Script Script Properties | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_LAST_UPDATE_ID` (otomatis) |
| Apps Script Triggers | trigger 1 menit untuk `pollTelegramUpdates` |
| Repo (`.env`, dll.) | **tidak ada token** disimpan |

## 9. Rencana Pengujian

1. **Linking:** start bot → kirim email → cek kolom `telegramChatId` terisi.
2. **Assign subtask** ke user yang sudah link → pesan masuk ke Telegram dalam hitungan detik.
3. **Semua tipe:** uji revisi, approve, delete, dll. → pastikan tiap tipe terkirim
   dengan format yang benar.
4. **Ketahanan:** sengaja kosongkan/salahkan token → pastikan aplikasi tetap jalan
   normal dan notifikasi in-app tidak rusak.
5. **Anti-duplikat:** pastikan `pollTelegramUpdates` tidak memproses pesan yang sama dua kali.

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Telegram API down / token salah | `try/catch` + `muteHttpExceptions`; alur utama tak terganggu |
| User belum link Telegram | `notifyTelegram` skip jika `telegramChatId` kosong (notif in-app tetap jalan) |
| Pesan dobel saat polling | Simpan & pakai `TELEGRAM_LAST_UPDATE_ID` sebagai offset |
| Token bocor | Disimpan di Script Properties, tidak di repo; sarankan regenerate token |
| Rate limit Telegram | Volume notifikasi rendah; jika perlu, batasi & beri jeda |

---

### Keputusan yang sudah disepakati
- **Cakupan:** semua user, semua tipe notifikasi.
- **Linking:** user chat langsung dengan bot (kirim email → polling tangkap `chat_id`).
- **Setup Apps Script:** disediakan fungsi `setupTelegramTrigger()` + panduan manual.

### Menunggu persetujuan
Setujui rencana ini untuk lanjut ke implementasi, atau beri masukan untuk direvisi.
