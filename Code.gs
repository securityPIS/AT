/**
 * Action Tracker Apps Script Backend API
 * Placed in Google Apps Script Editor of your Google Spreadsheet.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty request payload" });
    }

    var body;
    try { body = JSON.parse(e.postData.contents); } catch(parseErr) {
      return createJsonResponse({ success: false, error: "Invalid JSON payload" });
    }

    // Telegram webhook: Telegram menyertakan update_id pada setiap update
    if (body.update_id !== undefined) {
      return handleTelegramUpdate(body);
    }

    var requestData = body;
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
      case 'saveTask':
        result = handleSaveTask(requestData.task);
        break;
      case 'deleteTask':
        result = handleDeleteTask(requestData.id, requestData.actorName);
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
var SCHEMA_VERSION = 'v6';

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
    'subtasks': SUBTASK_HEADERS,
    'telegram_sessions': ['id', 'telegramUserId', 'telegramChatId', 'userId', 'userName', 'linkedAt'],
    'telegram_groups': ['id', 'chatId', 'title', 'subscribedBy', 'subscribedAt']
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
      var oldProgress = Number(tasks[j].progress) || 0;
      tasks[j].progress = progress;
      saveRow('tasks', tasks[j]);
      // Broadcast task completion saat progress baru menyentuh 100%
      if (oldProgress < 100 && progress >= 100) {
        try { broadcastToGroups(tgMsgTaskCompleted(tasks[j])); } catch(e) {}
      }
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
function handleDeleteTask(id, actorName) {
  return withScriptLock(function() {
    // Ambil judul task sebelum dihapus untuk notifikasi
    var tasks = getSheetData('tasks');
    var taskTitle = '';
    for (var i = 0; i < tasks.length; i++) {
      if (String(tasks[i].id) === String(id)) { taskTitle = tasks[i].title; break; }
    }
    deleteSubtaskRowsForParent(id);
    handleDeleteRow('tasks', id);
    if (taskTitle) {
      try { broadcastToGroups(tgMsgTaskDeleted(taskTitle, actorName || 'Seseorang')); } catch(e) {}
    }
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
  var isNew = !tgRowExists('events', event.id);
  var result = saveRow('events', event);
  if (isNew) {
    try { broadcastToGroups(tgMsgNewEvent(event)); } catch(e) {}
  }
  return result;
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
  // Broadcast ke grup Telegram untuk event yang relevan
  for (var j = 0; j < logsList.length; j++) {
    try { tgBroadcastLogEvent(logsList[j]); } catch(e) {}
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
    if (String(notifications[i].userId) === String(userId) && !notifications[i].isRead) {
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

// =============================================================
// TELEGRAM REALTIME BROADCAST
// =============================================================

// Kirim pesan ke semua grup yang berlangganan (telegram_groups).
function broadcastToGroups(message) {
  var groups = getSheetData('telegram_groups');
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].chatId) sendTelegramMessage(String(groups[i].chatId), message);
  }
}

// Cek apakah row dengan id tertentu sudah ada di sheet.
function tgRowExists(sheetName, id) {
  var rows = getSheetData(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) return true;
  }
  return false;
}

// Routing broadcast berdasarkan action di log entry.
function tgBroadcastLogEvent(log) {
  var msg = null;
  switch (log.action) {
    case 'subtask_created':  msg = tgMsgSubtaskCreated(log);  break;
    case 'subtask_deleted':  msg = tgMsgSubtaskDeleted(log);  break;
    case 'subtask_approved': msg = tgMsgSubtaskApproved(log); break;
  }
  if (msg) broadcastToGroups(msg);
}

// ---- Message builders ----

function tgMsgSubtaskCreated(log) {
  var subtasks = getSheetData('subtasks');
  var subtask = null;
  for (var i = 0; i < subtasks.length; i++) {
    if (subtasks[i].id === log.subtaskId) { subtask = subtasks[i]; break; }
  }
  var tasks = getSheetData('tasks');
  var taskTitle = log.taskId;
  for (var j = 0; j < tasks.length; j++) {
    if (tasks[j].id === log.taskId) { taskTitle = tasks[j].title; break; }
  }
  var lines = [
    '🆕 *Subtask Baru Dibuat*',
    '📁 Task: ' + taskTitle,
    '📌 Subtask: *' + (log.subtaskTitle || 'Tanpa nama') + '*'
  ];
  if (subtask) {
    lines.push('👤 Assignee: ' + (subtask.assignee || '-'));
    lines.push('📅 Deadline: ' + (subtask.deadline || '-'));
  }
  if (log.actorName) lines.push('✍️ Dibuat oleh: ' + log.actorName);
  return lines.join('\n');
}

function tgMsgSubtaskDeleted(log) {
  var tasks = getSheetData('tasks');
  var taskTitle = log.taskId;
  for (var j = 0; j < tasks.length; j++) {
    if (tasks[j].id === log.taskId) { taskTitle = tasks[j].title; break; }
  }
  var lines = [
    '🗑️ *Subtask Dihapus*',
    '📁 Task: ' + taskTitle,
    '📌 Subtask: ' + (log.subtaskTitle || log.subtaskId)
  ];
  if (log.actorName) lines.push('✍️ Dihapus oleh: ' + log.actorName);
  return lines.join('\n');
}

function tgMsgTaskDeleted(taskTitle, actorName) {
  return [
    '🗑️ *Task Dihapus*',
    '📁 Task: ' + taskTitle,
    '✍️ Dihapus oleh: ' + (actorName || 'Seseorang')
  ].join('\n');
}

function tgMsgSubtaskApproved(log) {
  var subtasks = getSheetData('subtasks');
  var subtask = null;
  for (var i = 0; i < subtasks.length; i++) {
    if (subtasks[i].id === log.subtaskId) { subtask = subtasks[i]; break; }
  }
  var tasks = getSheetData('tasks');
  var taskTitle = log.taskId;
  for (var j = 0; j < tasks.length; j++) {
    if (tasks[j].id === log.taskId) { taskTitle = tasks[j].title; break; }
  }
  var lines = [
    '✅ *Subtask Disetujui!*',
    '📁 Task: ' + taskTitle,
    '📌 Subtask: *' + (log.subtaskTitle || log.subtaskId) + '*'
  ];
  if (subtask && subtask.assignee) lines.push('👤 Assignee: ' + subtask.assignee);
  if (log.actorName) lines.push('✍️ Disetujui oleh: ' + log.actorName);
  return lines.join('\n');
}

function tgMsgNewEvent(event) {
  var participants = event.participants;
  if (typeof participants === 'string') {
    try { participants = JSON.parse(participants); } catch(e) { participants = []; }
  }
  var lines = [
    '📅 *Event Baru*',
    '🎯 ' + (event.title || 'Tanpa judul')
  ];
  if (event.startDate) {
    var dateStr = event.startDate + (event.endDate && event.endDate !== event.startDate ? ' s/d ' + event.endDate : '');
    lines.push('📆 ' + dateStr);
  }
  if (event.location) lines.push('📍 ' + event.location);
  if (Array.isArray(participants) && participants.length) {
    var peserta = participants.slice(0, 5).join(', ');
    if (participants.length > 5) peserta += ' (+' + (participants.length - 5) + ' lainnya)';
    lines.push('👥 ' + peserta);
  }
  if (event.eventType) lines.push('🏷️ Tipe: ' + event.eventType);
  return lines.join('\n');
}

function tgMsgTaskCompleted(task) {
  return [
    '🎉 *Task Selesai!*',
    '📁 ' + (task.title || task.id),
    '👤 PIC: ' + (task.pic || '-'),
    '✅ Semua subtask telah diselesaikan'
  ].join('\n');
}

// =============================================================
// TELEGRAM BOT INTEGRATION (Command-based, no external AI)
// =============================================================

function handleTelegramUpdate(update) {
  var message = update.message || update.edited_message;
  if (!message || !message.text) return createJsonResponse({ ok: true });

  var from = message.from || {};
  var ctx = {
    chatId: String(message.chat.id),
    chatType: message.chat.type,                 // 'private' | 'group' | 'supergroup'
    chatTitle: message.chat.title || '',
    fromId: from.id !== undefined ? String(from.id) : null,
    fromName: ((from.first_name || '') + (from.last_name ? ' ' + from.last_name : '')).trim() || (from.username || 'Unknown')
  };
  var text = message.text.trim();

  try {
    initSheets();
    var reply = dispatchTelegramCommand(ctx, text);
    if (reply) sendTelegramMessage(ctx.chatId, reply);
  } catch (err) {
    sendTelegramMessage(ctx.chatId, '❌ Error: ' + err.message);
  }

  return createJsonResponse({ ok: true });
}

function dispatchTelegramCommand(ctx, text) {
  var parts = text.split(/\s+/);
  // Strip @botname suffix (e.g. /start@MyBot)
  var cmd = parts[0].toLowerCase().split('@')[0];

  switch (cmd) {
    case '/start':  return tgCmdStart();
    case '/help':   return tgCmdHelp();
    case '/login':  return tgCmdLogin(ctx, parts[1], parts[2]);
    case '/logout': return tgCmdLogout(ctx);
    case '/whoami': return tgCmdWhoami(ctx);
    case '/tasks':  return tgCmdTasks(ctx);
    case '/mysubtasks': return tgCmdMySubtasks(ctx);
    case '/detail': return tgCmdDetail(ctx, parts[1]);
    case '/done':   return tgCmdDone(ctx, parts[1]);
    case '/update': return tgCmdUpdate(ctx, parts[1], parts[2]);
    case '/note':   return tgCmdNote(ctx, parts[1], parts.slice(2).join(' '));
    case '/subscribe':   return tgCmdSubscribe(ctx);
    case '/unsubscribe': return tgCmdUnsubscribe(ctx);
    case '/digest': return tgCmdDigestNow(ctx);
    default:        return '❓ Perintah tidak dikenali. Ketik /help untuk daftar perintah.';
  }
}

// ---- Auth ----

function tgCmdStart() {
  return (
    '👋 *Selamat datang di Action Tracker Bot!*\n\n' +
    'Bot ini membantu Anda memantau dan update subtask langsung dari Telegram.\n\n' +
    'Mulai dengan menghubungkan akun:\n' +
    '`/login email@example.com password`\n\n' +
    'Ketik /help untuk daftar perintah lengkap.'
  );
}

function tgCmdHelp() {
  return (
    '📋 *Perintah Action Tracker Bot*\n\n' +
    '*Auth (lakukan di chat privat dgn bot):*\n' +
    '`/login <email> <password>` — Hubungkan akun\n' +
    '`/logout` — Putuskan sesi\n' +
    '`/whoami` — Info akun aktif\n\n' +
    '*Lihat Data:*\n' +
    '`/tasks` — Daftar task Anda\n' +
    '`/mysubtasks` — Subtask yang ditugaskan ke Anda\n' +
    '`/detail <task-id>` — Subtask dari satu task\n\n' +
    '*Update:*\n' +
    '`/done <subtask-id>` — Tandai subtask selesai\n' +
    '`/update <subtask-id> <status>` — Ubah status\n' +
    '  Status: `pending` | `waiting\\_review` | `revision` | `completed`\n' +
    '`/note <subtask-id> <teks>` — Tambah komentar ke subtask\n\n' +
    '*Grup (jalankan di dalam grup):*\n' +
    '`/subscribe` — Aktifkan digest harian jam 6 pagi di grup ini\n' +
    '`/unsubscribe` — Matikan digest harian\n' +
    '`/digest` — Kirim ringkasan task belum selesai sekarang'
  );
}

function tgCmdLogin(ctx, email, password) {
  if (!ctx.fromId) return '⚠️ Tidak dapat mengenali identitas pengirim.';
  // Keamanan: di grup, pesan password terlihat semua anggota. Arahkan ke privat.
  if (ctx.chatType !== 'private') {
    return '🔒 Demi keamanan, lakukan `/login` di *chat privat* dengan bot (jangan di grup — password Anda akan terlihat anggota lain). Setelah login di privat, Anda otomatis dikenali di semua grup.';
  }
  if (!email || !password) {
    return '⚠️ Format: `/login email@example.com password`';
  }
  try {
    var user = handleLogin(email, password);
    // Sesi dikunci ke Telegram USER id (from.id), bukan chat id — agar identitas
    // pengirim tetap dikenali di grup mana pun.
    var session = {
      id: 'tg-' + ctx.fromId,
      telegramUserId: ctx.fromId,
      telegramChatId: ctx.chatId,
      userId: user.id,
      userName: user.name,
      linkedAt: new Date().toISOString()
    };
    saveRow('telegram_sessions', session);
    return '✅ Login berhasil sebagai *' + user.name + '* (' + user.role + ')\nAnda kini dikenali di semua grup yang memakai bot ini.';
  } catch (err) {
    return '❌ Login gagal: ' + err.message;
  }
}

function tgCmdLogout(ctx) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Anda belum login.';
  handleDeleteRow('telegram_sessions', 'tg-' + ctx.fromId);
  return '👋 Sesi berhasil dihapus. Sampai jumpa!';
}

function tgCmdWhoami(ctx) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Belum login. Gunakan `/login email password` di chat privat bot.';
  var users = getSheetData('users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === session.userId) { user = users[i]; break; }
  }
  if (!user) return '⚠️ Akun tidak ditemukan. Silakan `/login` ulang.';
  return (
    '👤 *Info Akun*\n' +
    'Nama: ' + user.name + '\n' +
    'Email: ' + user.email + '\n' +
    'Role: ' + user.role + '\n' +
    'Departemen: ' + (user.department || '-')
  );
}

// ---- View Commands ----

function tgCmdTasks(ctx) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Belum login. Gunakan `/login email password` di chat privat bot.';
  var user = getTgUser(session.userId);
  if (!user) return '⚠️ Akun tidak ditemukan.';

  var tasks = getSheetData('tasks');
  var subtasks = getSheetData('subtasks');

  var myTasks = [];
  for (var t = 0; t < tasks.length; t++) {
    var task = tasks[t];
    if (task.pic === user.name) { myTasks.push(task); continue; }
    for (var s = 0; s < subtasks.length; s++) {
      if (subtasks[s].parentId === task.id && subtasks[s].assignee === user.name) {
        myTasks.push(task); break;
      }
    }
  }

  if (!myTasks.length) return '💭 Tidak ada task untuk Anda saat ini.';

  var lines = ['📁 *Task Anda (' + myTasks.length + '):*\n'];
  for (var m = 0; m < myTasks.length; m++) {
    var tk = myTasks[m];
    var pct = Number(tk.progress) || 0;
    lines.push((m + 1) + '. *' + tk.title + '*');
    lines.push('   ID: `' + tk.id + '`  |  ' + tgProgressBar(pct) + ' ' + pct + '%');
    lines.push('   Deadline: ' + (tk.deadline || '-'));
    if (m < myTasks.length - 1) lines.push('');
  }
  lines.push('\n_Lihat subtask: `/detail <task-id>`_');
  return lines.join('\n');
}

function tgCmdMySubtasks(ctx) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Belum login. Gunakan `/login email password` di chat privat bot.';
  var user = getTgUser(session.userId);
  if (!user) return '⚠️ Akun tidak ditemukan.';

  var subtasks = getSheetData('subtasks');
  var tasks = getSheetData('tasks');
  var tasksMap = {};
  for (var t = 0; t < tasks.length; t++) tasksMap[tasks[t].id] = tasks[t].title;

  var mine = [];
  for (var s = 0; s < subtasks.length; s++) {
    if (subtasks[s].assignee === user.name) mine.push(subtasks[s]);
  }
  if (!mine.length) return '💭 Tidak ada subtask yang ditugaskan ke Anda.';

  var statusEmoji = { pending: '⏳', waiting_review: '🔍', revision: '🔄', completed: '✅' };
  var lines = ['📋 *Subtask Anda (' + mine.length + '):*\n'];
  var limit = Math.min(mine.length, 10);
  for (var m = 0; m < limit; m++) {
    var st = mine[m];
    var emoji = statusEmoji[st.status] || '❓';
    lines.push(emoji + ' *' + st.title + '*');
    lines.push('   ID: `' + st.id + '`');
    lines.push('   Task: ' + (tasksMap[st.parentId] || st.parentId));
    lines.push('   Deadline: ' + (st.deadline || '-'));
    if (m < limit - 1) lines.push('');
  }
  if (mine.length > 10) lines.push('\n_...dan ' + (mine.length - 10) + ' subtask lainnya_');
  return lines.join('\n');
}

function tgCmdDetail(ctx, taskId) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Belum login. Gunakan `/login email password` di chat privat bot.';
  if (!taskId) return '⚠️ Format: `/detail <task-id>`\nContoh: `/detail task-101`';

  var tasks = getSheetData('tasks');
  var task = null;
  for (var t = 0; t < tasks.length; t++) {
    if (tasks[t].id === taskId) { task = tasks[t]; break; }
  }
  if (!task) return '❌ Task `' + taskId + '` tidak ditemukan.';

  var subtasks = getSheetData('subtasks');
  var children = [];
  for (var s = 0; s < subtasks.length; s++) {
    if (subtasks[s].parentId === taskId) children.push(subtasks[s]);
  }

  var statusEmoji = { pending: '⏳', waiting_review: '🔍', revision: '🔄', completed: '✅' };
  var pct = Number(task.progress) || 0;
  var lines = [
    '📁 *' + task.title + '*',
    'PIC: ' + task.pic + '  |  Deadline: ' + (task.deadline || '-'),
    'Progress: ' + tgProgressBar(pct) + ' ' + pct + '%',
    '\n*Subtask (' + children.length + '):*'
  ];

  for (var i = 0; i < children.length; i++) {
    var c = children[i];
    var emoji = statusEmoji[c.status] || '❓';
    lines.push('');
    lines.push(emoji + ' *' + c.title + '*');
    lines.push('   ID: `' + c.id + '`  |  ' + (c.assignee || '-'));
    lines.push('   Status: ' + c.status + '  |  Deadline: ' + (c.deadline || '-'));
  }
  return lines.join('\n');
}

// ---- Update Commands ----

function tgCmdDone(ctx, subtaskId) {
  return tgCmdUpdate(ctx, subtaskId, 'completed');
}

function tgCmdUpdate(ctx, subtaskId, newStatus) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Belum login. Gunakan `/login email password` di chat privat bot.';
  if (!subtaskId) return '⚠️ Format: `/update <subtask-id> <status>`';

  var validStatuses = ['pending', 'waiting_review', 'revision', 'completed'];
  if (!newStatus || validStatuses.indexOf(newStatus.toLowerCase()) === -1) {
    return (
      '⚠️ Status tidak valid.\n' +
      'Pilihan: `pending` | `waiting\\_review` | `revision` | `completed`'
    );
  }
  newStatus = newStatus.toLowerCase();

  var user = getTgUser(session.userId);
  if (!user) return '⚠️ Akun tidak ditemukan.';

  var subtasks = getSheetData('subtasks');
  var subtask = null;
  for (var s = 0; s < subtasks.length; s++) {
    if (subtasks[s].id === subtaskId) { subtask = subtasks[s]; break; }
  }
  if (!subtask) return '❌ Subtask `' + subtaskId + '` tidak ditemukan.';

  var tasks = getSheetData('tasks');
  var parentTask = null;
  for (var t = 0; t < tasks.length; t++) {
    if (tasks[t].id === subtask.parentId) { parentTask = tasks[t]; break; }
  }

  var isAssignee = subtask.assignee === user.name;
  var isPIC = parentTask && parentTask.pic === user.name;
  if (!isAssignee && !isPIC) {
    return '🚫 Anda tidak memiliki izin untuk mengubah subtask ini.\n' +
           'Hanya assignee (' + (subtask.assignee || '-') + ') atau PIC yang bisa update.';
  }

  var oldStatus = subtask.status;
  subtask.status = newStatus;
  subtask.lastUpdated = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  handleSaveSubtask(subtask);

  // Audit: catat siapa yang melakukan update (identitas pengirim Telegram).
  tgLogActivity(subtask, parentTask, user, 'subtask_updated',
    user.name + ' mengubah status "' + subtask.title + '" dari ' + oldStatus + ' ke ' + newStatus + ' via Telegram (' + ctx.fromName + ')');

  var statusEmoji = { pending: '⏳', waiting_review: '🔍', revision: '🔄', completed: '✅' };
  return (
    '✅ *Subtask diupdate!*\n\n' +
    'Subtask: *' + subtask.title + '*\n' +
    'Status: ' + (statusEmoji[oldStatus] || '') + ' ' + oldStatus +
    ' → ' + (statusEmoji[newStatus] || '') + ' ' + newStatus + '\n' +
    'Oleh: ' + user.name + '\n' +
    'Waktu: ' + subtask.lastUpdated
  );
}

function tgCmdNote(ctx, subtaskId, noteText) {
  var session = getTelegramSession(ctx.fromId);
  if (!session) return '⚠️ Belum login. Gunakan `/login email password` di chat privat bot.';
  if (!subtaskId || !noteText) return '⚠️ Format: `/note <subtask-id> <teks catatan>`';

  var user = getTgUser(session.userId);
  if (!user) return '⚠️ Akun tidak ditemukan.';

  var subtasks = getSheetData('subtasks');
  var subtask = null;
  for (var s = 0; s < subtasks.length; s++) {
    if (subtasks[s].id === subtaskId) { subtask = subtasks[s]; break; }
  }
  if (!subtask) return '❌ Subtask `' + subtaskId + '` tidak ditemukan.';

  var comments = [];
  if (subtask.comments) {
    try { comments = JSON.parse(subtask.comments); } catch (e) { comments = []; }
  }
  if (!Array.isArray(comments)) comments = [];

  comments.push({
    text: noteText,
    user: user.name,
    type: 'note',
    timestamp: Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm')
  });

  subtask.comments = JSON.stringify(comments);
  subtask.lastUpdated = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
  handleSaveSubtask(subtask);

  return '💬 Catatan berhasil ditambahkan ke subtask *' + subtask.title + '*';
}

// ---- Group subscription + daily digest ----

// Daftarkan grup untuk menerima digest harian. Hanya boleh di dalam grup.
function tgCmdSubscribe(ctx) {
  if (ctx.chatType !== 'group' && ctx.chatType !== 'supergroup') {
    return 'ℹ️ Perintah `/subscribe` hanya berlaku di dalam grup. Tambahkan bot ke grup lalu jalankan `/subscribe` di sana.';
  }
  var session = getTelegramSession(ctx.fromId);
  var subscribedBy = session ? session.userName : ctx.fromName;
  saveRow('telegram_groups', {
    id: 'grp-' + ctx.chatId,
    chatId: ctx.chatId,
    title: ctx.chatTitle || '',
    subscribedBy: subscribedBy,
    subscribedAt: new Date().toISOString()
  });
  return '✅ Grup *' + (ctx.chatTitle || 'ini') + '* berlangganan digest harian.\n' +
         'Setiap pagi *jam 06:00 WIB* bot akan mengirim daftar task yang belum selesai.\n\n' +
         '_Coba sekarang dengan `/digest`._';
}

function tgCmdUnsubscribe(ctx) {
  if (ctx.chatType !== 'group' && ctx.chatType !== 'supergroup') {
    return 'ℹ️ Perintah `/unsubscribe` hanya berlaku di dalam grup.';
  }
  var ok = handleDeleteRow('telegram_groups', 'grp-' + ctx.chatId);
  return ok ? '🔕 Grup ini berhenti berlangganan digest harian.'
            : '⚠️ Grup ini belum berlangganan.';
}

// Kirim digest sekarang juga (manual), ke chat tempat perintah dipanggil.
function tgCmdDigestNow(ctx) {
  return buildDailyDigestMessage();
}

// Susun pesan ringkasan semua task yang belum 100% selesai, dikelompokkan per
// task dengan rincian subtask yang belum completed + penanda overdue.
function buildDailyDigestMessage() {
  var tasks = getSheetData('tasks');
  var subtasks = getSheetData('subtasks');

  // Kelompokkan subtask per parent
  var byParent = {};
  for (var s = 0; s < subtasks.length; s++) {
    var pid = subtasks[s].parentId;
    if (!byParent[pid]) byParent[pid] = [];
    byParent[pid].push(subtasks[s]);
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var statusEmoji = { pending: '⏳', waiting_review: '🔍', revision: '🔄', completed: '✅' };

  var openTasks = [];
  for (var t = 0; t < tasks.length; t++) {
    var task = tasks[t];
    if (task.isEvent === true || String(task.isEvent).toLowerCase() === 'true') continue;
    if ((Number(task.progress) || 0) >= 100) continue;
    openTasks.push(task);
  }

  var dateStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'EEEE, dd MMMM yyyy');
  if (!openTasks.length) {
    return '☀️ *Selamat Pagi!*\n' + dateStr + '\n\n🎉 Semua task sudah selesai. Tidak ada yang tertunda!';
  }

  var lines = ['☀️ *Selamat Pagi!* — ' + dateStr,
               '📋 *Task belum selesai (' + openTasks.length + '):*'];

  for (var o = 0; o < openTasks.length; o++) {
    var tk = openTasks[o];
    var children = byParent[tk.id] || [];
    var incomplete = [];
    for (var c = 0; c < children.length; c++) {
      if (children[c].status !== 'completed') incomplete.push(children[c]);
    }
    var pct = Number(tk.progress) || 0;
    lines.push('');
    lines.push('📁 *' + tk.title + '* — ' + pct + '%');
    lines.push('   PIC: ' + (tk.pic || '-') + '  |  Deadline: ' + (tk.deadline || '-'));
    for (var ic = 0; ic < incomplete.length; ic++) {
      var st = incomplete[ic];
      var emoji = statusEmoji[st.status] || '❓';
      var overdue = '';
      if (st.deadline) {
        var dl = tgParseDate(st.deadline);
        if (dl && dl < today) overdue = ' 🔴 OVERDUE';
      }
      lines.push('   ' + emoji + ' ' + st.title + ' — ' + (st.assignee || 'belum di-assign') + overdue);
    }
  }

  lines.push('\n_Update via `/done <subtask-id>` atau `/update <subtask-id> <status>`_');
  return lines.join('\n');
}

// Dipicu otomatis oleh time-based trigger. Kirim digest ke semua grup yang
// berlangganan. Buat trigger via setupDailyTrigger() (jalankan sekali).
function sendDailyDigest() {
  var groups = getSheetData('telegram_groups');
  if (!groups.length) return;
  var message = buildDailyDigestMessage();
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].chatId) sendTelegramMessage(String(groups[i].chatId), message);
  }
}

// Jalankan SEKALI dari editor Apps Script untuk memasang trigger harian jam 06:00.
// Timezone mengikuti pengaturan proyek (set ke Asia/Jakarta di Project Settings).
function setupDailyTrigger() {
  // Hapus trigger lama agar tidak dobel
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDailyDigest') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('sendDailyDigest')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
  return 'Trigger harian sendDailyDigest jam 06:00 berhasil dipasang.';
}

// Parse tanggal subtask. Mendukung 'YYYY-MM-DD' dan 'DD/MM/YYYY'.
function tgParseDate(str) {
  if (!str) return null;
  str = String(str).trim();
  var m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  var d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Tulis satu entri audit log (selaras skema sheet logs frontend).
function tgLogActivity(subtask, parentTask, actorUser, action, message) {
  try {
    var log = {
      id: 'log-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      taskId: parentTask ? parentTask.id : (subtask ? subtask.parentId : ''),
      subtaskId: subtask ? subtask.id : '',
      subtaskTitle: subtask ? subtask.title : '',
      action: action,
      actorUserId: actorUser ? actorUser.id : '',
      actorName: actorUser ? actorUser.name : '',
      message: message,
      documents: [],
      refKey: '',
      createdAt: Date.now()
    };
    handleAddLogs([log]);
  } catch (e) {
    Logger.log('tgLogActivity gagal: ' + e.message);
  }
}

// ---- Helpers ----

function getTelegramSession(telegramUserId) {
  if (!telegramUserId) return null;
  var sessions = getSheetData('telegram_sessions');
  for (var i = 0; i < sessions.length; i++) {
    if (String(sessions[i].telegramUserId) === String(telegramUserId)) return sessions[i];
  }
  return null;
}

function getTgUser(userId) {
  var users = getSheetData('users');
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) return users[i];
  }
  return null;
}

function tgProgressBar(pct) {
  var filled = Math.round(pct / 10);
  var bar = '';
  for (var i = 0; i < 10; i++) bar += (i < filled) ? '█' : '░';
  return '[' + bar + ']';
}

function sendTelegramMessage(chatId, text) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) {
    Logger.log('TELEGRAM_BOT_TOKEN belum diset di Script Properties');
    return;
  }
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    }),
    muteHttpExceptions: true
  });
}

// Jalankan fungsi ini SATU KALI dari editor Apps Script setelah deploy Web App
// untuk mendaftarkan URL GAS sebagai Telegram webhook.
function registerTelegramWebhook() {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('Set TELEGRAM_BOT_TOKEN di Script Properties terlebih dahulu.');
  var gasUrl = ScriptApp.getService().getUrl();
  var url = 'https://api.telegram.org/bot' + token + '/setWebhook';
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ url: gasUrl })
  });
  Logger.log('Telegram webhook response: ' + response.getContentText());
  return response.getContentText();
}
