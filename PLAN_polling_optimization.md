# Plan: Optimasi Polling + Navigasi Notifikasi

## Latar Belakang

Saat ini aplikasi melakukan polling **setiap 15 detik** dengan memanggil `api.getAllData()`, yang membaca **8 tabel sekaligus** dari Google Sheets (tasks, subtasks, users, kpis, events, templates, notifications, logs). Ini memberikan beban besar ke Google Apps Script quota.

Selain itu, klik notifikasi saat ini hanya melakukan navigasi ke halaman, namun **tidak me-refresh data** — sehingga konten yang dilihat user bisa sudah usang.

---

## Tujuan

1. **Kurangi beban polling** — hanya ambil tabel `notifications` setiap interval
2. **Refresh data penuh saat notifikasi diklik** — sehingga user melihat data terbaru
3. **Navigasi langsung ke target** — task, subtask, atau event yang dimaksud notifikasi

---

## Perubahan yang Diperlukan

### 1. `Code.gs` — Tambah endpoint `getNotifications`

Tambahkan `case 'getNotifications'` di switch handler dan fungsi `handleGetNotifications()`:

```javascript
// Di switch utama (sekitar baris 84):
case 'getNotifications':
  result = handleGetNotifications();
  break;

// Fungsi baru:
function handleGetNotifications() {
  var list = getSheetData('notifications');
  for (var i = 0; i < list.length; i++) {
    list[i] = parseRow('notifications', list[i]);
  }
  return { notifications: list };
}
```

**File:** `Code.gs`  
**Posisi:** Setelah `case 'markAllNotificationsRead'` (baris ~94) dan setelah fungsi `handleGetAllData` (baris ~532)

---

### 2. `googleScript.js` — Tambah `api.getNotifications()`

```javascript
// Tambahkan di blok Notifications operations (sekitar baris 110):
getNotifications: () => callAPI('getNotifications'),
```

**File:** `googleScript.js`  
**Posisi:** Baris ~110, setelah `getAllData`

---

### 3. `app.jsx` — Ganti polling + ubah `handleNotificationClick`

#### A. Ganti interval polling (baris 529–539)

**Sebelum:**
```javascript
useEffect(() => {
  if (!isLoggedIn) return undefined;
  fetchData(false);
  const interval = setInterval(() => {
    fetchData(true);       // ambil 8 tabel setiap 15 detik
  }, 15000);
  return () => clearInterval(interval);
}, [isLoggedIn]);
```

**Sesudah:**
```javascript
useEffect(() => {
  if (!isLoggedIn) return undefined;
  fetchData(false);        // full refresh saat login
  const interval = setInterval(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications((data.notifications || []).map(n => ({
        ...n,
        isRead: n.isRead === true || String(n.isRead).toLowerCase() === 'true'
      })));
    } catch (err) {
      console.error('Failed to poll notifications:', err);
    }
  }, 30000);               // interval diperpanjang ke 30 detik (beban ringan)
  return () => clearInterval(interval);
}, [isLoggedIn]);
```

> Interval bisa diperpanjang ke 30–60 detik karena request jauh lebih ringan.

---

#### B. Ubah `handleNotificationClick` (baris 1137–1172)

Tambahkan `fetchData(true)` di awal fungsi agar data selalu fresh sebelum navigasi, dan tambahkan handler untuk `targetType === 'event'` yang saat ini belum ada.

**Sesudah:**
```javascript
const handleNotificationClick = async (notification) => {
  if (!notification) return;
  setShowNotificationsPanel(false);
  markNotificationAsRead(notification.id);

  // Refresh data penuh agar konten yang dituju selalu terbaru
  await fetchData(true);

  // Navigasi ke subtask
  if (notification.targetType === 'subtask' && notification.parentTaskId) {
    const task = taskById.get(notification.parentTaskId)
      || tasks.find((t) => String(t.id) === String(notification.parentTaskId));
    const targetSubtask = task?.subtasks?.find(
      (subtask) => String(subtask.id) === String(notification.targetId)
    );
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
      setEvidenceText('');
      setExpandedSubtasks({ [targetSubtask.id]: true });
      setShowUserTaskDetailModal(true);
    }
    return;
  }

  // Navigasi ke task
  if (notification.targetType === 'task' && notification.targetId) {
    setSelectedTaskId(notification.targetId);
    setActivePage('jobtask');
    setShowMobileDetail(true);
    return;
  }

  // Navigasi ke event (baru — sebelumnya tidak ada)
  if (notification.targetType === 'event' && notification.targetId) {
    const targetEvent = events.find(
      (e) => String(e.id) === String(notification.targetId)
    );
    if (targetEvent) {
      setSelectedEventDetail(targetEvent);
      setShowEventDetailModal(true);
      navigateTo('coe');
    }
    return;
  }
};
```

---

## Ringkasan Perubahan per File

| File | Perubahan |
|---|---|
| `Code.gs` | Tambah `case 'getNotifications'` + fungsi `handleGetNotifications()` |
| `googleScript.js` | Tambah `api.getNotifications()` |
| `app.jsx` | Ganti isi `setInterval` → hanya fetch notifikasi; ubah `handleNotificationClick` → fetch data + navigasi event |

---

## Dampak

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Data per poll | 8 tabel (~seluruh DB) | 1 tabel (notifications) |
| Interval polling | 15 detik | 30 detik |
| Beban Google Apps Script | Tinggi | Ringan |
| Data saat klik notif | Bisa usang | Selalu fresh (full refresh) |
| Navigasi ke event | Tidak ada | Ada |

---

## Urutan Implementasi

1. `Code.gs` — tambah endpoint (backend harus siap dulu)
2. `googleScript.js` — tambah method API
3. `app.jsx` — ganti polling dan `handleNotificationClick`
4. Test manual: login → tunggu notifikasi masuk → klik → verifikasi navigasi & data fresh
