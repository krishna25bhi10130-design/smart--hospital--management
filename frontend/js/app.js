/**
 * Smart Hospital Management - Application Logic
 * Manages UI state, navigation, rendering, modals, and backend synchronization.
 */

const App = {
  // Application State
  state: {
    currentTab: 'dashboard',
    doctors: [],
    patients: [],
    appointments: [],
    medicalRecords: [],
    backendOnline: false,
    loading: {
      doctors: false,
      patients: false,
      appointments: false,
      medicalRecords: false,
    },
    filter: {
      doctors: '',
      patients: '',
      appointments: '',
      medicalRecords: '',
    }
  },

  // Initialize
  async init() {
    this.setupNavigation();
    this.setupEventListeners();
    this.setupBackendSettings();
    await this.checkBackend();
    await this.refreshAllData();

    // Periodic backend health ping every 15 seconds
    setInterval(() => this.checkBackend(true), 15000);
  },

  // =========================================================================
  // Backend Status & Health
  // =========================================================================
  async checkBackend(silent = false) {
    const status = await window.api.checkBackendStatus();
    this.state.backendOnline = status.online;
    this.renderBackendStatus();
    if (!silent && !status.online) {
      this.toast('warning', 'Backend Unreachable', `Cannot connect to ${CONFIG.getBaseUrl()}. Is Uvicorn running?`);
    }
  },

  renderBackendStatus() {
    const badge = document.getElementById('backend-status-badge');
    const text = document.getElementById('backend-status-text');
    const dot = document.getElementById('backend-status-dot');
    
    if (!badge || !text || !dot) return;

    if (this.state.backendOnline) {
      badge.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500 ping-dot';
      text.textContent = 'Backend Online (127.0.0.1:8000)';
    } else {
      badge.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100 transition';
      dot.className = 'w-2 h-2 rounded-full bg-rose-500';
      text.textContent = 'Backend Offline - Click to Check';
    }
  },

  // =========================================================================
  // Data Fetching & State Sync
  // =========================================================================
  async refreshAllData() {
    await Promise.allSettled([
      this.loadDoctors(),
      this.loadPatients(),
      this.loadAppointments(),
      this.loadMedicalRecords(),
    ]);
    this.renderDashboardStats();
    this.renderCurrentView();
  },

  async loadDoctors() {
    this.state.loading.doctors = true;
    this.renderLoadingState('doctors');
    try {
      this.state.doctors = await window.api.getDoctors();
    } catch (err) {
      console.error('Failed to load doctors:', err);
      this.state.doctors = [];
      this.toast('error', 'Doctors API Error', err.message);
    } finally {
      this.state.loading.doctors = false;
      this.renderDoctors();
      this.populateDoctorDropdowns();
    }
  },

  async loadPatients() {
    this.state.loading.patients = true;
    this.renderLoadingState('patients');
    try {
      this.state.patients = await window.api.getPatients();
    } catch (err) {
      console.error('Failed to load patients:', err);
      this.state.patients = [];
      this.toast('error', 'Patients API Error', err.message);
    } finally {
      this.state.loading.patients = false;
      this.renderPatients();
      this.populatePatientDropdowns();
    }
  },

  async loadAppointments() {
    this.state.loading.appointments = true;
    this.renderLoadingState('appointments');
    try {
      this.state.appointments = await window.api.getAppointments();
    } catch (err) {
      console.error('Failed to load appointments:', err);
      this.state.appointments = [];
      this.toast('error', 'Appointments API Error', err.message);
    } finally {
      this.state.loading.appointments = false;
      this.renderAppointments();
    }
  },

  async loadMedicalRecords() {
    this.state.loading.medicalRecords = true;
    this.renderLoadingState('medicalRecords');
    try {
      this.state.medicalRecords = await window.api.getMedicalRecords();
    } catch (err) {
      console.error('Failed to load medical records:', err);
      this.state.medicalRecords = [];
      this.toast('error', 'Medical Records API Error', err.message);
    } finally {
      this.state.loading.medicalRecords = false;
      this.renderMedicalRecords();
    }
  },

  // =========================================================================
  // Navigation & View Router
  // =========================================================================
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    if (mobileMenuBtn && sidebar && sidebarBackdrop) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebarBackdrop.classList.toggle('hidden');
      });

      sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        sidebarBackdrop.classList.add('hidden');
      });
    }
  },

  switchTab(tabName) {
    this.state.currentTab = tabName;

    // Update active nav styling
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Toggle view containers
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.add('hidden');
    });

    const targetSection = document.getElementById(`view-${tabName}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && sidebarBackdrop && !sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
      sidebarBackdrop.classList.add('hidden');
    }

    // Render active tab content
    this.renderCurrentView();

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderCurrentView() {
    switch (this.state.currentTab) {
      case 'dashboard':
        this.renderDashboardStats();
        this.renderDashboardRecent();
        break;
      case 'doctors':
        this.renderDoctors();
        break;
      case 'patients':
        this.renderPatients();
        break;
      case 'appointments':
        this.renderAppointments();
        break;
      case 'medical-records':
        this.renderMedicalRecords();
        break;
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // =========================================================================
  // Loading & Skeletons
  // =========================================================================
  renderLoadingState(resource) {
    const tableBody = document.getElementById(`${resource}-table-body`);
    if (!tableBody) return;

    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center gap-3">
            <div class="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm font-medium text-slate-600">Connecting to FastAPI backend...</p>
          </div>
        </td>
      </tr>
    `;
  },

  // =========================================================================
  // Dashboard Overview
  // =========================================================================
  renderDashboardStats() {
    const docCount = document.getElementById('stat-doctors-count');
    const patCount = document.getElementById('stat-patients-count');
    const appCount = document.getElementById('stat-appointments-count');
    const recCount = document.getElementById('stat-records-count');

    if (docCount) docCount.textContent = this.state.doctors.length;
    if (patCount) patCount.textContent = this.state.patients.length;
    if (appCount) appCount.textContent = this.state.appointments.length;
    if (recCount) recCount.textContent = this.state.medicalRecords.length;
  },

  renderDashboardRecent() {
    // Recent Appointments
    const recentAppointmentsList = document.getElementById('dashboard-recent-appointments');
    if (recentAppointmentsList) {
      const recent = [...this.state.appointments].reverse().slice(0, 4);
      if (recent.length === 0) {
        recentAppointmentsList.innerHTML = `
          <div class="p-6 text-center text-slate-400">
            <i data-lucide="calendar" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm">No scheduled appointments yet.</p>
          </div>
        `;
      } else {
        recentAppointmentsList.innerHTML = recent.map(app => {
          const patient = this.getPatientById(app.patient_id);
          const doctor = this.getDoctorById(app.doctor_id);
          return `
            <div class="flex items-center justify-between p-4 hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                  ${patient ? patient.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-slate-800">${patient ? this.escapeHtml(patient.name) : `Patient #${app.patient_id}`}</h4>
                  <p class="text-xs text-slate-500">With ${doctor ? this.escapeHtml(doctor.name) : `Doctor #${app.doctor_id}`}</p>
                </div>
              </div>
              <div class="text-right">
                <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  ${this.escapeHtml(app.date)}
                </span>
                <p class="text-xs text-slate-400 mt-0.5">${this.escapeHtml(app.time)}</p>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Recent Medical Records
    const recentRecordsList = document.getElementById('dashboard-recent-records');
    if (recentRecordsList) {
      const recent = [...this.state.medicalRecords].reverse().slice(0, 4);
      if (recent.length === 0) {
        recentRecordsList.innerHTML = `
          <div class="p-6 text-center text-slate-400">
            <i data-lucide="clipboard-list" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm">No medical records added yet.</p>
          </div>
        `;
      } else {
        recentRecordsList.innerHTML = recent.map(rec => {
          const patient = this.getPatientById(rec.patient_id);
          const doctor = this.getDoctorById(rec.doctor_id);
          return `
            <div class="p-4 hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ${this.escapeHtml(rec.diagnosis)}
                </span>
                <span class="text-xs text-slate-400">${this.escapeHtml(rec.date)}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-600">
                <span class="font-medium">${patient ? this.escapeHtml(patient.name) : `Patient #${rec.patient_id}`}</span>
                <span class="text-slate-400">${doctor ? this.escapeHtml(doctor.name) : `Doctor #${rec.doctor_id}`}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  // =========================================================================
  // DOCTORS VIEW & CRUD
  // =========================================================================
  renderDoctors() {
    const tableBody = document.getElementById('doctors-table-body');
    if (!tableBody) return;

    const searchTerm = (this.state.filter.doctors || '').toLowerCase();
    const filtered = this.state.doctors.filter(d => 
      (d.name && d.name.toLowerCase().includes(searchTerm)) ||
      (d.specialization && d.specialization.toLowerCase().includes(searchTerm))
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-12 text-center text-slate-400">
            <i data-lucide="user-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-medium text-slate-600">No doctors found.</p>
            <p class="text-xs text-slate-400 mt-1">Add a new doctor or adjust your search term.</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = filtered.map(doc => `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
          #${doc.id}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              ${doc.name ? doc.name.replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase() : 'D'}
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-800">${this.escapeHtml(doc.name)}</div>
              <div class="text-xs text-slate-400">ID: ${doc.id}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ${this.escapeHtml(doc.specialization)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center justify-end gap-2">
            <button onclick="App.openEditDoctorModal(${doc.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition" title="Edit Doctor">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="App.confirmDeleteDoctor(${doc.id}, '${this.escapeJs(doc.name)}')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition" title="Delete Doctor">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openAddDoctorModal() {
    document.getElementById('modal-doctor-title').textContent = 'Add New Doctor';
    document.getElementById('doctor-id-input').value = '';
    document.getElementById('doctor-name-input').value = '';
    document.getElementById('doctor-specialization-input').value = '';
    this.openModal('modal-doctor');
  },

  openEditDoctorModal(id) {
    const doctor = this.getDoctorById(id);
    if (!doctor) return;

    document.getElementById('modal-doctor-title').textContent = 'Edit Doctor Details';
    document.getElementById('doctor-id-input').value = doctor.id;
    document.getElementById('doctor-name-input').value = doctor.name;
    document.getElementById('doctor-specialization-input').value = doctor.specialization;
    this.openModal('modal-doctor');
  },

  async handleSaveDoctor(e) {
    e.preventDefault();
    const id = document.getElementById('doctor-id-input').value;
    const name = document.getElementById('doctor-name-input').value.trim();
    const specialization = document.getElementById('doctor-specialization-input').value.trim();

    if (!name || !specialization) {
      this.toast('warning', 'Validation Error', 'Please enter both doctor name and specialization.');
      return;
    }

    const saveBtn = document.getElementById('btn-save-doctor');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Saving...';

    try {
      if (id) {
        // Update existing doctor
        await window.api.updateDoctor(id, name, specialization);
        this.toast('success', 'Doctor Updated', `${name} updated successfully.`);
      } else {
        // Create new doctor
        await window.api.createDoctor(name, specialization);
        this.toast('success', 'Doctor Added', `${name} added successfully.`);
      }
      this.closeModal('modal-doctor');
      await this.loadDoctors();
      this.renderDashboardStats();
    } catch (err) {
      this.toast('error', 'Failed to save doctor', err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Doctor';
    }
  },

  confirmDeleteDoctor(id, name) {
    this.openConfirmModal({
      title: 'Delete Doctor',
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      confirmText: 'Delete Doctor',
      confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      onConfirm: async () => {
        try {
          await window.api.deleteDoctor(id);
          this.toast('success', 'Doctor Deleted', `${name} has been removed.`);
          await this.loadDoctors();
          this.renderDashboardStats();
        } catch (err) {
          this.toast('error', 'Failed to delete doctor', err.message);
        }
      }
    });
  },

  // =========================================================================
  // APPOINTMENTS VIEW & CRUD
  // =========================================================================
  renderAppointments() {
    const tableBody = document.getElementById('appointments-table-body');
    if (!tableBody) return;

    const searchTerm = (this.state.filter.appointments || '').toLowerCase();
    const filtered = this.state.appointments.filter(a => {
      const patient = this.getPatientById(a.patient_id);
      const doctor = this.getDoctorById(a.doctor_id);
      const patName = patient ? patient.name.toLowerCase() : '';
      const docName = doctor ? doctor.name.toLowerCase() : '';
      return patName.includes(searchTerm) || docName.includes(searchTerm) || a.date.includes(searchTerm);
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center text-slate-400">
            <i data-lucide="calendar-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-medium text-slate-600">No appointments found.</p>
            <p class="text-xs text-slate-400 mt-1">Schedule an appointment with the button above.</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = filtered.map(app => {
      const patient = this.getPatientById(app.patient_id);
      const doctor = this.getDoctorById(app.doctor_id);
      return `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
            #${app.id}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ${patient ? patient.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-800">${patient ? this.escapeHtml(patient.name) : `Patient #${app.patient_id}`}</div>
                <div class="text-xs text-slate-400">ID: ${app.patient_id}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                ${doctor ? doctor.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-800">${doctor ? this.escapeHtml(doctor.name) : `Doctor #${app.doctor_id}`}</div>
                <div class="text-xs text-indigo-600">${doctor ? this.escapeHtml(doctor.specialization) : ''}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-slate-700">${this.escapeHtml(app.date)}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <i data-lucide="clock" class="w-3.5 h-3.5"></i>
              ${this.escapeHtml(app.time)}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex items-center justify-end gap-2">
              <button onclick="App.openEditAppointmentModal(${app.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition" title="Edit Appointment">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="App.confirmDeleteAppointment(${app.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition" title="Cancel Appointment">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openAddAppointmentModal() {
    this.populatePatientDropdowns();
    this.populateDoctorDropdowns();

    document.getElementById('modal-appointment-title').textContent = 'Schedule New Appointment';
    document.getElementById('appointment-id-input').value = '';
    document.getElementById('appointment-patient-select').value = '';
    document.getElementById('appointment-doctor-select').value = '';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointment-date-input').value = today;
    document.getElementById('appointment-time-input').value = '10:00 AM';

    this.openModal('modal-appointment');
  },

  openEditAppointmentModal(id) {
    const app = this.state.appointments.find(a => a.id === id);
    if (!app) return;

    this.populatePatientDropdowns();
    this.populateDoctorDropdowns();

    document.getElementById('modal-appointment-title').textContent = 'Edit Appointment';
    document.getElementById('appointment-id-input').value = app.id;
    document.getElementById('appointment-patient-select').value = app.patient_id;
    document.getElementById('appointment-doctor-select').value = app.doctor_id;
    document.getElementById('appointment-date-input').value = app.date;
    document.getElementById('appointment-time-input').value = app.time;

    this.openModal('modal-appointment');
  },

  async handleSaveAppointment(e) {
    e.preventDefault();
    const id = document.getElementById('appointment-id-input').value;
    const patientId = document.getElementById('appointment-patient-select').value;
    const doctorId = document.getElementById('appointment-doctor-select').value;
    const date = document.getElementById('appointment-date-input').value;
    const time = document.getElementById('appointment-time-input').value.trim();

    if (!patientId || !doctorId || !date || !time) {
      this.toast('warning', 'Validation Error', 'Please complete all required fields.');
      return;
    }

    const saveBtn = document.getElementById('btn-save-appointment');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Saving...';

    try {
      if (id) {
        await window.api.updateAppointment(id, patientId, doctorId, date, time);
        this.toast('success', 'Appointment Updated', 'Appointment updated successfully.');
      } else {
        await window.api.createAppointment(patientId, doctorId, date, time);
        this.toast('success', 'Appointment Scheduled', 'New appointment scheduled successfully.');
      }
      this.closeModal('modal-appointment');
      await this.loadAppointments();
      this.renderDashboardStats();
    } catch (err) {
      this.toast('error', 'Failed to save appointment', err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Appointment';
    }
  },

  confirmDeleteAppointment(id) {
    this.openConfirmModal({
      title: 'Cancel Appointment',
      message: `Are you sure you want to cancel appointment #${id}?`,
      confirmText: 'Cancel Appointment',
      confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      onConfirm: async () => {
        try {
          await window.api.deleteAppointment(id);
          this.toast('success', 'Appointment Cancelled', `Appointment #${id} has been cancelled.`);
          await this.loadAppointments();
          this.renderDashboardStats();
        } catch (err) {
          this.toast('error', 'Failed to delete appointment', err.message);
        }
      }
    });
  },

  // =========================================================================
  // MEDICAL RECORDS VIEW & CRUD
  // =========================================================================
  renderMedicalRecords() {
    const tableBody = document.getElementById('records-table-body');
    if (!tableBody) return;

    const searchTerm = (this.state.filter.medicalRecords || '').toLowerCase();
    const filtered = this.state.medicalRecords.filter(r => {
      const patient = this.getPatientById(r.patient_id);
      const doctor = this.getDoctorById(r.doctor_id);
      const patName = patient ? patient.name.toLowerCase() : '';
      const docName = doctor ? doctor.name.toLowerCase() : '';
      const diag = r.diagnosis ? r.diagnosis.toLowerCase() : '';
      const symp = r.symptoms ? r.symptoms.toLowerCase() : '';
      return patName.includes(searchTerm) || docName.includes(searchTerm) || diag.includes(searchTerm) || symp.includes(searchTerm);
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-slate-400">
            <i data-lucide="file-x" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-medium text-slate-600">No medical records found.</p>
            <p class="text-xs text-slate-400 mt-1">Create a medical record using the button above.</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = filtered.map(rec => {
      const patient = this.getPatientById(rec.patient_id);
      const doctor = this.getDoctorById(rec.doctor_id);
      return `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
            #${rec.id}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-semibold text-slate-800">${patient ? this.escapeHtml(patient.name) : `Patient #${rec.patient_id}`}</div>
            <div class="text-xs text-slate-400">ID: ${rec.patient_id}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-slate-700">${doctor ? this.escapeHtml(doctor.name) : `Doctor #${rec.doctor_id}`}</div>
          </td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              ${this.escapeHtml(rec.diagnosis)}
            </span>
          </td>
          <td class="px-6 py-4 max-w-xs truncate text-sm text-slate-600" title="${this.escapeHtml(rec.symptoms)}">
            ${this.escapeHtml(rec.symptoms)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
            ${this.escapeHtml(rec.date)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex items-center justify-end gap-2">
              <button onclick="App.viewRecordDetail(${rec.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition" title="View Full Record">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button onclick="App.openEditMedicalRecordModal(${rec.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition" title="Edit Record">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </button>
              <button onclick="App.confirmDeleteMedicalRecord(${rec.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition" title="Delete Record">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openAddMedicalRecordModal() {
    this.populatePatientDropdowns();
    this.populateDoctorDropdowns();

    document.getElementById('modal-record-title').textContent = 'New Medical Record';
    document.getElementById('record-id-input').value = '';
    document.getElementById('record-patient-select').value = '';
    document.getElementById('record-doctor-select').value = '';
    document.getElementById('record-diagnosis-input').value = '';
    document.getElementById('record-symptoms-input').value = '';
    document.getElementById('record-prescription-input').value = '';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('record-date-input').value = today;

    this.openModal('modal-record');
  },

  openEditMedicalRecordModal(id) {
    const rec = this.state.medicalRecords.find(r => r.id === id);
    if (!rec) return;

    this.populatePatientDropdowns();
    this.populateDoctorDropdowns();

    document.getElementById('modal-record-title').textContent = 'Edit Medical Record';
    document.getElementById('record-id-input').value = rec.id;
    document.getElementById('record-patient-select').value = rec.patient_id;
    document.getElementById('record-doctor-select').value = rec.doctor_id;
    document.getElementById('record-diagnosis-input').value = rec.diagnosis;
    document.getElementById('record-symptoms-input').value = rec.symptoms;
    document.getElementById('record-prescription-input').value = rec.prescription;
    document.getElementById('record-date-input').value = rec.date;

    this.openModal('modal-record');
  },

  viewRecordDetail(id) {
    const rec = this.state.medicalRecords.find(r => r.id === id);
    if (!rec) return;

    const patient = this.getPatientById(rec.patient_id);
    const doctor = this.getDoctorById(rec.doctor_id);

    document.getElementById('detail-record-patient').textContent = patient ? patient.name : `Patient #${rec.patient_id}`;
    document.getElementById('detail-record-doctor').textContent = doctor ? doctor.name : `Doctor #${rec.doctor_id}`;
    document.getElementById('detail-record-date').textContent = rec.date;
    document.getElementById('detail-record-diagnosis').textContent = rec.diagnosis;
    document.getElementById('detail-record-symptoms').textContent = rec.symptoms;
    document.getElementById('detail-record-prescription').textContent = rec.prescription;

    this.openModal('modal-record-detail');
  },

  async handleSaveMedicalRecord(e) {
    e.preventDefault();
    const id = document.getElementById('record-id-input').value;
    const patientId = document.getElementById('record-patient-select').value;
    const doctorId = document.getElementById('record-doctor-select').value;
    const diagnosis = document.getElementById('record-diagnosis-input').value.trim();
    const symptoms = document.getElementById('record-symptoms-input').value.trim();
    const prescription = document.getElementById('record-prescription-input').value.trim();
    const date = document.getElementById('record-date-input').value;

    if (!patientId || !doctorId || !diagnosis || !symptoms || !prescription || !date) {
      this.toast('warning', 'Validation Error', 'Please complete all fields for the medical record.');
      return;
    }

    const saveBtn = document.getElementById('btn-save-record');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Saving...';

    try {
      if (id) {
        await window.api.updateMedicalRecord(id, patientId, doctorId, diagnosis, symptoms, prescription, date);
        this.toast('success', 'Record Updated', 'Medical record updated successfully.');
      } else {
        await window.api.createMedicalRecord(patientId, doctorId, diagnosis, symptoms, prescription, date);
        this.toast('success', 'Record Created', 'Medical record created successfully.');
      }
      this.closeModal('modal-record');
      await this.loadMedicalRecords();
      this.renderDashboardStats();
    } catch (err) {
      this.toast('error', 'Failed to save medical record', err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Record';
    }
  },

  confirmDeleteMedicalRecord(id) {
    this.openConfirmModal({
      title: 'Delete Medical Record',
      message: `Are you sure you want to delete medical record #${id}?`,
      confirmText: 'Delete Record',
      confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      onConfirm: async () => {
        try {
          await window.api.deleteMedicalRecord(id);
          this.toast('success', 'Record Deleted', `Medical record #${id} removed.`);
          await this.loadMedicalRecords();
          this.renderDashboardStats();
        } catch (err) {
          this.toast('error', 'Failed to delete record', err.message);
        }
      }
    });
  },

  // =========================================================================
  // PATIENTS VIEW & CRUD
  // =========================================================================
  renderPatients() {
    const tableBody = document.getElementById('patients-table-body');
    if (!tableBody) return;

    const searchTerm = (this.state.filter.patients || '').toLowerCase();
    const filtered = this.state.patients.filter(p => 
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.disease && p.disease.toLowerCase().includes(searchTerm))
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-12 text-center text-slate-400">
            <i data-lucide="user-minus" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
            <p class="text-sm font-medium text-slate-600">No patients registered.</p>
            <p class="text-xs text-slate-400 mt-1">Register a patient using the button above.</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = filtered.map(pat => `
      <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
          #${pat.id}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              ${pat.name ? pat.name.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div class="text-sm font-semibold text-slate-800">${this.escapeHtml(pat.name)}</div>
              <div class="text-xs text-slate-400">ID: ${pat.id}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
          ${pat.age} yrs
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            ${this.escapeHtml(pat.disease)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center justify-end gap-2">
            <button onclick="App.openEditPatientModal(${pat.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition" title="Edit Patient">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="App.confirmDeletePatient(${pat.id}, '${this.escapeJs(pat.name)}')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition" title="Delete Patient">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openAddPatientModal() {
    document.getElementById('modal-patient-title').textContent = 'Register New Patient';
    document.getElementById('patient-id-input').value = '';
    document.getElementById('patient-name-input').value = '';
    document.getElementById('patient-age-input').value = '';
    document.getElementById('patient-disease-input').value = '';
    this.openModal('modal-patient');
  },

  openEditPatientModal(id) {
    const pat = this.getPatientById(id);
    if (!pat) return;

    document.getElementById('modal-patient-title').textContent = 'Edit Patient Details';
    document.getElementById('patient-id-input').value = pat.id;
    document.getElementById('patient-name-input').value = pat.name;
    document.getElementById('patient-age-input').value = pat.age;
    document.getElementById('patient-disease-input').value = pat.disease;
    this.openModal('modal-patient');
  },

  async handleSavePatient(e) {
    e.preventDefault();
    const id = document.getElementById('patient-id-input').value;
    const name = document.getElementById('patient-name-input').value.trim();
    const age = document.getElementById('patient-age-input').value;
    const disease = document.getElementById('patient-disease-input').value.trim();

    if (!name || !age || !disease) {
      this.toast('warning', 'Validation Error', 'Please complete all patient fields.');
      return;
    }

    const saveBtn = document.getElementById('btn-save-patient');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Saving...';

    try {
      if (id) {
        await window.api.updatePatient(id, name, age, disease);
        this.toast('success', 'Patient Updated', `${name} updated successfully.`);
      } else {
        await window.api.createPatient(name, age, disease);
        this.toast('success', 'Patient Registered', `${name} added successfully.`);
      }
      this.closeModal('modal-patient');
      await this.loadPatients();
      this.renderDashboardStats();
    } catch (err) {
      this.toast('error', 'Failed to save patient', err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Patient';
    }
  },

  confirmDeletePatient(id, name) {
    this.openConfirmModal({
      title: 'Delete Patient',
      message: `Are you sure you want to remove patient ${name}?`,
      confirmText: 'Delete Patient',
      confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      onConfirm: async () => {
        try {
          await window.api.deletePatient(id);
          this.toast('success', 'Patient Removed', `${name} deleted successfully.`);
          await this.loadPatients();
          this.renderDashboardStats();
        } catch (err) {
          this.toast('error', 'Failed to delete patient', err.message);
        }
      }
    });
  },

  // =========================================================================
  // Dropdown Helpers
  // =========================================================================
  populateDoctorDropdowns() {
    const selects = [
      document.getElementById('appointment-doctor-select'),
      document.getElementById('record-doctor-select'),
    ];

    selects.forEach(select => {
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="">-- Select Doctor --</option>' + 
        this.state.doctors.map(d => 
          `<option value="${d.id}">${this.escapeHtml(d.name)} (${this.escapeHtml(d.specialization)})</option>`
        ).join('');
      if (currentVal) select.value = currentVal;
    });
  },

  populatePatientDropdowns() {
    const selects = [
      document.getElementById('appointment-patient-select'),
      document.getElementById('record-patient-select'),
    ];

    selects.forEach(select => {
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '<option value="">-- Select Patient --</option>' + 
        this.state.patients.map(p => 
          `<option value="${p.id}">${this.escapeHtml(p.name)} (Age: ${p.age}, ${this.escapeHtml(p.disease)})</option>`
        ).join('');
      if (currentVal) select.value = currentVal;
    });
  },

  // =========================================================================
  // Entity Finders
  // =========================================================================
  getDoctorById(id) {
    return this.state.doctors.find(d => Number(d.id) === Number(id));
  },

  getPatientById(id) {
    return this.state.patients.find(p => Number(p.id) === Number(id));
  },

  // =========================================================================
  // Backend Settings Modal
  // =========================================================================
  setupBackendSettings() {
    const configBtn = document.getElementById('btn-backend-settings');
    if (configBtn) {
      configBtn.addEventListener('click', () => {
        document.getElementById('settings-backend-url').value = CONFIG.getBaseUrl();
        this.openModal('modal-settings');
      });
    }

    const saveSettingsBtn = document.getElementById('btn-save-settings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', async () => {
        const newUrl = document.getElementById('settings-backend-url').value.trim();
        CONFIG.setBaseUrl(newUrl);
        this.toast('info', 'Settings Updated', `Backend URL set to ${CONFIG.getBaseUrl()}`);
        this.closeModal('modal-settings');
        await this.checkBackend();
        await this.refreshAllData();
      });
    }

    const resetSettingsBtn = document.getElementById('btn-reset-settings');
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener('click', () => {
        document.getElementById('settings-backend-url').value = CONFIG.resetBaseUrl();
      });
    }
  },

  // =========================================================================
  // Modal Utilities
  // =========================================================================
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  },

  openConfirmModal({ title, message, confirmText, confirmClass, onConfirm }) {
    document.getElementById('confirm-modal-title').textContent = title || 'Confirm Action';
    document.getElementById('confirm-modal-message').textContent = message || 'Are you sure?';
    
    const confirmBtn = document.getElementById('confirm-modal-button');
    confirmBtn.textContent = confirmText || 'Confirm';
    confirmBtn.className = `px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition ${confirmClass || 'bg-rose-600 hover:bg-rose-700 text-white'}`;
    
    // Replace listener cleanly
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      this.closeModal('modal-confirm');
      if (onConfirm) await onConfirm();
    });

    this.openModal('modal-confirm');
  },

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  toast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: 'check-circle-2',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-sky-600 text-white'
    };

    const toastEl = document.createElement('div');
    toastEl.className = `toast flex items-start gap-3 p-4 rounded-xl shadow-lg ${colors[type] || colors.info}`;
    toastEl.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
      <div class="flex-1">
        <h4 class="font-bold text-sm">${this.escapeHtml(title)}</h4>
        <p class="text-xs opacity-90 mt-0.5">${this.escapeHtml(message)}</p>
      </div>
      <button class="text-white/80 hover:text-white" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toastEl);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toastEl.classList.add('hiding');
      setTimeout(() => toastEl.remove(), 200);
    }, 4500);
  },

  // =========================================================================
  // Global Event Listeners & Search Filters
  // =========================================================================
  setupEventListeners() {
    // Search inputs
    const setupSearch = (inputId, stateKey, renderFn) => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', (e) => {
          this.state.filter[stateKey] = e.target.value;
          renderFn.call(this);
        });
      }
    };

    setupSearch('search-doctors', 'doctors', this.renderDoctors);
    setupSearch('search-patients', 'patients', this.renderPatients);
    setupSearch('search-appointments', 'appointments', this.renderAppointments);
    setupSearch('search-records', 'medicalRecords', this.renderMedicalRecords);

    // Refresh all button
    const refreshBtn = document.getElementById('btn-refresh-all');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('animate-spin');
        await this.checkBackend();
        await this.refreshAllData();
        setTimeout(() => refreshBtn.classList.remove('animate-spin'), 600);
        this.toast('info', 'Data Synchronized', 'All tables refreshed from FastAPI.');
      });
    }

    // Modal forms submit handlers
    const docForm = document.getElementById('form-doctor');
    if (docForm) docForm.addEventListener('submit', (e) => this.handleSaveDoctor(e));

    const patForm = document.getElementById('form-patient');
    if (patForm) patForm.addEventListener('submit', (e) => this.handleSavePatient(e));

    const appForm = document.getElementById('form-appointment');
    if (appForm) appForm.addEventListener('submit', (e) => this.handleSaveAppointment(e));

    const recForm = document.getElementById('form-record');
    if (recForm) recForm.addEventListener('submit', (e) => this.handleSaveMedicalRecord(e));

    // ESC key closes any open modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => {
          modal.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        });
      }
    });
  },

  // =========================================================================
  // XSS Protection Escaping
  // =========================================================================
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  escapeJs(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');
  }
};

window.App = App;

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
