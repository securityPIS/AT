import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { api, generateUniqueId } from './googleScript.js';
import {
  CheckCircle, Circle, Plus, Users, FileText, Upload, Briefcase, AlertCircle,
  Image as ImageIcon, Calendar, CalendarDays, Layout, Trash2, Edit2, X, Clock, AlertTriangle,
  Check, XCircle, ArrowLeft, BarChart2, List, History, Menu, Home, User,
  LayoutDashboard, LogOut, ChevronDown, ChevronUp, ChevronRight, Settings, ClipboardList,
  Search, Save, ExternalLink, File, Table, Presentation, FileImage, Mail,
  Building, UserPlus, PieChart, Activity, Lock, Eye, EyeOff, Power, LogIn, PenSquare, MapPin,
  ChevronLeft, Copy, Bell, CheckCheck
} from 'lucide-react';
import {
  DEFAULT_TASKS, DEFAULT_USERS, AVATAR_MAX_BYTES, ALLOWED_AVATAR_TYPES, COMPANY_OPTIONS,
  EMPTY_NEW_USER_FORM, EMPTY_REGISTER_FORM, EMPTY_PROFILE_FORM, DEFAULT_KPIS, DEFAULT_EVENTS,
  KPI_GROUPS, MAX_EVIDENCE_FILE_SIZE, ALLOWED_EVIDENCE_EXTENSIONS, ALLOWED_EVIDENCE_MIME_TYPES,
  INACTIVITY_LOGOUT_MINUTES, INACTIVITY_LOGOUT_MS, DEFAULT_TEMPLATES, ACTIVITY_LOG_ACTION_META,
  monthNames,
} from './lib/constants.js';


// --- HELPER COMPONENTS ---
const UserAvatar = ({ name, photoURL = "", className = "w-6 h-6", size = 128 }) => {
  const safeName = typeof name === 'string' ? name : 'User';
  const [hasPhotoError, setHasPhotoError] = React.useState(false);
  const seed = encodeURIComponent(safeName);
  const src = !hasPhotoError && photoURL
    ? photoURL
    : `https://ui-avatars.com/api/?name=${seed}&background=random&color=fff&size=${size}&rounded=true&bold=true`;

  React.useEffect(() => {
    setHasPhotoError(false);
  }, [photoURL, safeName]);

  return (
    <img
      src={src}
      alt={safeName}
      className={`rounded-full object-cover border border-white shadow-sm flex-shrink-0 ${className}`}
      title={safeName}
      onError={() => setHasPhotoError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent) => { const x = Math.cos(2 * Math.PI * percent); const y = Math.sin(2 * Math.PI * percent); return [x, y]; };

  if (total === 0) return <div className="flex items-center justify-center h-48 w-48 rounded-full border-4 border-slate-100"><span className="text-slate-400 text-xs">No Data</span></div>;

  return (
    <div className="relative w-48 h-48">
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full">
        {data.map((slice, index) => {
          if (slice.value === 0) return null;
          const startPercent = cumulativePercent; const slicePercent = slice.value / total; cumulativePercent += slicePercent; const endPercent = cumulativePercent;
          const [startX, startY] = getCoordinatesForPercent(startPercent); const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
          return <path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.05" />;
        })}
        <circle cx="0" cy="0" r="0.6" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-2xl font-bold text-slate-800">{total}</span><span className="text-xs text-slate-500">Subtasks</span></div>
    </div>
  );
};

// --- HELPER FUNCTIONS ---
const getCurrentDateTime = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const formatLogTimeLabel = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};


const parseActivityTimestamp = (value) => {
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

const normalizeSubtaskSnapshot = (subtask, parentId = null) => {
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

const pickPreferredSubtaskSnapshot = (embeddedSubtask, overrideSubtask) => {
  const embeddedTimestamp = parseActivityTimestamp(embeddedSubtask?.lastUpdated);
  const overrideTimestamp = parseActivityTimestamp(overrideSubtask?.lastUpdated);

  if (overrideTimestamp !== null && embeddedTimestamp !== null) {
    return overrideTimestamp >= embeddedTimestamp ? overrideSubtask : embeddedSubtask;
  }

  if (overrideTimestamp !== null) return overrideSubtask;
  if (embeddedTimestamp !== null) return embeddedSubtask;

  return overrideSubtask || embeddedSubtask || null;
};

const mergeTaskSubtaskSnapshots = (embeddedSubtask, overrideSubtask, parentId = null) => {
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

const formatDateIndo = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return "-";
  try {
    const parsed = parseDateValue(dateStr);
    if (!parsed) return dateStr;
    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const parseDateValue = (dateStr) => {
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
const toDateInputString = (dateStr) => toDateInputValue(parseDateValue(dateStr));

const toDateInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
};

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDateRangeKeys = (startDateStr, endDateStr) => {
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

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const diffDays = (start, end) => Math.round((end - start) / (1000 * 60 * 60 * 24));

const getTimelinePercent = (date, start, segments, zoomLevel, edge = 'center') => {
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

const getTimelineMarkerPlacement = (date, start, segments, zoomLevel, edge = 'center') => {
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

const formatTimelineLabel = (date, zoomLevel) => {
  if (zoomLevel === 'week') {
    const weekEnd = addDays(date, 6);
    return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric' });
};

const getGanttStatusLabel = (status) => {
  if (status === 'waiting_review') return 'Review';
  if (status === 'revision') return 'Revise';
  if (status === 'completed') return 'Completed';
  return 'Ready';
};

const getDefaultSubtaskStartDate = (deadlineStr) => {
  const deadlineDate = parseDateValue(deadlineStr);
  if (!deadlineDate) return "";
  return toDateInputValue(addDays(deadlineDate, -3));
};

const getEventTypeMeta = (eventType) => {
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

const getLatestProjectUpdate = (task) => {
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

const getTaskDeadlineBadge = (deadlineStr) => {
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

const getFileMeta = (filename) => {
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

const getNormalizedEvidenceEntries = (subtask) => {
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

const getApprovedEvidenceKeys = (subtask, options = {}) => {
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

const getApprovedEvidenceEntries = (subtask, options = {}) => {
  const approvedKeySet = new Set(getApprovedEvidenceKeys(subtask, options));
  return getNormalizedEvidenceEntries(subtask).filter((entry) => approvedKeySet.has(entry.key));
};

const UserTaskPage = lazy(() => import('./pages/UserTaskPage.jsx'));
const FilePage = lazy(() => import('./pages/FilePage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ManageUserPage = lazy(() => import('./pages/ManageUserPage.jsx'));
const KpiPage = lazy(() => import('./pages/KpiPage.jsx'));
const CoePage = lazy(() => import('./pages/CoePage.jsx'));
const TemplateTaskPage = lazy(() => import('./pages/TemplateTaskPage.jsx'));

const validateEvidenceFiles = (files) => {
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

const getProjectStatus = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return { label: 'SUBMITTED', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' };
  const hasRevision = task.subtasks.some(s => s.status === 'revision');
  const hasWaitingReview = task.subtasks.some(s => s.status === 'waiting_review');
  const isAllCompleted = task.subtasks.every(s => s.status === 'completed');
  if (hasRevision) return { label: 'REVISE', color: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', ring: 'ring-red-500' };
  if (hasWaitingReview) return { label: 'REVIEW', color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', ring: 'ring-yellow-500' };
  if (isAllCompleted) return { label: 'COMPLETED', color: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', ring: 'ring-green-500' };
  return { label: 'SUBMITTED', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' };
};

const calculateTaskProgress = (subtasksList = []) => {
  if (subtasksList.length === 0) return 0;
  const completedCount = subtasksList.filter((subtask) => subtask.status === 'completed').length;
  return Math.round((completedCount / subtasksList.length) * 100);
};

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin, onRegister, loginFeedback = "" }) => {
  const forgotPasswordMessages = [
    "KOCAK BENER bisa lupa password, coba inget inget dulu lah KOCAK",
    "Loh Ndak Tau Masa Tanya Sama Saya"
  ];
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER_FORM);
  const [registerAvatarFile, setRegisterAvatarFile] = useState(null);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const registerAvatarPreview = useMemo(
    () => (registerAvatarFile ? URL.createObjectURL(registerAvatarFile) : ""),
    [registerAvatarFile]
  );

  useEffect(() => {
    if (!registerAvatarPreview) return undefined;

    return () => URL.revokeObjectURL(registerAvatarPreview);
  }, [registerAvatarPreview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    onLogin(email, password, setError);
  };

  const handleForgotPasswordClick = () => {
    const randomMessage = forgotPasswordMessages[Math.floor(Math.random() * forgotPasswordMessages.length)];
    setForgotPasswordMessage(randomMessage);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setIsRegistering(true);

    try {
      const message = await onRegister(registerForm, registerAvatarFile);
      setRegisterSuccess(message);
      setRegisterForm(EMPTY_REGISTER_FORM);
      setRegisterAvatarFile(null);
      setShowRegisterPassword(false);
      setMode('login');
    } catch (registerErr) {
      setRegisterError(registerErr?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterAvatarChange = (file) => {
    if (!file) {
      setRegisterAvatarFile(null);
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setRegisterError('Foto avatar harus berformat JPG atau PNG.');
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setRegisterError('Ukuran foto avatar maksimal 2 MB.');
      return;
    }

    setRegisterError('');
    setRegisterAvatarFile(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
        <div className="text-center mb-8">
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Pertamina" className="h-16 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Action Tracker</h1>
          <p className="text-slate-500 text-sm">
            {mode === 'login' ? 'Masuk untuk mengelola task monitoring' : 'Daftarkan akun baru, lalu tunggu aktivasi dari PIC'}
          </p>
        </div>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Registrasi
          </button>
        </div>
        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginFeedback && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" /> <span>{loginFeedback}</span></div>}
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><div className="relative"><Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type="email" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><div className="relative"><Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2"><LogIn className="w-5 h-5" /> Masuk</button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lupa Password
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {registerError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5" /> <span>{registerError}</span></div>}
            {registerSuccess && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" /> <span>{registerSuccess}</span></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label><input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label><div className="relative"><Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type="email" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Company</label><select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.company} onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}><option value="">-Pilih Company-</option>{COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">No. Telephone (WhatsApp)</label><input type="tel" required pattern="[0-9]*" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="081234567890" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Role</label><select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}><option value="">-Pilih Role-</option><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Department</label><input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.department} onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Photo Avatar</label><input type="file" required accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleRegisterAvatarChange(e.target.files?.[0] || null)} />{registerAvatarPreview ? (<div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><img src={registerAvatarPreview} alt="Preview avatar registrasi" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700">{registerAvatarFile?.name}</p><p className="text-[11px] text-slate-400">Preview avatar baru</p></div></div>) : (<p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>)}</div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><div className="relative"><Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input required type={showRegisterPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Set login password" autoComplete="new-password" /><button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><p className="mt-1 text-[11px] text-slate-400">Akun akan dibuat dalam status nonaktif dan menunggu aktivasi dari PIC.</p></div>
            <button type="submit" disabled={isRegistering} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><UserPlus className="w-5 h-5" /> {isRegistering ? 'Mengirim Registrasi...' : 'Kirim Registrasi'}</button>
          </form>
        )}
        <div className="mt-6 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} Pertamina Action Tracker</div>
      </div>
      {forgotPasswordMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-6 w-6 text-amber-500" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">Lupa Password</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{forgotPasswordMessage}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotPasswordMessage('')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  // Firebase Realtime State
  const [taskDocs, setTaskDocs] = useState([]);
  const [subtaskDocs, setSubtaskDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [events, setEvents] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [authResolved, setAuthResolved] = useState(false);
  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    // Handle database seeding if URL has ?init=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('init') === 'true') {
      const runInit = async () => {
        try {
          setDataLoaded(false);
          const msg = await api.initDatabase();
          alert(msg);
          // Remove ?init=true from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        } catch(err) {
          alert("Gagal inisialisasi database: " + err.message);
        } finally {
          setDataLoaded(true);
        }
      };
      runInit();
      return;
    }

    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setUserRole(user.role);
      setIsLoggedIn(true);
      setActivePage('jobtask');
    }
    setAuthResolved(true);
    setDataLoaded(true);
  }, []);

  // UI States
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [activePage, setActivePage] = useState('jobtask');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuExpanded, setIsUserMenuExpanded] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [coeViewMode, setCoeViewMode] = useState('calendar');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDates, setSelectedCalendarDates] = useState([]);
  const [editingMainTaskId, setEditingMainTaskId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [ganttRangePreset, setGanttRangePreset] = useState('fit');
  const [ganttRangeStart, setGanttRangeStart] = useState('');
  const [ganttRangeEnd, setGanttRangeEnd] = useState('');
  const [ganttZoomLevel, setGanttZoomLevel] = useState('day');
  const [ganttShowCompleted, setGanttShowCompleted] = useState(true);
  const [ganttTooltip, setGanttTooltip] = useState(null);
  const [showGanttFilters, setShowGanttFilters] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [isMainTaskDetailExpanded, setIsMainTaskDetailExpanded] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Ya, lanjutkan",
    cancelLabel: "Batal",
    tone: "blue",
  });
  const confirmationResolverRef = useRef(null);

  // Fetch Public Holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentCalendarDate.getFullYear();
        const response = await fetch(`https://libur.deno.dev/api?year=${year}`);
        if (response.ok) {
          const data = await response.json();
          // API pihak ketiga (libur.deno.dev) bisa mengembalikan non-array
          // (mis. objek error / tahun tanpa data). Pastikan selalu array agar
          // holidaysByDate.map() tidak melempar dan memutih-layarkan aplikasi.
          setHolidays(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
      }
    };
    fetchHolidays();
  }, [currentCalendarDate.getFullYear()]);

  // Modal States
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showUserTaskDetailModal, setShowUserTaskDetailModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Data Selection States
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [subtaskToRevise, setSubtaskToRevise] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);

  // Form States
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceLink, setEvidenceLink] = useState("");
  const [approvalEvidenceSelection, setApprovalEvidenceSelection] = useState([]);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const evidenceFileInputRef = useRef(null);
  const [reviseComment, setReviseComment] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPic, setNewTaskPic] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskIsEvent, setNewTaskIsEvent] = useState(false);
  const [newEventStartDate, setNewEventStartDate] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventParticipants, setNewEventParticipants] = useState([]);
  const [subtaskFormTitle, setSubtaskFormTitle] = useState("");
  const [subtaskFormAssignee, setSubtaskFormAssignee] = useState("");
  const [subtaskFormDeadline, setSubtaskFormDeadline] = useState("");
  const [subtaskFormStartDate, setSubtaskFormStartDate] = useState("");
  const [subtaskFormDescription, setSubtaskFormDescription] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [newUserForm, setNewUserForm] = useState(EMPTY_NEW_USER_FORM);
  const [editUserForm, setEditUserForm] = useState({ id: null, name: "", email: "", role: "", department: "", company: COMPANY_OPTIONS[0], phone: "", photoURL: "" });
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [profilePasswordForm, setProfilePasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [newUserAvatarFile, setNewUserAvatarFile] = useState(null);
  const [editUserAvatarFile, setEditUserAvatarFile] = useState(null);
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState('');
  const [editingKPI, setEditingKPI] = useState(null);
  const [kpiForm, setKpiForm] = useState({ title: "", group: "FINANCE" });
  const [expandedKPIGroups, setExpandedKPIGroups] = useState({
    'FINANCE': true, 'CUSTOMER FOCUS': true, 'INTERNAL PROCESS': true, 'LEARNING & GROWTH': true
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", startDate: "", endDate: "", location: "", participants: [], linkedTaskId: "", eventType: "external" });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: "", subtasks: [{ title: "", assignee: "", deadline: "" }] });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!showProfileMenu) return undefined;

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  // Search States
  const [userTaskSearch, setUserTaskSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [maintaskFilter, setMaintaskFilter] = useState(null);

  // Collapsible State for Subtasks
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  // Sidebar Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const dataNeeds = useMemo(() => ({
    tasks: ['jobtask', 'user-task', 'file', 'dashboard', 'coe'].includes(activePage) || showNewTaskModal || showSubtaskModal || showReviseModal || showEvidenceModal || showUserTaskDetailModal || showEventModal || showEventDetailModal,
    users: ['jobtask', 'user-task', 'dashboard', 'manage-user', 'coe'].includes(activePage) || showAddUserModal || showEditUserModal || showTemplateModal || showEventModal || showSubtaskModal || showNewTaskModal,
    kpis: activePage === 'kpi' || showKPIModal,
    events: activePage === 'coe' || activePage === 'jobtask' || showEventModal || showEventDetailModal,
    templates: activePage === 'template-task' || showTemplateModal || showNewTaskModal,
  }), [
    activePage,
    showAddUserModal,
    showEditUserModal,
    showEvidenceModal,
    showEventDetailModal,
    showEventModal,
    showKPIModal,
    showNewTaskModal,
    showReviseModal,
    showSubtaskModal,
    showTemplateModal,
    showUserTaskDetailModal,
  ]);

  const tasks = useMemo(() => {
    const subtaskOverridesByParent = new Map();

    subtaskDocs.forEach((subtask) => {
      const parentKey = String(subtask.parentId || '');
      if (!parentKey) return;
      if (!subtaskOverridesByParent.has(parentKey)) {
        subtaskOverridesByParent.set(parentKey, new Map());
      }
      subtaskOverridesByParent.get(parentKey).set(String(subtask.id), subtask);
    });

    return taskDocs.map((task) => {
      const embeddedSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const overrides = subtaskOverridesByParent.get(String(task.id)) || new Map();
      const embeddedIds = new Set(embeddedSubtasks.map((subtask) => String(subtask.id)));
      const mergedSubtasks = [
        ...embeddedSubtasks.map((subtask) => (
          mergeTaskSubtaskSnapshots(subtask, overrides.get(String(subtask.id)), task.id)
        )),
        ...Array.from(overrides.values())
          .filter((subtask) => !embeddedIds.has(String(subtask.id)))
          .map((subtask) => normalizeSubtaskSnapshot(subtask, task.id)),
      ].filter((subtask) => subtask && subtask.isDeleted !== true);

      return {
        ...task,
        subtasks: mergedSubtasks,
        progress: calculateTaskProgress(mergedSubtasks),
      };
    });
  }, [subtaskDocs, taskDocs]);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeUsers = useMemo(() => users.filter((user) => user.status === 'Active'), [users]);
  const activePicUsers = useMemo(() => activeUsers.filter((user) => user.role === 'PIC'), [activeUsers]);
  const myNotifications = useMemo(() => {
    if (!currentUser?.id) return [];
    const uid = String(currentUser.id);
    return notifications
      .filter((notification) => String(notification.recipientUserId || notification.userId) === uid)
      .sort((a, b) => (Number(b.createdAt || b.timestamp) || 0) - (Number(a.createdAt || a.timestamp) || 0));
  }, [notifications, currentUser]);

  const unreadNotificationsCount = useMemo(
    () => myNotifications.filter((notification) => !notification.isRead).length,
    [myNotifications]
  );
  const eventsSorted = useMemo(
    () => [...events].sort((a, b) => new Date(a?.startDate || 0) - new Date(b?.startDate || 0)),
    [events]
  );
  const eventByLinkedTaskId = useMemo(() => {
    const linkedEvents = new Map();
    events.forEach((event) => {
      if (event.linkedTaskId && !linkedEvents.has(event.linkedTaskId)) {
        linkedEvents.set(event.linkedTaskId, event);
      }
    });
    return linkedEvents;
  }, [events]);
  const eventByTitle = useMemo(() => {
    const titledEvents = new Map();
    events.forEach((event) => {
      if (event.title && !titledEvents.has(event.title)) {
        titledEvents.set(event.title, event);
      }
    });
    return titledEvents;
  }, [events]);
  const holidaysByDate = useMemo(() => new Map((Array.isArray(holidays) ? holidays : []).map((holiday) => [holiday.date, holiday])), [holidays]);
  const kpisByGroup = useMemo(() => {
    const grouped = new Map(KPI_GROUPS.map((group) => [group, []]));
    kpis.forEach((kpi) => {
      if (!grouped.has(kpi.group)) grouped.set(kpi.group, []);
      grouped.get(kpi.group).push(kpi);
    });
    return grouped;
  }, [kpis]);
  const calendarEventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      if (!event?.startDate) return;
      const start = parseDateValue(event.startDate);
      const end = parseDateValue(event.endDate || event.startDate);
      if (!start || !end) return;
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const key = toLocalDateKey(cursor);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(event);
      }
    });
    return map;
  }, [events]);

  const activeTask = selectedTaskId ? taskById.get(selectedTaskId) || null : null;
  const canManageActiveTaskSubtasks = userRole === 'PIC';
  const isTaskOwnerPicUser = (task) => userRole === 'PIC' && task?.pic === currentUser?.name;
  const isActiveTaskOwnerPic = isTaskOwnerPicUser(activeTask);

  // Riwayat aktivitas untuk tab Log: gabungan log asli (sheet 'logs') + entri
  // legacy yang diturunkan dari comments[] subtask (aktivitas lama sebelum sheet
  // logs ada), di-group per hari dengan urutan terbaru di atas.
  const activeTaskActivityLog = useMemo(() => {
    if (!activeTask) return [];
    const taskIdStr = String(activeTask.id);

    const realLogs = activityLogs
      .filter((log) => String(log.taskId) === taskIdStr)
      .map((log) => ({ ...log, documents: Array.isArray(log.documents) ? log.documents : [], createdAt: Number(log.createdAt) || 0 }));

    const knownRefKeys = new Set(realLogs.map((log) => log.refKey).filter(Boolean));
    const legacyEntries = [];
    (activeTask.subtasks || []).forEach((subtask) => {
      (Array.isArray(subtask.comments) ? subtask.comments : []).forEach((comment, index) => {
        const refKey = `${subtask.id}|${comment.timestamp}|${comment.user}|${comment.type}`;
        if (knownRefKeys.has(refKey)) return;
        legacyEntries.push({
          id: `legacy-${refKey}-${index}`,
          taskId: taskIdStr,
          subtaskId: String(subtask.id),
          subtaskTitle: subtask.title,
          action: comment.type === 'revision' ? 'revision_requested' : 'evidence_submitted',
          actorUserId: '',
          actorName: comment.user || 'Pengguna',
          message: comment.text || '',
          documents: [],
          refKey,
          createdAt: parseActivityTimestamp(comment.timestamp) ?? 0,
          isLegacy: true,
        });
      });
    });

    const combined = [...realLogs, ...legacyEntries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const groups = [];
    const groupByKey = new Map();
    combined.forEach((entry) => {
      const entryDate = entry.createdAt ? new Date(entry.createdAt) : null;
      const key = entryDate ? toLocalDateKey(entryDate) : 'unknown';
      if (!groupByKey.has(key)) {
        const group = {
          key,
          label: entryDate
            ? entryDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : 'Tanggal tidak diketahui',
          entries: [],
        };
        groupByKey.set(key, group);
        groups.push(group);
      }
      groupByKey.get(key).entries.push(entry);
    });
    return groups;
  }, [activeTask, activityLogs]);

  // Firestore Realtime Listeners
  const fetchData = async (silent = false) => {
    if (!silent) setDataLoaded(false);
    try {
      const data = await api.getAllData();

      // Backend baru (v4) mengirim subtask sebagai sheet ternormalisasi
      // (data.subtasks, 1 baris/subtask). Backend lama tidak punya field ini —
      // jatuh ke parsing JSON embedded di kolom tasks.subtasks (degradasi anggun).
      const normalizedSubtaskRows = Array.isArray(data.subtasks) ? data.subtasks : null;

      let tasksWithSubtasks;
      let subtasks;
      if (normalizedSubtaskRows) {
        const byParent = new Map();
        normalizedSubtaskRows.forEach((s) => {
          const pid = String(s.parentId || '');
          if (!pid) return;
          if (!byParent.has(pid)) byParent.set(pid, []);
          byParent.get(pid).push({ ...s, parentId: pid });
        });
        // Override kolom subtasks legacy (yang kini hanya backup beku) dgn baris sheet.
        tasksWithSubtasks = (data.tasks || []).map((t) => ({
          ...t,
          subtasks: byParent.get(String(t.id)) || [],
        }));
        subtasks = normalizedSubtaskRows.map((s) => ({ ...s, parentId: String(s.parentId || '') }));
      } else {
        tasksWithSubtasks = (data.tasks || []).map((t) => {
          let st = [];
          if (typeof t.subtasks === 'string') {
            try { st = JSON.parse(t.subtasks); } catch (e) { st = []; }
          } else if (Array.isArray(t.subtasks)) {
            st = t.subtasks;
          }
          return { ...t, subtasks: st };
        });
        subtasks = tasksWithSubtasks.flatMap((t) => t.subtasks.map((s) => ({ ...s, parentId: String(t.id) })));
      }

      setTaskDocs(tasksWithSubtasks);
      setSubtaskDocs(subtasks);
      setUsers(data.users || []);
      setKpis(data.kpis || []);
      setEvents((data.events || []).map(e => ({
        ...e,
        eventType: e.eventType || (e.linkedTaskId ? 'internal' : 'external'),
        participants: typeof e.participants === 'string' ? JSON.parse(e.participants) : (e.participants || [])
      })));
      setTaskTemplates((data.templates || []).map(t => ({
        ...t,
        subtasks: typeof t.subtasks === 'string' ? JSON.parse(t.subtasks) : (t.subtasks || [])
      })));
      setNotifications((data.notifications || []).map(n => ({
        ...n,
        isRead: n.isRead === true || String(n.isRead).toLowerCase() === 'true'
      })));
      const serverLogs = (data.logs || []).map((l) => ({
        ...l,
        documents: (() => {
          if (Array.isArray(l.documents)) return l.documents;
          if (typeof l.documents === 'string' && l.documents) {
            try { return JSON.parse(l.documents); } catch (e) { return []; }
          }
          return [];
        })(),
        createdAt: Number(l.createdAt) || 0,
      }));
      setActivityLogs((prev) => {
        // Pertahankan entri optimistik (<60 dtk) yang belum sampai di server agar
        // tidak berkedip hilang saat refetch mendahului penulisan addLogs.
        const serverIds = new Set(serverLogs.map((l) => String(l.id)));
        const pendingLocal = prev.filter((l) => !serverIds.has(String(l.id)) && (Date.now() - (l.createdAt || 0)) < 60000);
        return [...pendingLocal, ...serverLogs];
      });
    } catch(err) {
      console.error("Failed to fetch data:", err);
    } finally {
      if (!silent) setDataLoaded(true);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    
    fetchData(false);
    
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId(null);
      return;
    }

    if (!selectedTaskId || !taskById.has(selectedTaskId)) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [selectedTaskId, taskById, tasks]);

  // --- LOGIC ---

  const toggleSubtask = (subtaskId) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [subtaskId]: !(prev[subtaskId] ?? true)
    }));
  };

  const handleLogin = async (email, password, setErrorCallback) => {
    try {
      setLoginFeedback('');
      setDataLoaded(false);
      const user = await api.login(email, password);
      
      setCurrentUser(user);
      setUserRole(user.role);
      setIsLoggedIn(true);
      setActivePage('jobtask');
    } catch (error) {
      console.error('Login error:', error);
      setErrorCallback(error.message || 'Terjadi kesalahan login. Silakan coba lagi.');
    } finally {
      setDataLoaded(true);
    }
  };

  const performLogout = async (message = '') => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    await api.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole('');
    setTaskDocs([]);
    setSubtaskDocs([]);
    setUsers([]);
    setKpis([]);
    setEvents([]);
    setTaskTemplates([]);
    setNotifications([]);
    setActivityLogs([]);
    setIsSidebarOpen(false);
    setShowProfileMenu(false);
    setShowEditProfileModal(false);
    if (message) {
      window.alert(message);
    }
  };

  const handleLogout = async () => {
    setShowNotificationsPanel(false);
    await performLogout();
  };

  useEffect(() => {
    if (!isLoggedIn) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return undefined;
    }

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = window.setTimeout(() => {
        void performLogout(`Sesi berakhir karena tidak ada aktivitas selama ${INACTIVITY_LOGOUT_MINUTES} menit.`);
      }, INACTIVITY_LOGOUT_MS);
    };

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetInactivityTimer();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!selectedSubtask) {
      setApprovalEvidenceSelection([]);
      return;
    }

    setApprovalEvidenceSelection(getApprovedEvidenceKeys(selectedSubtask, { fallbackToAllWhenCompleted: false }));
  }, [selectedSubtask]);

  useEffect(() => {
    if (!selectedSubtask) return;

    const parentId = selectedSubtask.parentId || selectedSubtask.taskId;
    if (!parentId) return;

    const latestTask = taskById.get(parentId);
    if (!latestTask) return;

    const latestSubtask = latestTask.subtasks.find((subtask) => String(subtask.id) === String(selectedSubtask.id));
    if (!latestSubtask) return;

    const hasChanged =
      JSON.stringify({
        title: selectedSubtask.title,
        assignee: selectedSubtask.assignee,
        startDate: selectedSubtask.startDate,
        deadline: selectedSubtask.deadline,
        status: selectedSubtask.status,
        evidence: selectedSubtask.evidence,
        evidenceUrl: selectedSubtask.evidenceUrl,
        evidenceUrls: selectedSubtask.evidenceUrls || [],
        evidenceLinks: selectedSubtask.evidenceLinks || [],
        approvedEvidenceKeys: selectedSubtask.approvedEvidenceKeys || [],
        comments: selectedSubtask.comments || [],
        lastUpdated: selectedSubtask.lastUpdated,
      }) !== JSON.stringify({
        title: latestSubtask.title,
        assignee: latestSubtask.assignee,
        startDate: latestSubtask.startDate,
        deadline: latestSubtask.deadline,
        status: latestSubtask.status,
        evidence: latestSubtask.evidence,
        evidenceUrl: latestSubtask.evidenceUrl,
        evidenceUrls: latestSubtask.evidenceUrls || [],
        evidenceLinks: latestSubtask.evidenceLinks || [],
        approvedEvidenceKeys: latestSubtask.approvedEvidenceKeys || [],
        comments: latestSubtask.comments || [],
        lastUpdated: latestSubtask.lastUpdated,
      });

    if (hasChanged) {
      setSelectedSubtask((prev) => ({
        ...prev,
        ...latestSubtask,
        parentId,
        taskId: parentId,
        parentTitle: prev?.parentTitle || latestTask.title,
        parentPic: prev?.parentPic || latestTask.pic,
      }));
    }
  }, [selectedSubtask, taskById]);

  // Filter Logic
  const filteredUserTasks = useMemo(() => {
    if (!currentUser) return [];
    const normalizedCurrentUserName = (currentUser.name || '').trim().toLowerCase();
    const filtered = tasks.flatMap(t =>
      t.subtasks.map(s => ({ ...s, parentId: t.id, parentTitle: t.title, parentPic: t.pic }))
    ).filter(sub =>
      (sub.assignee || '').trim().toLowerCase() === normalizedCurrentUserName &&
      (
        sub.title.toLowerCase().includes(userTaskSearch.toLowerCase())
        || sub.parentTitle.toLowerCase().includes(userTaskSearch.toLowerCase())
      )
    );
    const statusOrder = { 'revision': 1, 'waiting_review': 2, 'pending': 3, 'completed': 4 };
    return filtered.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
  }, [tasks, currentUser, userTaskSearch]);

  const dashboardStats = useMemo(() => {
    const totalProjects = tasks.length;
    const allSubtasks = tasks.flatMap(t => t.subtasks);
    const totalSubtasks = allSubtasks.length;
    const completedSubtasks = allSubtasks.filter(s => s.status === 'completed').length;
    const waitingReview = allSubtasks.filter(s => s.status === 'waiting_review').length;
    const revision = allSubtasks.filter(s => s.status === 'revision').length;
    const pending = allSubtasks.filter(s => s.status === 'pending').length;
    const workload = {};
    allSubtasks.forEach(s => {
      if (!workload[s.assignee]) workload[s.assignee] = { total: 0, completed: 0 };
      workload[s.assignee].total++;
      if (s.status === 'completed') workload[s.assignee].completed++;
    });
    return { totalProjects, totalSubtasks, completedSubtasks, waitingReview, revision, pending, workload: Object.entries(workload).map(([name, stats]) => ({ name, ...stats })) };
  }, [tasks]);

  const userByName = useMemo(() => {
    const entries = users
      .filter((user) => user?.name)
      .map((user) => [user.name, user]);
    return new Map(entries);
  }, [users]);

  useEffect(() => {
    if (!currentUser?.id || users.length === 0) return;

    const latestCurrentUser = users.find((user) => user.id === currentUser.id);
    if (!latestCurrentUser) return;

    const hasChanged =
      latestCurrentUser.name !== currentUser.name ||
      latestCurrentUser.email !== currentUser.email ||
      latestCurrentUser.role !== currentUser.role ||
      latestCurrentUser.company !== currentUser.company ||
      latestCurrentUser.department !== currentUser.department ||
      latestCurrentUser.phone !== currentUser.phone ||
      latestCurrentUser.status !== currentUser.status ||
      latestCurrentUser.photoURL !== currentUser.photoURL;

    if (hasChanged) {
      setCurrentUser(latestCurrentUser);
      setUserRole(latestCurrentUser.role);
    }
  }, [users, currentUser]);

  // Notifications are fetched periodically via the main fetchData batch polling

  const newUserAvatarPreview = useMemo(
    () => (newUserAvatarFile ? URL.createObjectURL(newUserAvatarFile) : ""),
    [newUserAvatarFile]
  );

  const editUserAvatarPreview = useMemo(
    () => (editUserAvatarFile ? URL.createObjectURL(editUserAvatarFile) : ""),
    [editUserAvatarFile]
  );

  const profileAvatarPreview = useMemo(
    () => (profileAvatarFile ? URL.createObjectURL(profileAvatarFile) : ""),
    [profileAvatarFile]
  );

  useEffect(() => {
    return () => {
      if (newUserAvatarPreview) {
        URL.revokeObjectURL(newUserAvatarPreview);
      }
    };
  }, [newUserAvatarPreview]);

  useEffect(() => {
    return () => {
      if (editUserAvatarPreview) {
        URL.revokeObjectURL(editUserAvatarPreview);
      }
    };
  }, [editUserAvatarPreview]);

  useEffect(() => {
    return () => {
      if (profileAvatarPreview) {
        URL.revokeObjectURL(profileAvatarPreview);
      }
    };
  }, [profileAvatarPreview]);

  useEffect(() => {
    if (!activeTask?.subtasks?.length) return;

    const datedSubtasks = activeTask.subtasks
      .filter((subtask) => subtask.deadline)
      .map((subtask) => parseDateValue(subtask.deadline))
      .filter(Boolean);

    const mainDeadlineDate = parseDateValue(activeTask.deadline);
    if (mainDeadlineDate) {
      datedSubtasks.push(mainDeadlineDate);
    }
    if (datedSubtasks.length === 0) return;

    const earliest = new Date(Math.min(...datedSubtasks.map((date) => date.getTime())));
    const latest = new Date(Math.max(...datedSubtasks.map((date) => date.getTime())));
    const fitStart = addDays(earliest, -3);
    const fitEnd = addDays(latest, 7);
    const fitSpanDays = Math.max(1, diffDays(fitStart, fitEnd) + 1);

    setGanttRangePreset('fit');
    setGanttRangeStart(toDateInputValue(fitStart));
    setGanttRangeEnd(toDateInputValue(fitEnd));
    setGanttZoomLevel(fitSpanDays > 45 ? 'week' : 'day');
    setGanttShowCompleted(true);
    setGanttTooltip(null);
    setShowGanttFilters(false);
  }, [activeTask?.id]);

  const ganttData = useMemo(() => {
    if (!activeTask?.subtasks?.length || !ganttRangeStart || !ganttRangeEnd) return null;

    const start = parseDateValue(ganttRangeStart);
    const end = parseDateValue(ganttRangeEnd);
    if (!start || !end || end < start) return null;

    const visibleSubtasks = activeTask.subtasks
      .filter((subtask) => subtask.deadline)
      .filter((subtask) => ganttShowCompleted || subtask.status !== 'completed')
      .map((subtask) => {
        const deadlineDate = parseDateValue(subtask.deadline);
        return deadlineDate ? { ...subtask, deadlineDate } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const statusOrder = { revision: 1, waiting_review: 2, pending: 3, completed: 4 };
        const orderDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (orderDiff !== 0) return orderDiff;
        return a.deadlineDate - b.deadlineDate;
      });

    const totalDays = Math.max(1, diffDays(start, end) + 1);
    const zoomDays = ganttZoomLevel === 'week' ? 7 : 1;
    const segments = [];
    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, zoomDays)) {
      segments.push(new Date(cursor));
    }

    const mainTaskDeadlineDate = parseDateValue(activeTask.deadline);
    const mainTaskDeadlinePlacement = mainTaskDeadlineDate
      ? getTimelineMarkerPlacement(mainTaskDeadlineDate, start, segments, ganttZoomLevel, 'center')
      : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlacement = today >= start && today <= end
      ? getTimelineMarkerPlacement(today, start, segments, ganttZoomLevel, 'center')
      : null;

    return {
      start,
      end,
      segments,
      subtasks: visibleSubtasks,
      totalDays,
      mainTaskDeadlinePlacement,
      todayPlacement,
      zoomLevel: ganttZoomLevel,
    };
  }, [activeTask, ganttRangeStart, ganttRangeEnd, ganttShowCompleted, ganttZoomLevel]);

  const applyGanttPreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === '2w') {
      const nextStart = addDays(today, -7);
      const nextEnd = addDays(today, 7);
      setGanttRangePreset(preset);
      setGanttRangeStart(toDateInputValue(nextStart));
      setGanttRangeEnd(toDateInputValue(nextEnd));
      setGanttZoomLevel('day');
      return;
    }

    if (preset === '1m') {
      const nextStart = addDays(today, -7);
      const nextEnd = addDays(today, 30);
      setGanttRangePreset(preset);
      setGanttRangeStart(toDateInputValue(nextStart));
      setGanttRangeEnd(toDateInputValue(nextEnd));
      setGanttZoomLevel('day');
      return;
    }

    if (preset === '3m') {
      const nextStart = addDays(today, -14);
      const nextEnd = addDays(today, 90);
      setGanttRangePreset(preset);
      setGanttRangeStart(toDateInputValue(nextStart));
      setGanttRangeEnd(toDateInputValue(nextEnd));
      setGanttZoomLevel('week');
      return;
    }

    const datedSubtasks = (activeTask?.subtasks || [])
      .filter((subtask) => subtask.deadline)
      .map((subtask) => parseDateValue(subtask.deadline))
      .filter(Boolean);
    const mainDeadlineDate = parseDateValue(activeTask?.deadline);
    if (mainDeadlineDate) datedSubtasks.push(mainDeadlineDate);
    if (datedSubtasks.length === 0) return;

    const earliest = new Date(Math.min(...datedSubtasks.map((date) => date.getTime())));
    const latest = new Date(Math.max(...datedSubtasks.map((date) => date.getTime())));
    const nextStart = addDays(earliest, -3);
    const nextEnd = addDays(latest, 7);
    const spanDays = Math.max(1, diffDays(nextStart, nextEnd) + 1);

    setGanttRangePreset('fit');
    setGanttRangeStart(toDateInputValue(nextStart));
    setGanttRangeEnd(toDateInputValue(nextEnd));
    setGanttZoomLevel(spanDays > 45 ? 'week' : 'day');
  };

  const handleGanttTooltipMove = (event, subtask) => {
    setGanttTooltip({
      subtask,
      x: event.clientX + 16,
      y: event.clientY + 16,
    });
  };

  // Actions
  const recalculateProgress = (task, subtasksList) => {
    return { ...task, subtasks: subtasksList, progress: calculateTaskProgress(subtasksList) };
  };

  const syncTaskSubtaskState = async (task, nextSubtask, options = {}) => {
    if (!task || !nextSubtask) return { updatedTask: task, syncedSubtask: null };
    const { syncParentTask = true } = options;

    const normalizedNextSubtask = normalizeSubtaskSnapshot(nextSubtask, task.id);
    const targetId = String(normalizedNextSubtask.id);
    let hasExistingSubtask = false;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const syncedSubtasks = currentSubtasks.map((subtask) => {
      if (String(subtask.id) !== targetId) return subtask;
      hasExistingSubtask = true;
      return mergeTaskSubtaskSnapshots(subtask, normalizedNextSubtask, task.id);
    });

    const finalSubtasks = hasExistingSubtask
      ? syncedSubtasks
      : [...syncedSubtasks, normalizedNextSubtask];

    const updatedTask = recalculateProgress(task, finalSubtasks);
    const syncedSubtask = updatedTask.subtasks.find((subtask) => String(subtask.id) === targetId) || null;

    if (syncParentTask && syncedSubtask) {
      // Simpan hanya satu baris subtask; backend menghitung ulang progress parent.
      await api.saveSubtask({ ...syncedSubtask, parentId: String(task.id) });
      fetchData(true);
    }

    return { updatedTask, syncedSubtask };
  };

  const createNotifications = async (recipients, notificationInput, options = {}) => {
    const { skipRefetch = false } = options;
    if (!currentUser?.id || !currentUser?.name || !Array.isArray(recipients) || recipients.length === 0) return;

    const uniqueRecipients = recipients.filter((recipient, index, array) => (
      recipient?.id
      && recipient.id !== currentUser.id
      && array.findIndex((item) => item?.id === recipient.id) === index
    ));

    if (uniqueRecipients.length === 0) return;

    const newNotifications = uniqueRecipients.map((recipient) => ({
      id: generateUniqueId('notif'),
      userId: recipient.id, // matches our sheets headers recipientUserId mapping or just userId
      recipientUserId: recipient.id,
      recipientName: recipient.name,
      type: notificationInput.type,
      priority: notificationInput.priority || 'medium',
      title: notificationInput.title,
      message: notificationInput.message,
      targetType: notificationInput.targetType || 'subtask',
      targetId: notificationInput.targetId || '',
      parentTaskId: notificationInput.parentTaskId || '',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      isRead: false,
      timestamp: Date.now(),
      createdAt: Date.now(),
      meta: notificationInput.meta || {},
    }));

    await api.createNotifications(newNotifications);
    if (!skipRefetch) fetchData(true);
  };

  // Catat aktivitas ke sheet 'logs' untuk tab Log. Optimistic prepend agar
  // langsung tampil; kegagalan backend (mis. deployment lama belum punya action
  // 'addLogs') ditelan diam-diam supaya tidak pernah mematahkan alur utama.
  const logTaskActivity = async ({ task, subtaskId = '', subtaskTitle = '', action, message = '', documents = [], refKey = '' }) => {
    if (!task?.id || !action || !currentUser?.id) return;
    const entry = {
      id: generateUniqueId('log'),
      taskId: String(task.id),
      subtaskId: subtaskId ? String(subtaskId) : '',
      subtaskTitle: subtaskTitle || '',
      action,
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      message: message || '',
      documents: Array.isArray(documents) ? documents : [],
      refKey: refKey || '',
      createdAt: Date.now(),
    };
    setActivityLogs((prev) => [entry, ...prev]); // optimistic
    try {
      await api.addLogs([entry]);
    } catch (error) {
      console.error('Error saving activity log:', error);
    }
  };

  const getUserByName = (name) => userByName.get(name) || null;

  const getNotificationTimeLabel = (createdAt) => {
    if (!createdAt) return '';
    const diffMinutes = Math.max(0, Math.round((Date.now() - createdAt) / (1000 * 60)));
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes}m lalu`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}h lalu`;
  };

  const markNotificationAsRead = async (notificationId) => {
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification || notification.isRead) return;
    // Optimistic: tandai terbaca seketika, lalu sinkron ke backend di latar belakang.
    setNotifications((prev) => prev.map((item) => (
      item.id === notificationId ? { ...item, isRead: true } : item
    )));
    try {
      await api.markNotificationRead(notificationId);
    } catch (error) {
      console.error('Error marking notification read:', error);
      fetchData(true);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser?.id) return;
    const uid = String(currentUser.id);
    // Optimistic: tandai terbaca seketika untuk notifikasi milik user ini saja
    // (selaras dengan backend yang hanya menandai notifikasi penerima terkait).
    setNotifications((prev) => prev.map((item) => (
      String(item.recipientUserId || item.userId) === uid && !item.isRead
        ? { ...item, isRead: true }
        : item
    )));
    try {
      await api.markAllNotificationsRead(currentUser.id);
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      fetchData(true);
    }
  };

  const openConfirmationDialog = ({
    title = "Konfirmasi",
    message,
    confirmLabel = "Ya, lanjutkan",
    cancelLabel = "Batal",
    tone = "blue",
  }) => new Promise((resolve) => {
    confirmationResolverRef.current = resolve;
    setConfirmationDialog({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
    });
  });

  const closeConfirmationDialog = (confirmed) => {
    setConfirmationDialog((prev) => ({ ...prev, open: false }));
    if (confirmationResolverRef.current) {
      confirmationResolverRef.current(confirmed);
      confirmationResolverRef.current = null;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;
    setShowNotificationsPanel(false);
    // Tandai terbaca di latar belakang (optimistic) supaya navigasi terasa instan.
    markNotificationAsRead(notification.id);

    if (notification.targetType === 'subtask' && notification.parentTaskId) {
      const task = taskById.get(notification.parentTaskId)
        || tasks.find((t) => String(t.id) === String(notification.parentTaskId));
      const targetSubtask = task?.subtasks?.find((subtask) => String(subtask.id) === String(notification.targetId));
      setSelectedTaskId(task ? task.id : notification.parentTaskId);
      setActivePage('jobtask');
      setShowMobileDetail(true);
      setViewMode('list');

      if (targetSubtask) {
        setSelectedSubtask({
          ...targetSubtask,
          taskId: task.id,
          parentId: task.id,
          parentTitle: task.title,
          parentPic: task.pic,
        });
        setEvidenceText("");
        setExpandedSubtasks({ [targetSubtask.id]: true });
        setShowUserTaskDetailModal(true);
      }
      return;
    }

    if (notification.targetType === 'task' && notification.targetId) {
      setSelectedTaskId(notification.targetId);
      setActivePage('jobtask');
      setShowMobileDetail(true);
    }
  };

  const submitEvidence = async () => {
    if (!selectedSubtask) return;
    if (evidenceFiles.length === 0 && !evidenceText && !evidenceLink) {
        alert("Pekerjaan wajib menyertakan setidaknya satu file atau satu tautan bukti, atau catatan.");
        return;
    }
    const confirmed = await openConfirmationDialog({
      title: "Kirim Subtask",
      message: `Apakah Anda yakin ingin mengirim subtask "${selectedSubtask.title}"? PIC akan menerima notifikasi untuk review.`,
      confirmLabel: "Ya, kirim",
      tone: "emerald",
    });
    if (!confirmed) {
      return;
    }
    const parentId = selectedSubtask.parentId || selectedSubtask.taskId;
    const task = taskById.get(parentId);
    if (!task) return;
    setEvidenceUploading(true);
    try {
      let uploadedEvidenceUrls = selectedSubtask.evidenceUrls || [];
      let newlyUploadedUrls = [];

      if (evidenceFiles.length > 0) {
        const uploadPromises = evidenceFiles.map(async (file) => {
          const ownerId = currentUser?.id;
          if (!ownerId) {
            throw new Error('Sesi pengguna tidak valid. Silakan login ulang.');
          }
          const uploadResult = await api.uploadFile(file);
          return { name: file.name, url: uploadResult.url };
        });

        const newUrls = await Promise.all(uploadPromises);
        newlyUploadedUrls = newUrls;
        uploadedEvidenceUrls = [...uploadedEvidenceUrls, ...newUrls];
      }
      
      // Handle legacy string evidence backward compatibility
      let legacyEvidenceName = selectedSubtask.evidence || null;
      let legacyEvidenceUrl = selectedSubtask.evidenceUrl || null;
      
      // if it's the first time uploading, keep legacy fields alive for simple UI
      if (!legacyEvidenceName && uploadedEvidenceUrls.length > 0) {
          legacyEvidenceName = uploadedEvidenceUrls[0].name;
          legacyEvidenceUrl = uploadedEvidenceUrls[0].url;
      }
      
      let evidenceLinksArray = selectedSubtask.evidenceLinks || [];
      if (evidenceLink) {
          evidenceLinksArray = [...evidenceLinksArray, evidenceLink];
      }

      let commentFilesStr = "";
      if (evidenceFiles.length > 0) {
          commentFilesStr = `File: ${evidenceFiles.map(f=>f.name).join(', ')} `;
      }
      let commentLinkStr = "";
      if (evidenceLink) {
          commentLinkStr = `Link: ${evidenceLink} `;
      }
        
      const commentText = evidenceText || (commentFilesStr + commentLinkStr).trim() || 'Evidence submitted';
      const newComment = { text: commentText, type: 'evidence', user: currentUser.name, timestamp: getCurrentDateTime() };
      const updatedSubtask = {
        ...selectedSubtask,
        status: 'waiting_review',
        evidence: legacyEvidenceName,
        evidenceUrl: legacyEvidenceUrl,
        evidenceUrls: uploadedEvidenceUrls,
        evidenceLinks: evidenceLinksArray,
        approvedEvidenceKeys: [],
        comments: [newComment, ...(selectedSubtask.comments || [])],
        lastUpdated: getCurrentDateTime(),
      };
      await syncTaskSubtaskState(task, updatedSubtask);
      await logTaskActivity({
        task,
        subtaskId: selectedSubtask.id,
        subtaskTitle: selectedSubtask.title,
        action: 'evidence_submitted',
        message: evidenceText || '',
        documents: [
          ...newlyUploadedUrls.map((f) => ({ name: f.name, url: f.url })),
          ...(evidenceLink ? [{ name: evidenceLink, url: evidenceLink, isLink: true }] : []),
        ],
        refKey: `${selectedSubtask.id}|${newComment.timestamp}|${newComment.user}|${newComment.type}`,
      });
      const picUser = getUserByName(task.pic);
      await createNotifications(picUser ? [picUser] : [], {
        type: 'subtask_waiting_review',
        priority: 'high',
        title: 'Subtask menunggu review',
        message: `${currentUser.name} mengirim update untuk "${selectedSubtask.title}".`,
        targetType: 'subtask',
        targetId: String(selectedSubtask.id),
        parentTaskId: String(parentId),
      });
      setShowEvidenceModal(false); setShowUserTaskDetailModal(false); setSelectedSubtask(null); 
      setEvidenceFiles([]); setEvidenceLink(""); setEvidenceText("");
    } catch (error) {
      console.error('Error submitting evidence:', error);
      alert('Gagal mengupload file: ' + (error.message || 'Silakan coba lagi.'));
    } finally {
      setEvidenceUploading(false);
    }
  };

  const handleSendRevision = async () => {
    if (!subtaskToRevise) return;
    const task = taskById.get(subtaskToRevise.taskId);
    if (!task) return;
    const targetSubtask = task.subtasks.find((subtask) => String(subtask.id) === String(subtaskToRevise.id));
    if (!targetSubtask) return;
    if (!reviseComment.trim()) {
      alert("Komentar revisi wajib diisi.");
      return;
    }
    const confirmed = await openConfirmationDialog({
      title: "Kirim Revisi",
      message: `Apakah Anda yakin ingin mengirim revisi untuk subtask "${targetSubtask.title}"? Assignee akan menerima notifikasi revisi.`,
      confirmLabel: "Ya, kirim revisi",
      tone: "red",
    });
    if (!confirmed) {
      return;
    }
    const newComment = { text: reviseComment, type: 'revision', user: currentUser.name, timestamp: getCurrentDateTime() };
    await syncTaskSubtaskState(task, {
      ...targetSubtask,
      status: 'revision',
      comments: [newComment, ...(targetSubtask.comments || [])],
      lastUpdated: getCurrentDateTime(),
    });
    await logTaskActivity({
      task,
      subtaskId: targetSubtask.id,
      subtaskTitle: targetSubtask.title,
      action: 'revision_requested',
      message: reviseComment,
      refKey: `${targetSubtask.id}|${newComment.timestamp}|${newComment.user}|${newComment.type}`,
    });
    const assigneeUser = getUserByName(targetSubtask.assignee);
    await createNotifications(assigneeUser ? [assigneeUser] : [], {
      type: 'subtask_revision',
      priority: 'high',
      title: 'Subtask direvisi',
      message: `${task.pic || currentUser.name} merevisi "${targetSubtask.title}".`,
      targetType: 'subtask',
      targetId: String(targetSubtask.id),
      parentTaskId: String(task.id),
    });
    setShowReviseModal(false); setSubtaskToRevise(null);
  };

  const approveSubtask = async (subtaskId, parentTaskId = null, approvedEvidenceKeysInput = null) => {
    const targetTaskId = parentTaskId || activeTask?.id;
    if (!targetTaskId) return false;
    const task = taskById.get(targetTaskId);
    if (!task) return false;
    const targetSubtask = task.subtasks.find((subtask) => String(subtask.id) === String(subtaskId));
    if (!targetSubtask) return false;
    const availableEvidenceEntries = getNormalizedEvidenceEntries(targetSubtask);
    if (availableEvidenceEntries.length === 0) {
      alert('Subtask ini belum memiliki evidence yang bisa di-approve.');
      return false;
    }

    const selectedEvidenceKeys = Array.isArray(approvedEvidenceKeysInput)
      ? approvedEvidenceKeysInput.filter(Boolean)
      : getApprovedEvidenceKeys(targetSubtask, { fallbackToAllWhenCompleted: false });

    if (selectedEvidenceKeys.length === 0) {
      alert('PIC wajib memilih minimal satu evidence yang disetujui sebelum approve.');
      return false;
    }

    const availableKeySet = new Set(availableEvidenceEntries.map((entry) => entry.key));
    const sanitizedApprovedKeys = [...new Set(selectedEvidenceKeys)].filter((key) => availableKeySet.has(key));
    if (sanitizedApprovedKeys.length === 0) {
      alert('Evidence yang dipilih tidak valid. Silakan pilih ulang evidence yang disetujui.');
      return false;
    }

    const approvedEntries = availableEvidenceEntries.filter((entry) => sanitizedApprovedKeys.includes(entry.key));
    const primaryApprovedFile = approvedEntries.find((entry) => entry.type === 'file');
    const confirmed = await openConfirmationDialog({
      title: "Approve Subtask",
      message: `Apakah Anda yakin ingin meng-approve subtask "${targetSubtask.title}"?`,
      confirmLabel: "Ya, approve",
      tone: "emerald",
    });
    if (!confirmed) {
      return false;
    }
    try {
      const approvalTimestamp = getCurrentDateTime();
      const { syncedSubtask: approvedSubtask } = await syncTaskSubtaskState(task, {
        ...targetSubtask,
        status: 'completed',
        approvedEvidenceKeys: sanitizedApprovedKeys,
        evidence: primaryApprovedFile?.label || targetSubtask.evidence || null,
        evidenceUrl: primaryApprovedFile?.url || targetSubtask.evidenceUrl || null,
        lastUpdated: approvalTimestamp,
      });
      if (approvedSubtask) {
        setSelectedSubtask((prev) => (
          prev && String(prev.id) === String(approvedSubtask.id)
            ? { ...prev, ...approvedSubtask, parentId: prev.parentId || String(targetTaskId) }
            : prev
        ));
        await logTaskActivity({
          task,
          subtaskId: approvedSubtask.id,
          subtaskTitle: approvedSubtask.title,
          action: 'subtask_approved',
          documents: approvedEntries.map((entry) => ({ name: entry.label, url: entry.url, isLink: entry.type === 'link' })),
        });
        const assigneeUser = getUserByName(approvedSubtask.assignee);
        await createNotifications(assigneeUser ? [assigneeUser] : [], {
          type: 'subtask_approved',
          priority: 'medium',
          title: 'Subtask di-approve',
          message: `"${approvedSubtask.title}" telah di-approve oleh ${currentUser.name}.`,
          targetType: 'subtask',
          targetId: String(approvedSubtask.id),
          parentTaskId: String(targetTaskId),
        });
      }
      return true;
    } catch (error) {
      console.error('Error approving subtask:', error);
      alert('Gagal meng-approve subtask. Silakan coba lagi.');
      return false;
    }
  };


  const deleteSubtask = async (subtaskId) => {
    const task = taskById.get(activeTask.id);
    if (!task) return;
    const deletedSubtask = task.subtasks.find((subtask) => String(subtask.id) === String(subtaskId));
    if (!deletedSubtask) return;
    const confirmed = await openConfirmationDialog({
      title: "Hapus Subtask",
      message: `Apakah Anda yakin ingin menghapus subtask "${deletedSubtask.title}"? Perubahan ini akan mengirimkan notifikasi ke assignee terkait.`,
      confirmLabel: "Ya, hapus",
      tone: "red",
    });
    if (!confirmed) return;

    const updatedSubtasks = task.subtasks.filter((st) => String(st.id) !== String(subtaskId));
    const updatedTask = recalculateProgress(task, updatedSubtasks);

    // Optimistic: langsung hilangkan subtask dari UI tanpa menunggu backend.
    setTaskDocs((prev) => prev.map((t) => (
      String(t.id) === String(task.id)
        ? { ...t, subtasks: updatedSubtasks, progress: updatedTask.progress }
        : t
    )));
    setSubtaskDocs((prev) => prev.filter((s) => (
      !(String(s.parentId) === String(task.id) && String(s.id) === String(subtaskId))
    )));

    try {
      await api.deleteSubtask(subtaskId, String(task.id));
      await logTaskActivity({
        task,
        subtaskId: deletedSubtask.id,
        subtaskTitle: deletedSubtask.title,
        action: 'subtask_deleted',
      });
      const assigneeUser = getUserByName(deletedSubtask.assignee);
      await createNotifications(assigneeUser ? [assigneeUser] : [], {
        type: 'subtask_deleted',
        priority: 'high',
        title: 'Subtask dihapus',
        message: `Subtask "${deletedSubtask.title}" telah dihapus dari project "${task.title}".`,
        targetType: 'task',
        targetId: String(task.id),
        parentTaskId: String(task.id),
      }, { skipRefetch: true });
      await fetchData(true);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      alert('Gagal menghapus subtask. Perubahan dibatalkan, silakan coba lagi.');
      fetchData(true);
    }
  };

  const saveSubtask = async () => {
    if (!subtaskFormTitle) return;
    const task = taskById.get(activeTask.id);
    if (!task) return;
    const isOwnerPic = isTaskOwnerPicUser(task);
    const mainTaskDeadline = parseDateValue(task.deadline);
    const subtaskDeadline = parseDateValue(subtaskFormDeadline);
    const resolvedStartDate = subtaskFormStartDate || getDefaultSubtaskStartDate(subtaskFormDeadline);
    const subtaskStartDate = parseDateValue(resolvedStartDate);

    if (subtaskFormDeadline && mainTaskDeadline && subtaskDeadline && subtaskDeadline > mainTaskDeadline) {
      alert("Deadline subtask tidak boleh melewati deadline main task.");
      return;
    }

    if (resolvedStartDate && mainTaskDeadline && subtaskStartDate && subtaskStartDate > mainTaskDeadline) {
      alert("Start date subtask tidak boleh melewati deadline main task.");
      return;
    }

    if (subtaskStartDate && subtaskDeadline && subtaskStartDate > subtaskDeadline) {
      alert("Start date subtask tidak boleh lebih besar dari deadline subtask.");
      return;
    }

    const confirmationMessage = editingSubtaskId
      ? `Apakah Anda yakin ingin menyimpan perubahan subtask "${subtaskFormTitle}"? Perubahan ini akan mengirimkan notifikasi ke assignee terkait.`
      : `Apakah Anda yakin ingin menambahkan subtask "${subtaskFormTitle}"? Assignee terkait akan menerima notifikasi tugas baru.`;
    const confirmed = await openConfirmationDialog({
      title: editingSubtaskId ? "Simpan Perubahan Subtask" : "Tambah Subtask",
      message: confirmationMessage,
      confirmLabel: editingSubtaskId ? "Ya, simpan" : "Ya, tambah",
      tone: "blue",
    });
    if (!confirmed) {
      return;
    }

    let updatedSubtasks;
    let savedSubtask;
    const previousSubtask = editingSubtaskId
      ? task.subtasks.find((subtask) => String(subtask.id) === String(editingSubtaskId))
      : null;
    if (editingSubtaskId) {
      updatedSubtasks = task.subtasks.map(st => st.id === editingSubtaskId ? { ...st, title: subtaskFormTitle, assignee: subtaskFormAssignee, startDate: resolvedStartDate || st.startDate || "", deadline: subtaskFormDeadline || st.deadline, description: subtaskFormDescription, lastUpdated: getCurrentDateTime() } : st);
      savedSubtask = updatedSubtasks.find((subtask) => subtask.id === editingSubtaskId);
    } else {
      savedSubtask = { id: generateUniqueId('sub'), title: subtaskFormTitle, assignee: subtaskFormAssignee || "Unassigned", startDate: resolvedStartDate || "", deadline: subtaskFormDeadline || "TBD", description: subtaskFormDescription, status: "pending", evidence: null, approvedEvidenceKeys: [], comments: [], lastUpdated: getCurrentDateTime() };
      updatedSubtasks = [...task.subtasks, savedSubtask];
    }
    const updatedTask = recalculateProgress(task, updatedSubtasks);

    // Optimistic update: langsung tampilkan perubahan di UI tanpa menunggu
    // round-trip ke backend, lalu tutup modal supaya terasa instan.
    setTaskDocs((prev) => prev.map((t) => (
      String(t.id) === String(task.id)
        ? { ...t, subtasks: updatedSubtasks, progress: updatedTask.progress }
        : t
    )));
    setShowSubtaskModal(false);
    setIsSavingSubtask(true);

    try {
      // Persist hanya baris subtask yang berubah; backend hitung ulang progress.
      await api.saveSubtask({ ...savedSubtask, parentId: String(task.id) });

    if (savedSubtask) {
      if (editingSubtaskId) {
        const changes = [];
        if (previousSubtask) {
          if (previousSubtask.title !== savedSubtask.title) changes.push(`judul menjadi "${savedSubtask.title}"`);
          if (previousSubtask.assignee !== savedSubtask.assignee) changes.push(`assignee dari ${previousSubtask.assignee || '-'} ke ${savedSubtask.assignee}`);
          if ((previousSubtask.startDate || '') !== (savedSubtask.startDate || '')) changes.push(`start date menjadi ${savedSubtask.startDate || '-'}`);
          if ((previousSubtask.deadline || '') !== (savedSubtask.deadline || '')) changes.push(`deadline menjadi ${savedSubtask.deadline || '-'}`);
          if ((previousSubtask.description || '') !== (savedSubtask.description || '')) changes.push('deskripsi');
        }
        await logTaskActivity({
          task,
          subtaskId: savedSubtask.id,
          subtaskTitle: savedSubtask.title,
          action: 'subtask_updated',
          message: changes.length > 0 ? `Mengubah ${changes.join(', ')}` : '',
        });
        const importantChanged = !previousSubtask
          || previousSubtask.title !== savedSubtask.title
          || previousSubtask.assignee !== savedSubtask.assignee
          || (previousSubtask.startDate || '') !== (savedSubtask.startDate || '')
          || (previousSubtask.deadline || '') !== (savedSubtask.deadline || '');
        if (importantChanged) {
          const recipients = [
            getUserByName(previousSubtask?.assignee),
            getUserByName(savedSubtask.assignee),
          ].filter(Boolean);
          await createNotifications(recipients, {
            type: previousSubtask?.assignee !== savedSubtask.assignee ? 'subtask_reassigned' : 'subtask_updated',
            priority: previousSubtask?.assignee !== savedSubtask.assignee || previousSubtask?.deadline !== savedSubtask.deadline ? 'high' : 'medium',
            title: previousSubtask?.assignee !== savedSubtask.assignee ? 'Subtask diperbarui dan dipindahkan' : 'Subtask diperbarui',
            message: `${currentUser.name} memperbarui "${savedSubtask.title}" pada project "${task.title}".`,
            targetType: 'subtask',
            targetId: String(savedSubtask.id),
            parentTaskId: String(task.id),
            meta: {
              oldAssignee: previousSubtask?.assignee || '',
              newAssignee: savedSubtask.assignee,
              oldDeadline: previousSubtask?.deadline || '',
              newDeadline: savedSubtask.deadline || '',
            },
          }, { skipRefetch: true });
        }
      } else {
        await logTaskActivity({
          task,
          subtaskId: savedSubtask.id,
          subtaskTitle: savedSubtask.title,
          action: 'subtask_created',
          message: savedSubtask.assignee && savedSubtask.assignee !== 'Unassigned' ? `Ditugaskan ke ${savedSubtask.assignee}` : '',
        });
        const assigneeUser = getUserByName(savedSubtask.assignee);
        await createNotifications(assigneeUser ? [assigneeUser] : [], {
          type: 'subtask_assigned',
          priority: 'medium',
          title: 'Subtask baru',
          message: `Anda mendapat subtask baru: "${savedSubtask.title}".`,
          targetType: 'subtask',
          targetId: String(savedSubtask.id),
          parentTaskId: String(task.id),
        }, { skipRefetch: true });
      }
    }
      // Satu kali sinkronisasi diam-diam untuk merekonsiliasi state lokal
      // dengan data otoritatif dari backend.
      await fetchData(true);
    } catch (error) {
      console.error('Error saving subtask:', error);
      alert('Gagal menyimpan subtask. Perubahan dibatalkan, silakan coba lagi.');
      // Kembalikan state ke kondisi server karena update optimistik gagal.
      fetchData(true);
    } finally {
      setIsSavingSubtask(false);
    }
  };

  const addNewTask = async () => {
    const trimmedTaskTitle = newTaskTitle.trim();
    if (!trimmedTaskTitle) {
      alert("Nama project wajib diisi.");
      return;
    }

    if (!newTaskPic) {
      alert("PIC wajib dipilih.");
      return;
    }

    const resolvedEventStartDate = newEventStartDate || newTaskDeadline || new Date().toISOString().split('T')[0];
    const resolvedEventEndDate = newEventEndDate || newTaskDeadline || resolvedEventStartDate;
    const resolvedEventLocation = newEventLocation.trim() || "TBD";
    const resolvedEventParticipants = newTaskPic ? [newTaskPic] : [];

    if (editingMainTaskId) {
      // Handle Edit
      const existingTask = taskById.get(editingMainTaskId);
      if (!existingTask) return;
      const updatedTask = {
        ...existingTask,
        title: trimmedTaskTitle,
        description: newTaskDesc,
        pic: newTaskPic,
        deadline: newTaskDeadline || "TBD",
        isEvent: newTaskIsEvent
      };
      // Edit hanya field main task — buang subtasks agar tidak menulis ulang
      // baris subtask (backend memakai jalur ringan & mempertahankan datanya).
      delete updatedTask.subtasks;
      await api.saveTask(updatedTask);
      const taskChanges = [];
      if (existingTask.title !== updatedTask.title) taskChanges.push(`judul menjadi "${updatedTask.title}"`);
      if (existingTask.pic !== updatedTask.pic) taskChanges.push(`PIC menjadi ${updatedTask.pic}`);
      if ((toDateInputString(existingTask.deadline) || existingTask.deadline || '') !== (updatedTask.deadline || '')) taskChanges.push(`deadline menjadi ${formatDateIndo(updatedTask.deadline)}`);
      await logTaskActivity({
        task: updatedTask,
        action: 'task_updated',
        message: taskChanges.length > 0 ? `Mengubah ${taskChanges.join(', ')}` : '',
      });

      if (newTaskIsEvent) {
        const existingEvent = events.find(e => String(e.linkedTaskId) === String(editingMainTaskId)) || events.find(e => e.title === newTaskTitle && e.eventType === 'internal');
        const eventPayload = {
          id: existingEvent ? existingEvent.id : generateUniqueId('evt'),
          title: trimmedTaskTitle,
          startDate: resolvedEventStartDate,
          endDate: resolvedEventEndDate,
          location: resolvedEventLocation,
          participants: resolvedEventParticipants,
          linkedTaskId: String(editingMainTaskId),
          eventType: 'internal',
        };
        await api.saveEvent(eventPayload);
      } else {
        const existingEvent = events.find((e) => String(e.linkedTaskId) === String(editingMainTaskId) && e.eventType === 'internal');
        if (existingEvent) {
          await api.deleteEvent(existingEvent.id);
        }
      }
    } else {
      // Handle Add New
      const newId = generateUniqueId('task');
      const calculateSubtaskDeadline = (mainDeadline, daysBeforeStr) => {
          if (!mainDeadline || daysBeforeStr === "" || daysBeforeStr === null || daysBeforeStr === undefined) return "TBD";
          const daysBefore = parseInt(daysBeforeStr, 10);
          if (isNaN(daysBefore)) return daysBeforeStr;
          
          const d = new Date(mainDeadline);
          d.setDate(d.getDate() - daysBefore);
          return d.toISOString().split('T')[0];
      };

      const selectedTemplate = selectedTemplateId ? taskTemplates.find(t => t.id === selectedTemplateId || t.id === Number(selectedTemplateId)) : null;
      
      const generatedSubtasks = selectedTemplate
        ? selectedTemplate.subtasks.map((s) => ({
          id: generateUniqueId('sub'),
          title: s.title,
          assignee: s.assignee || "Unassigned",
          deadline: calculateSubtaskDeadline(newTaskDeadline, s.deadline),
          status: "pending",
          evidence: null,
          approvedEvidenceKeys: [],
          comments: [],
          lastUpdated: getCurrentDateTime()
        }))
        : [];
      const newTaskData = {
        id: newId,
        title: trimmedTaskTitle,
        description: newTaskDesc,
        pic: newTaskPic,
        deadline: newTaskDeadline || "TBD",
        progress: 0,
        subtasks: generatedSubtasks,
        isEvent: newTaskIsEvent
      };

      await api.createTaskWithSubtasks(newTaskData, generatedSubtasks);
      setSelectedTaskId(newId);
      await logTaskActivity({
        task: newTaskData,
        action: 'task_created',
        message: generatedSubtasks.length > 0 ? `Project dibuat dengan ${generatedSubtasks.length} subtask dari template` : '',
      });

      if (newTaskIsEvent) {
        await api.saveEvent({
          id: generateUniqueId('evt'),
          title: trimmedTaskTitle,
          startDate: resolvedEventStartDate,
          endDate: resolvedEventEndDate,
          location: resolvedEventLocation,
          participants: resolvedEventParticipants,
          linkedTaskId: newId,
          eventType: 'internal',
        });
      }
    }

    fetchData(true);
    setShowNewTaskModal(false);
    setEditingMainTaskId(null);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPic("");
    setNewTaskDeadline("");
    setNewTaskIsEvent(false);
    setNewEventStartDate("");
    setNewEventEndDate("");
    setNewEventLocation("");
    setNewEventParticipants([]);
    setSelectedTemplateId("");
  };

  const openNewTaskModal = (options = {}) => {
    const shouldAddToEvent = options.addToEvent === true;
    const defaultPic = currentUser?.role === 'PIC' ? currentUser.name : "";
    setEditingMainTaskId(null);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPic(defaultPic);
    setNewTaskDeadline("");
    setNewTaskIsEvent(shouldAddToEvent);
    setNewEventStartDate("");
    setNewEventEndDate("");
    setNewEventLocation("");
    setNewEventParticipants([]);
    setSelectedTemplateId("");
    setShowNewTaskModal(true);
  };

  const openInternalEventTaskModal = () => {
    openNewTaskModal({ addToEvent: true });
  };

  const handleEditMainTask = (task) => {
    const existingEvent = events.find((event) => String(event.linkedTaskId) === String(task.id) && event.eventType === 'internal')
      || events.find((event) => event.eventType === 'internal' && event.title === task.title);
    setEditingMainTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description);
    setNewTaskPic(task.pic);
    setNewTaskDeadline(toDateInputString(task.deadline));
    setNewTaskIsEvent(task.isEvent || false);
    setNewEventStartDate(toDateInputString(existingEvent?.startDate));
    setNewEventEndDate(toDateInputString(existingEvent?.endDate));
    setNewEventLocation(existingEvent?.location || "");
    setNewEventParticipants([]);
    setShowNewTaskModal(true);
  };

  const handleDeleteMainTask = async (taskId) => {
    if (confirm("Yakin ingin menghapus Main Task ini beserta seluruh subtask-nya?")) {
      await api.deleteTask(taskId);
      const assocEvent = events.find(e => String(e.linkedTaskId) === String(taskId));
      if (assocEvent) {
        await api.deleteEvent(assocEvent.id);
      }
      if (selectedTaskId === taskId) {
        const remainingTasks = tasks.filter(t => t.id !== taskId);
        if (remainingTasks.length > 0) {
          setSelectedTaskId(remainingTasks[0].id);
        } else {
          setSelectedTaskId(null);
        }
      }
      fetchData(true);
    }
  };

  const validateAvatarFile = (file) => {
    if (!file) {
      return { ok: true };
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return { ok: false, message: 'Foto avatar harus berformat JPG atau PNG.' };
    }

    if (file.size > AVATAR_MAX_BYTES) {
      return { ok: false, message: 'Ukuran foto avatar maksimal 2 MB.' };
    }

    return { ok: true };
  };

  const handleAvatarFileSelection = (file, mode) => {
    const validation = validateAvatarFile(file);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }

    if (mode === 'new') {
      setNewUserAvatarFile(file || null);
      return;
    }

    if (mode === 'profile') {
      setProfileAvatarFile(file || null);
      return;
    }

    setEditUserAvatarFile(file || null);
  };

  const uploadUserAvatar = async (userId, file) => {
    if (!file) return "";
    const uploadResult = await api.uploadFile(file);
    return uploadResult.url;
  };

  const handleSelfRegister = async (formData, avatarFile) => {
    const validation = validateAvatarFile(avatarFile);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    if (!formData.name || !formData.email || !formData.password || !formData.company || !formData.phone || !formData.department || !formData.role) {
      throw new Error('Semua field registrasi wajib diisi.');
    }

    if (!avatarFile) {
      throw new Error('Photo Avatar wajib diisi.');
    }

    try {
      const tempId = generateUniqueId('usr');
      const uploadedPhotoURL = await uploadUserAvatar(tempId, avatarFile);
      
      const payload = {
        ...formData,
        photoURL: uploadedPhotoURL
      };

      await api.register(payload);
      
      const successMessage = 'Registrasi berhasil dikirim. Akun Anda akan aktif setelah PIC melakukan aktivasi.';
      setLoginFeedback(successMessage);
      return successMessage;
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error(error.message || 'Gagal mengirim registrasi. Silakan coba lagi.');
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password || !newUserForm.company || !newUserForm.phone) return;

    try {
      setIsSavingUser(true);
      const tempId = generateUniqueId('usr');
      const uploadedPhotoURL = await uploadUserAvatar(tempId, newUserAvatarFile);
      const payload = {
        name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role,
        department: newUserForm.department,
        company: newUserForm.company,
        phone: newUserForm.phone,
        photoURL: uploadedPhotoURL,
        status: "Inactive"
      };
      await api.register(payload);
      
      setShowAddUserModal(false);
      setNewUserForm(EMPTY_NEW_USER_FORM);
      setNewUserAvatarFile(null);
      setShowPassword(false);
      fetchData(true);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Gagal membuat user: ' + error.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const toggleUserStatus = async (e, userId) => {
    e.stopPropagation();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    await api.updateUser({ ...user, status: nextStatus });
    fetchData(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.status === 'Active') { alert("Hanya user Inactive yang dapat dihapus."); return; }
    if (confirm(`Yakin ingin menghapus user ${selectedUser.name}?`)) {
      await api.deleteUser(selectedUser.id);
      setShowUserDetailModal(false); setSelectedUser(null);
      fetchData(true);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.email) return;
    try {
      setIsSavingUser(true);
      const { id, ...updateData } = editUserForm;
      const uploadedPhotoURL = editUserAvatarFile ? await uploadUserAvatar(id, editUserAvatarFile) : (updateData.photoURL || "").trim();
      const updatedUser = {
        id,
        ...updateData,
        photoURL: uploadedPhotoURL
      };
      await api.updateUser(updatedUser);
      setShowEditUserModal(false);
      setEditUserForm({ id: null, name: "", email: "", role: "", department: "", company: COMPANY_OPTIONS[0], phone: "", photoURL: "" });
      setEditUserAvatarFile(null);
      fetchData(true);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Gagal menyimpan perubahan user: ' + error.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const closeEditProfileModal = () => {
    setShowEditProfileModal(false);
    setProfileAvatarFile(null);
    setProfilePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setProfileForm(EMPTY_PROFILE_FORM);
  };

  const openEditProfileModal = () => {
    if (!currentUser) return;
    setShowNotificationsPanel(false);
    setShowProfileMenu(false);
    setProfileAvatarFile(null);
    setProfilePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setProfileForm({
      id: currentUser.id,
      name: currentUser.name || "",
      email: currentUser.email || "",
      role: currentUser.role || "",
      department: currentUser.department || "",
      company: currentUser.company || COMPANY_OPTIONS[0],
      phone: currentUser.phone || "",
      photoURL: currentUser.photoURL || "",
      status: currentUser.status || "",
    });
    setShowEditProfileModal(true);
  };

  const syncCurrentUserProfileState = (nextProfile) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...nextProfile } : prev));
    setUsers((prev) => prev.map((user) => (
      user.id === currentUser?.id ? { ...user, ...nextProfile } : user
    )));
  };

  const handleUpdateOwnProfile = async () => {
    if (!currentUser?.id) return;
    if (!profileForm.company || !profileForm.department.trim() || !profileForm.phone.trim()) {
      alert('Company, Department, dan No. Telephone wajib diisi.');
      return;
    }

    const wantsPasswordChange = profilePasswordForm.currentPassword || profilePasswordForm.newPassword || profilePasswordForm.confirmPassword;
    if (wantsPasswordChange) {
      if (!profilePasswordForm.currentPassword || !profilePasswordForm.newPassword || !profilePasswordForm.confirmPassword) {
        alert('Untuk ganti password, isi password saat ini, password baru, dan konfirmasi password baru.');
        return;
      }

      if (profilePasswordForm.newPassword.length < 6) {
        alert('Password baru minimal 6 karakter.');
        return;
      }

      if (profilePasswordForm.newPassword !== profilePasswordForm.confirmPassword) {
        alert('Konfirmasi password baru tidak sama.');
        return;
      }
    }

    try {
      setIsSavingProfile(true);

      if (wantsPasswordChange) {
        // Verify current password by making a verification check
        try {
          await api.login(currentUser.email, profilePasswordForm.currentPassword);
        } catch (err) {
          throw new Error('Password saat ini tidak sesuai.');
        }
      }

      const uploadedPhotoURL = profileAvatarFile
        ? await uploadUserAvatar(currentUser.id, profileAvatarFile)
        : (profileForm.photoURL || "").trim();

      const updatedUser = {
        ...currentUser,
        company: profileForm.company,
        department: profileForm.department.trim(),
        phone: profileForm.phone.trim(),
        photoURL: uploadedPhotoURL,
      };

      if (wantsPasswordChange) {
        updatedUser.password = profilePasswordForm.newPassword;
      }

      await api.updateUser(updatedUser);
      
      const savedUser = { ...updatedUser };
      delete savedUser.password;
      localStorage.setItem('action_tracker_user', JSON.stringify(savedUser));

      syncCurrentUserProfileState(savedUser);
      closeEditProfileModal();
      alert(wantsPasswordChange ? 'Profil dan password berhasil diperbarui.' : 'Profil berhasil diperbarui.');
    } catch (error) {
      console.error('Error updating own profile:', error);
      alert('Gagal memperbarui profil: ' + (error.message || 'Silakan coba lagi.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEvidenceFileSelection = (files) => {
    const incomingFiles = Array.from(files || []);
    const validation = validateEvidenceFiles(incomingFiles);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }
    setEvidenceFiles(validation.files);
  };

  const handleSaveKPI = async () => {
    if (!kpiForm.title) return;
    const kpiPayload = {
      id: editingKPI ? editingKPI.id : generateUniqueId('kpi'),
      title: kpiForm.title,
      group: kpiForm.group
    };
    await api.saveKPI(kpiPayload);
    setShowKPIModal(false); setKpiForm({ title: "", group: "FINANCE" }); setEditingKPI(null);
    fetchData(true);
  };

  const handleDeleteKPI = async (id) => {
    if (confirm("Hapus KPI ini?")) {
      await api.deleteKPI(id);
      fetchData(true);
    }
  };

  const openKPIModal = (kpi = null) => {
    if (kpi) {
      setEditingKPI(kpi);
      setKpiForm({ title: kpi.title, group: kpi.group });
    } else {
      setEditingKPI(null);
      setKpiForm({ title: "", group: "FINANCE" });
    }
    setShowKPIModal(true);
  };

  const toggleKPIGroup = (group) => {
    if (expandedKPIGroups) {
      setExpandedKPIGroups(prev => ({ ...prev, [group]: !prev[group] }));
    }
  };


  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  // Nav Helpers
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleUserMenu = () => setIsUserMenuExpanded(!isUserMenuExpanded);
  const navigateTo = (page) => { setActivePage(page); setIsSidebarOpen(false); setShowNotificationsPanel(false); setShowProfileMenu(false); };
  const handleTaskClick = (taskId) => { setSelectedTaskId(taskId); setShowMobileDetail(true); setViewMode('list'); };
  const handleOpenUserTaskDetail = (sub) => { setSelectedSubtask(sub); setEvidenceText(""); setShowUserTaskDetailModal(true); };
  const handleOpenUserDetail = (user) => { setSelectedUser(user); setShowUserDetailModal(true); };
  const openAddSubtaskModal = () => { setSubtaskFormTitle(""); setSubtaskFormAssignee(""); setSubtaskFormDeadline(""); setSubtaskFormStartDate(""); setSubtaskFormDescription(""); setEditingSubtaskId(null); setShowSubtaskModal(true); };
  const openEditSubtaskModal = (sub) => { setSubtaskFormTitle(sub.title); setSubtaskFormAssignee(sub.assignee); setSubtaskFormDeadline(toDateInputString(sub.deadline)); setSubtaskFormStartDate(toDateInputString(sub.startDate) || getDefaultSubtaskStartDate(sub.deadline || "")); setSubtaskFormDescription(sub.description || ""); setEditingSubtaskId(sub.id); setShowSubtaskModal(true); };
  const openReviseModal = (task, sub) => { setSubtaskToRevise({ taskId: task.id, parentTitle: task.title, parentPic: task.pic, ...sub }); setReviseComment(""); setShowReviseModal(true); };
  const openEvidenceModal = (task, sub) => { setSelectedSubtask({ taskId: task.id, parentTitle: task.title, parentPic: task.pic, ...sub }); setEvidenceText(""); setEvidenceFiles([]); setEvidenceLink(""); setShowEvidenceModal(true); };
  const handleOpenEditUser = (user) => {
    const { password, ...safeUser } = user || {};
    setEditUserForm({ photoURL: "", company: COMPANY_OPTIONS[0], phone: "", ...safeUser });
    setEditUserAvatarFile(null);
    setShowUserDetailModal(false);
    setShowEditUserModal(true);
  };

  const openEventModal = (ev = null) => {
    if (ev) {
      setEditingEvent(ev);
      const resolvedEventType = ev.eventType || (ev.linkedTaskId ? 'internal' : 'external');
      const linkedTask = ev.linkedTaskId ? taskById.get(ev.linkedTaskId) : null;
      setEventForm({
        title: ev.title,
        startDate: ev.startDate,
        endDate: ev.endDate,
        location: ev.location,
        participants: resolvedEventType === 'internal'
          ? (linkedTask?.pic ? [linkedTask.pic] : (ev.participants || []))
          : (ev.participants || []),
        linkedTaskId: ev.linkedTaskId || "",
        eventType: resolvedEventType,
      });
    } else {
      setEditingEvent(null);
      setEventForm({ title: "", startDate: "", endDate: "", location: "", participants: [], linkedTaskId: "", eventType: "external" });
    }
    setShowEventModal(true);
  };

  const handleOpenEventDetail = (ev) => {
    setSelectedEventDetail(ev);
    setShowEventDetailModal(true);
  };

  const openCoeCalendarForEvent = (eventItem, fallbackDate = null) => {
    if (eventItem?.startDate) {
      const eventDate = parseDateValue(eventItem.startDate);
      if (eventDate) {
        setCurrentCalendarDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
      }
      setSelectedCalendarDates(getDateRangeKeys(eventItem.startDate, eventItem.endDate));
    } else {
      const resolvedFallback = parseDateValue(fallbackDate);
      if (resolvedFallback) {
        setCurrentCalendarDate(new Date(resolvedFallback.getFullYear(), resolvedFallback.getMonth(), 1));
        setSelectedCalendarDates([toLocalDateKey(resolvedFallback)]);
      } else {
        setSelectedCalendarDates([]);
      }
    }

    setCoeViewMode('calendar');
    navigateTo('coe');
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.startDate || !eventForm.endDate) return;
    const linkedTask = eventForm.linkedTaskId ? taskById.get(eventForm.linkedTaskId) : null;
    const normalizedEventForm = eventForm.eventType === 'internal'
      ? {
          ...eventForm,
          participants: linkedTask?.pic ? [linkedTask.pic] : [],
        }
      : eventForm;
    
    const eventPayload = {
      id: editingEvent ? editingEvent.id : generateUniqueId('evt'),
      ...normalizedEventForm,
      eventType: editingEvent ? normalizedEventForm.eventType : 'external',
      linkedTaskId: editingEvent ? normalizedEventForm.linkedTaskId : ""
    };

    await api.saveEvent(eventPayload);
    setShowEventModal(false); setEventForm({ title: "", startDate: "", endDate: "", location: "", participants: [], linkedTaskId: "", eventType: "external" }); setEditingEvent(null);
    fetchData(true);
  };

  const handleDeleteEvent = async (id) => {
    if (confirm("Hapus event ini?")) {
      const targetEvent = events.find((event) => String(event.id) === String(id));
      await api.deleteEvent(id);
      if (targetEvent?.linkedTaskId) {
        const task = taskById.get(targetEvent.linkedTaskId);
        if (task) {
          const { subtasks, ...taskWithoutSubtasks } = task;
          await api.saveTask({ ...taskWithoutSubtasks, isEvent: false });
        }
      }
      if (selectedEventDetail?.id === id) {
        setSelectedEventDetail(null);
      }
      fetchData(true);
    }
  };

  // Template CRUD handlers
  const openTemplateModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({ name: template.name, subtasks: template.subtasks.map(s => ({ ...s })) });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ name: "", subtasks: [{ title: "", assignee: "", deadline: "" }] });
    }
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name) return;
    const validSubtasks = templateForm.subtasks.filter(s => s.title.trim() !== "");
    if (validSubtasks.length === 0) return;
    
    const templatePayload = {
      id: editingTemplate ? editingTemplate.id : generateUniqueId('tpl'),
      name: templateForm.name,
      subtasks: validSubtasks
    };
    
    await api.saveTemplate(templatePayload);
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({ name: "", subtasks: [{ title: "", assignee: "", deadline: "" }] });
    fetchData(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (confirm("Hapus template ini?")) {
      await api.deleteTemplate(id);
      fetchData(true);
    }
  };

  const addTemplateSubtaskRow = () => {
    setTemplateForm(prev => ({ ...prev, subtasks: [...prev.subtasks, { title: "", assignee: "", deadline: "" }] }));
  };

  const removeTemplateSubtaskRow = (index) => {
    setTemplateForm(prev => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }));
  };

  const updateTemplateSubtaskRow = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const toggleEventParticipant = (userName) => {
    setEventForm(prev => {
      const isSelected = prev.participants.includes(userName);
      const newParticipants = isSelected
        ? prev.participants.filter(name => name !== userName)
        : [...prev.participants, userName];
      return { ...prev, participants: newParticipants };
    });
  };

  const toggleNewTaskEventParticipant = (userName) => {
    setNewEventParticipants((prev) => (
      prev.includes(userName)
        ? prev.filter((name) => name !== userName)
        : [...prev, userName]
    ));
  };

  // Show loading screen while auth or protected app data is being fetched
  if (!authResolved || (isLoggedIn && !dataLoaded)) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="h-16 object-contain mx-auto mb-4 animate-pulse" />
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm">Memuat data...</p>
      </div>
    </div>
  );

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} onRegister={handleSelfRegister} loginFeedback={loginFeedback} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col h-screen overflow-hidden">

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="w-8 h-8 object-contain" />
            Menu
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 lg:hidden"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          <button onClick={() => navigateTo('jobtask')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'jobtask' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Home className="w-5 h-5" /><span className="font-medium text-sm">Jobtask</span>
          </button>
          <button onClick={() => navigateTo('user-task')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'user-task' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ClipboardList className="w-5 h-5" /><span className="font-medium text-sm">User Task</span>
          </button>
          <button onClick={() => navigateTo('coe')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'coe' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CalendarDays className="w-5 h-5" /><span className="font-medium text-sm">Calendar Of Event</span>
          </button>
          <button onClick={() => navigateTo('file')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'file' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-5 h-5" /><span className="font-medium text-sm">File</span>
          </button>
          <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-5 h-5" /><span className="font-medium text-sm">Dashboard</span>
          </button>
          {userRole === 'PIC' && (
            <button onClick={() => navigateTo('manage-user')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'manage-user' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="w-5 h-5" /><span className="font-medium text-sm">Manage User</span>
            </button>
          )}
          <button onClick={() => navigateTo('kpi')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'kpi' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <BarChart2 className="w-5 h-5" /><span className="font-medium text-sm">KPI</span>
          </button>
          <button onClick={() => navigateTo('template-task')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'template-task' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Copy className="w-5 h-5" /><span className="font-medium text-sm">Template Task</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      <header className="bg-white shadow-sm border-b border-slate-200 z-10 flex-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Menu className="w-6 h-6" /></button>
            <div className="p-1 hidden md:block"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="w-8 h-8 object-contain" /></div>
            <h1 className="text-lg font-bold text-slate-900">ActionTracker <span className="text-slate-400 font-normal text-sm hidden md:inline">| Task Monitoring</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowNotificationsPanel((prev) => !prev);
                }}
                className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-[18px] text-white">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsPanel && (
                <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-400">{unreadNotificationsCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={unreadNotificationsCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {myNotifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-400">
                        Belum ada notifikasi.
                      </div>
                    ) : (
                      myNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${notification.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{notification.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                            </div>
                            {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="uppercase tracking-[0.08em]">{notification.priority || 'medium'}</span>
                            <span>{getNotificationTimeLabel(notification.createdAt)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {currentUser && (
              <div ref={profileMenuRef} className="relative flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 uppercase">{currentUser.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsPanel(false);
                    setShowProfileMenu((prev) => !prev);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 transition-colors hover:bg-slate-50"
                  aria-label="Open profile menu"
                >
                  <UserAvatar name={currentUser.name} photoURL={currentUser.photoURL} className="w-8 h-8" />
                  <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition-transform md:block ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                      <p className="mt-0.5 text-xs uppercase text-slate-400">{currentUser.role}</p>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={openEditProfileModal}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm font-medium">Edit Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full bg-slate-50">

        {activePage === 'jobtask' && (
          <>
            <aside className={`w-full md:w-1/3 border-r border-slate-200 bg-white flex-col h-full ${showMobileDetail ? 'hidden md:flex' : 'flex'} ${isSidebarCollapsed ? 'md:hidden' : 'md:flex'}`}>
              <div className="p-4 border-b border-slate-100 flex flex-col bg-slate-50/50 gap-3">
                <div className="flex justify-between items-center w-full">
                  <h2 className="font-semibold text-slate-700 flex items-center gap-2"><Layout className="w-4 h-4" /> Main Task</h2>
                  <div className="flex items-center gap-1.5">
                    {currentUser && <button onClick={openNewTaskModal} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>}
                    <button onClick={() => setIsSidebarCollapsed(true)} className="hidden md:block text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-colors" title="Sembunyikan Sidebar">
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 w-full">
                  {[
                    { label: 'SUBMITTED', display: 'NEW ENTRY', colorClass: 'text-blue-700 bg-blue-50 border-blue-200', activeClass: 'bg-blue-600 text-white border-blue-600' },
                    { label: 'REVIEW', display: 'REVIEW', colorClass: 'text-yellow-700 bg-yellow-50 border-yellow-200', activeClass: 'bg-yellow-500 text-white border-yellow-500' },
                    { label: 'REVISE', display: 'REVISE', colorClass: 'text-red-700 bg-red-50 border-red-200', activeClass: 'bg-red-500 text-white border-red-500' },
                    { label: 'COMPLETED', display: 'COMPLETED', colorClass: 'text-green-700 bg-green-50 border-green-200', activeClass: 'bg-green-500 text-white border-green-500' }
                  ].map(stat => {
                    const count = tasks.filter(t => getProjectStatus(t).label === stat.label).length;
                    const isActive = maintaskFilter === stat.label;
                    return (
                      <button
                        key={stat.label}
                        onClick={() => setMaintaskFilter(isActive ? null : stat.label)}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-md border text-[9px] font-bold transition-all shadow-sm ${isActive ? stat.activeClass : stat.colorClass + ' hover:opacity-80'}`}
                      >
                        <span className="truncate w-full text-center">{stat.display}</span>
                        <span>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {tasks.filter(t => !maintaskFilter || getProjectStatus(t).label === maintaskFilter).map((task) => {
                  const status = getProjectStatus(task);
                  const latestUpdate = getLatestProjectUpdate(task);
                  const deadlineBadge = getTaskDeadlineBadge(task.deadline);
                  return (
                    <div key={task.id} onClick={() => handleTaskClick(task.id)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative ${selectedTaskId === task.id ? `${status.color} ${status.ring} ring-1 shadow-sm` : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.badge}`}>{status.label}</span><span className={`text-[10px] font-semibold ${deadlineBadge.className}`}>{deadlineBadge.label}</span></div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Users className="w-3 h-3" /><span className="truncate font-medium">{task.pic}</span></div>
                      <h3 className={`font-bold text-sm mb-1 line-clamp-2 ${status.text}`}>{task.title}</h3>
                      <div className="mt-3">
                        <div className="flex items-center gap-2 w-full"><div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${status.label === 'COMPLETED' ? 'bg-green-500' : status.label === 'REVISE' ? 'bg-red-500' : status.label === 'REVIEW' ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${task.progress}%` }}></div></div><span className="text-xs font-bold text-slate-600">{task.progress}%</span></div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 justify-end"><History className="w-3 h-3" /><span>Update: {latestUpdate}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
            <main className={`flex-1 bg-slate-50 flex-col h-full overflow-hidden ${showMobileDetail ? 'flex' : 'hidden md:flex'}`}>
              {activeTask ? (
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  <div className="md:hidden mb-4"><button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-slate-600 font-medium hover:text-blue-600 transition-colors p-2 -ml-2 rounded-lg active:bg-slate-200"><ArrowLeft className="w-5 h-5" />Kembali ke List</button></div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                          {isSidebarCollapsed && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className="hidden md:flex items-center gap-1 p-1 hover:bg-slate-100 hover:text-blue-600 rounded text-slate-400 transition-colors mr-1" title="Tampilkan Sidebar">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <Briefcase className="w-4 h-4" /><span>Task Detail</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 pr-4">{activeTask.title}</h2>
                          {isActiveTaskOwnerPic && (
                            <div className={`items-center gap-2 mb-2 flex-shrink-0 ${isMainTaskDetailExpanded ? 'flex' : 'hidden md:flex'}`}>
                              <button onClick={() => openEventModal({ linkedTaskId: activeTask.id, title: activeTask.title })} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Jadwalkan Event Terkait">
                                <CalendarDays className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditMainTask(activeTask)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Main Task">
                                <PenSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMainTask(activeTask.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Main Task">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={isMainTaskDetailExpanded ? 'block mt-2' : 'hidden md:block mt-2'}>
                          <p className="text-slate-600 mb-4 text-sm md:text-base">{activeTask.description}</p>
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm">
                          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-start gap-2">
                            <UserAvatar name={activeTask.pic} photoURL={userByName.get(activeTask.pic)?.photoURL} className="w-5 h-5 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">PIC:</span>
                              <span className="font-semibold text-slate-900">{activeTask.pic}</span>
                            </div>
                          </div>
                          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Deadline:</span>
                              <span className="font-semibold text-slate-900">{formatDateIndo(activeTask.deadline)}</span>
                            </div>
                          </div>
                          {(() => {
                            const relatedEvent = eventByLinkedTaskId.get(activeTask.id) || eventByTitle.get(activeTask.title);
                            if (!relatedEvent) return null;
                            return (
                              <div
                                onClick={() => {
                                  openCoeCalendarForEvent(relatedEvent, activeTask.deadline);
                                }}
                                className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg flex gap-2 text-blue-800 items-start cursor-pointer hover:bg-blue-100 transition-all"
                                title="Lihat di Calendar Of Event"
                              >
                                <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">Event:</span>
                                  <span className="font-semibold text-sm">{activeTask.title}</span>
                                  <span className="text-xs text-blue-600 font-medium">{(() => {
                                    let dateDisplay = formatDateIndo(activeTask.deadline);
                                    const formatDmy = (dateStr) => {
                                      if (!dateStr) return "";
                                      const [y, m, d] = dateStr.split('-');
                                      return `${d}/${m}/${y}`;
                                    };
                                    if (relatedEvent) {
                                      dateDisplay = `${formatDmy(relatedEvent.startDate)}${relatedEvent.endDate && relatedEvent.endDate !== relatedEvent.startDate ? ` - ${formatDmy(relatedEvent.endDate)}` : ''}`;
                                    }
                                    return dateDisplay;
                                  })()}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" /><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * activeTask.progress) / 100} strokeLinecap="round" className={`transition-all duration-700 ease-out ${activeTask.progress === 100 ? 'text-green-500' : 'text-blue-600'}`} /></svg><span className="absolute text-base md:text-lg font-bold text-slate-700">{activeTask.progress}%</span></div><span className="text-xs text-slate-400 mt-1">Progress</span>
                      </div>
                    </div>
                    <div className="md:hidden flex justify-end mt-4 pt-4 border-t border-slate-100">
                      <button 
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs" 
                        onClick={() => setIsMainTaskDetailExpanded(!isMainTaskDetailExpanded)}
                      >
                        <span className="font-bold uppercase">{isMainTaskDetailExpanded ? 'Sembunyikan' : 'Selengkapnya'}</span> 
                        {isMainTaskDetailExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded flex items-center justify-center text-xs">{activeTask.subtasks.length}</span>Subtasks</h3>{canManageActiveTaskSubtasks && <button onClick={openAddSubtaskModal} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition-colors"><Plus className="w-3 h-3" /> Tambah</button>}</div>
                    <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg self-start md:self-auto"><button onClick={() => setViewMode('list')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-3.5 h-3.5" /> List</button><button onClick={() => setViewMode('gantt')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'gantt' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BarChart2 className="w-3.5 h-3.5" /> Gantt</button><button onClick={() => setViewMode('log')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'log' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><History className="w-3.5 h-3.5" /> Log</button></div>
                  </div>
                  {viewMode === 'list' ? (
                    <div className="space-y-3 pb-8">
                      {activeTask.subtasks.length === 0 ? <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400"><p className="text-sm">Belum ada subtask.</p></div> : (
                        [...activeTask.subtasks].sort((a, b) => {
                          const statusOrder = { 'revision': 1, 'waiting_review': 2, 'pending': 3, 'completed': 4 };
                          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                        }).map((subtask) => {
                          const isExpanded = expandedSubtasks[subtask.id] ?? false;
                          const evidenceEntries = getNormalizedEvidenceEntries(subtask);
                          const commentEntries = Array.isArray(subtask.comments) ? subtask.comments : [];
                          const hasSubtaskHistory = evidenceEntries.length > 0 || commentEntries.length > 0;
                          const approvedEvidenceKeySet = new Set(getApprovedEvidenceKeys(subtask));
                          return (
                            <div key={subtask.id} className={`bg-white rounded-xl border transition-all hover:shadow-sm group ${subtask.status === 'completed' ? 'border-green-200 bg-green-50/30' : subtask.status === 'revision' ? 'border-red-200 bg-red-50/30' : subtask.status === 'waiting_review' ? 'border-yellow-200 bg-yellow-50/30' : 'border-slate-200'}`}>
                              {/* Header - Clickable to Expand/Collapse */}
                              <div
                                onClick={() => toggleSubtask(subtask.id)}
                                className="p-4 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {subtask.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {subtask.status === 'waiting_review' && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
                                    {subtask.status === 'revision' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                    {subtask.status === 'pending' && <Circle className="w-5 h-5 text-slate-300" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-base break-words ${subtask.status === 'completed' ? 'text-slate-500' : 'text-slate-800'}`}>
                                      {subtask.title}
                                      {!isExpanded && <span className="font-normal text-slate-500 text-sm ml-1">- {subtask.assignee}</span>}
                                    </h4>
                                    {subtask.description && (
                                      <p className="mt-1 text-sm text-slate-500 whitespace-pre-wrap break-words font-normal leading-relaxed">
                                        {subtask.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-2 text-slate-400">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                              </div>

                              {/* Body - Collapsible Details */}
                              {isExpanded && (
                                <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-slate-100/50 pt-3 md:pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 w-full min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded">
                                          <UserAvatar name={subtask.assignee} photoURL={userByName.get(subtask.assignee)?.photoURL} className="w-4 h-4" />
                                          <span className="text-xs text-slate-600">{subtask.assignee}</span>
                                        </div>
                                        {subtask.deadline && (
                                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {formatDateIndo(subtask.deadline)}
                                          </span>
                                        )}
                                      </div>

                                        {hasSubtaskHistory && (
                                          <div className={`mt-3 border rounded-lg p-3 flex gap-3 shadow-sm text-sm ${subtask.status === 'revision' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                            <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${subtask.status === 'revision' ? 'text-red-500' : 'text-slate-500'}`} />
                                            <div className="min-w-0 flex-1">
                                              {evidenceEntries.length > 0 && (
                                                <>
                                                  <p className="font-semibold text-slate-700 mb-1">Bukti / Lampiran:</p>
                                                  <div className="space-y-1.5 mb-2">
                                                    {evidenceEntries.map((entry, idx) => {
                                                      const isApproved = approvedEvidenceKeySet.has(entry.key);
                                                      return (
                                                        <div key={entry.key} className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${isApproved ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                                          {entry.isLink ? <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />}
                                                          <a href={entry.url || '#'} target={entry.url ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full">
                                                            {idx + 1}. {entry.label}
                                                          </a>
                                                          {isApproved && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </>
                                              )}
                                            {commentEntries.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-2">
                                                {commentEntries.map((comment, idx) => (
                                                  <div key={idx} className="flex items-start gap-2">
                                                    <UserAvatar name={comment.user} photoURL={userByName.get(comment.user)?.photoURL} className="w-5 h-5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                      <div className="flex justify-between items-baseline">
                                                        <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                                      </div>
                                                      <p className={`text-xs ${comment.type === 'revision' ? 'text-red-600' : 'text-slate-600'}`}>{comment.text}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}


                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto md:min-w-[140px] mt-2 md:mt-0">
                                      {(subtask.status === 'pending' || subtask.status === 'revision') && (userRole === 'Assignee' || userRole === 'PIC') && subtask.assignee === currentUser.name && (
                                        <button onClick={() => openEvidenceModal(activeTask, subtask)} className={`flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-full ${subtask.status === 'revision' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                          <Upload className="w-4 h-4" /> {subtask.status === 'revision' ? 'Perbaiki' : 'Lapor'}
                                        </button>
                                      )}
                                      {subtask.status === 'waiting_review' && userRole === 'PIC' && (
                                        <div className="flex gap-2 w-full">
                                          {activeTask.pic === currentUser.name ? (
                                            <>
                                              <button onClick={() => handleOpenUserTaskDetail({ ...subtask, parentId: activeTask.id, parentTitle: activeTask.title, parentPic: activeTask.pic })} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm">
                                                <Check className="w-3 h-3" /> Review
                                              </button>
                                              <button onClick={() => openReviseModal(activeTask, subtask)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm">
                                                <AlertCircle className="w-3 h-3" /> Revise
                                              </button>
                                            </>
                                          ) : (
                                            <div className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 text-center w-full">Menunggu PIC Main Task</div>
                                          )}
                                        </div>
                                      )}
                                      {subtask.status === 'waiting_review' && userRole === 'Assignee' && <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200 text-center w-full">Reviewing</div>}
                                      {subtask.status === 'waiting_review' && userRole === 'PIC' && <div className="text-xs text-slate-400 text-center w-full mb-1">Butuh Approval</div>}
                                      {subtask.status === 'revision' && userRole === 'PIC' && <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 text-center w-full">Revisi Assignee</div>}
                                      {subtask.status === 'completed' && <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 text-center w-full">Verified</div>}

                                      {canManageActiveTaskSubtasks && (
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full justify-end">
                                          <button onClick={(e) => { e.stopPropagation(); openEditSubtaskModal(subtask); }} className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded">
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); deleteSubtask(subtask.id); }} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : viewMode === 'gantt' ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 overflow-hidden relative">
                      {ganttData ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setShowGanttFilters((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                Filter
                                {showGanttFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {showGanttFilters && (
                              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {[
                                    { id: '2w', label: '2 Minggu' },
                                    { id: '1m', label: '1 Bulan' },
                                    { id: '3m', label: '3 Bulan' },
                                    { id: 'fit', label: 'Fit' },
                                  ].map((preset) => (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => applyGanttPreset(preset.id)}
                                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${ganttRangePreset === preset.id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                  <select
                                    value={ganttZoomLevel}
                                    onChange={(e) => setGanttZoomLevel(e.target.value)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-300"
                                  >
                                    <option value="day">Hari</option>
                                    <option value="week">Minggu</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const nextStart = ganttZoomLevel === 'week' ? addDays(today, -14) : addDays(today, -7);
                                      const nextEnd = ganttZoomLevel === 'week' ? addDays(today, 35) : addDays(today, 7);
                                      setGanttRangePreset('custom');
                                      setGanttRangeStart(toDateInputValue(nextStart));
                                      setGanttRangeEnd(toDateInputValue(nextEnd));
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                                  >
                                    Today
                                  </button>
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                      checked={ganttShowCompleted}
                                      onChange={(e) => setGanttShowCompleted(e.target.checked)}
                                    />
                                    Show Completed
                                  </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <span>From</span>
                                    <input
                                      type="date"
                                      value={ganttRangeStart}
                                      onChange={(e) => {
                                        setGanttRangePreset('custom');
                                        setGanttRangeStart(e.target.value);
                                      }}
                                      className="bg-transparent text-slate-600 outline-none"
                                    />
                                  </label>
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <span>To</span>
                                    <input
                                      type="date"
                                      value={ganttRangeEnd}
                                      onChange={(e) => {
                                        setGanttRangePreset('custom');
                                        setGanttRangeEnd(e.target.value);
                                      }}
                                      className="bg-transparent text-slate-600 outline-none"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            <span>{ganttData.subtasks.length} subtask terlihat</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'completed').length} completed</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'waiting_review').length} review</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'revision').length} revise</span>
                          </div>

                          <div className="overflow-x-auto relative">
                            <div className="min-w-[920px] relative">
                              <div className="sticky top-0 z-20 bg-white">
                                <div className="flex border-b border-slate-200">
                                  <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    Subtask
                                  </div>
                                  <div className="flex-1">
                                    <div className="grid" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment, index) => {
                                        const monthLabel = segment.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                                        const prevMonthLabel = index > 0 ? ganttData.segments[index - 1].toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : null;
                                        return (
                                          <div key={`month-${segment.toISOString()}`} className={`border-l border-slate-100 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${monthLabel !== prevMonthLabel ? 'bg-slate-50/70' : 'bg-white'}`}>
                                            {monthLabel !== prevMonthLabel ? monthLabel : ''}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="grid border-t border-slate-100" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment) => {
                                        const isWeekend = ganttData.zoomLevel === 'day' && [0, 6].includes(segment.getDay());
                                        return (
                                          <div key={segment.toISOString()} className={`border-l border-slate-100 px-2 py-2 text-center text-[10px] font-medium text-slate-500 ${isWeekend ? 'bg-red-50/40' : 'bg-white'}`}>
                                            {formatTimelineLabel(segment, ganttData.zoomLevel)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                {(ganttData.todayPlacement || ganttData.mainTaskDeadlinePlacement) && (
                                  <div className="pointer-events-none absolute bottom-0 top-0 left-56 right-0 z-10">
                                    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment, index) => (
                                        <div key={`marker-${segment.toISOString()}`} className="relative h-full">
                                          {ganttData.todayPlacement && ganttData.todayPlacement.segmentIndex === index && (
                                            <div
                                              className="absolute bottom-0 top-0 w-0.5 bg-blue-500/90"
                                              style={{ left: `calc(${ganttData.todayPlacement.offsetPercent}% - 1px)` }}
                                            />
                                          )}
                                          {ganttData.mainTaskDeadlinePlacement && ganttData.mainTaskDeadlinePlacement.segmentIndex === index && (
                                            <div
                                              className="absolute bottom-0 top-0 w-0.5 bg-red-500/90"
                                              style={{ left: `calc(${ganttData.mainTaskDeadlinePlacement.offsetPercent}% - 1px)` }}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="divide-y divide-slate-100 border-b border-slate-200">
                                  {ganttData.subtasks.map((sub) => {
                                    const subStartDate = parseDateValue(sub.startDate) || addDays(sub.deadlineDate, -3);
                                    const clampedStartDate = subStartDate < ganttData.start ? ganttData.start : subStartDate;
                                    const clampedEndDate = sub.deadlineDate > ganttData.end ? ganttData.end : sub.deadlineDate;
                                    const startPercent = getTimelinePercent(clampedStartDate, ganttData.start, ganttData.segments, ganttData.zoomLevel, 'start');
                                    const endPercent = getTimelinePercent(clampedEndDate, ganttData.start, ganttData.segments, ganttData.zoomLevel, 'end');
                                    const widthPercent = Math.max(endPercent - startPercent, ganttData.zoomLevel === 'week' ? 7 : 3.2);
                                    let barColor = 'bg-blue-500';
                                    if (sub.status === 'completed') barColor = 'bg-green-500';
                                    if (sub.status === 'revision') barColor = 'bg-red-500';
                                    if (sub.status === 'waiting_review') barColor = 'bg-amber-500';

                                    return (
                                      <div key={sub.id} className="flex min-h-[54px] bg-white transition-colors hover:bg-slate-50/70">
                                        <div className="w-56 flex-shrink-0 border-r border-slate-200 px-4 py-3">
                                          <p
                                            className="truncate text-sm font-medium text-slate-700"
                                            title={sub.title}
                                            onMouseEnter={(event) => handleGanttTooltipMove(event, sub)}
                                            onMouseMove={(event) => handleGanttTooltipMove(event, sub)}
                                            onMouseLeave={() => setGanttTooltip(null)}
                                          >
                                            {sub.title}
                                          </p>
                                        </div>
                                        <div className="relative flex-1">
                                          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                            {ganttData.segments.map((segment) => {
                                              const isWeekend = ganttData.zoomLevel === 'day' && [0, 6].includes(segment.getDay());
                                              return <div key={`grid-${sub.id}-${segment.toISOString()}`} className={`border-l border-slate-100 ${isWeekend ? 'bg-red-50/30' : 'bg-transparent'}`} />;
                                            })}
                                          </div>
                                          <div className="absolute inset-y-0 left-0 right-0">
                                            <button
                                              type="button"
                                              className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-full ${barColor} shadow-sm transition hover:opacity-90`}
                                              style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                              onClick={() => handleOpenUserTaskDetail({ ...sub, parentId: activeTask.id, parentTitle: activeTask.title })}
                                              onMouseEnter={(event) => handleGanttTooltipMove(event, sub)}
                                              onMouseMove={(event) => handleGanttTooltipMove(event, sub)}
                                              onMouseLeave={() => setGanttTooltip(null)}
                                              aria-label={sub.title}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-end gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Completed</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Review</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Revise</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Ready</span>
                                <span className="flex items-center gap-2"><span className="h-4 w-px bg-blue-400" /> Today</span>
                                <span className="flex items-center gap-2"><span className="h-4 w-px bg-red-400" /> Main deadline</span>
                              </div>
                            </div>
                          </div>

                          {ganttTooltip && (
                            <div
                              className="pointer-events-none fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                              style={{
                                left: `${Math.min(ganttTooltip.x, window.innerWidth - 280)}px`,
                                top: `${Math.min(ganttTooltip.y, window.innerHeight - 140)}px`,
                              }}
                            >
                              <p className="text-sm font-semibold text-slate-900">{ganttTooltip.subtask.title}</p>
                              <div className="mt-2 space-y-1.5 text-xs text-slate-500">
                                <p><span className="font-semibold text-slate-700">Assignee:</span> {ganttTooltip.subtask.assignee}</p>
                                <p><span className="font-semibold text-slate-700">Status:</span> {getGanttStatusLabel(ganttTooltip.subtask.status)}</p>
                                <p><span className="font-semibold text-slate-700">Deadline:</span> {formatDateIndo(ganttTooltip.subtask.deadline)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm"><BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" />Tidak ada data deadline untuk ditampilkan di Gantt Chart.</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 pb-8">
                      {activeTaskActivityLog.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Belum ada aktivitas tercatat untuk project ini.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {activeTaskActivityLog.map((group) => (
                            <div key={group.key}>
                              {/* Header tanggal per grup */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                                  <Calendar className="w-3 h-3" /> {group.label}
                                </span>
                                <div className="flex-1 h-px bg-slate-100" />
                              </div>
                              {/* Timeline: garis vertikal di kiri, entri di kanan */}
                              <div className="relative pl-9 md:pl-10 space-y-4">
                                <div className="absolute left-4 md:left-[18px] top-1 bottom-1 w-px bg-slate-200" aria-hidden="true" />
                                {group.entries.map((entry) => {
                                  const meta = ACTIVITY_LOG_ACTION_META[entry.action] || ACTIVITY_LOG_ACTION_META.default;
                                  const ActionIcon = meta.icon;
                                  const actorUser = userByName.get(entry.actorName);
                                  return (
                                    <div key={entry.id} className="relative">
                                      {/* Node ikon menempel di garis */}
                                      <div className={`absolute -left-9 md:-left-10 top-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${meta.iconBg}`}>
                                        <ActionIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${meta.iconColor}`} />
                                      </div>
                                      {/* Kartu log */}
                                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-start gap-2 min-w-0">
                                            <UserAvatar name={entry.actorName} photoURL={actorUser?.photoURL} className="w-5 h-5 md:w-6 md:h-6 mt-0.5" />
                                            <p className="text-xs md:text-sm text-slate-600 leading-snug min-w-0 break-words">
                                              <span className="font-semibold text-slate-800">{entry.actorName}</span>{' '}{meta.sentence}
                                              {entry.subtaskTitle && <> <span className="font-semibold text-slate-800">"{entry.subtaskTitle}"</span></>}
                                            </p>
                                          </div>
                                          <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap"><Clock className="w-3 h-3" />{formatLogTimeLabel(entry.createdAt)}</span>
                                        </div>
                                        {entry.message && (
                                          <p className="mt-1.5 text-xs md:text-sm text-slate-500 whitespace-pre-wrap break-words italic">"{entry.message}"</p>
                                        )}
                                        {entry.documents.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            {entry.documents.map((doc, docIndex) => {
                                              const chipClass = "inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 text-[11px] md:text-xs px-2 py-1 rounded-md max-w-full md:max-w-[240px]";
                                              const docIcon = doc.isLink ? <ExternalLink className="w-3 h-3 flex-shrink-0 text-blue-500" /> : <FileText className="w-3 h-3 flex-shrink-0 text-indigo-500" />;
                                              return doc.url ? (
                                                <a key={`${entry.id}-doc-${docIndex}`} href={doc.url} target="_blank" rel="noopener noreferrer" className={`${chipClass} hover:border-blue-300 hover:text-blue-600 transition-colors`}>
                                                  {docIcon}<span className="truncate">{doc.name || doc.url}</span>
                                                </a>
                                              ) : (
                                                <span key={`${entry.id}-doc-${docIndex}`} className={chipClass}>{docIcon}<span className="truncate">{doc.name}</span></span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  {isSidebarCollapsed && (
                    <button onClick={() => setIsSidebarCollapsed(false)} className="absolute top-4 left-4 hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 text-xs font-semibold rounded-lg shadow-sm transition-all" title="Tampilkan Sidebar">
                      <ChevronRight className="w-4 h-4" /> Tampilkan List Project
                    </button>
                  )}
                  <Briefcase className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Pilih project untuk melihat detail</p>
                </div>
              )}
            </main>
          </>
        )}

        {activePage === 'user-task' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <UserTaskPage
              userTaskSearch={userTaskSearch}
              setUserTaskSearch={setUserTaskSearch}
              filteredUserTasks={filteredUserTasks}
              currentUser={currentUser}
              handleOpenUserTaskDetail={handleOpenUserTaskDetail}
              formatDateIndo={formatDateIndo}
              users={users}
              UserAvatar={UserAvatar}
            />
          </Suspense>
        )}

        {activePage === 'file' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <FilePage fileSearch={fileSearch} setFileSearch={setFileSearch} tasks={tasks} getFileMeta={getFileMeta} getApprovedEvidenceEntries={getApprovedEvidenceEntries} />
          </Suspense>
        )}

        {activePage === 'dashboard' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <DashboardPage dashboardStats={dashboardStats} tasks={tasks} DonutChart={DonutChart} UserAvatar={UserAvatar} />
          </Suspense>
        )}

        {activePage === 'manage-user' && userRole === 'PIC' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <ManageUserPage users={users} UserAvatar={UserAvatar} handleOpenUserDetail={handleOpenUserDetail} toggleUserStatus={toggleUserStatus} setShowAddUserModal={setShowAddUserModal} />
          </Suspense>
        )}

        {/* KPI MASTER PAGE */}
        {activePage === 'kpi' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <KpiPage KPI_GROUPS={KPI_GROUPS} kpisByGroup={kpisByGroup} expandedKPIGroups={expandedKPIGroups} toggleKPIGroup={toggleKPIGroup} openKPIModal={openKPIModal} handleDeleteKPI={handleDeleteKPI} />
          </Suspense>
        )}

        {/* COE PAGE */}
        {activePage === 'coe' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <CoePage
              coeViewMode={coeViewMode}
              setCoeViewMode={setCoeViewMode}
              userRole={userRole}
              openEventModal={openEventModal}
              openInternalEventTaskModal={openInternalEventTaskModal}
              events={events}
              eventsSorted={eventsSorted}
              tasks={tasks}
              formatDateIndo={formatDateIndo}
              UserAvatar={UserAvatar}
              currentCalendarDate={currentCalendarDate}
              selectedCalendarDates={selectedCalendarDates}
              monthNames={monthNames}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              setSelectedCalendarDates={setSelectedCalendarDates}
              getFirstDayOfMonth={getFirstDayOfMonth}
              getDaysInMonth={getDaysInMonth}
              calendarEventsByDate={calendarEventsByDate}
              holidaysByDate={holidaysByDate}
              handleOpenEventDetail={handleOpenEventDetail}
              handleDeleteEvent={handleDeleteEvent}
              setSelectedTaskId={setSelectedTaskId}
              navigateTo={navigateTo}
              openCoeCalendarForEvent={openCoeCalendarForEvent}
            />
          </Suspense>
        )}

        {/* TEMPLATE TASK PAGE */}
        {activePage === 'template-task' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <TemplateTaskPage taskTemplates={taskTemplates} openTemplateModal={openTemplateModal} handleDeleteTemplate={handleDeleteTemplate} />
          </Suspense>
        )}

      </div>

      {
        showUserTaskDetailModal && selectedSubtask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{selectedSubtask.title}</h3>
                  {selectedSubtask.description && <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{selectedSubtask.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <button onClick={() => { setSelectedTaskId(selectedSubtask.parentId); setActivePage('jobtask'); setShowMobileDetail(true); setExpandedSubtasks({ [selectedSubtask.id]: true }); setShowUserTaskDetailModal(false); }} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium"><Briefcase className="w-3 h-3" /> Parent Project: {selectedSubtask.parentTitle}</button>
                  </div>
                </div>
                <button onClick={() => setShowUserTaskDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Deadline</p><p className="text-sm font-medium text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {selectedSubtask.deadline || "-"}</p></div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Status</p><div className="text-sm font-medium">{selectedSubtask.status === 'completed' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Completed</span>}{selectedSubtask.status === 'waiting_review' && <span className="text-yellow-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Waiting Review</span>}{selectedSubtask.status === 'revision' && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Revision Needed</span>}{selectedSubtask.status === 'pending' && <span className="text-slate-600 flex items-center gap-1"><Circle className="w-4 h-4" /> Pending</span>}</div></div>
                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Assignee</p><p className="text-sm font-medium text-slate-800 flex items-center gap-2"><UserAvatar name={selectedSubtask.assignee} photoURL={userByName.get(selectedSubtask.assignee)?.photoURL} className="w-5 h-5" />{selectedSubtask.assignee}</p></div>
                </div>
                {(getNormalizedEvidenceEntries(selectedSubtask).length > 0 || (selectedSubtask.comments && selectedSubtask.comments.length > 0)) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Riwayat Bukti & Catatan</h4>
                    <div className={`border rounded-lg p-3 text-sm ${selectedSubtask.status === 'revision' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-start gap-3">
                        <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedSubtask.status === 'revision' ? 'text-red-500' : 'text-slate-500'}`} />
                        <div className="w-full relative pr-2">
                          {getNormalizedEvidenceEntries(selectedSubtask).length > 0 && (
                            <>
                              <p className="font-semibold text-slate-800 mb-2">Bukti Terlampir:</p>
                              <div className="space-y-1.5 mb-3">
                                {getNormalizedEvidenceEntries(selectedSubtask).map((entry, idx) => {
                                  const isApproved = new Set(getApprovedEvidenceKeys(selectedSubtask)).has(entry.key);
                                  return (
                                    <div key={entry.key} className={`rounded p-2 shadow-sm flex items-center gap-2 border ${isApproved ? 'bg-emerald-50 border-emerald-200' : entry.isLink ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                                      {entry.isLink ? <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                                      <a href={entry.url || '#'} target={entry.url ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full text-sm font-medium" title={entry.label}>
                                        {idx + 1}. {entry.label}
                                      </a>
                                      {isApproved && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          {selectedSubtask.comments && selectedSubtask.comments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-3">
                              {selectedSubtask.comments.map((comment, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <UserAvatar name={comment.user} photoURL={userByName.get(comment.user)?.photoURL} className="w-6 h-6 flex-shrink-0" />
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex-1 shadow-sm">
                                    <div className="flex justify-between items-baseline mb-1">
                                      <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                      <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                    </div>
                                    <p className={`text-xs ${comment.type === 'revision' ? 'text-red-600' : 'text-slate-600'}`}>{comment.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(userRole === 'Assignee' || userRole === 'PIC') && (selectedSubtask.status === 'pending' || selectedSubtask.status === 'revision') && selectedSubtask.assignee === currentUser.name && (
                  <div className="border-t border-slate-100 pt-5 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-600" /> Upload Pekerjaan & Komentar</h4>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-blue-50 hover:border-blue-400 transition-all group relative">
                        <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { if (e.target.files) handleEvidenceFileSelection(e.target.files); }} />
                        <div className="bg-blue-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5 text-blue-500" /></div>
                        <span className="text-xs font-medium text-slate-600 mb-1">Klik atau Drop file di sini</span>
                        <span className="text-[10px] text-slate-400">Bisa pilih lebih dari 1 file</span>
                      </div>
                      
                      {/* Tampilkan Daftar File Terpilih */}
                      {evidenceFiles.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg space-y-2">
                             <p className="text-xs font-bold text-blue-800">File Terpilih ({evidenceFiles.length}):</p>
                             {evidenceFiles.map((f, i) => (
                                <div key={i} className="flex justify-between items-center text-sm bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                    <span className="text-slate-700 truncate w-3/4" title={f.name}>{f.name}</span>
                                    <button onClick={() => setEvidenceFiles(evidenceFiles.filter((_, idx)=>idx!==i))} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><X className="w-3 h-3" /></button>
                                </div>
                             ))}
                          </div>
                      )}

                      <div><label className="block text-xs font-medium text-slate-700 mb-1">Tautan Bukti (URL)</label>
                           <input type="url" className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" placeholder="https://..." value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
                      </div>
                      
                      <div><label className="block text-xs font-medium text-slate-700 mb-1">Catatan / Komentar (Opsional)</label><textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" rows="3" placeholder="Tuliskan detail pengerjaan..." value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)}></textarea></div>
                    </div>
                  </div>
                )}
                {userRole === 'PIC' && selectedSubtask.status === 'waiting_review' && selectedSubtask.parentPic === currentUser.name && getNormalizedEvidenceEntries(selectedSubtask).length > 0 && (
                  <div className="border-t border-slate-100 pt-5 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Pilih Evidence Yang Disetujui</h4>
                    <div className="space-y-2">
                      {getNormalizedEvidenceEntries(selectedSubtask).map((entry, idx) => {
                        const checked = approvalEvidenceSelection.includes(entry.key);
                        return (
                          <label key={entry.key} className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setApprovalEvidenceSelection((prev) => (
                                  e.target.checked
                                    ? [...prev, entry.key]
                                    : prev.filter((key) => key !== entry.key)
                                ));
                              }}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-700">{idx + 1}. {entry.label}</p>
                              <p className="text-xs text-slate-400">{entry.isLink ? 'Link evidence' : 'File evidence'}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Evidence yang dipilih akan diberi tanda centang di subtask dan hanya evidence itu yang muncul di halaman File.</p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
                <button onClick={() => setShowUserTaskDetailModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg hover:bg-white transition-colors">Tutup</button>
                {(userRole === 'Assignee' || userRole === 'PIC') && (selectedSubtask.status === 'pending' || selectedSubtask.status === 'revision') && selectedSubtask.assignee === currentUser.name && <button onClick={submitEvidence} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"><Save className="w-4 h-4" /> Simpan & Kirim</button>}
                {userRole === 'PIC' && selectedSubtask.status === 'waiting_review' && selectedSubtask.parentPic === currentUser.name && (
                  <>
                    <button onClick={() => { openReviseModal({ id: selectedSubtask.parentId, title: selectedSubtask.parentTitle, pic: selectedSubtask.parentPic }, selectedSubtask); setShowUserTaskDetailModal(false); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"><AlertCircle className="w-4 h-4" /> Revise</button>
                    <button
                      onClick={async () => {
                        const approved = await approveSubtask(selectedSubtask.id, selectedSubtask.parentId, approvalEvidenceSelection);
                        if (approved) {
                          setShowUserTaskDetailModal(false);
                        }
                      }}
                      disabled={approvalEvidenceSelection.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        showEvidenceModal && selectedSubtask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between sticky top-0 z-10"><h3 className="font-bold text-slate-800">{selectedSubtask.status === 'revision' ? 'Perbaiki Laporan' : 'Lapor Pekerjaan Selesai'}</h3><button onClick={() => setShowEvidenceModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">
                
                <label className={`block border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${evidenceFiles.length > 0 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 text-slate-500 hover:bg-blue-50 hover:border-blue-400'}`}>
                  <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files) handleEvidenceFileSelection(e.target.files); }} />
                  {evidenceFiles.length > 0 ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
                      <span className="text-sm font-medium text-emerald-700">{evidenceFiles.length} File Terpilih</span>
                      <span className="text-xs text-slate-400 mt-1">Klik untuk mengganti</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-blue-500 mb-2" />
                      <span className="text-sm">Klik upload dokumen / file</span>
                      <span className="text-xs text-slate-400 mt-1">Bisa pilih multiple file</span>
                    </>
                  )}
                </label>
                
                {evidenceFiles.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                        {evidenceFiles.map((f, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-white px-2 py-1.5 rounded shadow-sm border border-slate-100">
                                <span className="text-slate-700 truncate min-w-0" title={f.name}>{f.name}</span>
                                <button onClick={() => setEvidenceFiles(evidenceFiles.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link URL (Opsional)</label>
                   <input type="url" className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Contoh: https://drive.google.com/..." value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan</label>
                   <textarea className="w-full border p-3 rounded-lg text-sm bg-white" rows="2" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} placeholder="Tulis catatan pendek (opsional)"></textarea>
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0">
                <button onClick={() => { setShowEvidenceModal(false); setEvidenceFiles([]); setEvidenceLink(""); setEvidenceText(""); }} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Batal</button>
                <button onClick={submitEvidence} disabled={evidenceUploading || (evidenceFiles.length === 0 && !evidenceText && !evidenceLink)} className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${evidenceUploading || (evidenceFiles.length === 0 && !evidenceText && !evidenceLink) ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
                  {evidenceUploading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : 'Kirim Laporan'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showReviseModal && subtaskToRevise && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center"><h3 className="font-bold text-red-800 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Revisi Pekerjaan</h3><button onClick={() => setShowReviseModal(false)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Berikan catatan perbaikan untuk subtask: <br /><span className="font-semibold text-slate-800">{subtaskToRevise.title}</span></p>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Komentar Revisi</label><textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" rows="4" placeholder="Contoh: Bukti buram, tolong upload ulang dengan resolusi tinggi..." value={reviseComment} onChange={(e) => setReviseComment(e.target.value)}></textarea></div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-200"><button onClick={() => setShowReviseModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100">Cancel</button><button onClick={handleSendRevision} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm">Send</button></div>
            </div>
          </div>
        )
      }

      {
        showNewTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-4 border-b flex justify-between sticky top-0 z-10"><h3 className="font-bold">{editingMainTaskId ? 'Edit Project' : 'Buat Project Baru'}</h3><button onClick={() => setShowNewTaskModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nama Project" />
                <textarea className="w-full border p-2 rounded-lg text-sm" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Deskripsi"></textarea>

                {/* Template Subtask Dropdown - only show for new tasks */}
                {!editingMainTaskId && taskTemplates.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Template Subtask (Opsional)</label>
                    <select className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                      <option value="">-- Tanpa Template --</option>
                      {taskTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subtasks.length} subtasks)</option>
                      ))}
                    </select>
                    {selectedTemplateId && (() => {
                      const tpl = taskTemplates.find(t => t.id === Number(selectedTemplateId));
                      if (!tpl) return null;
                      return (
                        <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><Copy className="w-3 h-3" /> Preview Subtask dari Template:</p>
                          <div className="space-y-1">
                            {tpl.subtasks.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-blue-800">
                                <Circle className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                                <span>{s.title}</span>
                                {s.assignee && <span className="text-blue-500">• {s.assignee}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1 w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">PIC</label>
                    <select
                      className="w-full border p-2 rounded-lg text-sm bg-white"
                      value={newTaskPic}
                      onChange={(e) => setNewTaskPic(e.target.value)}
                    >
                      <option value="">-- Pilih PIC --</option>
                      {newTaskPic && !activePicUsers.some((user) => user.name === newTaskPic) && (
                        <option value={newTaskPic}>{newTaskPic}</option>
                      )}
                      {activePicUsers.map((user) => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Deadline</label>
                    <input type="date" className="w-full border p-2 rounded-lg text-sm" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={newTaskIsEvent} onChange={(e) => setNewTaskIsEvent(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-slate-700">Add to Event</span>
                  </label>

                  {newTaskIsEvent && (
                    <div className="p-3 bg-blue-50/50 rounded-lg mt-2 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-blue-800 mb-1">Event Start Date</label>
                          <input type="date" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventStartDate} onChange={(e) => setNewEventStartDate(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-blue-800 mb-1">Event End Date</label>
                          <input type="date" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventEndDate} onChange={(e) => setNewEventEndDate(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">Event Location</label>
                        <input type="text" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} placeholder="Masukkan lokasi event" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0"><button onClick={() => setShowNewTaskModal(false)} className="px-4 py-2 text-sm text-slate-600">Batal</button><button onClick={addNewTask} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Simpan</button></div>
            </div>
          </div>
        )
      }

      {
        showSubtaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between"><h3 className="font-bold">{editingSubtaskId ? 'Edit Subtask' : 'Tambah Subtask'}</h3><button onClick={() => setShowSubtaskModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4">
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormTitle} onChange={(e) => setSubtaskFormTitle(e.target.value)} placeholder="Nama Subtask" />
                <textarea className="w-full border p-2 rounded-lg text-sm" rows="3" value={subtaskFormDescription} onChange={(e) => setSubtaskFormDescription(e.target.value)} placeholder="Deskripsi Subtask (Opsional)"></textarea>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Assignee (Member)</label><select className="w-full border p-2 rounded-lg text-sm bg-white" value={subtaskFormAssignee} onChange={(e) => setSubtaskFormAssignee(e.target.value)}><option value="" disabled>-- Pilih Assignee --</option>{activeUsers.map(user => (<option key={user.id} value={user.name}>{user.name} ({user.role})</option>))}</select></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormStartDate} max={activeTask?.deadline || undefined} onChange={(e) => setSubtaskFormStartDate(e.target.value)} />
                  <p className="mt-1 text-[11px] text-slate-400">Kosongkan untuk default H-3 dari deadline subtask. Tidak boleh melewati deadline main task.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deadline</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormDeadline} max={activeTask?.deadline || undefined} onChange={(e) => { setSubtaskFormDeadline(e.target.value); if (!subtaskFormStartDate) { setSubtaskFormStartDate(getDefaultSubtaskStartDate(e.target.value)); } }} />
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowSubtaskModal(false)} disabled={isSavingSubtask} className="px-4 py-2 text-sm text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Batal</button><button onClick={saveSubtask} disabled={isSavingSubtask} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">{isSavingSubtask ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : 'Simpan'}</button></div>
            </div>
          </div>
        )
      }

      {
        showEditProfileModal && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b bg-slate-50 p-4">
                <div>
                  <h3 className="font-bold text-slate-800">Edit Profile</h3>
                  <p className="text-xs text-slate-500">Perbarui data pribadi, avatar, dan password akun Anda.</p>
                </div>
                <button type="button" onClick={closeEditProfileModal}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateOwnProfile();
                }}
              >
                <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Full Name</label>
                      <input type="text" value={profileForm.name} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Email Address</label>
                      <input type="email" value={profileForm.email} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Role</label>
                      <input type="text" value={profileForm.role} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Status</label>
                      <input type="text" value={profileForm.status} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Company</label>
                    <select
                      required
                      value={profileForm.company}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Department</label>
                      <input
                        type="text"
                        required
                        value={profileForm.department}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">No. Telephone (WhatsApp)</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]*"
                        value={profileForm.phone}
                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="081234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Photo Avatar</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'profile')}
                    />
                    {profileAvatarPreview ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={profileAvatarPreview} alt="Preview avatar profile" className="h-14 w-14 rounded-full border border-white object-cover shadow-sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{profileAvatarFile?.name}</p>
                          <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                        </div>
                      </div>
                    ) : profileForm.photoURL ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={profileForm.photoURL} alt="Avatar profile saat ini" className="h-14 w-14 rounded-full border border-white object-cover shadow-sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700">Avatar saat ini</p>
                          <p className="text-[11px] text-slate-400">Akan tetap dipakai jika tidak memilih file baru.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-800">Ganti Password</h4>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Kosongkan bagian ini jika tidak ingin mengganti password.</p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Password Saat Ini</label>
                        <input
                          type="password"
                          value={profilePasswordForm.currentPassword}
                          onChange={(e) => setProfilePasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Password Baru</label>
                          <input
                            type="password"
                            value={profilePasswordForm.newPassword}
                            onChange={(e) => setProfilePasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="new-password"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Konfirmasi Password</label>
                          <input
                            type="password"
                            value={profilePasswordForm.confirmPassword}
                            onChange={(e) => setProfilePasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t bg-slate-50 p-4">
                  <button type="button" onClick={closeEditProfileModal} disabled={isSavingProfile} className="rounded-lg px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Batal</button>
                  <button type="submit" disabled={isSavingProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">Add New User</h3><button onClick={() => setShowAddUserModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
                <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label><input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label><input type="email" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Company</label>
                    <select required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.company} onChange={(e) => setNewUserForm({ ...newUserForm, company: e.target.value })}>
                      {COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">No. Telephone (WhatsApp)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <input type="tel" required pattern="[0-9]*" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} className="w-full border border-slate-300 rounded-lg p-2 pl-9 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.phone} onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })} placeholder="081234567890" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Photo Avatar</label>
                    <input type="file" accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'new')} />
                    {newUserAvatarPreview ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={newUserAvatarPreview} alt="Preview avatar baru" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{newUserAvatarFile?.name}</p>
                          <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                    )}
                  </div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label><div className="relative"><input required type={showPassword ? "text" : "password"} className="w-full border border-slate-300 rounded-lg p-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} placeholder="Set login password" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><p className="mt-1 text-[11px] text-slate-400">Password hanya dipakai untuk membuat akun Firebase dan tidak disimpan di Firestore.</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Role</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label><input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.department} onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button type="button" onClick={() => setShowAddUserModal(false)} disabled={isSavingUser} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button><button type="submit" disabled={isSavingUser} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingUser ? 'Creating...' : 'Create User'}</button></div>
              </form>
            </div>
          </div>
        )
      }

      {
        showEditUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">Edit User</h3><button onClick={() => setShowEditUserModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label><input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label><input type="email" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Company</label>
                    <select required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.company} onChange={(e) => setEditUserForm({ ...editUserForm, company: e.target.value })}>
                      {COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">No. Telephone (WhatsApp)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <input type="tel" required pattern="[0-9]*" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} className="w-full border border-slate-300 rounded-lg p-2 pl-9 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.phone} onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })} placeholder="081234567890" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Photo Avatar</label>
                    <input type="file" accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'edit')} />
                    {editUserAvatarPreview ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={editUserAvatarPreview} alt="Preview avatar edit user" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{editUserAvatarFile?.name}</p>
                          <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                        </div>
                      </div>
                    ) : editUserForm.photoURL ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={editUserForm.photoURL} alt="Avatar user saat ini" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700">Avatar saat ini</p>
                          <p className="text-[11px] text-slate-400">Akan tetap dipakai jika tidak memilih file baru.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Role</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label><input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.department} onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button type="button" onClick={() => setShowEditUserModal(false)} disabled={isSavingUser} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button><button type="submit" disabled={isSavingUser} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingUser ? 'Saving...' : 'Save Changes'}</button></div>
              </form>
            </div>
          </div>
        )
      }

      {
        showUserDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center">
              <div className="bg-blue-600 h-28 w-full relative"><button onClick={() => setShowUserDetailModal(false)} className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button></div>
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-14 mb-4 flex justify-center"><div className="rounded-full p-1.5 bg-white shadow-lg"><UserAvatar name={selectedUser.name} photoURL={selectedUser.photoURL} size={128} className="w-24 h-24" /></div></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedUser.name}</h3><p className="text-slate-500 text-sm">{selectedUser.role} • {selectedUser.department}</p>
                  <div className="mt-6 space-y-3 text-left">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Mail className="w-5 h-5 text-blue-500" /><div className="overflow-hidden"><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="text-sm font-medium text-slate-700 truncate" title={selectedUser.email}>{selectedUser.email}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Briefcase className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Company</p><p className="text-sm font-medium text-slate-700">{selectedUser.company || '-'}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Building className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Department</p><p className="text-sm font-medium text-slate-700">{selectedUser.department}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg><div><p className="text-xs text-slate-400 font-bold uppercase">WhatsApp</p>{selectedUser.phone ? <a href={`https://wa.me/${String(selectedUser.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">{selectedUser.phone}</a> : <p className="text-sm font-medium text-slate-700">-</p>}</div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><CheckCircle className="w-5 h-5 text-green-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Status</p><p className="text-sm font-medium text-green-700">{selectedUser.status}</p></div></div>
                  </div>
                  <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
                    <button onClick={() => handleOpenEditUser(selectedUser)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"><PenSquare className="w-4 h-4" /> Edit</button>
                    <button onClick={handleDeleteUser} disabled={selectedUser.status === 'Active'} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedUser.status === 'Active' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title={selectedUser.status === 'Active' ? "Hanya user Inactive yang dapat dihapus" : "Hapus User"}><Trash2 className="w-4 h-4" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* KPI MODAL */}
      {
        showKPIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">{editingKPI ? 'Edit KPI' : 'Add New KPI'}</h3><button onClick={() => setShowKPIModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">KPI Title</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={kpiForm.title} onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })} placeholder="e.g. Revenue Growth" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Group</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={kpiForm.group} onChange={(e) => setKpiForm({ ...kpiForm, group: e.target.value })}>{KPI_GROUPS.map(g => (<option key={g} value={g}>{g}</option>))}</select></div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowKPIModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button><button onClick={handleSaveKPI} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Save</button></div>
            </div>
          </div>
        )
      }

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold">{editingEvent ? 'Edit Event' : (eventForm.eventType === 'internal' ? 'Add Internal Event' : 'Add External Event')}</h3>
              <button onClick={() => setShowEventModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Judul Event</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Masukkan Judul Event" />
              </div>
              {eventForm.eventType === 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Linked Project</label>
                  <div className="w-full border border-slate-200 bg-slate-50 p-2 text-sm rounded-lg text-slate-700 font-medium">
                    {taskById.get(eventForm.linkedTaskId)?.title || eventForm.title}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">End Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lokasi</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Masukkan Lokasi" />
              </div>
              {eventForm.eventType !== 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Peserta (User)</label>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                    {activeUsers.map(user => {
                      const isSelected = eventForm.participants.includes(user.name);
                      return (
                        <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-colors">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleEventParticipant(user.name)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                          <UserAvatar name={user.name} photoURL={user.photoURL} className="w-6 h-6" />
                          <span className="text-sm font-medium text-slate-700 flex-1">{user.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">{user.role}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4 border-t sticky bottom-0 flex justify-end gap-2">
              <button onClick={() => setShowEventModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSaveEvent} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Simpan Event</button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL (Pop-up Card) */}
      {
        showEventDetailModal && selectedEventDetail && (
          (() => {
            const eventTypeMeta = getEventTypeMeta(selectedEventDetail.eventType);
            const linkedTask = tasks.find((task) => {
              if (selectedEventDetail.linkedTaskId && String(task.id) === String(selectedEventDetail.linkedTaskId)) {
                return true;
              }
              return selectedEventDetail.eventType === 'internal' && task.title === selectedEventDetail.title;
            }) || null;
            return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative">
              <div className={`${eventTypeMeta.accentClass} p-5 text-white flex justify-between items-start`}>
                <div>
                  <div className="mb-2">
                    <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {eventTypeMeta.label} Event
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight mb-1">{selectedEventDetail.title}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-sm opacity-90">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateIndo(selectedEventDetail.startDate)} {selectedEventDetail.endDate && selectedEventDetail.endDate !== selectedEventDetail.startDate ? ` - ${formatDateIndo(selectedEventDetail.endDate)}` : ''}</span>
                  </div>
                </div>
                <button onClick={() => setShowEventDetailModal(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Location</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEventDetail.location || "TBD"}</p>
                    </div>
                  </div>

                  {selectedEventDetail.eventType === 'internal' && linkedTask && (
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Briefcase className="w-5 h-5" /></div>
                      <div className="w-full">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Main Task</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEventDetailModal(false);
                            setSelectedTaskId(linkedTask.id);
                            navigateTo('jobtask');
                          }}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {linkedTask.title}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Users className="w-5 h-5" /></div>
                    <div className="w-full">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Participants</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEventDetail.participants && Array.isArray(selectedEventDetail.participants) && selectedEventDetail.participants.length > 0 ? (
                          selectedEventDetail.participants.map(p => (
                            <div key={p} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-xs font-medium text-slate-700 flex items-center gap-1.5">
                              <UserAvatar name={p} photoURL={userByName.get(p)?.photoURL} className="w-4 h-4" />{p}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-400">Belum ada peserta</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowEventDetailModal(false);
                    handleDeleteEvent(selectedEventDetail.id);
                  }}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => {
                    setShowEventDetailModal(false);
                    openEventModal(selectedEventDetail);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Event
                </button>
              </div>
            </div>
          </div>
            );
          })()
        )
      }

      {confirmationDialog.open && (
        <div className="fixed inset-0 bg-slate-900/50 z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className={`flex items-start gap-3 border-b px-5 py-4 ${
              confirmationDialog.tone === 'red'
                ? 'border-red-100 bg-red-50'
                : confirmationDialog.tone === 'emerald'
                  ? 'border-emerald-100 bg-emerald-50'
                  : 'border-blue-100 bg-blue-50'
            }`}>
              <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                confirmationDialog.tone === 'red'
                  ? 'bg-red-100 text-red-600'
                  : confirmationDialog.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmationDialog.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{confirmationDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => closeConfirmationDialog(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {confirmationDialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirmationDialog(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  confirmationDialog.tone === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmationDialog.tone === 'emerald'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmationDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE TASK MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">{editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}</h3>
              <button onClick={() => setShowTemplateModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Template</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. IT Project Template" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Subtask Items</label>
                  <button onClick={addTemplateSubtaskRow} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors">
                    <Plus className="w-3 h-3" /> Tambah Row
                  </button>
                </div>
                <div className="space-y-3">
                  {templateForm.subtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-shrink-0 mt-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-200 w-5 h-5 flex items-center justify-center rounded">{idx + 1}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={sub.title} onChange={(e) => updateTemplateSubtaskRow(idx, 'title', e.target.value)} placeholder="Nama Subtask" />
                        <div className="flex gap-2">
                          <select className="flex-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={sub.assignee} onChange={(e) => updateTemplateSubtaskRow(idx, 'assignee', e.target.value)}>
                            <option value="">-- Assignee (Opsional) --</option>
                            {activeUsers.map(user => (<option key={user.id} value={user.name}>{user.name}</option>))}
                          </select>
                          <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-sm text-slate-500 font-semibold whitespace-nowrap">H -</span>
                            <input type="number" min="0" className="w-16 flex-1 text-sm outline-none bg-transparent" placeholder="Hari" value={sub.deadline} onChange={(e) => updateTemplateSubtaskRow(idx, 'deadline', e.target.value)} title="Masukkan angka (H minus hari dari deadline project)" />
                          </div>
                        </div>
                      </div>
                      {templateForm.subtasks.length > 1 && (
                        <button onClick={() => removeTemplateSubtaskRow(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t sticky bottom-0 flex justify-end gap-2">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSaveTemplate} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Simpan Template</button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
