const API_BASE = '/api';

const patientForm = document.querySelector('#patient-form');
const sessionForm = document.querySelector('#session-form');
const confirmForm = document.querySelector('#confirm-form');
const patientSelect = document.querySelector('#session-patient');
const sessionsBody = document.querySelector('#sessions-body');
const refreshSessionsBtn = document.querySelector('#refresh-sessions');
const toast = document.querySelector('#toast');

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

async function fetchPatients() {
  const response = await fetch(`${API_BASE}/patients`);
  if (!response.ok) {
    throw new Error('No fue posible obtener los pacientes');
  }
  return await response.json();
}

async function fetchSessions() {
  const response = await fetch(`${API_BASE}/sessions`);
  if (!response.ok) {
    throw new Error('No fue posible obtener las sesiones');
  }
  return await response.json();
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function renderPatients(patients) {
  patientSelect.innerHTML = '';
  if (!patients.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Primero registra un paciente';
    patientSelect.appendChild(option);
    patientSelect.disabled = true;
    return;
  }
  patientSelect.disabled = false;
  for (const patient of patients) {
    const option = document.createElement('option');
    option.value = patient.id;
    option.textContent = patient.full_name;
    patientSelect.appendChild(option);
  }
}

function createStatusPill(value) {
  const span = document.createElement('span');
  span.className = 'status-pill';
  span.dataset.kind = value;
  span.textContent = value.replace('_', ' ');
  return span;
}

function createActionButtons(session) {
  const container = document.createElement('div');
  container.className = 'actions';

  if (session.payment_status !== 'paid') {
    const markPaidBtn = document.createElement('button');
    markPaidBtn.type = 'button';
    markPaidBtn.textContent = 'Registrar pago';
    markPaidBtn.addEventListener('click', async () => {
      const amount = prompt('Monto pagado', session.payment_amount ?? 0) ?? '';
      if (!amount) return;
      const method = prompt('Método de pago', session.payment_method ?? '') ?? '';
      await updateSession(session.id, {
        payment_status: 'paid',
        payment_amount: Number(amount),
        payment_method: method || null,
        paid_at: new Date().toISOString(),
      });
      loadSessions();
      showToast('Pago registrado correctamente', 'success');
    });
    container.appendChild(markPaidBtn);
  }

  if (session.status !== 'completed') {
    const completeBtn = document.createElement('button');
    completeBtn.type = 'button';
    completeBtn.textContent = 'Marcar completada';
    completeBtn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/sessions/${session.id}/complete`, {
        method: 'POST',
      });
      loadSessions();
      showToast('Sesión completada', 'success');
    });
    container.appendChild(completeBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar sesión? Esta acción no se puede deshacer.')) return;
    await fetch(`${API_BASE}/sessions/${session.id}`, { method: 'DELETE' });
    loadSessions();
    showToast('Sesión eliminada', 'success');
  });
  container.appendChild(deleteBtn);

  return container;
}

function renderSessions(sessions) {
  sessionsBody.innerHTML = '';
  for (const session of sessions) {
    const tr = document.createElement('tr');

    const columns = [
      session.id,
      session.patient_name,
      formatDateTime(session.scheduled_at),
      session.status,
      session.confirmation_status,
      session.payment_status,
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(
        session.payment_amount || 0
      ),
    ];

    columns.forEach((value, index) => {
      const td = document.createElement('td');
      if (index >= 3 && index <= 5) {
        td.appendChild(createStatusPill(String(value)));
      } else {
        td.textContent = String(value);
      }
      tr.appendChild(td);
    });

    const actionsCell = document.createElement('td');
    actionsCell.appendChild(createActionButtons(session));
    tr.appendChild(actionsCell);

    sessionsBody.appendChild(tr);
  }
}

async function updateSession(id, payload) {
  const response = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('No fue posible actualizar la sesión');
  }
  return await response.json();
}

async function loadPatients() {
  try {
    const patients = await fetchPatients();
    renderPatients(patients);
  } catch (error) {
    console.error(error);
    showToast('Error al cargar pacientes', 'error');
  }
}

async function loadSessions() {
  try {
    const sessions = await fetchSessions();
    renderSessions(sessions);
  } catch (error) {
    console.error(error);
    showToast('Error al cargar sesiones', 'error');
  }
}

patientForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(patientForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('No fue posible crear el paciente');
    }
    patientForm.reset();
    showToast('Paciente registrado correctamente', 'success');
    await loadPatients();
  } catch (error) {
    console.error(error);
    showToast('Error al registrar paciente', 'error');
  }
});

sessionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(sessionForm);
  const payload = Object.fromEntries(formData.entries());
  payload.patient_id = Number(payload.patient_id);
  payload.duration_minutes = Number(payload.duration_minutes);
  payload.payment_amount = Number(payload.payment_amount);
  if (!payload.payment_method) {
    payload.payment_method = null;
  }
  if (!payload.notes) {
    payload.notes = null;
  }

  try {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('No fue posible crear la sesión');
    }
    sessionForm.reset();
    await loadSessions();
    showToast('Sesión programada', 'success');
  } catch (error) {
    console.error(error);
    showToast('Error al crear sesión', 'error');
  }
});

confirmForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(confirmForm);
  const sessionId = formData.get('session_id');
  const payload = Object.fromEntries(formData.entries());
  payload.notes = payload.notes || null;

  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('No fue posible enviar la confirmación');
    }
    confirmForm.reset();
    showToast('Confirmación registrada. ¡Gracias!', 'success');
    await loadSessions();
  } catch (error) {
    console.error(error);
    showToast('Error al confirmar sesión', 'error');
  }
});

refreshSessionsBtn.addEventListener('click', loadSessions);

loadPatients();
loadSessions();
