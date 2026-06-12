/**
 * Action Tracker API Client for Google Apps Script Web App
 */

const API_URL = import.meta.env.VITE_GOOGLE_SCRIPT_API_URL;
const API_SECRET = import.meta.env.VITE_API_SECRET || "";

async function callAPI(action, payload = {}) {
  if (!API_URL) {
    console.error("VITE_GOOGLE_SCRIPT_API_URL is not defined in environment variables!");
    throw new Error("API URL is not configured. Silakan periksa file .env Anda.");
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain', // Bypasses CORS preflight check on Google Apps Script
      },
      body: JSON.stringify({
        action,
        secret: API_SECRET,
        ...payload
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Gagal memproses request backend.");
    }

    return result.data;
  } catch (error) {
    console.error(`API Call error [Action: ${action}]:`, error);
    throw error;
  }
}

// Generate unique ID in frontend for tasks/events/kpis/templates/notifications
export const generateUniqueId = (prefix = "id") => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
};

export const api = {
  // Database Setup / Seeder
  initDatabase: () => callAPI('init'),

  // Auth Handlers
  login: async (email, password) => {
    const user = await callAPI('login', { email, password });
    // Save to localStorage for persistence
    localStorage.setItem('action_tracker_user', JSON.stringify(user));
    return user;
  },

  register: async (formData) => {
    return callAPI('register', { formData });
  },

  logout: () => {
    localStorage.removeItem('action_tracker_user');
    return Promise.resolve();
  },

  getCurrentUser: () => {
    const userJson = localStorage.getItem('action_tracker_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      localStorage.removeItem('action_tracker_user');
      return null;
    }
  },

  // Fetch all tables in a single batch
  getAllData: () => callAPI('getAllData'),

  // Tasks operations
  saveTask: (task) => callAPI('saveTask', { task }),
  deleteTask: (id) => callAPI('deleteTask', { id }),

  // KPIs operations
  saveKPI: (kpi) => callAPI('saveKPI', { kpi }),
  deleteKPI: (id) => callAPI('deleteKPI', { id }),

  // Events operations
  saveEvent: (event) => callAPI('saveEvent', { event }),
  deleteEvent: (id) => callAPI('deleteEvent', { id }),

  // Templates operations
  saveTemplate: (template) => callAPI('saveTemplate', { template }),
  deleteTemplate: (id) => callAPI('deleteTemplate', { id }),

  // Users operations
  updateUser: (user) => callAPI('updateUser', { user }),
  deleteUser: (id) => callAPI('deleteUser', { id }),

  // Notifications operations
  createNotifications: (notifications) => callAPI('createNotifications', { notifications }),
  markNotificationRead: (id) => callAPI('markNotificationRead', { id }),
  markAllNotificationsRead: (userId) => callAPI('markAllNotificationsRead', { userId }),

  // File Upload to Google Drive (convert file to base64 first)
  uploadFile: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const filename = file.name;
          const mimeType = file.type;
          
          const result = await callAPI('uploadFile', {
            filename,
            mimeType,
            base64Data
          });
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
};
