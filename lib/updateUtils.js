// Util domain "Update & Koordinasi" (entri non-task dengan LOG progres).
// Fungsi murni tanpa React — aman dipakai di page/modal/app.jsx.
import { UPDATE_CATEGORY_META, UPDATE_STATUS_META } from './constants.js';

// Normalisasi satu baris update dari sheet menjadi bentuk konsisten untuk UI.
// `entries` = timeline LOG (array of { text, user, status, timestamp }).
export const normalizeUpdate = (update) => {
  if (!update) return null;
  return {
    ...update,
    id: update.id,
    title: update.title || '',
    category: update.category || 'meeting',
    status: update.status || 'baru',
    description: update.description || '',
    createdBy: update.createdBy || '',
    createdAt: update.createdAt || '',
    lastUpdated: update.lastUpdated || '',
    entries: Array.isArray(update.entries) ? update.entries : [],
  };
};

// Metadata tampilan kategori (label + ikon + warna). Fallback ke `default`.
export const getUpdateCategoryMeta = (category) =>
  UPDATE_CATEGORY_META[category] || UPDATE_CATEGORY_META.default;

// Metadata tampilan status (label + warna badge/teks/dot). Fallback ke `default`.
export const getUpdateStatusMeta = (status) =>
  UPDATE_STATUS_META[status] || UPDATE_STATUS_META.default;

// Entri LOG terbaru (elemen terakhir array, karena append di server menaruh di akhir).
// Dipakai untuk ringkasan "sampai mana" pada kartu daftar.
export const getLatestUpdateEntry = (update) => {
  const entries = Array.isArray(update?.entries) ? update.entries : [];
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
};
