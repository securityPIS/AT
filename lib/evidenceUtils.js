// Util evidence/file murni: metadata ikon file, normalisasi daftar evidence,
// seleksi evidence yang di-approve, dan validasi file upload.
import { File, FileText, Table, Presentation, Image as ImageIcon } from 'lucide-react';
import { ALLOWED_EVIDENCE_EXTENSIONS, ALLOWED_EVIDENCE_MIME_TYPES, MAX_EVIDENCE_FILE_SIZE } from './constants.js';

export const getFileMeta = (filename) => {
  if (!filename) return { type: 'unknown', icon: File, color: 'text-slate-500', bg: 'bg-slate-100', label: 'FILE' };
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return { type: 'pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50', label: 'PDF' };
    case 'doc': case 'docx': return { type: 'word', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'WORD' };
    case 'xls': case 'xlsx': case 'csv': return { type: 'excel', icon: Table, color: 'text-green-600', bg: 'bg-green-50', label: 'EXCEL' };
    case 'ppt': case 'pptx': return { type: 'ppt', icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50', label: 'PPT' };
    case 'jpg': case 'jpeg': case 'png': case 'gif': return { type: 'image', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50', label: 'IMG' };
    default: return { type: 'file', icon: File, color: 'text-slate-500', bg: 'bg-slate-100', label: ext.toUpperCase() };
  }
};

export const getNormalizedEvidenceEntries = (subtask) => {
  if (!subtask) return [];

  const entries = [];
  const pushEntry = (entry) => {
    if (!entry?.key) return;
    if (entries.some((item) => item.key === entry.key)) return;
    entries.push(entry);
  };

  if (Array.isArray(subtask.evidenceUrls) && subtask.evidenceUrls.length > 0) {
    subtask.evidenceUrls.forEach((file, index) => {
      if (!file?.name) return;
      const fileUrl = file.url || null;
      pushEntry({
        key: `file:${fileUrl || `${file.name}:${index}`}`,
        type: 'file',
        label: file.name,
        url: fileUrl,
      });
    });
  } else if (subtask.evidence) {
    pushEntry({
      key: `legacy:${subtask.evidenceUrl || subtask.evidence}`,
      type: 'file',
      label: subtask.evidence,
      url: subtask.evidenceUrl || null,
    });
  }

  if (Array.isArray(subtask.evidenceLinks)) {
    subtask.evidenceLinks.forEach((link) => {
      if (!link) return;
      pushEntry({
        key: `link:${link}`,
        type: 'link',
        label: link,
        url: link,
        isLink: true,
      });
    });
  }

  return entries;
};

export const getApprovedEvidenceKeys = (subtask, options = {}) => {
  const { fallbackToAllWhenCompleted = true } = options;
  const selectedKeys = Array.isArray(subtask?.approvedEvidenceKeys)
    ? subtask.approvedEvidenceKeys.filter(Boolean)
    : [];

  if (selectedKeys.length > 0) {
    return selectedKeys;
  }

  if (fallbackToAllWhenCompleted && subtask?.status === 'completed') {
    return getNormalizedEvidenceEntries(subtask).map((entry) => entry.key);
  }

  return [];
};

export const getApprovedEvidenceEntries = (subtask, options = {}) => {
  const approvedKeySet = new Set(getApprovedEvidenceKeys(subtask, options));
  return getNormalizedEvidenceEntries(subtask).filter((entry) => approvedKeySet.has(entry.key));
};

export const validateEvidenceFiles = (files) => {
  const invalidFile = files.find((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const extensionAllowed = extension && ALLOWED_EVIDENCE_EXTENSIONS.has(extension);
    const mimeAllowed = !file.type || ALLOWED_EVIDENCE_MIME_TYPES.has(file.type);
    return !extensionAllowed || !mimeAllowed || file.size > MAX_EVIDENCE_FILE_SIZE;
  });

  if (!invalidFile) return { ok: true, files };

  if (invalidFile.size > MAX_EVIDENCE_FILE_SIZE) {
    return { ok: false, message: `File ${invalidFile.name} melebihi batas 10 MB.` };
  }

  return {
    ok: false,
    message: `File ${invalidFile.name} tidak diizinkan. Hanya PDF, Office, CSV, JPG, dan PNG yang diperbolehkan.`,
  };
};
