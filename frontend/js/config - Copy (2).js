/**
 * Smart Hospital Management - API Configuration
 * Centralized configuration for backend API endpoints.
 */

const CONFIG = {
  // Auto-detect best backend endpoint:
  // If served via our local proxy server (port 3000), use /api route to avoid any CORS limitations.
  // Otherwise, connect directly to FastAPI at http://127.0.0.1:8000.
  get DEFAULT_BACKEND_URL() {
    if (typeof window !== 'undefined' && window.location.port === '3000') {
      return '/api';
    }
    return 'http://127.0.0.1:8000';
  },
  
  // Storage key for custom backend URL
  STORAGE_KEY: 'shm_backend_url',

  // Get current active base URL (supports local storage override if user wants to change port/host)
  getBaseUrl() {
    return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_BACKEND_URL;
  },

  // Update base URL
  setBaseUrl(url) {
    if (!url) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      let cleaned = url.trim().replace(/\/+$/, '');
      localStorage.setItem(this.STORAGE_KEY, cleaned);
    }
  },

  // Reset to default
  resetBaseUrl() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.DEFAULT_BACKEND_URL;
  },

  // API Endpoints mapping
  ENDPOINTS: {
    HEALTH: '/',
    PATIENTS: '/patients',
    PATIENT_DETAIL: (id) => `/patients/${id}`,
    DOCTORS: '/doctors',
    DOCTOR_DETAIL: (id) => `/doctors/${id}`,
    APPOINTMENTS: '/appointments',
    APPOINTMENT_DETAIL: (id) => `/appointments/${id}`,
    MEDICAL_RECORDS: '/medical-records',
    MEDICAL_RECORD_DETAIL: (id) => `/medical-records/${id}`,
  }
};

window.CONFIG = CONFIG;
