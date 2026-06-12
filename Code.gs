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
      case 'saveTask':
        result = handleSaveTask(requestData.task);
        break;
      case 'deleteTask':
        result = handleDeleteRow('tasks', requestData.id);
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

// Check and create sheets
function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var schemas = {
    'users': ['id', 'name', 'email', 'password', 'role', 'department', 'company', 'phone', 'photoURL', 'status'],
    'tasks': ['id', 'title', 'description', 'pic', 'deadline', 'progress', 'isEvent', 'subtasks'],
    'kpis': ['id', 'title', 'group'],
    'events': ['id', 'title', 'startDate', 'endDate', 'location', 'participants', 'linkedTaskId', 'eventType'],
    'templates': ['id', 'name', 'subtasks'],
    'notifications': ['id', 'userId', 'message', 'timestamp', 'isRead', 'taskId']
  };
  
  for (var sheetName in schemas) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
      // Format headers bold
      sheet.getRange(1, 1, 1, schemas[sheetName].length).setFontWeight('bold');
    }
  }
}

// Initial Seeding logic
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Clear other than headers first
  var sheets = ['users', 'tasks', 'kpis', 'events', 'templates', 'notifications'];
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
  
  for (var k = 0; k < defaultTasks.length; k++) {
    saveRow('tasks', defaultTasks[k]);
  }
  
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
  var tables = ['users', 'tasks', 'kpis', 'events', 'templates', 'notifications'];
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
  }
  
  // Remove password field if it leaks anywhere
  if (sheetName === 'users' && row.password) {
    delete row.password;
  }
  
  return row;
}

// Specific Table Handlers
function handleSaveTask(task) {
  return saveRow('tasks', task);
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
