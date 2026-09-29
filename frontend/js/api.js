/**
 * Smart Hospital Management - API Service
 * Centralized API client for communicating with the FastAPI backend.
 * Handles query parameter serialization (required by FastAPI backend endpoints),
 * JSON response parsing, loading indicators, and error formatting.
 */

class ApiService {
  constructor() {
    this.timeoutMs = 8000;
  }

  /**
   * Helper to build full URL with optional query parameters.
   */
  buildUrl(endpoint, params = {}) {
    const rawBase = window.CONFIG ? window.CONFIG.getBaseUrl() : 'https://smart-hospital-management-1-hrt3.onrender.com';
    const cleanBase = rawBase.trim().replace(/\/+$/, '');
    const cleanPath = endpoint.trim().replace(/^\/+/, '');
    
    // Construct full target URL string
    const fullPathStr = cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
    const url = new URL(fullPathStr, window.location.origin);
    
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });
    }
    return url.toString();
  }

  /**
   * Unified request handler with timeout and error extraction.
   */
  async request(endpoint, options = {}, queryParams = {}) {
    const url = this.buildUrl(endpoint, queryParams);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const defaultHeaders = {
        'Accept': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      // Handle non-JSON or empty response
      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        let errorMsg = `Request failed (${response.status})`;
        if (data) {
          if (data.detail) {
            if (Array.isArray(data.detail)) {
              errorMsg = data.detail.map(e => `${e.loc ? e.loc.join('.') : ''}: ${e.msg}`).join(', ');
            } else if (typeof data.detail === 'string') {
              errorMsg = data.detail;
            }
          } else if (data.message) {
            errorMsg = data.message;
          }
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeoutMs / 1000}s. Check if backend is running.`);
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(`Unable to connect to backend at ${window.CONFIG.getBaseUrl()}. Ensure FastAPI server is running.`);
      }
      throw err;
    }
  }

  // ==========================================
  // Health / System
  // ==========================================
  async checkBackendStatus() {
    try {
      const res = await this.request(window.CONFIG.ENDPOINTS.HEALTH);
      return { online: true, message: res.message || 'Connected' };
    } catch (err) {
      return { online: false, error: err.message };
    }
  }

  // ==========================================
  // DOCTORS APIs
  // ==========================================
  async getDoctors() {
    const res = await this.request(window.CONFIG.ENDPOINTS.DOCTORS);
    return res.doctors || [];
  }

  async getDoctor(id) {
    return await this.request(window.CONFIG.ENDPOINTS.DOCTOR_DETAIL(id));
  }

  async createDoctor(name, specialization) {
    // Note: Backend endpoint expects query parameters: POST /doctors?name=...&specialization=...
    return await this.request(
      window.CONFIG.ENDPOINTS.DOCTORS,
      { method: 'POST' },
      { name, specialization }
    );
  }

  async updateDoctor(id, name, specialization) {
    // Note: Backend endpoint expects query parameters: PUT /doctors/{id}?name=...&specialization=...
    return await this.request(
      window.CONFIG.ENDPOINTS.DOCTOR_DETAIL(id),
      { method: 'PUT' },
      { name, specialization }
    );
  }

  async deleteDoctor(id) {
    return await this.request(
      window.CONFIG.ENDPOINTS.DOCTOR_DETAIL(id),
      { method: 'DELETE' }
    );
  }

  // ==========================================
  // APPOINTMENTS APIs
  // ==========================================
  async getAppointments() {
    const res = await this.request(window.CONFIG.ENDPOINTS.APPOINTMENTS);
    return res.appointments || [];
  }

  async getAppointment(id) {
    return await this.request(window.CONFIG.ENDPOINTS.APPOINTMENT_DETAIL(id));
  }

  async createAppointment(patientId, doctorId, date, time) {
    // Note: Backend endpoint expects query parameters: POST /appointments?patient_id=...&doctor_id=...&date=...&time=...
    return await this.request(
      window.CONFIG.ENDPOINTS.APPOINTMENTS,
      { method: 'POST' },
      {
        patient_id: parseInt(patientId, 10),
        doctor_id: parseInt(doctorId, 10),
        date: String(date),
        time: String(time)
      }
    );
  }

  async updateAppointment(id, patientId, doctorId, date, time) {
    // Note: Backend endpoint expects query parameters: PUT /appointments/{id}?patient_id=...&doctor_id=...&date=...&time=...
    return await this.request(
      window.CONFIG.ENDPOINTS.APPOINTMENT_DETAIL(id),
      { method: 'PUT' },
      {
        patient_id: parseInt(patientId, 10),
        doctor_id: parseInt(doctorId, 10),
        date: String(date),
        time: String(time)
      }
    );
  }

  async deleteAppointment(id) {
    return await this.request(
      window.CONFIG.ENDPOINTS.APPOINTMENT_DETAIL(id),
      { method: 'DELETE' }
    );
  }

  // ==========================================
  // MEDICAL RECORDS APIs
  // ==========================================
  async getMedicalRecords() {
    const res = await this.request(window.CONFIG.ENDPOINTS.MEDICAL_RECORDS);
    return res.medical_records || [];
  }

  async getMedicalRecord(id) {
    return await this.request(window.CONFIG.ENDPOINTS.MEDICAL_RECORD_DETAIL(id));
  }

  async createMedicalRecord(patientId, doctorId, diagnosis, symptoms, prescription, date) {
    // Note: Backend endpoint expects query parameters: POST /medical-records?...
    return await this.request(
      window.CONFIG.ENDPOINTS.MEDICAL_RECORDS,
      { method: 'POST' },
      {
        patient_id: parseInt(patientId, 10),
        doctor_id: parseInt(doctorId, 10),
        diagnosis: String(diagnosis),
        symptoms: String(symptoms),
        prescription: String(prescription),
        date: String(date)
      }
    );
  }

  async updateMedicalRecord(id, patientId, doctorId, diagnosis, symptoms, prescription, date) {
    // Note: Backend endpoint expects query parameters: PUT /medical-records/{id}?...
    return await this.request(
      window.CONFIG.ENDPOINTS.MEDICAL_RECORD_DETAIL(id),
      { method: 'PUT' },
      {
        patient_id: parseInt(patientId, 10),
        doctor_id: parseInt(doctorId, 10),
        diagnosis: String(diagnosis),
        symptoms: String(symptoms),
        prescription: String(prescription),
        date: String(date)
      }
    );
  }

  async deleteMedicalRecord(id) {
    return await this.request(
      window.CONFIG.ENDPOINTS.MEDICAL_RECORD_DETAIL(id),
      { method: 'DELETE' }
    );
  }

  // ==========================================
  // PATIENTS APIs
  // ==========================================
  async getPatients() {
    const res = await this.request(window.CONFIG.ENDPOINTS.PATIENTS);
    return res.patients || [];
  }

  async getPatient(id) {
    return await this.request(window.CONFIG.ENDPOINTS.PATIENT_DETAIL(id));
  }

  async createPatient(name, age, disease) {
    // Note: Backend expects query parameters: POST /patients?name=...&age=...&disease=...
    return await this.request(
      window.CONFIG.ENDPOINTS.PATIENTS,
      { method: 'POST' },
      {
        name: String(name),
        age: parseInt(age, 10),
        disease: String(disease)
      }
    );
  }

  async updatePatient(id, name, age, disease) {
    // Note: Backend expects query parameters: PUT /patients/{id}?name=...&age=...&disease=...
    return await this.request(
      window.CONFIG.ENDPOINTS.PATIENT_DETAIL(id),
      { method: 'PUT' },
      {
        name: String(name),
        age: parseInt(age, 10),
        disease: String(disease)
      }
    );
  }

  async deletePatient(id) {
    return await this.request(
      window.CONFIG.ENDPOINTS.PATIENT_DETAIL(id),
      { method: 'DELETE' }
    );
  }
}

// Global singleton instance
window.api = new ApiService();
