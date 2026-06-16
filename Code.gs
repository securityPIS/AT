/**
 * Action Tracker Apps Script Backend API
 * Placed in Google Apps Script Editor of your Google Spreadsheet.
 */

function doPost(e) {
  // CORS Response Header helper
  var origin = "*";
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty request payload" });
    }
    
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var secret = requestData.secret;
    
    // Optional Security token check
    var API_SECRET = PropertiesService.getScriptProperties().getProperty('API_SECRET') || "";
    if (API_SECRET && secret !== API_SECRET) {
      return createJsonResponse({ success: false, error: 'Unauthorized: Invalid API secret' });
    }
    
    // Ensure all tables exist before executing actions
    initSheets();
    
    var result;
    switch(action) {
      case 'init':
        result = initDatabase();
        break;
      case 'login':
        result = handleLogin(requestData.email, requestData.password);
        break;
      case 'register':
        result = handleRegister(requestData.formData);
        break;
      case 'getAllData':
        result = handleGetAllData();
        break;
      case 'getNotifications':
        result = handleGetNotifications(requestData.userId);
        break;
      case 'saveTask':
        result = handleSaveTask(requestData.task);
        break;
      case 'deleteTask':
        result = handleDeleteTask(requestData.id);
        break;
      case 'saveSubtask':
        result = handleSaveSubtask(requestData.subtask);
        break;
      case 'deleteSubtask':
        result = handleDeleteSubtask(requestData.id, requestData.parentId);
        break;
      case 'createTaskWithSubtasks':
        result = handleCreateTaskWithSubtasks(requestData.task, requestData.subtasks);
        break;
      case 'saveKPI':
        result = handleSaveKPI(requestData.kpi);
        break;
      case 'deleteKPI':
        result = handleDeleteRow('kpis', requestData.id);
        break;
      case 'saveEvent':
        result = handleSaveEvent(requestData.event);
        break;
      case 'deleteEvent':
        result = handleDeleteRow('events', requestData.id);
        break;
      case 'saveTemplate':
        result = handleSaveTemplate(requestData.template);
        break;
      case 'deleteTemplate':
        result = handleDeleteRow('templates', requestData.id);
        break;
      case 'updateUser':
        result = handleUpdateUser(requestData.user);
        break;
      case 'deleteUser':
        result = handleDeleteRow('users', requestData.id);
        break;
      case 'uploadFile':
        result = handleUploadFile(requestData.filename, requestData.mimeType, requestData.base64Data);
        break;
      case 'createNotifications':
        result = handleCreateNotifications(requestData.notifications);
        break;
      case 'addLogs':
        result = handleAddLogs(requestData.logs);
        break;
      case 'markNotificationRead':
        result = handleMarkNotificationRead(requestData.id);
        break;
      case 'markAllNotificationsRead':
        result = handleMarkAllNotificationsRead(requestData.userId);
        break;
      default:
        throw new Error('Unknown action: ' + action);
    }
    
    return createJsonResponse({ success: true, data: result });
  } catch(error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// SHA-256 Hash implementation in Apps Script
function sha256(input) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var output = '';
  for (var i = 0; i < rawHash.length; i++) {
    var v = rawHash[i] & 0xFF;
    var h = v.toString(16);
    if (h.length === 1) output += '0';
    output += h;
  }
  return output;
}

// Full notification schema. Kolom navigasi (targetType, targetId, parentTaskId)
// wajib ada agar klik notifikasi bisa mengarahkan ke subtask yang dituju.
var NOTIFICATION_HEADERS = ['id', 'userId', 'recipientUserId', 'recipientName', 'type', 'priority', 'title', 'message', 'targetType', 'targetId', 'parentTaskId', 'actorUserId', 'actorName', 'isRead', 'timestamp', 'createdAt', 'meta'];

// Skema audit log aktivitas per main task. subtaskTitle disimpan sebagai
// snapshot agar riwayat tetap terbaca walau subtask-nya sudah dihapus.
var LOG_HEADERS = ['id', 'taskId', 'subtaskId', 'subtaskTitle', 'action', 'actorUserId', 'actorName', 'message', 'documents', 'refKey', 'createdAt'];

// Skema subtask ternormalisasi: 1 baris = 1 subtask (sebelumnya dipadatkan
// sebagai JSON dalam satu sel kolom tasks.subtasks). Memisahkan ini menghindari
// batas 50.000 karakter/sel dan mengurangi lost-update antar subtask.
var SUBTASK_HEADERS = ['id', 'parentId', 'title', 'assignee', 'startDate', 'deadline', 'status', 'description', 'evidence', 'evidenceUrl', 'evidenceUrls', 'evidenceLinks', 'approvedEvidenceKeys', 'comments', 'lastUpdated'];

// Naikkan versi ini bila ada perubahan skema sheet agar migrasi jalan ulang.
var SCHEMA_VERSION = 'v4';

// Check and create sheets.
// Catatan performa: dipanggil di setiap doPost. Untuk menghindari membaca
// header semua sheet pada tiap request (yang memperlambat login/getAllData),
// migrasi hanya dijalankan sekali per versi skrip dan ditandai via
// ScriptProperties. Set force=true untuk memaksa pengecekan ulang.
function initSheets(force) {
  var props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty('SCHEMA_VERSION') === SCHEMA_VERSION) {
    return; // sudah tersetup pada versi ini, lewati agar request cepat
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var schemas = {
    'users': ['id', 'name', 'email', 'password', 'role', 'department', 'company', 'phone', 'photoURL', 'status'],
    'tasks': ['id', 'title', 'description', 'pic', 'deadline', 'progress', 'isEvent', 'subtasks'],
    'kpis': ['id', 'title', 'group'],
    'events': ['id', 'title', 'startDate', 'endDate', 'location', 'participants', 'linkedTaskId', 'eventType'],
    'templates': ['id', 'name', 'subtasks'],
    'notifications': NOTIFICATION_HEADERS,
    'logs': LOG_HEADERS,
    'subtasks': SUBTASK_HEADERS
  };

  for (var sheetName in schemas) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
      // Format headers bold
      sheet.getRange(1, 1, 1, schemas[sheetName].length).setFontWeight('bold');
    } else {
      // Migrasi: tambahkan kolom yang belum ada pada sheet yang sudah dibuat
      // sebelumnya (mis. notifications yang dulu hanya punya kolom terbatas).
      ensureColumns(sheet, schemas[sheetName]);
    }
  }

  // Pindahkan subtask lama (JSON di tasks.subtasks) ke baris-baris sheet subtasks.
  migrateSubtasksToSheet();

  props.setProperty('SCHEMA_VERSION', SCHEMA_VERSION);
}

// Bungkus operasi tulis dengan script lock agar tidak ada dua request yang
// menulis sheet bersamaan (read-modify-write rawan lost-update).
function withScriptLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// Migrasi sekali jalan: salin subtask dari kolom JSON tasks.subtasks menjadi
// baris di sheet subtasks. Kolom legacy SENGAJA dibiarkan utuh sebagai backup
// rollback. Idempotent: dijaga flag ScriptProperties + lock, dan saveRow
// melakukan upsert by id sehingga aman bila terpanggil ulang.
function migrateSubtasksToSheet() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SUBTASKS_MIGRATED') === 'true') return;

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return; // request lain sedang memigrasi
  try {
    if (props.getProperty('SUBTASKS_MIGRATED') === 'true') return;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName('tasks') || !ss.getSheetByName('subtasks')) return;

    var tasks = getSheetData('tasks');
    for (var i = 0; i < tasks.length; i++) {
      var raw = tasks[i].subtasks;
      if (!raw) continue;
      var list;
      try { list = JSON.parse(raw); } catch (e) { list = []; }
      if (!list || !list.length) continue;
      for (var j = 0; j < list.length; j++) {
        var st = list[j];
        if (!st || st.isDeleted === true) continue;
        st.parentId = tasks[i].id;
        saveRow('subtasks', st);
      }
    }
    props.setProperty('SUBTASKS_MIGRATED', 'true');
  } finally {
    lock.releaseLock();
  }
}

// Jalankan manual dari editor Apps Script untuk memaksa pengecekan/penambahan
// kolom ulang (mengabaikan flag SCHEMA_VERSION). Berguna saat debugging skema.
function forceInitSheets() {
  initSheets(true);
}

// Tambahkan header kolom yang hilang ke akhir sheet tanpa menghapus data lama.
function ensureColumns(sheet, requiredHeaders) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold');
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missing = [];
  for (var i = 0; i < requiredHeaders.length; i++) {
    if (headers.indexOf(requiredHeaders[i]) === -1) {
      missing.push(requiredHeaders[i]);
    }
  }
  if (missing.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
    sheet.getRange(1, 1, 1, lastCol + missing.length).setFontWeight('bold');
  }
}

// Initial Seeding logic
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clear other than headers first
  var sheets = ['users', 'tasks', 'kpis', 'events', 'templates', 'notifications', 'logs', 'subtasks'];
  for (var i = 0; i < sheets.length; i++) {
    var sheet = ss.getSheetByName(sheets[i]);
    if (sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  }
  
  var defaultPasswordHash = sha256("Pertamina123!");
  
  // 1. Seed Users
  var defaultUsers = [
    { id: "usr-budi", name: "Budi Santoso", email: "budi.s@pertamina.com", password: defaultPasswordHash, role: "PIC", department: "Strategic Planning", company: "Pertamina", phone: "08111111111", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi", status: "Active" },
    { id: "usr-siti", name: "Siti Aminah", email: "siti.a@pertamina.com", password: defaultPasswordHash, role: "Assignee", department: "Finance", company: "Pertamina", phone: "08122222222", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siti", status: "Active" },
    { id: "usr-rudi", name: "Rudi Hartono", email: "rudi.h@pertamina.com", password: defaultPasswordHash, role: "Assignee", department: "IT Infrastructure", company: "Pertamina", phone: "08133333333", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rudi", status: "Active" },
    { id: "usr-andi", name: "Andi Wijaya", email: "andi.w@pertamina.com", password: defaultPasswordHash, role: "PIC", department: "IT Support", company: "Pertamina", phone: "08144444444", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Andi", status: "Active" },
    { id: "usr-sarah", name: "Sarah Larasati", email: "sarah.l@pertamina.com", password: defaultPasswordHash, role: "PIC", department: "Digital Product", company: "Pertamina", phone: "08155555555", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", status: "Active" },
    { id: "usr-dimas", name: "Dimas Anggara", email: "dimas.a@pertamina.com", password: defaultPasswordHash, role: "Assignee", department: "Software Engineering", company: "Pertamina", phone: "08166666666", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dimas", status: "Active" }
  ];
  
  for (var j = 0; j < defaultUsers.length; j++) {
    saveRow('users', defaultUsers[j]);
  }
  
  // 2. Seed Tasks
  var defaultTasks = [
    {
      id: "task-101",
      title: "Penyusunan Laporan Tahunan 2024",
      description: "Mengumpulkan data dari semua departemen dan menyusun layout buku tahunan.",
      pic: "Budi Santoso",
      deadline: "2024-03-30",
      progress: 33,
      isEvent: false,
      subtasks: [
        { id: "sub-101", title: "Kompilasi Data Keuangan", assignee: "Siti Aminah", deadline: "2024-03-20", status: "completed", evidence: "Laporan_Keuangan_Final.pdf", evidenceUrl: "https://example.com/mock.pdf", comments: [{ text: "Sudah divalidasi finance.", user: "Siti Aminah", type: "evidence", timestamp: "26/01/2024 10:00" }], lastUpdated: "26/01/2024 10:00" },
        { id: "sub-102", title: "Drafting Narasi CEO", assignee: "Rudi Hartono", deadline: "2024-03-25", status: "waiting_review", evidence: "Draft_Narasi_v1.docx", evidenceUrl: "https://example.com/mock.docx", comments: [{ text: "Mohon direview pak.", user: "Rudi Hartono", type: "evidence", timestamp: "26/01/2024 14:30" }], lastUpdated: "26/01/2024 14:30" },
        { id: "sub-103", title: "Desain Cover & Layout", assignee: "Siti Aminah", deadline: "2024-03-28", status: "pending", evidence: null, comments: [], lastUpdated: "20/01/2024 09:00" }
      ]
    },
    {
      id: "task-102",
      title: "Maintenance Server & Keamanan",
      description: "Update patch keamanan rutin and backup database Q1.",
      pic: "Andi Wijaya",
      deadline: "2024-02-15",
      progress: 0,
      isEvent: false,
      subtasks: [
        { id: "sub-201", title: "Backup Database Utama", assignee: "Rudi Hartono", deadline: "2024-02-10", status: "revision", evidence: "Backup_Log.txt", evidenceUrl: "https://example.com/mock.txt", comments: [{ text: "File corrupt, tolong ulang backup manual.", user: "Andi Wijaya", type: "revision", timestamp: "25/01/2024 16:45" }], lastUpdated: "25/01/2024 16:45" },
        { id: "sub-202", title: "Update Firewall Rules", assignee: "Rudi Hartono", deadline: "2024-02-12", status: "pending", evidence: null, comments: [], lastUpdated: "20/01/2024 08:00" }
      ]
    }
  ];
  
  // Tulis task tanpa kolom subtasks legacy, lalu subtask ke sheet ternormalisasi.
  for (var k = 0; k < defaultTasks.length; k++) {
    var seedTask = defaultTasks[k];
    var seedSubtasks = Array.isArray(seedTask.subtasks) ? seedTask.subtasks : [];
    var taskRow = {};
    for (var key in seedTask) {
      if (key === 'subtasks') continue;
      taskRow[key] = seedTask[key];
    }
    taskRow.subtasks = '';
    saveRow('tasks', taskRow);
    for (var s = 0; s < seedSubtasks.length; s++) {
      seedSubtasks[s].parentId = seedTask.id;
      saveRow('subtasks', seedSubtasks[s]);
    }
  }
  // Data fresh sudah dalam bentuk ternormalisasi — tandai agar migrasi tidak jalan.
  PropertiesService.getScriptProperties().setProperty('SUBTASKS_MIGRATED', 'true');
  
  // 3. Seed KPIs
  var defaultKPIs = [
    { id: "kpi-1", title: "Revenue Growth Rate", group: "FINANCE" },
    { id: "kpi-2", title: "Operating Cost Reduction", group: "FINANCE" },
    { id: "kpi-3", title: "Customer Satisfaction Index", group: "CUSTOMER FOCUS" },
    { id: "kpi-4", title: "Net Promoter Score (NPS)", group: "CUSTOMER FOCUS" },
    { id: "kpi-5", title: "Process Automation Rate", group: "INTERNAL PROCESS" },
    { id: "kpi-6", title: "System Uptime Percentage", group: "INTERNAL PROCESS" },
    { id: "kpi-7", title: "Employee Training Hours", group: "LEARNING & GROWTH" },
    { id: "kpi-8", title: "Innovation Projects Delivered", group: "LEARNING & GROWTH" }
  ];
  
  for (var l = 0; l < defaultKPIs.length; l++) {
    saveRow('kpis', defaultKPIs[l]);
  }
  
  // 4. Seed Events
  var defaultEvents = [
    { id: "evt-1", title: "Town Hall Meeting Q1", startDate: "2024-02-15", endDate: "2024-02-15", location: "Auditorium Lantai 5", participants: ["Budi Santoso", "Siti Aminah", "Rudi Hartono"], eventType: "external", linkedTaskId: "" },
    { id: "evt-2", title: "Workshop Digital Transformation", startDate: "2024-03-10", endDate: "2024-03-11", location: "Ruang Meeting DigitalHub", participants: ["Andi Wijaya", "Sarah Larasati"], eventType: "external", linkedTaskId: "" }
  ];
  
  for (var m = 0; m < defaultEvents.length; m++) {
    saveRow('events', defaultEvents[m]);
  }
  
  // 5. Seed Templates
  var defaultTemplates = [
    {
      id: "tpl-1",
      name: "IT Project Template",
      subtasks: [
        { title: "Requirement Analysis", assignee: "", deadline: "" },
        { title: "Design & Planning", assignee: "", deadline: "" },
        { title: "Development", assignee: "", deadline: "" },
        { title: "Testing & QA", assignee: "", deadline: "" },
        { title: "Deployment", assignee: "", deadline: "" }
      ]
    },
    {
      id: "tpl-2",
      name: "Report Submission Template",
      subtasks: [
        { title: "Pengumpulan Data", assignee: "", deadline: "" },
        { title: "Penyusunan Draft", assignee: "", deadline: "" },
        { title: "Review & Revisi", assignee: "", deadline: "" },
        { title: "Finalisasi Dokumen", assignee: "", deadline: "" }
      ]
    }
  ];
  
  for (var n = 0; n < defaultTemplates.length; n++) {
    saveRow('templates', defaultTemplates[n]);
  }
  
  return "Database successfully seeded. Default login credentials: budi.s@pertamina.com / Pertamina123!";
}

// Auth Handlers
function handleLogin(email, password) {
  var users = getSheetData('users');
  var passwordHash = sha256(password);
  
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      if (user.password === passwordHash) {
        if (user.status === 'Inactive') {
          throw new Error('Akun Anda masih berstatus Inactive. Hubungi PIC untuk aktivasi.');
        }
        // Return user profile without password hash
        delete user.password;
        return user;
      } else {
        throw new Error('Password salah.');
      }
    }
  }
  throw new Error('Email tidak terdaftar.');
}

function handleRegister(formData) {
  var users = getSheetData('users');
  for (var i = 0; i < users.length; i++) {
    if (users[i].email.toLowerCase() === formData.email.toLowerCase()) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
    }
  }
  
  var newUser = {
    id: "usr-" + Date.now().toString(36),
    name: formData.name,
    email: formData.email,
    password: sha256(formData.password),
    role: formData.role || 'Assignee',
    department: formData.department || '',
    company: formData.company || '',
    phone: formData.phone || '',
    photoURL: formData.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(formData.name),
    status: 'Inactive' // Standard initial registration state
  };
  
  saveRow('users', newUser);
  
  delete newUser.password;
  return newUser;
}

// Sheets Read & Write core utilities
function getSheetData(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function saveRow(sheetName, obj) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error('ID column not found in sheet: ' + sheetName);
  
  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(obj.id)) {
      rowIndex = i + 1; // 1-based, offset header row
      break;
    }
  }
  
  var rowValues = [];
  for (var j = 0; j < headers.length; j++) {
    var key = headers[j];
    var val = obj[key];
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    }
    rowValues.push(val === undefined || val === null ? "" : val);
  }
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return obj;
}

function handleDeleteRow(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIndex = headers.indexOf('id');
  if (idIndex === -1) return false;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// Fetch All Collections Action
function handleGetAllData() {
  var tables = ['users', 'tasks', 'kpis', 'events', 'templates', 'notifications', 'logs', 'subtasks'];
  var data = {};
  
  for (var i = 0; i < tables.length; i++) {
    var tableName = tables[i];
    var list = getSheetData(tableName);
    
    // Post-process rows (decode JSON-encoded fields)
    for (var j = 0; j < list.length; j++) {
      list[j] = parseRow(tableName, list[j]);
    }
    data[tableName] = list;
  }
  
  return data;
}

function isNotificationForUser(notification, userId) {
  if (!userId) return false;
  var recipientId = notification.recipientUserId || notification.userId;
  return String(recipientId) === String(userId);
}

function isNotificationUnread(notification) {
  return !(notification.isRead === true || String(notification.isRead).toLowerCase() === 'true');
}

function handleGetNotifications(userId) {
  var notifications = getSheetData('notifications');
  var filtered = [];

  for (var i = 0; i < notifications.length; i++) {
    var parsed = parseRow('notifications', notifications[i]);
    if (isNotificationForUser(parsed, userId)) {
      filtered.push(parsed);
    }
  }

  return { notifications: filtered };
}

function parseRow(sheetName, row) {
  if (sheetName === 'tasks') {
    if (row.subtasks) {
      try { row.subtasks = JSON.parse(row.subtasks); } catch(e) { row.subtasks = []; }
    } else {
      row.subtasks = [];
    }
    row.isEvent = (row.isEvent === true || String(row.isEvent).toLowerCase() === 'true');
    row.progress = Number(row.progress) || 0;
  }
  
  if (sheetName === 'templates') {
    if (row.subtasks) {
      try { row.subtasks = JSON.parse(row.subtasks); } catch(e) { row.subtasks = []; }
    } else {
      row.subtasks = [];
    }
  }
  
  if (sheetName === 'events') {
    if (row.participants) {
      try { row.participants = JSON.parse(row.participants); } catch(e) { row.participants = []; }
    } else {
      row.participants = [];
    }
  }
  
  if (sheetName === 'notifications') {
    row.isRead = (row.isRead === true || String(row.isRead).toLowerCase() === 'true');
    if (row.meta) {
      try { row.meta = JSON.parse(row.meta); } catch (e) { row.meta = {}; }
    } else {
      row.meta = {};
    }
    if (row.timestamp !== "" && row.timestamp !== null && row.timestamp !== undefined) {
      row.timestamp = Number(row.timestamp) || row.timestamp;
    }
    if (row.createdAt !== "" && row.createdAt !== null && row.createdAt !== undefined) {
      row.createdAt = Number(row.createdAt) || row.createdAt;
    }
  }
  
  if (sheetName === 'logs') {
    if (row.documents) {
      try { row.documents = JSON.parse(row.documents); } catch (e) { row.documents = []; }
    } else {
      row.documents = [];
    }
    if (row.createdAt !== "" && row.createdAt !== null && row.createdAt !== undefined) {
      row.createdAt = Number(row.createdAt) || row.createdAt;
    }
  }

  if (sheetName === 'subtasks') {
    var jsonFields = ['evidenceUrls', 'evidenceLinks', 'approvedEvidenceKeys', 'comments'];
    for (var f = 0; f < jsonFields.length; f++) {
      var key = jsonFields[f];
      if (row[key]) {
        try { row[key] = JSON.parse(row[key]); } catch (e) { row[key] = []; }
      } else {
        row[key] = [];
      }
    }
  }

  // Remove password field if it leaks anywhere
  if (sheetName === 'users' && row.password) {
    delete row.password;
  }
  
  return row;
}

// Specific Table Handlers

// Hitung progress (persentase subtask completed) — selaras dgn frontend.
function computeProgress(list) {
  if (!list || !list.length) return 0;
  var completed = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].status === 'completed') completed++;
  }
  return Math.round((completed / list.length) * 100);
}

function getExistingTaskCell(taskId, column) {
  var rows = getSheetData('tasks');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(taskId)) return rows[i][column];
  }
  return '';
}

// Hitung ulang progress parent dari baris-baris sheet subtasks, lalu update sel
// progress di sheet tasks (kolom legacy subtasks dipertahankan apa adanya).
function recalcParentProgress(parentId) {
  var rows = getSheetData('subtasks');
  var mine = [];
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].parentId) === String(parentId)) mine.push(rows[i]);
  }
  var progress = computeProgress(mine);
  var tasks = getSheetData('tasks');
  for (var j = 0; j < tasks.length; j++) {
    if (String(tasks[j].id) === String(parentId)) {
      tasks[j].progress = progress;
      saveRow('tasks', tasks[j]);
      break;
    }
  }
  return progress;
}

// Hapus semua baris subtask milik satu parent (bottom-up agar indeks tak geser).
function deleteSubtaskRowsForParent(parentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('subtasks');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  var pIdx = data[0].indexOf('parentId');
  if (pIdx === -1) return;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][pIdx]) === String(parentId)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deleteSubtaskRow(id, parentId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('subtasks');
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;
  var idIdx = data[0].indexOf('id');
  var pIdx = data[0].indexOf('parentId');
  if (idIdx === -1) return false;
  for (var i = data.length - 1; i >= 1; i--) {
    var matchId = String(data[i][idIdx]) === String(id);
    var matchParent = (parentId === undefined || parentId === null || parentId === '')
      ? true : String(data[i][pIdx]) === String(parentId);
    if (matchId && matchParent) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// Ganti seluruh subtask milik parent dengan set baru (dipakai jalur kompatibilitas
// frontend lama yang mengirim task + array subtasks lengkap).
function replaceSubtasksForParent(parentId, subtasksArray) {
  deleteSubtaskRowsForParent(parentId);
  var list = Array.isArray(subtasksArray) ? subtasksArray : [];
  for (var i = 0; i < list.length; i++) {
    if (!list[i]) continue;
    list[i].parentId = parentId;
    saveRow('subtasks', list[i]);
  }
}

// Simpan task. Kolom legacy tasks.subtasks TIDAK pernah ditimpa (backup beku).
// Jika payload masih membawa array subtasks (frontend lama), array itu
// disinkronkan ke sheet subtasks agar tulisannya tetap mendarat di model baru.
function handleSaveTask(task) {
  return withScriptLock(function() {
    var incomingSubtasks = (task && Object.prototype.hasOwnProperty.call(task, 'subtasks') && Array.isArray(task.subtasks))
      ? task.subtasks : null;

    var taskToSave = {};
    for (var k in task) {
      if (k === 'subtasks') continue;
      taskToSave[k] = task[k];
    }
    taskToSave.subtasks = getExistingTaskCell(task.id, 'subtasks');
    saveRow('tasks', taskToSave);

    if (incomingSubtasks !== null) {
      replaceSubtasksForParent(task.id, incomingSubtasks);
      recalcParentProgress(task.id);
    }
    return taskToSave;
  });
}

// Hapus task beserta seluruh subtask-nya (cascade).
function handleDeleteTask(id) {
  return withScriptLock(function() {
    deleteSubtaskRowsForParent(id);
    handleDeleteRow('tasks', id);
    return true;
  });
}

// Upsert satu subtask (jalur utama frontend baru) + hitung ulang progress parent.
function handleSaveSubtask(subtask) {
  return withScriptLock(function() {
    saveRow('subtasks', subtask);
    if (subtask && subtask.parentId) recalcParentProgress(subtask.parentId);
    return subtask;
  });
}

function handleDeleteSubtask(id, parentId) {
  return withScriptLock(function() {
    deleteSubtaskRow(id, parentId);
    if (parentId) recalcParentProgress(parentId);
    return true;
  });
}

// Buat task baru + banyak subtask dalam satu request (mis. project dari template).
function handleCreateTaskWithSubtasks(task, subtasks) {
  return withScriptLock(function() {
    var list = Array.isArray(subtasks) ? subtasks : [];
    var taskToSave = {};
    for (var k in task) {
      if (k === 'subtasks') continue;
      taskToSave[k] = task[k];
    }
    taskToSave.subtasks = '';
    taskToSave.progress = computeProgress(list);
    saveRow('tasks', taskToSave);
    for (var i = 0; i < list.length; i++) {
      if (!list[i]) continue;
      list[i].parentId = task.id;
      saveRow('subtasks', list[i]);
    }
    return { task: taskToSave, subtasks: list };
  });
}

function handleSaveKPI(kpi) {
  return saveRow('kpis', kpi);
}

function handleSaveEvent(event) {
  return saveRow('events', event);
}

function handleSaveTemplate(template) {
  return saveRow('templates', template);
}

function handleUpdateUser(user) {
  // Retain password hash if it isn't provided
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('users');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = headers.indexOf('id');
  var passIdx = headers.indexOf('password');
  
  var existingHash = "";
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(user.id)) {
      existingHash = data[i][passIdx];
      break;
    }
  }
  
  var userToSave = { ...user };
  if (!userToSave.password && existingHash) {
    userToSave.password = existingHash;
  } else if (userToSave.password) {
    userToSave.password = sha256(userToSave.password);
  }
  
  saveRow('users', userToSave);
  delete userToSave.password;
  return userToSave;
}

function handleCreateNotifications(notificationsList) {
  for (var i = 0; i < notificationsList.length; i++) {
    saveRow('notifications', notificationsList[i]);
  }
  return notificationsList;
}

function handleAddLogs(logsList) {
  if (!logsList || !logsList.length) return [];
  for (var i = 0; i < logsList.length; i++) {
    saveRow('logs', logsList[i]);
  }
  return logsList;
}

function handleMarkNotificationRead(id) {
  var notifications = getSheetData('notifications');
  for (var i = 0; i < notifications.length; i++) {
    if (String(notifications[i].id) === String(id)) {
      notifications[i].isRead = true;
      saveRow('notifications', notifications[i]);
      return true;
    }
  }
  return false;
}

function handleMarkAllNotificationsRead(userId) {
  var notifications = getSheetData('notifications');
  var count = 0;
  for (var i = 0; i < notifications.length; i++) {
    if (isNotificationForUser(notifications[i], userId) && isNotificationUnread(notifications[i])) {
      notifications[i].isRead = true;
      saveRow('notifications', notifications[i]);
      count++;
    }
  }
  return count;
}

// Drive File Upload
function handleUploadFile(filename, mimeType, base64Data) {
  var folderName = "ActionTracker_Uploads";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, filename);
  var file = folder.createFile(blob);
  
  // Set sharing permissions so anyone with link can view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Generate download URL
  var directDownloadUrl = "https://drive.google.com/uc?export=download&id=" + file.getId();
  
  return {
    id: file.getId(),
    name: file.getName(),
    url: directDownloadUrl,
    webViewLink: file.getUrl()
  };
}
