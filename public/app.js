const API = '/api/v1';
const $ = (selector) => document.querySelector(selector);

const state = { filter: 'PENDING', sending: false };

/* ---------- Utilidades ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let toastTimer;
function toast(message, isError = false) {
  const node = $('#toast');
  node.textContent = message;
  node.className = `toast${isError ? ' error' : ''}`;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 3200);
}

const storage = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* sin almacenamiento */ } },
  remove(key) { try { sessionStorage.removeItem(key); } catch { /* sin almacenamiento */ } },
};

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const teacherKey = storage.get('teacherKey');
  if (teacherKey) headers['x-api-key'] = teacherKey;

  const response = await fetch(API + path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    const error = new Error(body.error || 'No se pudo completar la operación. Intentá de nuevo.');
    error.status = response.status;
    throw error;
  }
  return body.data;
}

const formatDate = (iso) =>
  new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/* ---------- Tema ---------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('theme', theme); } catch { /* sin almacenamiento */ }
}
(function initTheme() {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch { /* sin almacenamiento */ }
  applyTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
})();
$('#themeToggle').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

/* ---------- Navegación ---------- */
function showView(name) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.view === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $('#view-student').hidden = name !== 'student';
  $('#view-teacher').hidden = name !== 'teacher';
  if (name === 'teacher') loadTeacherPanel();
}
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => showView(tab.dataset.view)));

/* ---------- Chat del alumno ---------- */
const messages = $('#messages');

function addMessage(role, text, ticketId) {
  const wrapper = el('div', `msg ${role}`);
  wrapper.append(el('span', 'who', role === 'user' ? 'Vos' : 'Profesor Virtual'));
  const bubble = el('div', 'bubble');
  bubble.append(el('span', '', text));
  if (ticketId) {
    const note = el('div', 'ticket-note', 'Un docente va a responderte. Ticket ');
    note.append(el('code', '', `#${ticketId.slice(0, 8)}`));
    bubble.append(note);
  }
  wrapper.append(bubble);
  messages.append(wrapper);
  messages.scrollTop = messages.scrollHeight;
  return wrapper;
}

function showTyping() {
  const wrapper = el('div', 'msg bot typing');
  wrapper.append(el('span', 'who', 'Profesor Virtual'));
  const bubble = el('div', 'bubble');
  bubble.append(el('i'), el('i'), el('i'));
  wrapper.append(bubble);
  messages.append(wrapper);
  messages.scrollTop = messages.scrollHeight;
  return wrapper;
}

function identity() {
  const studentName = $('#studentName').value.trim();
  const course = $('#course').value.trim();
  $('#studentName').classList.toggle('is-invalid', !studentName);
  $('#course').classList.toggle('is-invalid', !course);
  return studentName && course ? { studentName, course, channel: $('#channel').value } : null;
}

async function sendMessage(text) {
  const message = text.trim();
  if (!message || state.sending) return;

  const who = identity();
  if (!who) {
    toast('Completá tu nombre y tu curso para enviar la consulta.', true);
    (!$('#studentName').value.trim() ? $('#studentName') : $('#course')).focus();
    return;
  }

  state.sending = true;
  $('#sendBtn').disabled = true;
  $('#suggestions').hidden = true;
  addMessage('user', message);
  $('#messageInput').value = '';
  autoGrow();
  const typing = showTyping();

  try {
    const data = await api('/chat/message', { method: 'POST', body: JSON.stringify({ ...who, message }) });
    typing.remove();
    addMessage('bot', data.reply, data.ticketId);
  } catch (error) {
    typing.remove();
    addMessage('error', error.message);
  } finally {
    state.sending = false;
    $('#sendBtn').disabled = false;
    $('#messageInput').focus();
  }
}

const input = $('#messageInput');
function autoGrow() {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
}
input.addEventListener('input', autoGrow);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    $('#chatForm').requestSubmit();
  }
});
$('#chatForm').addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(input.value);
});
document.querySelectorAll('.chip').forEach((chip) => chip.addEventListener('click', () => sendMessage(chip.textContent)));
['studentName', 'course'].forEach((id) => $(`#${id}`).addEventListener('input', (event) => event.target.classList.remove('is-invalid')));

addMessage('bot', 'Hola, soy el Profesor Virtual. Contame tu duda sobre clases, tareas o fechas de entrega.');

/* ---------- Panel docente ---------- */
function showGate(errorMessage) {
  $('#panel').hidden = true;
  $('#gate').hidden = false;
  $('#gateError').hidden = !errorMessage;
  $('#gateError').textContent = errorMessage ?? '';
  $('#gateKey').focus();
}

async function refreshBadge() {
  try {
    const pending = await api('/tickets?status=PENDING');
    const badge = $('#pendingBadge');
    badge.textContent = pending.length;
    badge.hidden = pending.length === 0;
  } catch { /* el contador es opcional */ }
}

function renderStats(summary) {
  const stats = $('#stats');
  stats.replaceChildren();

  const figures = el('div', 'stat-figures');
  for (const [value, label] of [
    [String(summary.totalInteractions), 'consultas recibidas'],
    [`${summary.resolvedByAIPercent}%`, 'resueltas por el Profesor Virtual'],
    [`${summary.derivatedPercent}%`, 'derivadas a un docente'],
  ]) {
    const figure = el('div');
    figure.append(el('span', 'value', value), el('span', 'label', label));
    figures.append(figure);
  }

  const split = el('div', 'split');
  split.setAttribute('role', 'img');
  split.setAttribute('aria-label', `${summary.resolvedByAIPercent}% resuelto por IA y ${summary.derivatedPercent}% derivado`);
  const ia = el('span', 'ia');
  ia.style.width = `${summary.totalInteractions ? summary.resolvedByAIPercent : 0}%`;
  const docente = el('span', 'docente');
  docente.style.width = `${summary.totalInteractions ? summary.derivatedPercent : 0}%`;
  split.append(ia, docente);

  const legend = el('div', 'legend');
  for (const [cls, text] of [['ia', 'Resuelto por IA'], ['docente', 'Derivado a docente']]) {
    const item = el('span');
    item.append(el('i', cls), document.createTextNode(text));
    legend.append(item);
  }
  stats.append(figures, split, legend);
}

function ticketCard(ticket) {
  const resolved = ticket.status === 'RESOLVED';
  const card = el('article', `ticket${resolved ? ' is-resolved' : ''}`);
  const top = el('div', 'ticket-top');
  top.append(
    el('strong', '', ticket.studentName),
    el('span', '', `${ticket.course} · ${ticket.channel}`),
    el('span', 'state', resolved ? 'Resuelto' : 'Pendiente'),
  );
  card.append(top, el('p', 'summary', ticket.summary || 'Consulta derivada'), el('p', 'original', `“${ticket.originalMessage}”`));
  card.append(el('p', 'meta', `Creado ${formatDate(ticket.createdAt)}${ticket.resolvedAt ? ` · Resuelto ${formatDate(ticket.resolvedAt)}` : ''}`));

  if (resolved) {
    const reply = el('div', 'teacher-reply');
    reply.append(el('small', '', 'Respuesta del docente'), el('span', '', ticket.teacherReply));
    card.append(reply);
    return card;
  }

  const form = el('form', 'reply');
  const textarea = el('textarea');
  textarea.placeholder = 'Escribí la respuesta para el alumno';
  textarea.setAttribute('aria-label', `Respuesta para ${ticket.studentName}`);
  textarea.required = true;
  textarea.maxLength = 2000;
  const actions = el('div', 'actions');
  const button = el('button', 'btn primary', 'Responder y cerrar ticket');
  button.type = 'submit';
  actions.append(button);
  form.append(textarea, actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      await api(`/tickets/${ticket.id}/resolve`, { method: 'PATCH', body: JSON.stringify({ teacherReply: textarea.value }) });
      toast('Ticket cerrado');
      loadTeacherPanel();
    } catch (error) {
      toast(error.message, true);
      button.disabled = false;
    }
  });
  card.append(form);
  return card;
}

async function loadTeacherPanel() {
  try {
    const query = state.filter ? `?status=${state.filter}` : '';
    const [summary, tickets] = await Promise.all([api('/analytics/summary'), api(`/tickets${query}`)]);
    $('#gate').hidden = true;
    $('#panel').hidden = false;
    renderStats(summary);

    const list = $('#tickets');
    list.replaceChildren();
    if (tickets.length === 0) {
      const empty = el('div', 'empty');
      empty.append(
        el('strong', '', state.filter === 'PENDING' ? 'No hay tickets pendientes' : 'No hay tickets para mostrar'),
        el('span', '', 'Cuando un alumno haga un reclamo o una consulta personal, aparece acá.'),
      );
      list.append(empty);
    } else {
      [...tickets].reverse().forEach((ticket) => list.append(ticketCard(ticket)));
    }
    refreshBadge();
  } catch (error) {
    if (error.status === 401) {
      const hadKey = Boolean(storage.get('teacherKey'));
      storage.remove('teacherKey');
      showGate(hadKey ? 'La clave no es correcta. Revisala e intentá de nuevo.' : undefined);
    } else {
      toast(error.message, true);
    }
  }
}

$('#gateForm').addEventListener('submit', (event) => {
  event.preventDefault();
  storage.set('teacherKey', $('#gateKey').value);
  $('#gateKey').value = '';
  loadTeacherPanel();
});

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((other) => other.classList.toggle('is-active', other === button));
    state.filter = button.dataset.status;
    loadTeacherPanel();
  });
});

refreshBadge();
