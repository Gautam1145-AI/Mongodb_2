/**
 * Hospital Management System - Enterprise Command Center Script
 * MNC-Grade Interactions: Command Palette (Ctrl+K), Floating Action Speed-Dial,
 * Subtle Audio Haptics (Web Audio API), Real-time Notification Flyout, and Table Exporters.
 */

// -------------------------------------------------------------
// 1. SUBTLE HIGH-TECH AUDIO FEEDBACK (WEB AUDIO API)
// -------------------------------------------------------------
let soundEnabled = true;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playHapticSound(type = 'click') {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (e) {
    // Audio context may be restricted by autoplay policies
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const icon = document.getElementById('soundToggleIcon');
  if (icon) {
    icon.textContent = soundEnabled ? '🔊' : '🔇';
  }
  showToast(soundEnabled ? 'Haptic sound effects enabled' : 'Sound effects muted', 'success');
}

// -------------------------------------------------------------
// 2. TOAST NOTIFICATION ENGINE
// -------------------------------------------------------------
function showToast(message, type = 'success') {
  playHapticSound(type === 'success' ? 'success' : 'click');
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${type === 'success' ? '⚡' : '⚠️'}</span>
    <div>
      <div style="font-weight: 600; font-size: 0.84rem; color: #fff;">${type === 'success' ? 'System Notice' : 'Alert'}</div>
      <div style="color: var(--text-secondary); font-size: 0.8rem;">${message}</div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// -------------------------------------------------------------
// 3. MODAL CONTROLS
// -------------------------------------------------------------
function openModal(modalId) {
  playHapticSound('click');
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  playHapticSound('click');
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
  // Close notification flyout if clicking outside
  const flyout = document.getElementById('notificationFlyout');
  const bellBtn = document.getElementById('notifBellBtn');
  if (flyout && flyout.classList.contains('open') && !flyout.contains(e.target) && !bellBtn.contains(e.target)) {
    flyout.classList.remove('open');
  }
});

// -------------------------------------------------------------
// 4. FLOATING SPEED-DIAL GESTURE FAB
// -------------------------------------------------------------
function toggleSpeedDial() {
  playHapticSound('click');
  const btn = document.getElementById('fabMainBtn');
  const menu = document.getElementById('fabMenuOptions');
  if (btn && menu) {
    btn.classList.toggle('active');
    menu.classList.toggle('open');
  }
}

// -------------------------------------------------------------
// 5. LIVE NOTIFICATION CENTER FLYOUT
// -------------------------------------------------------------
function toggleNotificationFlyout() {
  playHapticSound('click');
  const flyout = document.getElementById('notificationFlyout');
  if (flyout) {
    flyout.classList.toggle('open');
  }
}

// -------------------------------------------------------------
// 6. GLOBAL COMMAND PALETTE (CTRL+K / ⌘K)
// -------------------------------------------------------------
const COMMAND_REGISTRY = [
  { title: "Dashboard", category: "Navigation", icon: "📊", url: "/" },
  { title: "Patients Directory", category: "Navigation", icon: "👥", url: "/patients" },
  { title: "Register New Patient", category: "Action", icon: "➕", action: () => openModal('newPatientModal') },
  { title: "Doctors & Specialists", category: "Navigation", icon: "🩺", url: "/doctors" },
  { title: "Add New Doctor Profile", category: "Action", icon: "➕", action: () => openModal('newDoctorModal') },
  { title: "Appointments & Schedules", category: "Navigation", icon: "📅", url: "/appointments" },
  { title: "Book Patient Appointment", category: "Action", icon: "📅", action: () => openModal('bookAppointmentModal') },
  { title: "Medical Records & Prescriptions", category: "Navigation", icon: "📋", url: "/medical-records" },
  { title: "Billing & Revenue Analytics", category: "Navigation", icon: "💳", url: "/billing" },
  { title: "Generate Patient Invoice", category: "Action", icon: "💳", action: () => openModal('newBillModal') },
  { title: "Room & Ward Management", category: "Navigation", icon: "🛏️", url: "/rooms" },
  { title: "Allocate Patient to Room", category: "Action", icon: "🛏️", action: () => openModal('allocateRoomModal') },
  { title: "MongoDB Live Query Console", category: "Database", icon: "⚡", url: "/queries" },
  { title: "Configure MongoDB Connection (Atlas / Local)", category: "Settings", icon: "⚙️", action: () => openModal('dbConnectionModal') },
  { title: "Reset Database Sample Data", category: "Maintenance", icon: "🔄", action: () => resetSeedData() }
];

let selectedCmdIndex = 0;

function openCommandPalette() {
  playHapticSound('click');
  const palette = document.getElementById('cmdPaletteBackdrop');
  const input = document.getElementById('cmdPaletteInput');
  if (palette && input) {
    palette.classList.add('active');
    input.value = '';
    renderCommandResults('');
    setTimeout(() => input.focus(), 50);
  }
}

function closeCommandPalette() {
  const palette = document.getElementById('cmdPaletteBackdrop');
  if (palette) {
    palette.classList.remove('active');
  }
}

function renderCommandResults(searchTerm) {
  const container = document.getElementById('cmdResultsList');
  if (!container) return;

  const term = searchTerm.toLowerCase().trim();
  const filtered = COMMAND_REGISTRY.filter(cmd => 
    cmd.title.toLowerCase().includes(term) || cmd.category.toLowerCase().includes(term)
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; color: var(--text-tertiary); font-size: 0.88rem;">
        No command or patient record matching "${searchTerm}"
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((cmd, idx) => `
    <div class="cmd-result-item ${idx === selectedCmdIndex ? 'highlighted' : ''}" 
         onclick="executeCommandItem(${idx})"
         onmouseenter="highlightCmdIndex(${idx})">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.15rem;">${cmd.icon}</span>
        <span style="font-weight: 600; color: #fff;">${cmd.title}</span>
      </div>
      <span class="kpi-badge">${cmd.category}</span>
    </div>
  `).join('');
}

function highlightCmdIndex(idx) {
  selectedCmdIndex = idx;
  const items = document.querySelectorAll('.cmd-result-item');
  items.forEach((item, i) => {
    item.classList.toggle('highlighted', i === idx);
  });
}

function executeCommandItem(idx) {
  const term = (document.getElementById('cmdPaletteInput')?.value || '').toLowerCase().trim();
  const filtered = COMMAND_REGISTRY.filter(cmd => 
    cmd.title.toLowerCase().includes(term) || cmd.category.toLowerCase().includes(term)
  );
  const target = filtered[idx];
  if (!target) return;

  closeCommandPalette();
  if (target.url) {
    window.location.href = target.url;
  } else if (target.action) {
    target.action();
  }
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl + K or Cmd + K opens command palette
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  // Escape key closes modals and palette
  if (e.key === 'Escape') {
    closeCommandPalette();
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.getElementById('notificationFlyout')?.classList.remove('open');
    return;
  }

  // If palette is active, navigate with arrow keys
  const palette = document.getElementById('cmdPaletteBackdrop');
  if (palette && palette.classList.contains('active')) {
    const items = document.querySelectorAll('.cmd-result-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex + 1) % items.length;
      highlightCmdIndex(selectedCmdIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex - 1 + items.length) % items.length;
      highlightCmdIndex(selectedCmdIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommandItem(selectedCmdIndex);
    }
  }
});

// -------------------------------------------------------------
// 7. TABLE EXPORT UTILITIES (CSV & JSON DOWNLOADS)
// -------------------------------------------------------------
function exportTableToCSV(tableId, filename = 'hospital_records.csv') {
  playHapticSound('success');
  const table = document.getElementById(tableId);
  if (!table) return;

  let csv = [];
  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    const cols = row.querySelectorAll('th, td');
    let rowData = [];
    cols.forEach((col, idx) => {
      // Exclude action column
      if (idx !== cols.length - 1 || row.parentElement.tagName === 'THEAD') {
        let text = col.innerText.replace(/"/g, '""').trim();
        rowData.push(`"${text}"`);
      }
    });
    csv.push(rowData.join(','));
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${filename} successfully!`, 'success');
}

// -------------------------------------------------------------
// 8. DATABASE CONNECTION & SEED MANAGEMENT
// -------------------------------------------------------------
async function handleDbConnect(event) {
  event.preventDefault();
  const uriInput = document.getElementById('mongoUriInput');
  const submitBtn = document.getElementById('dbConnectSubmitBtn');
  const uri = uriInput.value.trim();

  if (!uri) {
    showToast('Please enter a valid MongoDB URI', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Connecting...';

  try {
    const res = await fetch('/api/database/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeModal('dbConnectionModal');
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Network error connecting to MongoDB', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Test & Connect';
  }
}

async function resetSeedData() {
  if (!confirm('Re-seed initial sample data across all 7 MongoDB collections?')) {
    return;
  }

  try {
    const res = await fetch('/api/database/reset-seed', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      setTimeout(() => window.location.reload(), 800);
    }
  } catch (err) {
    showToast('Error resetting sample data', 'error');
  }
}

// -------------------------------------------------------------
// 9. PATIENT CRUD ACTIONS
// -------------------------------------------------------------
async function handlePatientRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Patient ${result.patient_id} registered successfully!`, 'success');
      closeModal('newPatientModal');
      setTimeout(() => window.location.reload(), 600);
    } else {
      showToast(result.error || 'Failed to register patient', 'error');
    }
  } catch (err) {
    showToast('Error registering patient', 'error');
  }
}

async function deletePatient(patientId) {
  if (!confirm(`Delete patient record ${patientId}? (Demonstrating Query 5: db.patients.deleteOne)`)) {
    return;
  }

  try {
    const res = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast(`Patient ${patientId} deleted successfully`, 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error deleting patient', 'error');
  }
}

function openEditPatientModal(patient) {
  document.getElementById('editPatientId').value = patient.patient_id;
  document.getElementById('editPatientName').value = patient.name;
  document.getElementById('editPatientAge').value = patient.age;
  document.getElementById('editPatientGender').value = patient.gender;
  document.getElementById('editPatientBloodGroup').value = patient.blood_group;
  document.getElementById('editPatientPhone').value = patient.phone;
  document.getElementById('editPatientAddress').value = patient.address;
  openModal('editPatientModal');
}

async function handlePatientUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const patientId = data.patient_id;

  try {
    const res = await fetch(`/api/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Patient ${patientId} updated successfully (Query 4: $set)`, 'success');
      closeModal('editPatientModal');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error updating patient', 'error');
  }
}

// -------------------------------------------------------------
// 10. DOCTOR & APPOINTMENT ACTIONS
// -------------------------------------------------------------
async function handleDoctorRegister(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Doctor ${result.doctor_id} onboarded!`, 'success');
      closeModal('newDoctorModal');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error onboarding doctor', 'error');
  }
}

async function toggleDoctorAvailability(doctorId, currentStatus) {
  const newStatus = !currentStatus;
  try {
    const res = await fetch(`/api/doctors/${doctorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Status switched to ${newStatus ? 'Available' : 'Unavailable'}`, 'success');
      setTimeout(() => window.location.reload(), 500);
    }
  } catch (err) {
    showToast('Error updating status', 'error');
  }
}

async function handleAppointmentBook(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Appointment ${result.appointment_id} scheduled!`, 'success');
      closeModal('bookAppointmentModal');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error booking appointment', 'error');
  }
}

async function updateAppointmentStatus(appointmentId, status) {
  try {
    const res = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Appointment marked as ${status}`, 'success');
      setTimeout(() => window.location.reload(), 500);
    }
  } catch (err) {
    showToast('Error updating status', 'error');
  }
}

// -------------------------------------------------------------
// 11. BILLING & ROOM ALLOCATION
// -------------------------------------------------------------
async function handleCreateBill(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Invoice ${result.bill_id} generated!`, 'success');
      closeModal('newBillModal');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error generating bill', 'error');
  }
}

function openPayBillModal(billId, amount) {
  document.getElementById('payBillId').value = billId;
  document.getElementById('payBillAmount').textContent = `₹${amount}`;
  openModal('payBillModal');
}

async function handlePayBillSubmit(event) {
  event.preventDefault();
  const billId = document.getElementById('payBillId').value;
  const method = document.getElementById('paymentMethodSelect').value;

  try {
    const res = await fetch(`/api/billing/${billId}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_method: method })
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      closeModal('payBillModal');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error processing payment', 'error');
  }
}

async function handleAllocateRoom(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/rooms/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      closeModal('allocateRoomModal');
      setTimeout(() => window.location.reload(), 600);
    } else {
      showToast(result.message, 'error');
    }
  } catch (err) {
    showToast('Error allocating bed', 'error');
  }
}

async function dischargePatient(roomNumber, patientId) {
  if (!confirm(`Discharge patient ${patientId} from room ${roomNumber}?`)) return;

  try {
    const res = await fetch('/api/rooms/discharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_number: roomNumber, patient_id: patientId })
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    showToast('Error discharging patient', 'error');
  }
}

// -------------------------------------------------------------
// 12. INTERACTIVE MONGO QUERY CONSOLE
// -------------------------------------------------------------
const PREDEFINED_QUERIES = {
  q1: {
    title: "Query 1: Display All Patients",
    desc: "Retrieves all patient documents from the patients collection.",
    code: "db.patients.find()"
  },
  q2: {
    title: "Query 2: Find a Patient by Name",
    desc: "Filter documents matching patient name via BSON regex/equality.",
    code: 'db.patients.find({\n    name: "Rahul Sharma"\n})'
  },
  q3: {
    title: "Query 3: Find Doctors by Specialization",
    desc: "Query doctor documents by department specialty.",
    code: 'db.doctors.find({\n    specialization: "Cardiology"\n})'
  },
  q4: {
    title: "Query 4: Update Patient Details",
    desc: "Updates address or phone using MongoDB's $set atomic operator.",
    code: 'db.patients.updateOne(\n    { patient_id: "P101" },\n    { $set: { address: "Jodhpur" } }\n)'
  },
  q5: {
    title: "Query 5: Delete a Patient Record",
    desc: "Deletes a specified patient document adhering to retention policies.",
    code: 'db.patients.deleteOne({\n    patient_id: "P101"\n})'
  },
  q6: {
    title: "Query 6: Count Total Patients",
    desc: "Uses countDocuments for high-speed collection volume aggregation.",
    code: "db.patients.countDocuments()"
  },
  q7: {
    title: "Query 7: Count Doctors by Specialization ($group)",
    desc: "Multi-stage pipeline grouping doctors by specialization and computing sum.",
    code: `db.doctors.aggregate([
    {
        $group: {
            _id: "$specialization",
            totalDoctors: { $sum: 1 }
        }
    },
    { $sort: { totalDoctors: -1 } }
])`
  },
  q8: {
    title: "Query 8: Appointments with Patient Relational Join ($lookup)",
    desc: "Left outer join linking appointments with patients, unwinding child arrays.",
    code: `db.appointments.aggregate([
    {
        $lookup: {
            from: "patients",
            localField: "patient_id",
            foreignField: "patient_id",
            as: "patient_details"
        }
    },
    {
        $unwind: "$patient_details"
    },
    {
        $project: {
            _id: 0,
            appointment_id: 1,
            patient_name: "$patient_details.name",
            appointment_date: 1,
            status: 1
        }
    }
])`
  },
  q_revenue: {
    title: "Revenue Analytics: Total Revenue Aggregation Pipeline",
    desc: "Filters for Paid bills with $match and sums revenue with $group accumulator.",
    code: `db.billing.aggregate([
    {
        $match: {
            payment_status: "Paid"
        }
    },
    {
        $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" }
        }
    }
])`
  }
};

let currentSelectedQuery = 'q1';

function selectQuery(queryId) {
  playHapticSound('click');
  currentSelectedQuery = queryId;

  document.querySelectorAll('.query-card').forEach(el => el.classList.remove('active'));
  const activeEl = document.getElementById(`query-card-${queryId}`);
  if (activeEl) activeEl.classList.add('active');

  const q = PREDEFINED_QUERIES[queryId];
  if (!q) return;

  const titleEl = document.getElementById('queryDetailTitle');
  const descEl = document.getElementById('queryDetailDesc');
  const codeEl = document.getElementById('queryCodeViewer');
  const paramInputDiv = document.getElementById('queryParamContainer');

  if (titleEl) titleEl.textContent = q.title;
  if (descEl) descEl.textContent = q.desc;
  if (codeEl) codeEl.textContent = q.code;

  if (paramInputDiv) {
    if (queryId === 'q2') {
      paramInputDiv.style.display = 'block';
      paramInputDiv.innerHTML = `
        <label style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.35rem; display: block; font-weight: 600;">Target Name Parameter:</label>
        <input type="text" id="queryParamInput" class="form-control" value="Rahul Sharma" style="max-width: 320px;">
      `;
    } else if (queryId === 'q3') {
      paramInputDiv.style.display = 'block';
      paramInputDiv.innerHTML = `
        <label style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.35rem; display: block; font-weight: 600;">Target Specialization Parameter:</label>
        <select id="queryParamInput" class="form-control" style="max-width: 320px;">
          <option value="Cardiology">Cardiology</option>
          <option value="Neurology">Neurology</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="General Medicine">General Medicine</option>
          <option value="Dermatology">Dermatology</option>
        </select>
      `;
    } else {
      paramInputDiv.style.display = 'none';
      paramInputDiv.innerHTML = '';
    }
  }

  const outputEl = document.getElementById('queryResultOutput');
  if (outputEl) outputEl.textContent = '// Click "Execute Pipeline" to stream live BSON results';
  const metaEl = document.getElementById('queryExecutionMeta');
  if (metaEl) metaEl.textContent = 'Engine ready';
}

async function runCurrentQuery() {
  playHapticSound('click');
  const outputEl = document.getElementById('queryResultOutput');
  const metaEl = document.getElementById('queryExecutionMeta');
  const btn = document.getElementById('runQueryBtn');

  if (!outputEl) return;

  btn.disabled = true;
  btn.textContent = 'Streaming...';
  outputEl.textContent = 'Dispatching execution plan to MongoDB cluster...';

  let param = null;
  const paramInput = document.getElementById('queryParamInput');
  if (paramInput) {
    param = paramInput.value;
  }

  const startTime = performance.now();

  try {
    const res = await fetch('/api/run-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_id: currentSelectedQuery,
        param: param
      })
    });
    const data = await res.json();
    const duration = (performance.now() - startTime).toFixed(1);

    if (data.success) {
      playHapticSound('success');
      outputEl.textContent = JSON.stringify(data.result, null, 2);
      const count = Array.isArray(data.result) ? data.result.length : (data.result.count || 1);
      metaEl.innerHTML = `<span style="color: var(--status-emerald); font-weight: 700;">● Pipeline Resolved</span> | ${duration}ms | ${count} document(s)`;
    } else {
      outputEl.textContent = `MongoDB Error: ${data.error || data.message}`;
      metaEl.innerHTML = `<span style="color: var(--status-rose); font-weight: 700;">● Execution Failed</span>`;
    }
  } catch (err) {
    outputEl.textContent = `Network / Dispatch Error: ${err.message}`;
    metaEl.innerHTML = `<span style="color: var(--status-rose); font-weight: 700;">● Network Error</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '▶ Execute Pipeline';
  }
}

function copyQueryCode() {
  playHapticSound('click');
  const codeEl = document.getElementById('queryCodeViewer');
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.textContent);
    showToast('MongoDB query copied to clipboard!', 'success');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('query-card-q1')) {
    selectQuery('q1');
  }
});
