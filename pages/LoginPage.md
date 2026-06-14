# `LoginPage.jsx`

**Tujuan:** Halaman Login & registrasi mandiri (mode login/register/forgot password).

Ukuran berkas ~172 baris.

## Ekspor
- **default**: `LoginPage`

## Props

| Prop | Keterangan |
|------|------------|
| `onLogin` | Handler aksi (didefinisikan di `app.jsx`). |
| `onRegister` | Handler aksi (didefinisikan di `app.jsx`). |
| `loginFeedback` | State / nilai turunan dari `app.jsx`. |

> Props dioper dari `app.jsx`. Cari baris render `<LoginPage ... />` di `app.jsx`.

## Dependensi
- `react`
- `lucide-react`
- `../lib/constants.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
