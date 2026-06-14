// Util domain task/subtask murni: normalisasi snapshot subtask, status proyek,
// progress, badge deadline, label gantt, dan metadata event.
import { parseActivityTimestamp, parseDateValue, toDateInputValue, addDays, diffDays } from './dateUtils.js';

export const normalizeSubtaskSnapshot = (subtask, parentId = null) => {
  if (!subtask) return null;

  return {
    ...subtask,
    id: subtask.id,
    parentId: parentId ? String(parentId) : String(subtask.parentId || ''),
    title: subtask.title || '',
    assignee: subtask.assignee || 'Unassigned',
    startDate: subtask.startDate || '',
    deadline: subtask.deadline || 'TBD',
    status: subtask.status || 'pending',
    evidence: subtask.evidence ?? null,
    evidenceUrl: subtask.evidenceUrl ?? null,
    evidenceUrls: Array.isArray(subtask.evidenceUrls) ? subtask.evidenceUrls : [],
    evidenceLinks: Array.isArray(subtask.evidenceLinks) ? subtask.evidenceLinks : [],
    approvedEvidenceKeys: Array.isArray(subtask.approvedEvidenceKeys) ? subtask.approvedEvidenceKeys : [],
    comments: Array.isArray(subtask.comments) ? subtask.comments : [],
    lastUpdated: subtask.lastUpdated || '',
    isDeleted: subtask.isDeleted === true,
    deletedAt: subtask.deletedAt || '',
    deletedBy: subtask.deletedBy || '',
  };
};

export const pickPreferredSubtaskSnapshot = (embeddedSubtask, overrideSubtask) => {
  const embeddedTimestamp = parseActivityTimestamp(embeddedSubtask?.lastUpdated);
  const overrideTimestamp = parseActivityTimestamp(overrideSubtask?.lastUpdated);

  if (overrideTimestamp !== null && embeddedTimestamp !== null) {
    return overrideTimestamp >= embeddedTimestamp ? overrideSubtask : embeddedSubtask;
  }

  if (overrideTimestamp !== null) return overrideSubtask;
  if (embeddedTimestamp !== null) return embeddedSubtask;

  return overrideSubtask || embeddedSubtask || null;
};

export const mergeTaskSubtaskSnapshots = (embeddedSubtask, overrideSubtask, parentId = null) => {
  const normalizedEmbedded = normalizeSubtaskSnapshot(embeddedSubtask, parentId);
  const normalizedOverride = normalizeSubtaskSnapshot(overrideSubtask, parentId);

  if (!normalizedEmbedded) return normalizedOverride;
  if (!normalizedOverride) return normalizedEmbedded;

  const preferredSnapshot = pickPreferredSubtaskSnapshot(normalizedEmbedded, normalizedOverride);
  const fallbackSnapshot = preferredSnapshot === normalizedOverride ? normalizedEmbedded : normalizedOverride;

  return {
    ...fallbackSnapshot,
    ...preferredSnapshot,
    id: normalizedEmbedded.id,
    parentId: normalizedEmbedded.parentId || normalizedOverride.parentId,
  };
};

export const getGanttStatusLabel = (status) => {
  if (status === 'waiting_review') return 'Review';
  if (status === 'revision') return 'Revise';
  if (status === 'completed') return 'Completed';
  return 'Ready';
};

export const getDefaultSubtaskStartDate = (deadlineStr) => {
  const deadlineDate = parseDateValue(deadlineStr);
  if (!deadlineDate) return "";
  return toDateInputValue(addDays(deadlineDate, -3));
};

// Catatan: versi ini punya field `accentClass` (dipakai EventDetailModal).
// Ada salinan ringkas terpisah di pages/CoePage.jsx yang TIDAK punya accentClass —
// jangan disamakan secara naif.
export const getEventTypeMeta = (eventType) => {
  if (eventType === 'internal') {
    return {
      label: 'Internal',
      cardClass: 'border-blue-200 bg-blue-50/40',
      badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
      chipClass: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      accentClass: 'bg-blue-600',
    };
  }

  return {
    label: 'External',
    cardClass: 'border-emerald-200 bg-emerald-50/40',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    chipClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    accentClass: 'bg-emerald-600',
  };
};

export const getLatestProjectUpdate = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return "-";
  const sorted = [...task.subtasks].sort((a, b) => {
    // Toleran terhadap lastUpdated yang tidak lengkap (mis. tanpa bagian jam,
    // atau bukan format DD/MM/YYYY HH:MM) agar tidak melempar saat render.
    const parse = d => {
      if (!d || typeof d !== 'string') return 0;
      const [D = '', T = ''] = d.split(' ');
      const [dd, mm, yy] = D.split('/');
      const [hh = '0', mn = '0'] = T.split(':');
      const t = new Date(yy, (Number(mm) || 1) - 1, Number(dd) || 1, Number(hh) || 0, Number(mn) || 0).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    return parse(b.lastUpdated) - parse(a.lastUpdated);
  });
  return sorted[0]?.lastUpdated || "-";
};

export const getTaskDeadlineBadge = (deadlineStr) => {
  const deadlineDate = parseDateValue(deadlineStr);
  if (!deadlineDate) {
    return { label: deadlineStr || '-', className: 'text-slate-400' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const remainingDays = diffDays(today, deadlineDate);
  if (remainingDays < 0) {
    return { label: 'Overdue', className: 'text-red-600' };
  }

  return { label: `H-${remainingDays}`, className: 'text-slate-500' };
};

export const getProjectStatus = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return { label: 'SUBMITTED', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' };
  const hasRevision = task.subtasks.some(s => s.status === 'revision');
  const hasWaitingReview = task.subtasks.some(s => s.status === 'waiting_review');
  const isAllCompleted = task.subtasks.every(s => s.status === 'completed');
  if (hasRevision) return { label: 'REVISE', color: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', ring: 'ring-red-500' };
  if (hasWaitingReview) return { label: 'REVIEW', color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', ring: 'ring-yellow-500' };
  if (isAllCompleted) return { label: 'COMPLETED', color: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', ring: 'ring-green-500' };
  return { label: 'SUBMITTED', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' };
};

export const calculateTaskProgress = (subtasksList = []) => {
  if (subtasksList.length === 0) return 0;
  const completedCount = subtasksList.filter((subtask) => subtask.status === 'completed').length;
  return Math.round((completedCount / subtasksList.length) * 100);
};
