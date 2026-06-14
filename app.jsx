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
} from './components/modals/index.js';



const UserTaskPage = lazy(() => import('./pages/UserTaskPage.jsx'));
const FilePage = lazy(() => import('./pages/FilePage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ManageUserPage = lazy(() => import('./pages/ManageUserPage.jsx'));
const KpiPage = lazy(() => import('./pages/KpiPage.jsx'));
const CoePage = lazy(() => import('./pages/CoePage.jsx'));
const TemplateTaskPage = lazy(() => import('./pages/TemplateTaskPage.jsx'));


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

      {showUserTaskDetailModal && selectedSubtask && <UserTaskDetailModal approvalEvidenceSelection={approvalEvidenceSelection} approveSubtask={approveSubtask} currentUser={currentUser} evidenceFiles={evidenceFiles} evidenceLink={evidenceLink} evidenceText={evidenceText} handleEvidenceFileSelection={handleEvidenceFileSelection} openReviseModal={openReviseModal} selectedSubtask={selectedSubtask} setActivePage={setActivePage} setApprovalEvidenceSelection={setApprovalEvidenceSelection} setEvidenceFiles={setEvidenceFiles} setEvidenceLink={setEvidenceLink} setEvidenceText={setEvidenceText} setExpandedSubtasks={setExpandedSubtasks} setSelectedTaskId={setSelectedTaskId} setShowMobileDetail={setShowMobileDetail} setShowUserTaskDetailModal={setShowUserTaskDetailModal} submitEvidence={submitEvidence} userByName={userByName} userRole={userRole} />}

      {showEvidenceModal && selectedSubtask && <EvidenceModal evidenceFiles={evidenceFiles} evidenceLink={evidenceLink} evidenceText={evidenceText} evidenceUploading={evidenceUploading} handleEvidenceFileSelection={handleEvidenceFileSelection} selectedSubtask={selectedSubtask} setEvidenceFiles={setEvidenceFiles} setEvidenceLink={setEvidenceLink} setEvidenceText={setEvidenceText} setShowEvidenceModal={setShowEvidenceModal} submitEvidence={submitEvidence} />}

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
