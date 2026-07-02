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
import UserAvatar from './components/UserAvatar.jsx';
import DonutChart from './components/DonutChart.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import {
  getCurrentDateTime, formatLogTimeLabel, parseActivityTimestamp, formatDateIndo, parseDateValue,
  toDateInputString, toDateInputValue, toLocalDateKey, getDateRangeKeys, addDays, diffDays,
  getTimelinePercent, getTimelineMarkerPlacement, formatTimelineLabel,
} from './lib/dateUtils.js';
import {
  normalizeSubtaskSnapshot, pickPreferredSubtaskSnapshot, mergeTaskSubtaskSnapshots, getGanttStatusLabel,
  getDefaultSubtaskStartDate, getEventTypeMeta, getLatestProjectUpdate, getTaskDeadlineBadge,
  getProjectStatus, calculateTaskProgress,
} from './lib/taskUtils.js';
import {
  getFileMeta, getNormalizedEvidenceEntries, getApprovedEvidenceKeys, getApprovedEvidenceEntries,
  validateEvidenceFiles,
} from './lib/evidenceUtils.js';
import {
  UserTaskDetailModal,
  EvidenceModal,
  ReviseModal,
  NewTaskModal,
  SubtaskModal,
  EditProfileModal,
  AddUserModal,
  EditUserModal,
  UserDetailModal,
  KpiModal,
  EventModal,
  EventDetailModal,
  ConfirmationDialog,
  TemplateModal,
  UpdateLogModal,
} from './components/modals/index.js';



import LoginPage from './pages/LoginPage.jsx';
const JobTaskPage = lazy(() => import('./pages/JobTaskPage.jsx'));
const UserTaskPage = lazy(() => import('./pages/UserTaskPage.jsx'));
const FilePage = lazy(() => import('./pages/FilePage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ManageUserPage = lazy(() => import('./pages/ManageUserPage.jsx'));
const KpiPage = lazy(() => import('./pages/KpiPage.jsx'));
const CoePage = lazy(() => import('./pages/CoePage.jsx'));
const TemplateTaskPage = lazy(() => import('./pages/TemplateTaskPage.jsx'));


// --- LOGIN PAGE ---

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) {
    try { return JSON.parse(value); } catch (e) { return []; }
  }
  return [];
};

const normalizeNotifications = (list = []) => list.map((notification) => ({
  ...notification,
  isRead: notification.isRead === true || String(notification.isRead).toLowerCase() === 'true',
}));

const normalizeServerLogs = (list = []) => list.map((log) => ({
  ...log,
  documents: parseJsonArray(log.documents),
  createdAt: Number(log.createdAt) || 0,
}));

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
  const notificationPollingRef = useRef(false);

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
  const [viewMode, setViewMode] = useState('log');
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
  const [showUpdateLogModal, setShowUpdateLogModal] = useState(false);
  const [updateLogText, setUpdateLogText] = useState("");
  const [updateLogFiles, setUpdateLogFiles] = useState([]);
  const [updateLogUploading, setUpdateLogUploading] = useState(false);

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
      const parsedEvents = (data.events || []).map(e => ({
        ...e,
        eventType: e.eventType || (e.linkedTaskId ? 'internal' : 'external'),
        participants: parseJsonArray(e.participants)
      }));
      const parsedTemplates = (data.templates || []).map(t => ({
        ...t,
        subtasks: parseJsonArray(t.subtasks)
      }));
      const parsedNotifications = normalizeNotifications(data.notifications || []);

      setUsers(data.users || []);
      setKpis(data.kpis || []);
      setEvents(parsedEvents);
      setTaskTemplates(parsedTemplates);
      setNotifications(parsedNotifications);
      const serverLogs = normalizeServerLogs(data.logs || []);
      setActivityLogs((prev) => {
        // Pertahankan entri optimistik (<60 dtk) yang belum sampai di server agar
        // tidak berkedip hilang saat refetch mendahului penulisan addLogs.
        const serverIds = new Set(serverLogs.map((l) => String(l.id)));
        const pendingLocal = prev.filter((l) => !serverIds.has(String(l.id)) && (Date.now() - (l.createdAt || 0)) < 60000);
        return [...pendingLocal, ...serverLogs];
      });
      return {
        tasks: tasksWithSubtasks,
        subtasks,
        users: data.users || [],
        kpis: data.kpis || [],
        events: parsedEvents,
        templates: parsedTemplates,
        notifications: parsedNotifications,
        logs: serverLogs,
      };
    } catch(err) {
      console.error("Failed to fetch data:", err);
      return null;
    } finally {
      if (!silent) setDataLoaded(true);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return undefined;
    
    fetchData(false);
    let isActive = true;

    const pollNotifications = async () => {
      if (notificationPollingRef.current) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      notificationPollingRef.current = true;
      try {
        const data = await api.getNotifications(currentUser.id);
        if (isActive) {
          setNotifications(normalizeNotifications(data.notifications || []));
        }
      } catch (err) {
        console.error('Failed to poll notifications:', err);
      } finally {
        if (isActive) {
          notificationPollingRef.current = false;
        }
      }
    };

    const interval = setInterval(pollNotifications, 30000);
    
    return () => {
      isActive = false;
      clearInterval(interval);
      notificationPollingRef.current = false;
    };
  }, [isLoggedIn, currentUser?.id]);

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
    // Optimistic di UI, tetapi tunggu backend agar full refresh tidak mengambil status lama.
    await markNotificationAsRead(notification.id);

    // Refresh penuh lalu pakai snapshot response agar navigasi tidak membaca state lama.
    const snapshot = await fetchData(true);
    const freshTasks = snapshot?.tasks || tasks;
    const freshEvents = snapshot?.events || events;
    const freshTaskById = new Map(freshTasks.map((task) => [String(task.id), task]));

    if (notification.targetType === 'subtask' && notification.parentTaskId) {
      const task = freshTaskById.get(String(notification.parentTaskId))
        || freshTasks.find((t) => String(t.id) === String(notification.parentTaskId));
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
      return;
    }

    if (notification.targetType === 'event' && notification.targetId) {
      const targetEvent = freshEvents.find((event) => String(event.id) === String(notification.targetId));
      if (targetEvent) {
        setSelectedEventDetail(targetEvent);
        setShowEventDetailModal(true);
        navigateTo('coe');
      }
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

  // --- Update ke LOG project (tombol "+ Update" di detail Job Task) ---
  const openUpdateLogModal = () => {
    setUpdateLogText("");
    setUpdateLogFiles([]);
    setShowUpdateLogModal(true);
  };

  const handleUpdateLogFileSelection = (files) => {
    const incoming = Array.from(files || []);
    const validImages = [];
    for (const file of incoming) {
      if (!file.type || !file.type.startsWith('image/')) {
        alert(`"${file.name}" bukan gambar. Hanya file gambar yang diperbolehkan.`);
        return;
      }
      if (file.size > MAX_EVIDENCE_FILE_SIZE) {
        alert(`"${file.name}" melebihi batas ukuran (maks ${Math.round(MAX_EVIDENCE_FILE_SIZE / (1024 * 1024))}MB).`);
        return;
      }
      validImages.push(file);
    }
    setUpdateLogFiles((prev) => [...prev, ...validImages]);
  };

  const submitUpdateLog = async () => {
    if (!activeTask) return;
    if (updateLogText.trim() === "" && updateLogFiles.length === 0) return;
    setUpdateLogUploading(true);
    try {
      let documents = [];
      if (updateLogFiles.length > 0) {
        documents = await Promise.all(updateLogFiles.map(async (file) => {
          const res = await api.uploadFile(file);
          return { name: file.name, url: res.url, isImage: true };
        }));
      }
      await logTaskActivity({
        task: activeTask,
        action: 'update_posted',
        message: updateLogText.trim(),
        documents,
      });
      setShowUpdateLogModal(false);
      setUpdateLogText("");
      setUpdateLogFiles([]);
    } catch (error) {
      console.error('Error submitting update:', error);
      alert('Gagal menyimpan update: ' + (error.message || 'Silakan coba lagi.'));
    } finally {
      setUpdateLogUploading(false);
    }
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
  const handleTaskClick = (taskId) => { setSelectedTaskId(taskId); setShowMobileDetail(true); setViewMode('log'); };
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
  if (!authResolved || (isLoggedIn && !dataLoaded)) return <LoadingScreen />;

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} onRegister={handleSelfRegister} loginFeedback={loginFeedback} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col h-screen overflow-hidden">

      <Sidebar activePage={activePage} handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} navigateTo={navigateTo} setIsSidebarOpen={setIsSidebarOpen} userRole={userRole} />

      <Header currentUser={currentUser} getNotificationTimeLabel={getNotificationTimeLabel} handleLogout={handleLogout} handleNotificationClick={handleNotificationClick} markAllNotificationsAsRead={markAllNotificationsAsRead} myNotifications={myNotifications} openEditProfileModal={openEditProfileModal} profileMenuRef={profileMenuRef} setShowNotificationsPanel={setShowNotificationsPanel} setShowProfileMenu={setShowProfileMenu} showNotificationsPanel={showNotificationsPanel} showProfileMenu={showProfileMenu} toggleSidebar={toggleSidebar} unreadNotificationsCount={unreadNotificationsCount} />

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full bg-slate-50">

        {activePage === 'jobtask' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <JobTaskPage
              activeTask={activeTask}
              activeTaskActivityLog={activeTaskActivityLog}
              applyGanttPreset={applyGanttPreset}
              canManageActiveTaskSubtasks={canManageActiveTaskSubtasks}
              currentUser={currentUser}
              deleteSubtask={deleteSubtask}
              eventByLinkedTaskId={eventByLinkedTaskId}
              eventByTitle={eventByTitle}
              events={events}
              expandedSubtasks={expandedSubtasks}
              ganttData={ganttData}
              ganttRangeEnd={ganttRangeEnd}
              ganttRangePreset={ganttRangePreset}
              ganttRangeStart={ganttRangeStart}
              ganttShowCompleted={ganttShowCompleted}
              ganttTooltip={ganttTooltip}
              ganttZoomLevel={ganttZoomLevel}
              handleDeleteMainTask={handleDeleteMainTask}
              handleEditMainTask={handleEditMainTask}
              handleGanttTooltipMove={handleGanttTooltipMove}
              handleOpenUserTaskDetail={handleOpenUserTaskDetail}
              handleTaskClick={handleTaskClick}
              isActiveTaskOwnerPic={isActiveTaskOwnerPic}
              isMainTaskDetailExpanded={isMainTaskDetailExpanded}
              isSidebarCollapsed={isSidebarCollapsed}
              maintaskFilter={maintaskFilter}
              openAddSubtaskModal={openAddSubtaskModal}
              openCoeCalendarForEvent={openCoeCalendarForEvent}
              openEditSubtaskModal={openEditSubtaskModal}
              openEventModal={openEventModal}
              openEvidenceModal={openEvidenceModal}
              openUpdateLogModal={openUpdateLogModal}
              openNewTaskModal={openNewTaskModal}
              openReviseModal={openReviseModal}
              selectedTaskId={selectedTaskId}
              setGanttRangeEnd={setGanttRangeEnd}
              setGanttRangePreset={setGanttRangePreset}
              setGanttRangeStart={setGanttRangeStart}
              setGanttShowCompleted={setGanttShowCompleted}
              setGanttTooltip={setGanttTooltip}
              setGanttZoomLevel={setGanttZoomLevel}
              setIsMainTaskDetailExpanded={setIsMainTaskDetailExpanded}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              setMaintaskFilter={setMaintaskFilter}
              setShowGanttFilters={setShowGanttFilters}
              setShowMobileDetail={setShowMobileDetail}
              setViewMode={setViewMode}
              showGanttFilters={showGanttFilters}
              showMobileDetail={showMobileDetail}
              tasks={tasks}
              toggleSubtask={toggleSubtask}
              userByName={userByName}
              userRole={userRole}
              viewMode={viewMode}
            />
          </Suspense>
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

      {showUserTaskDetailModal && selectedSubtask && <UserTaskDetailModal approvalEvidenceSelection={approvalEvidenceSelection} approveSubtask={approveSubtask} currentUser={currentUser} evidenceFiles={evidenceFiles} evidenceLink={evidenceLink} evidenceText={evidenceText} handleEvidenceFileSelection={handleEvidenceFileSelection} openReviseModal={openReviseModal} selectedSubtask={selectedSubtask} setActivePage={setActivePage} setApprovalEvidenceSelection={setApprovalEvidenceSelection} setEvidenceFiles={setEvidenceFiles} setEvidenceLink={setEvidenceLink} setEvidenceText={setEvidenceText} setExpandedSubtasks={setExpandedSubtasks} setSelectedTaskId={setSelectedTaskId} setShowMobileDetail={setShowMobileDetail} setShowUserTaskDetailModal={setShowUserTaskDetailModal} submitEvidence={submitEvidence} userByName={userByName} userRole={userRole} />}

      {showEvidenceModal && selectedSubtask && <EvidenceModal evidenceFiles={evidenceFiles} evidenceLink={evidenceLink} evidenceText={evidenceText} evidenceUploading={evidenceUploading} handleEvidenceFileSelection={handleEvidenceFileSelection} selectedSubtask={selectedSubtask} setEvidenceFiles={setEvidenceFiles} setEvidenceLink={setEvidenceLink} setEvidenceText={setEvidenceText} setShowEvidenceModal={setShowEvidenceModal} submitEvidence={submitEvidence} />}

      {showUpdateLogModal && <UpdateLogModal activeTaskTitle={activeTask?.title} handleUpdateLogFileSelection={handleUpdateLogFileSelection} setShowUpdateLogModal={setShowUpdateLogModal} setUpdateLogFiles={setUpdateLogFiles} setUpdateLogText={setUpdateLogText} submitUpdateLog={submitUpdateLog} updateLogFiles={updateLogFiles} updateLogText={updateLogText} updateLogUploading={updateLogUploading} />}

      {showReviseModal && subtaskToRevise && <ReviseModal handleSendRevision={handleSendRevision} reviseComment={reviseComment} setReviseComment={setReviseComment} setShowReviseModal={setShowReviseModal} subtaskToRevise={subtaskToRevise} />}

      {showNewTaskModal && <NewTaskModal activePicUsers={activePicUsers} addNewTask={addNewTask} editingMainTaskId={editingMainTaskId} newEventEndDate={newEventEndDate} newEventLocation={newEventLocation} newEventStartDate={newEventStartDate} newTaskDeadline={newTaskDeadline} newTaskDesc={newTaskDesc} newTaskIsEvent={newTaskIsEvent} newTaskPic={newTaskPic} newTaskTitle={newTaskTitle} selectedTemplateId={selectedTemplateId} setNewEventEndDate={setNewEventEndDate} setNewEventLocation={setNewEventLocation} setNewEventStartDate={setNewEventStartDate} setNewTaskDeadline={setNewTaskDeadline} setNewTaskDesc={setNewTaskDesc} setNewTaskIsEvent={setNewTaskIsEvent} setNewTaskPic={setNewTaskPic} setNewTaskTitle={setNewTaskTitle} setSelectedTemplateId={setSelectedTemplateId} setShowNewTaskModal={setShowNewTaskModal} taskTemplates={taskTemplates} tasks={tasks} />}

      {showSubtaskModal && <SubtaskModal activeTask={activeTask} activeUsers={activeUsers} editingSubtaskId={editingSubtaskId} isSavingSubtask={isSavingSubtask} saveSubtask={saveSubtask} setShowSubtaskModal={setShowSubtaskModal} setSubtaskFormAssignee={setSubtaskFormAssignee} setSubtaskFormDeadline={setSubtaskFormDeadline} setSubtaskFormDescription={setSubtaskFormDescription} setSubtaskFormStartDate={setSubtaskFormStartDate} setSubtaskFormTitle={setSubtaskFormTitle} subtaskFormAssignee={subtaskFormAssignee} subtaskFormDeadline={subtaskFormDeadline} subtaskFormDescription={subtaskFormDescription} subtaskFormStartDate={subtaskFormStartDate} subtaskFormTitle={subtaskFormTitle} />}

      {showEditProfileModal && currentUser && <EditProfileModal closeEditProfileModal={closeEditProfileModal} handleAvatarFileSelection={handleAvatarFileSelection} handleUpdateOwnProfile={handleUpdateOwnProfile} isSavingProfile={isSavingProfile} profileAvatarFile={profileAvatarFile} profileAvatarPreview={profileAvatarPreview} profileForm={profileForm} profilePasswordForm={profilePasswordForm} setProfileForm={setProfileForm} setProfilePasswordForm={setProfilePasswordForm} />}

      {showAddUserModal && <AddUserModal events={events} handleAddUser={handleAddUser} handleAvatarFileSelection={handleAvatarFileSelection} isSavingUser={isSavingUser} newUserAvatarFile={newUserAvatarFile} newUserAvatarPreview={newUserAvatarPreview} newUserForm={newUserForm} setNewUserForm={setNewUserForm} setShowAddUserModal={setShowAddUserModal} setShowPassword={setShowPassword} showPassword={showPassword} />}

      {showEditUserModal && <EditUserModal editUserAvatarFile={editUserAvatarFile} editUserAvatarPreview={editUserAvatarPreview} editUserForm={editUserForm} events={events} handleAvatarFileSelection={handleAvatarFileSelection} handleUpdateUser={handleUpdateUser} isSavingUser={isSavingUser} setEditUserForm={setEditUserForm} setShowEditUserModal={setShowEditUserModal} />}

      {showUserDetailModal && selectedUser && <UserDetailModal handleDeleteUser={handleDeleteUser} handleOpenEditUser={handleOpenEditUser} selectedUser={selectedUser} setShowUserDetailModal={setShowUserDetailModal} />}

      {/* KPI MODAL */}
      {showKPIModal && <KpiModal editingKPI={editingKPI} handleSaveKPI={handleSaveKPI} kpiForm={kpiForm} setKpiForm={setKpiForm} setShowKPIModal={setShowKPIModal} />}

      {/* EVENT MODAL */}
      {showEventModal && <EventModal activeUsers={activeUsers} editingEvent={editingEvent} eventForm={eventForm} handleSaveEvent={handleSaveEvent} setEventForm={setEventForm} setShowEventModal={setShowEventModal} taskById={taskById} toggleEventParticipant={toggleEventParticipant} />}

      {/* EVENT DETAIL MODAL (Pop-up Card) */}
      {showEventDetailModal && selectedEventDetail && <EventDetailModal handleDeleteEvent={handleDeleteEvent} navigateTo={navigateTo} openEventModal={openEventModal} selectedEventDetail={selectedEventDetail} setSelectedTaskId={setSelectedTaskId} setShowEventDetailModal={setShowEventDetailModal} tasks={tasks} userByName={userByName} />}

      {confirmationDialog.open && <ConfirmationDialog closeConfirmationDialog={closeConfirmationDialog} confirmationDialog={confirmationDialog} />}

      {/* TEMPLATE TASK MODAL */}
      {showTemplateModal && <TemplateModal activeUsers={activeUsers} addTemplateSubtaskRow={addTemplateSubtaskRow} editingTemplate={editingTemplate} handleSaveTemplate={handleSaveTemplate} removeTemplateSubtaskRow={removeTemplateSubtaskRow} setShowTemplateModal={setShowTemplateModal} setTemplateForm={setTemplateForm} templateForm={templateForm} updateTemplateSubtaskRow={updateTemplateSubtaskRow} />}

    </div >
  );
}
