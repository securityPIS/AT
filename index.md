# `index.jsx`

**Tujuan:** Entry point aplikasi. Memasang React root ke `#root` dan membungkus
`<App />` dengan `ErrorBoundary` agar error render tidak membuat layar blank putih
(menampilkan pesan + tombol "Muat ulang").

Ukuran ~55 baris.

## Isi
- `ErrorBoundary` — class component penangkap error render (`componentDidCatch`).
- `ReactDOM.createRoot(...).render(<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>)`.

## Dependensi
- `react`, `react-dom/client`
- `./app.jsx` (komponen utama)
- `./index.css`

## Catatan maintenance
- Jarang perlu diubah. Logika aplikasi ada di `app.jsx` (lihat `app.md` & `SYSTEM_MAP.md`).
