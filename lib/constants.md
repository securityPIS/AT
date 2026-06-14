# `constants.js`

**Tujuan:** Konstanta & data default aplikasi Action Tracker. Berisi nilai murni (tanpa state React). Satu-satunya impor eksternal adalah ikon lucide untuk ACTIVITY_LOG_ACTION_META.

Ukuran berkas ~221 baris.

## Ekspor (named)
- `DEFAULT_TASKS`
- `DEFAULT_USERS`
- `AVATAR_MAX_BYTES`
- `ALLOWED_AVATAR_TYPES`
- `COMPANY_OPTIONS`
- `EMPTY_NEW_USER_FORM`
- `EMPTY_REGISTER_FORM`
- `EMPTY_PROFILE_FORM`
- `DEFAULT_KPIS`
- `DEFAULT_EVENTS`
- `KPI_GROUPS`
- `MAX_EVIDENCE_FILE_SIZE`
- `ALLOWED_EVIDENCE_EXTENSIONS`
- `ALLOWED_EVIDENCE_MIME_TYPES`
- `INACTIVITY_LOGOUT_MINUTES`
- `INACTIVITY_LOGOUT_MS`
- `DEFAULT_TEMPLATES`
- `monthNames`
- `ACTIVITY_LOG_ACTION_META`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
