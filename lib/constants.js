// Konstanta & data default aplikasi Action Tracker.
// Berisi nilai murni (tanpa state React). Satu-satunya impor eksternal adalah
// ikon lucide untuk ACTIVITY_LOG_ACTION_META.
import {
  Plus, Edit2, Trash2, Upload, AlertCircle, CheckCircle, Briefcase, History,
  MessageSquarePlus,
} from 'lucide-react';

// --- DATA AWAL (DEFAULT / SEEDER) ---
export const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Penyusunan Laporan Tahunan 2024",
    description: "Mengumpulkan data dari semua departemen dan menyusun layout buku tahunan.",
    pic: "Budi Santoso",
    deadline: "2024-03-30",
    progress: 33,
    subtasks: [
      {
        id: 101,
        title: "Kompilasi Data Keuangan",
        assignee: "Siti Aminah",
        deadline: "2024-03-20",
        status: "completed",
        evidence: "Laporan_Keuangan_Final.pdf",
        comments: [
          { text: "Sudah divalidasi finance.", user: "Siti Aminah", type: "evidence", timestamp: "26/01/2024 10:00" },
          { text: "Tolong pastikan format sesuai template baru.", user: "Budi Santoso", type: "revision", timestamp: "25/01/2024 14:00" }
        ],
        lastUpdated: "26/01/2024 10:00"
      },
      {
        id: 102,
        title: "Drafting Narasi CEO",
        assignee: "Rudi Hartono",
        deadline: "2024-03-25",
        status: "waiting_review",
        evidence: "Draft_Narasi_v1.docx",
        comments: [
          { text: "Mohon direview pak.", user: "Rudi Hartono", type: "evidence", timestamp: "26/01/2024 14:30" }
        ],
        lastUpdated: "26/01/2024 14:30"
      },
      {
        id: 103,
        title: "Desain Cover & Layout",
        assignee: "Siti Aminah",
        deadline: "2024-03-28",
        status: "pending",
        evidence: null,
        comments: [],
        lastUpdated: "20/01/2024 09:00"
      },
    ]
  },
  {
    id: 2,
    title: "Maintenance Server & Keamanan",
    description: "Update patch keamanan rutin dan backup database Q1.",
    pic: "Andi Wijaya",
    deadline: "2024-02-15",
    progress: 0,
    subtasks: [
      {
        id: 201,
        title: "Backup Database Utama",
        assignee: "Rudi Hartono",
        deadline: "2024-02-10",
        status: "revision",
        evidence: "Backup_Log.txt",
        comments: [
          { text: "File corrupt, tolong ulang backup manual.", user: "Andi Wijaya", type: "revision", timestamp: "25/01/2024 16:45" },
          { text: "Backup otomatis gagal kemarin.", user: "Rudi Hartono", type: "evidence", timestamp: "25/01/2024 09:00" }
        ],
        lastUpdated: "25/01/2024 16:45"
      },
      {
        id: 202,
        title: "Update Firewall Rules",
        assignee: "Rudi Hartono",
        deadline: "2024-02-12",
        status: "pending",
        evidence: null,
        comments: [],
        lastUpdated: "20/01/2024 08:00"
      },
    ]
  }
];

export const DEFAULT_USERS = [
  { id: 1, name: "Budi Santoso", email: "budi.s@pertamina.com", role: "PIC", department: "Strategic Planning", status: "Active" },
  { id: 2, name: "Siti Aminah", email: "siti.a@pertamina.com", role: "Assignee", department: "Finance", status: "Active" },
  { id: 3, name: "Rudi Hartono", email: "rudi.h@pertamina.com", role: "Assignee", department: "IT Infrastructure", status: "Active" },
  { id: 4, name: "Andi Wijaya", email: "andi.w@pertamina.com", role: "PIC", department: "IT Support", status: "Active" },
  { id: 5, name: "Sarah Larasati", email: "sarah.l@pertamina.com", role: "PIC", department: "Digital Product", status: "Active" },
  { id: 6, name: "Dimas Anggara", email: "dimas.a@pertamina.com", role: "Assignee", department: "Software Engineering", status: "Active" },
  { id: 7, name: "Jessica Tan", email: "jessica.t@pertamina.com", role: "PIC", department: "Human Resources", status: "Active" },
  { id: 8, name: "Reza Mahendra", email: "reza.m@pertamina.com", role: "Assignee", department: "Legal", status: "Active" },
];

// --- KONFIGURASI AVATAR & PERUSAHAAN ---
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png'];
export const COMPANY_OPTIONS = [
  'PT Pertamina (Holding)',
  'PT Pertamina Patra Niaga',
  'PT Pertamina International Shipping',
];

// --- TEMPLATE FORM KOSONG ---
export const EMPTY_NEW_USER_FORM = {
  name: "",
  email: "",
  password: "",
  role: "Assignee",
  department: "",
  company: COMPANY_OPTIONS[0],
  phone: "",
};
export const EMPTY_REGISTER_FORM = {
  ...EMPTY_NEW_USER_FORM,
  role: "",
  company: "",
};
export const EMPTY_PROFILE_FORM = {
  id: null,
  name: "",
  email: "",
  role: "",
  department: "",
  company: COMPANY_OPTIONS[0],
  phone: "",
  photoURL: "",
  status: "",
};

// --- DATA KPI & EVENT DEFAULT ---
export const DEFAULT_KPIS = [
  { id: 1, title: "Revenue Growth", group: "FINANCE" },
  { id: 2, title: "Cost Reduction", group: "FINANCE" },
  { id: 3, title: "Customer Satisfaction Index", group: "CUSTOMER FOCUS" },
  { id: 4, title: "Market Share", group: "CUSTOMER FOCUS" },
  { id: 5, title: "Operational Efficiency", group: "INTERNAL PROCESS" },
  { id: 6, title: "Employee Training Hours", group: "LEARNING & GROWTH" },
];

export const DEFAULT_EVENTS = [
  {
    id: 1,
    title: "Annual Security Drill",
    startDate: "2026-03-15",
    endDate: "2026-03-16",
    eventType: "external",
    location: "Main Gate, Area A",
    participants: ["Budi Santoso", "Reza Mahendra"]
  }
];

export const KPI_GROUPS = ['FINANCE', 'CUSTOMER FOCUS', 'INTERNAL PROCESS', 'LEARNING & GROWTH'];

// --- KONFIGURASI VALIDASI EVIDENCE ---
export const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_EVIDENCE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']);
export const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
]);

// --- TIMEOUT LOGOUT OTOMATIS ---
export const INACTIVITY_LOGOUT_MINUTES = 30;
export const INACTIVITY_LOGOUT_MS = INACTIVITY_LOGOUT_MINUTES * 60 * 1000;

// --- TEMPLATE TASK DEFAULT ---
export const DEFAULT_TEMPLATES = [
  {
    id: 1,
    name: "IT Project Template",
    subtasks: [
      { title: "Requirement Analysis", assignee: "", deadline: "" },
      { title: "Design & Planning", assignee: "", deadline: "" },
      { title: "Development", assignee: "", deadline: "" },
      { title: "Testing & QA", assignee: "", deadline: "" },
      { title: "Deployment", assignee: "", deadline: "" },
    ]
  },
  {
    id: 2,
    name: "Report Submission Template",
    subtasks: [
      { title: "Pengumpulan Data", assignee: "", deadline: "" },
      { title: "Penyusunan Draft", assignee: "", deadline: "" },
      { title: "Review & Revisi", assignee: "", deadline: "" },
      { title: "Finalisasi Dokumen", assignee: "", deadline: "" },
    ]
  },
];

// Nama bulan (Bahasa Indonesia) untuk komponen kalender.
export const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Metadata tampilan per jenis aksi pada tab Log (icon, warna node, kalimat aksi).
export const ACTIVITY_LOG_ACTION_META = {
  subtask_created:    { icon: Plus,        iconBg: 'bg-blue-100',    iconColor: 'text-blue-600',    sentence: 'menambahkan subtask' },
  subtask_updated:    { icon: Edit2,       iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   sentence: 'memperbarui subtask' },
  subtask_deleted:    { icon: Trash2,      iconBg: 'bg-red-100',     iconColor: 'text-red-600',     sentence: 'menghapus subtask' },
  evidence_submitted: { icon: Upload,      iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  sentence: 'mengirim evidence untuk' },
  revision_requested: { icon: AlertCircle, iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  sentence: 'meminta revisi pada' },
  subtask_approved:   { icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', sentence: 'meng-approve subtask' },
  task_created:       { icon: Briefcase,   iconBg: 'bg-blue-100',    iconColor: 'text-blue-700',    sentence: 'membuat project ini' },
  task_updated:       { icon: Edit2,       iconBg: 'bg-slate-200',   iconColor: 'text-slate-600',   sentence: 'memperbarui detail project ini' },
  update_posted:      { icon: MessageSquarePlus, iconBg: 'bg-sky-100', iconColor: 'text-sky-600',    sentence: 'menambahkan update' },
  default:            { icon: History,     iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',   sentence: 'melakukan aktivitas pada' },
};
