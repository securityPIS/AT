# `taskUtils.js`

**Tujuan:** Util domain task/subtask murni: normalisasi snapshot subtask, status proyek, progress, badge deadline, label gantt, dan metadata event.

Ukuran berkas ~150 baris.

## Ekspor (named)
- `normalizeSubtaskSnapshot`
- `pickPreferredSubtaskSnapshot`
- `mergeTaskSubtaskSnapshots`
- `getGanttStatusLabel`
- `getDefaultSubtaskStartDate`
- `getEventTypeMeta`
- `getLatestProjectUpdate`
- `getTaskDeadlineBadge`
- `getProjectStatus`
- `calculateTaskProgress`

## Dependensi
- `./dateUtils.js`

## Catatan maintenance
- Hasil refactor dari `app.jsx` (lihat `SYSTEM_MAP.md` untuk peta lengkap).
- Komponen presentasional — state & logika tetap di `app.jsx`; ubah perilaku data di sana, ubah tampilan di sini.
