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

Tambah **dua kolom baru** pada array schema `users`
(saat ini: `['id', 'name', 'email', 'password', 'role', 'department', 'company', 'phone', 'photoURL', 'status']`):

- **`telegramUsername`** — `@username` Telegram user (diisi lewat form app, tanpa `@`).
  Dipakai untuk proses auto-linking saat user menekan Start di bot.
- **`telegramChatId`** — ID numerik Telegram (diisi otomatis oleh bot setelah linking
  berhasil). Ini yang dipakai untuk kirim pesan.

Bump `SCHEMA_VERSION` dari `v4` → `v5`. Migrasi `ensureColumns()` yang sudah ada
akan menambahkan kedua kolom baru ke sheet lama secara otomatis.

### 4.2 Fungsi baru

```js
// Kirim 1 pesan ke Telegram. Dibungkus muteHttpExceptions supaya tidak melempar.
function sendTelegramMessage(chatId, text) { ... }

// Ambil chatId user dari recipientUserId, format pesan per type, lalu kirim.
function notifyTelegram(notification) { ... }

// Dipanggil time-driven trigger tiap 1 menit: baca pesan masuk via getUpdates,
// proses linking via telegramUsername (lihat Bagian 5), simpan offset update terakhir.
function pollTelegramUpdates() { ... }

// Simpan chatId ke baris user setelah linking berhasil dicocokkan.
function linkTelegramChat(userId, chatId) { ... }

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

## 5. Linking Akun: `@username` Telegram di Form + Tap Start

### Latar belakang teknis

Telegram Bot API **tidak bisa mengirim pesan via `@username`**. Yang dibutuhkan
adalah `chat_id` numerik, dan `chat_id` hanya bisa diperoleh saat user memulai
percakapan dengan bot. Pendekatan ini memanfaatkan fakta bahwa Telegram secara
otomatis menyertakan `message.from.username` (terverifikasi Telegram, tidak bisa
dipalsukan) saat user mengirim pesan ke bot.

### Alur user (Opsi A — dipilih)

```
User isi @username di form app
        │
        ▼
User buka @taskonewbot → tap Start
        │  (Telegram kirim /start beserta username asli user)
        ▼
pollTelegramUpdates() baca getUpdates
        │
        ├── ambil message.from.username  ← dari Telegram, bukan ketikan user
        ├── cocokkan dengan kolom telegramUsername di sheet users
        ├── simpan chat_id ke telegramChatId
        └── bot balas "✅ Terhubung! Halo [nama]."
```

1. User mengisi field **"Telegram Username"** (tanpa `@`) di form Add User atau
   Edit Profile — contoh: `budisoekanto`.
2. User membuka [`@taskonewbot`](https://t.me/taskonewbot) dan menekan **Start**.
   Tidak perlu mengetik apa pun lagi.
3. Dalam ≤1 menit, `pollTelegramUpdates()` membaca pesan masuk, mengambil
   `message.from.username` yang Telegram sertakan secara otomatis.
4. Backend mencocokkan username tersebut (case-insensitive) dengan kolom
   `telegramUsername` di sheet `users`.
5. Jika cocok: simpan `chat_id` ke `telegramChatId`, bot balas
   _"✅ Akun terhubung! Halo [nama], kamu akan menerima notifikasi di sini."_
6. Jika tidak cocok (username belum diisi di app): bot balas _"❌ Username Telegram
   kamu belum terdaftar di Action Tracker. Minta admin untuk mengisinya di profil
   kamu, lalu coba lagi."_

### Fallback — user tanpa `@username` Telegram

Tidak semua akun Telegram wajib punya `@username` (bersifat opsional di Telegram).
Untuk kasus ini, bot tetap menyediakan jalur lama:

- Setelah Start, jika `message.from.username` kosong, bot balas:
  _"Kamu tidak punya username Telegram. Balas pesan ini dengan **email terdaftar**
  kamu di Action Tracker."_
- User mengetik emailnya → backend cocokkan dengan kolom `email` di sheet → link.

### Keunggulan pendekatan ini vs. sebelumnya

| | Rencana awal (ketik email ke bot) | Opsi A (username di form) |
|---|---|---|
| Keamanan linking | Rawan spoofing — siapa pun bisa kirim email orang lain ke bot | Aman — username datang dari Telegram, tidak bisa dipalsukan |
| Aksi user di bot | Ketik email | Hanya tap Start |
| Aksi user di app | Tidak ada | Isi field username sekali (saat register/edit profil) |
| Perubahan kode | Kecil | Kecil-sedang |

### Catatan teknis
- **Polling, bukan webhook.** Apps Script Web App sudah dipakai untuk API aplikasi
  (dengan cek `API_SECRET`). Memakai polling `getUpdates` lewat time-driven trigger
  membuat endpoint API tetap bersih & aman.
- **Delay hanya saat linking** (sekali per user, ≤1 menit). Pengiriman notifikasi
  tetap **instan** karena bersifat outbound (`sendMessage`) dan sinkron di
  `handleCreateNotifications`.
- **Offset update** disimpan di Script Properties (`TELEGRAM_LAST_UPDATE_ID`) agar
  pesan tidak diproses dua kali.

## 6. Perubahan Frontend

### 6.1 Form AddUserModal (`components/modals/AddUserModal.jsx`)
Tambah field baru di bawah "No. Telephone":

```
Telegram Username (opsional)
[ @  _________________ ]
Isi untuk menerima notifikasi via Telegram.
```

State: `newUserForm.telegramUsername`. Karakter `@` tidak disimpan, hanya nama.

### 6.2 Form EditUserModal (`components/modals/EditUserModal.jsx`)
Sama seperti AddUserModal — admin bisa mengisi/mengubah username Telegram user lain.

### 6.3 EditProfileModal (`components/modals/EditProfileModal.jsx`)
Tambah field yang bisa diedit sendiri oleh user:

```
Telegram Username (opsional)
[ @  _________________ ]
Status: Terhubung ✅  /  Belum terhubung ⬜
```

- Field editable untuk `telegramUsername`.
- Status "Terhubung" ditampilkan jika `telegramChatId` sudah terisi (read-only,
  hanya informatif).
- Tombol **"Buka Bot"** → buka `https://t.me/taskonewbot` di tab baru.
- (Opsional) tombol **"Putuskan"** → kosongkan `telegramChatId` di sheet.

### 6.4 `app.jsx`
- State form profil & handler `handleUpdateOwnProfile` sudah ada; cukup sertakan
  `telegramUsername` dalam payload yang dikirim ke `api.updateUser()`.
- Tidak perlu perubahan pada logika notifikasi (`createNotifications` tidak disentuh).

## 7. Langkah Manual (di luar kode — perlu dilakukan di konsol Google)

1. **Set Script Property.** Apps Script Editor → Project Settings → Script Properties:
   - Key: `TELEGRAM_BOT_TOKEN` | Value: `<token dari @BotFather>`
2. **Pasang trigger.** Buka editor Apps Script → jalankan fungsi
   `setupTelegramTrigger()` sekali (klik Run). Fungsi ini memasang time-driven
   trigger 1 menit untuk `pollTelegramUpdates` secara otomatis.
3. **Re-deploy Web App.** Karena `Code.gs` berubah, deploy ulang:
   Deploy → Manage deployments → Edit → New version → Deploy.
4. **Linking tiap user.** Setiap user isi username Telegram di profil,
   lalu start bot sekali (Bagian 5).

> ⚠️ **Keamanan token:** token bot **tidak akan** ditulis ke file mana pun di repo.
> Karena token sempat dibagikan di chat, sebaiknya **regenerate** lewat @BotFather
> dan pakai token baru di Script Properties.

## 8. File yang Akan Disentuh (saat implementasi)

| File / Lokasi | Perubahan |
|---|---|
| `Code.gs` | +`sendTelegramMessage`, `notifyTelegram`, `pollTelegramUpdates`, `linkTelegramChat`, `setupTelegramTrigger`; ubah `handleCreateNotifications`; +kolom `telegramUsername` & `telegramChatId`; bump `SCHEMA_VERSION` → `v5` |
| `components/modals/AddUserModal.jsx` | +field `telegramUsername` |
| `components/modals/EditUserModal.jsx` | +field `telegramUsername` |
| `components/modals/EditProfileModal.jsx` | +field `telegramUsername` + status link + tombol Buka Bot |
| `app.jsx` | sertakan `telegramUsername` di payload `updateUser` / `handleAddUser` |
| Apps Script Script Properties | `TELEGRAM_BOT_TOKEN` (manual), `TELEGRAM_LAST_UPDATE_ID` (otomatis) |
| Apps Script Triggers | trigger 1 menit untuk `pollTelegramUpdates` |
| Repo (`.env`, dll.) | **tidak ada token** disimpan |

## 9. Rencana Pengujian

1. **Isi username di form** → save → cek kolom `telegramUsername` terisi di sheet.
2. **Linking:** start bot (tanpa ketik apa pun) → cek `telegramChatId` terisi otomatis.
3. **Fallback:** test dengan akun Telegram tanpa username → pastikan alur kirim email masih jalan.
4. **Assign subtask** ke user yang sudah link → pesan masuk ke Telegram dalam hitungan detik.
5. **Semua tipe:** uji revisi, approve, delete, dll. → pastikan tiap tipe terkirim
   dengan format yang benar.
6. **Ketahanan:** sengaja kosongkan/salahkan token → pastikan aplikasi tetap jalan
   normal dan notifikasi in-app tidak rusak.
7. **Anti-duplikat:** pastikan `pollTelegramUpdates` tidak memproses pesan yang sama dua kali.
8. **Username tidak cocok:** isi username salah di form → start bot → pastikan bot
   memberi pesan error yang jelas, bukan diam.

## 10. Batasan & Trade-off

| # | Batasan / Trade-off | Mitigasi |
|---|---|---|
| 1 | **Lubang notif di `createTaskWithSubtasks`:** buat project + subtask dari template tidak memicu `createNotifications` → tidak ada notif in-app maupun Telegram | Perbaiki terpisah: tambah `createNotifications` setelah `createTaskWithSubtasks` di `app.jsx:1707` |
| 2 | **Tidak semua user Telegram punya `@username`** (opsional di Telegram) | Fallback: kirim email ke bot (alur lama). Kedua jalur berjalan paralel |
| 3 | **Pengiriman Telegram sinkron → menambah latensi save** | Semua call ke Telegram dibungkus try/catch + muteHttpExceptions; gagal = skip, tidak blokir |
| 4 | **Kuota Apps Script:** ±20.000 UrlFetch/hari + polling 1.440 call/hari | Aman untuk tim kecil-menengah; monitor jika volume tumbuh |
| 5 | **Konten pesan keluar ke server Telegram** (pihak ketiga) | Batasi isi pesan: cukup judul & tipe, tanpa detail sensitif |
| 6 | **Fire-and-forget:** kegagalan pengiriman tidak di-retry | Notif in-app tetap ada sebagai fallback utama |
| 7 | **Re-deploy Apps Script manual** setiap ada perubahan `Code.gs` | Tidak bisa diotomatisasi dari repo; sudah jadi sifat bawaan Apps Script |
| 8 | **Trigger 1 menit hanya untuk linking** (bukan untuk notif) | Notifikasi tetap instan — outbound `sendMessage` jalan sinkron di `doPost` |

---

## 11. Keputusan yang Sudah Disepakati

- **Cakupan:** semua user, semua 7 tipe notifikasi.
- **Linking:** `@username` Telegram diisi di form app → user cukup tap Start di bot
  → auto-link via `message.from.username` (terverifikasi Telegram).
- **Fallback:** user tanpa `@username` tetap bisa kirim email ke bot.
- **Setup Apps Script:** disediakan fungsi `setupTelegramTrigger()` + panduan manual.
- **Token:** disimpan di Script Properties, tidak di repo mana pun.

## 12. Menunggu Persetujuan

Setujui rencana ini untuk lanjut ke implementasi, atau beri masukan untuk direvisi.
