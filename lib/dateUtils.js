// Util tanggal & waktu murni (tanpa state React).
// Catatan: beberapa fungsi memanggil fungsi lain di file yang sama (mis.
// formatDateIndo -> parseDateValue, toDateInputString -> toDateInputValue).
// Arrow `const` tidak di-hoist, jadi JANGAN memisah pasangan caller+callee ke
// file berbeda — aman selama tetap satu file karena baru dipanggil saat runtime.

export const getCurrentDateTime = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const formatLogTimeLabel = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const parseActivityTimestamp = (value) => {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/);
  if (match) {
    const [, day, month, year, hours = '00', minutes = '00'] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export const formatDateIndo = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return "-";
  try {
    const parsed = parseDateValue(dateStr);
    if (!parsed) return dateStr;
    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export const parseDateValue = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return null;
  // Already a Date object (e.g. dari beberapa helper internal).
  if (dateStr instanceof Date) {
    return Number.isNaN(dateStr.getTime())
      ? null
      : new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
  }
  const str = String(dateStr).trim();
  if (!str || str === 'TBD') return null;

  // Tanggal polos "YYYY-MM-DD" -> tengah malam lokal.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parsed = new Date(`${str}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Timestamp ISO penuh dari Sheets (mis. "2024-03-29T17:00:00.000Z").
  // Parse natif lalu ambil komponen tanggal lokal supaya konsisten date-only.
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

// Normalisasi nilai tanggal apa pun (ISO/Date/"YYYY-MM-DD") ke format
// "YYYY-MM-DD" yang dibutuhkan oleh <input type="date">.
export const toDateInputString = (dateStr) => toDateInputValue(parseDateValue(dateStr));

export const toDateInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
};

export const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getDateRangeKeys = (startDateStr, endDateStr) => {
  const start = parseDateValue(startDateStr);
  const end = parseDateValue(endDateStr || startDateStr);
  if (!start || !end) return [];

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  const keys = [];

  for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor.setDate(cursor.getDate() + 1)) {
    keys.push(toLocalDateKey(cursor));
  }

  return keys;
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const diffDays = (start, end) => Math.round((end - start) / (1000 * 60 * 60 * 24));

export const getTimelinePercent = (date, start, segments, zoomLevel, edge = 'center') => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !(start instanceof Date) || Number.isNaN(start.getTime()) || !Array.isArray(segments) || segments.length === 0) {
    return -1;
  }

  const segmentSpanDays = zoomLevel === 'week' ? 7 : 1;
  const offsetDays = diffDays(start, date);
  const segmentIndex = Math.floor(offsetDays / segmentSpanDays);
  const dayInSegment = offsetDays - (segmentIndex * segmentSpanDays);

  let segmentFraction = (dayInSegment + 0.5) / segmentSpanDays;
  if (edge === 'start') {
    segmentFraction = dayInSegment / segmentSpanDays;
  } else if (edge === 'end') {
    segmentFraction = (dayInSegment + 1) / segmentSpanDays;
  }

  return Math.min(100, Math.max(0, ((segmentIndex + segmentFraction) / segments.length) * 100));
};

export const getTimelineMarkerPlacement = (date, start, segments, zoomLevel, edge = 'center') => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !(start instanceof Date) || Number.isNaN(start.getTime()) || !Array.isArray(segments) || segments.length === 0) {
    return null;
  }

  const segmentSpanDays = zoomLevel === 'week' ? 7 : 1;
  const offsetDays = diffDays(start, date);
  if (offsetDays < 0) return null;

  const segmentIndex = Math.floor(offsetDays / segmentSpanDays);
  if (segmentIndex < 0 || segmentIndex >= segments.length) return null;

  const dayInSegment = offsetDays - (segmentIndex * segmentSpanDays);
  let offsetPercent = ((dayInSegment + 0.5) / segmentSpanDays) * 100;
  if (edge === 'start') {
    offsetPercent = (dayInSegment / segmentSpanDays) * 100;
  } else if (edge === 'end') {
    offsetPercent = ((dayInSegment + 1) / segmentSpanDays) * 100;
  }

  return {
    segmentIndex,
    offsetPercent: Math.min(100, Math.max(0, offsetPercent)),
  };
};

export const formatTimelineLabel = (date, zoomLevel) => {
  if (zoomLevel === 'week') {
    const weekEnd = addDays(date, 6);
    return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric' });
};
