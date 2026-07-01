// Utilitas tampilan avatar dari Google Drive.
//
// Google Drive TIDAK lagi menyajikan URL "uc?export=download|view" sebagai
// gambar yang bisa di-embed di tag <img> (di-redirect ke halaman peringatan /
// diblokir), sehingga avatar hasil upload gagal tampil. Endpoint "thumbnail"
// masih menyajikan byte gambar yang bisa langsung dipakai sebagai `src` <img>.

// Ambil fileId dari berbagai bentuk URL Google Drive.
export function extractDriveFileId(url) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // https://drive.google.com/file/d/<id>/view
    /[?&]id=([a-zA-Z0-9_-]+)/,     // ...uc?export=...&id=<id>, open?id=<id>, thumbnail?id=<id>
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return "";
}

// Ubah URL Google Drive menjadi URL thumbnail yang bisa di-embed di <img>.
// URL non-Drive (dicebear, ui-avatars, blob:, dll.) dikembalikan apa adanya,
// dan fungsi ini idempotent (URL thumbnail yang sudah benar tidak berubah).
export function normalizeAvatarUrl(url) {
  if (typeof url !== 'string') return "";
  const trimmed = url.trim();
  if (!trimmed || !trimmed.includes('drive.google.com')) return trimmed;

  const fileId = extractDriveFileId(trimmed);
  if (!fileId) return trimmed;

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}
