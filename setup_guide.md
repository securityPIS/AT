# Panduan Setup Action Tracker (Google Sheets + Google Drive)

Aplikasi ini telah dimigrasi untuk menggunakan **Google Sheets** sebagai database, **Google Drive** sebagai media storage evidence/avatar, dan hosting menggunakan **Vercel**.

Ikuti langkah-langkah berikut untuk mengaktifkan backend Google Apps Script dan menghubungkannya dengan frontend.

---

## Langkah 1: Setup Google Spreadsheet & Apps Script

1. Buka [Google Sheets](https://sheets.google.com) dan buat sebuah Spreadsheet baru yang kosong.
2. Beri nama spreadsheet Anda, misalnya `Action Tracker Database`.
3. Buka menu **Extensions > Apps Script** di bagian atas menu Spreadsheet.
4. Hapus kode default yang ada di editor Apps Script (`myFunction() {}`).
5. Buka file `Code.gs` dari folder proyek Anda (`C:\dev\ACTION TRACKER GS\Code.gs`), copy semua kontennya, dan paste ke editor Apps Script.
6. Simpan project Apps Script dengan menekan icon **Save** (disket) atau menekan `Ctrl + S`.

## Langkah 2: Deploy Apps Script sebagai Web App

1. Di dalam editor Apps Script, klik tombol **Deploy** di bagian kanan atas, lalu pilih **New deployment**.
2. Klik tombol gear (**Select type**) dan pilih **Web app**.
3. Isi konfigurasi sebagai berikut:
   - **Description**: `Action Tracker API v1`
   - **Execute as**: `Me (email-anda@gmail.com)` (Ini penting agar script bisa menulis data ke sheet dan membuat folder Drive atas nama akun Anda).
   - **Who has access**: `Anyone` (Pilih "Anyone" agar frontend React bisa mengakses URL ini tanpa hambatan login Google di browser client).
4. Klik tombol **Deploy**.
5. Jika ini pertama kali, Google akan meminta Anda memberikan izin keamanan (**Authorize Access**). Klik **Authorize Access**, pilih akun Google Anda, klik **Advanced**, lalu klik **Go to Action Tracker (unsafe)**, dan klik **Allow**.
6. Salin **Web App URL** yang muncul di layar (URL ini berformat `https://script.google.com/macros/s/.../exec`).

## Langkah 3: Konfigurasi Keamanan Tambahan (Opsional tapi Direkomendasikan)

Untuk mencegah orang lain mengakses API Google Sheets Anda secara langsung:
1. Di Apps Script, buka menu **Project Settings** (icon gerigi/roda gigi di bagian kiri).
2. Di bawah **Script Properties**, klik **Add script property**.
3. Tambahkan property baru:
   - **Property**: `API_SECRET`
   - **Value**: Masukkan token rahasia acak pilihan Anda (misalnya `PertaminaSecretKey2026`).
4. Klik **Save script properties**.
5. Jika Anda menset ini, pastikan untuk memasukkan nilai yang sama ke file `.env` Anda sebagai `VITE_API_SECRET`.

## Langkah 4: Konfigurasi Frontend (File `.env`)

1. Buka folder `C:\dev\ACTION TRACKER GS` di text editor Anda.
2. Buat file bernama `.env` di root folder tersebut (atau edit file `.env` jika sudah ada).
3. Isi dengan konfigurasi berikut:

```env
# URL Web App hasil deploy Google Apps Script di Langkah 2
VITE_GOOGLE_SCRIPT_API_URL=https://script.google.com/macros/s/.../exec

# Token rahasia yang sama dengan yang di-set di Script Properties (jika diset)
VITE_API_SECRET=PertaminaSecretKey2026
```

## Langkah 5: Inisialisasi Database (Seed Data Awal)

1. Jalankan server lokal frontend dengan perintah:
   ```bash
   npm install
   npm run dev
   ```
2. Buka aplikasi di browser (biasanya `http://localhost:5173`).
3. Pada halaman Login, Anda akan melihat tampilan login. Namun database Google Sheets Anda saat ini masih kosong.
4. Buka halaman khusus inisialisasi di browser Anda dengan menambahkan `?init=true` di akhir URL Anda (misalnya `http://localhost:5173/?init=true`).
5. Atau, ketika pertama kali dijalankan, sistem akan otomatis mendeteksi database kosong dan mencoba melakukan inisialisasi ketika Anda mengklik login dengan kredensial default.
6. Halaman inisialisasi database akan memanggil backend Apps Script untuk membuat semua tabel dan mengisinya dengan user default dan task sample:
   - **User Default**: `budi.s@pertamina.com`
   - **Password Default**: `Pertamina123!`
7. Setelah selesai, Anda bisa login menggunakan akun `budi.s@pertamina.com` / `Pertamina123!`!

---

## Struktur Database Google Sheets (Otomatis Dibuat)

Aplikasi akan membuat 6 tab secara otomatis di Spreadsheet Anda:
1. `users`: Menyimpan profil pengguna dan status aktivasi. Password di-hash menggunakan algoritma SHA-256 bawaan Apps Script.
2. `tasks`: Menyimpan data task utama beserta subtask-nya dalam bentuk JSON string ter-enkapsulasi.
3. `kpis`: Menyimpan Key Performance Indicators.
4. `events`: Menyimpan agenda event internal dan eksternal.
5. `templates`: Menyimpan template subtask pengerjaan.
6. `notifications`: Menyimpan notifikasi real-time untuk team member.

Upload evidence file akan secara otomatis membuat folder baru bernama `ActionTracker_Uploads` di Google Drive Anda. Semua file evidence akan disimpan di sana dan link direct download-nya dimasukkan ke database.
