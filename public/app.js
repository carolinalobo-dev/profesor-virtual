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

async function api(path, options = {}) {
  const response = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) throw new Error(body.error || 'No se pudo completar la operación.');
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
  if (role === 'bot' || role === 'error') wrapper.append(el('span', 'avatar bot', 'PV'));
  const bubble = el('div', 'bubble');
  bubble.append(el('span', '', text));
  if (ticketId) {
    const note = el('div', 'ticket-note', 'Ticket creado para el docente · ');
    note.append(el('code', '', `Ticket #${ticketId.slice(0, 8)}`));
    bubble.append(note);
  }
  wrapper.append(bubble);
  messages.append(wrapper);
  messages.scrollTop = messages.scrollHeight;
  return wrapper;
}

function showTyping() {
  const wrapper = el('div', 'msg bot typing');
  wrapper.append(el('span', 'avatar bot', 'PV'));
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
    toast('Completá tu nombre y curso para continuar.', true);
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
    if (data.derivated) refreshBadge();
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

addMessage('bot', '¡Hola! Soy tu Profesor Virtual. Contame tu duda sobre clases, tareas o fechas de entrega.');

/* ---------- Panel docente ---------- */
async function refreshBadge() {
  try {
    const pending = await api('/tickets?status=PENDING');
    const badge = $('#pendingBadge');
    badge.textContent = pending.length;
    badge.hidden = pending.length === 0;
  } catch { /* el badge es opcional */ }
}

function renderStats(summary) {
  const stats = $('#stats');
  stats.replaceChildren();
  const items = [
    { label: 'Consultas totales', value: summary.totalInteractions, percent: 100 },
    { label: 'Resueltas por IA', value: `${summary.resolvedByAIPercent}%`, percent: summary.resolvedByAIPercent },
    { label: 'Derivadas a docentes', value: `${summary.derivatedPercent}%`, percent: summary.derivatedPercent, warn: true },
  ];
  for (const item of items) {
    const card = el('div', `card stat${item.warn ? ' warn' : ''}`);
    const bar = el('div', 'bar');
    const fill = el('span');
    fill.style.width = `${item.percent}%`;
    bar.append(fill);
    card.append(el('span', 'label', item.label), el('span', 'value', String(item.value)), bar);
    stats.append(card);
  }
}

function ticketCard(ticket) {
  const card = el('article', 'ticket');
  const top = el('div', 'ticket-top');
  top.append(
    el('strong', '', ticket.studentName),
    el('span', 'pill channel', ticket.course),
    el('span', 'pill channel', ticket.channel),
    el('span', `pill ${ticket.status === 'PENDING' ? 'pending' : 'resolved'}`, ticket.status === 'PENDING' ? 'PENDIENTE' : 'RESUELTO'),
  );
  card.append(top, el('p', 'summary', ticket.summary || 'Consulta derivada'), el('p', 'original', `“${ticket.originalMessage}”`));
  card.append(el('p', 'meta', `Creado ${formatDate(ticket.createdAt)}${ticket.resolvedAt ? ` · Resuelto ${formatDate(ticket.resolvedAt)}` : ''}`));

  if (ticket.status === 'RESOLVED') {
    const reply = el('div', 'teacher-reply');
    reply.append(el('small', '', 'Respuesta del docente'), el('span', '', ticket.teacherReply));
    card.append(reply);
    return card;
  }

  const form = el('form', 'reply');
  const textarea = el('textarea');
  textarea.placeholder = 'Escribí la respuesta para el alumno…';
  textarea.required = true;
  textarea.maxLength = 2000;
  const actions = el('div', 'actions');
  const button = el('button', 'btn primary', 'Responder y cerrar');
  button.type = 'submit';
  actions.append(button);
  form.append(textarea, actions);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    try {
      await api(`/tickets/${ticket.id}/resolve`, { method: 'PATCH', body: JSON.stringify({ teacherReply: textarea.value }) });
      toast('Ticket resuelto');
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
    renderStats(summary);
    const list = $('#tickets');
    list.replaceChildren();
    if (tickets.length === 0) {
      const empty = el('div', 'empty');
      empty.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16v10H4zM4 7l8 6 8-6"/></svg>';
      empty.append(el('div', '', state.filter === 'PENDING' ? 'No hay tickets pendientes. ¡Todo al día!' : 'No hay tickets para mostrar.'));
      list.append(empty);
    } else {
      [...tickets].reverse().forEach((ticket) => list.append(ticketCard(ticket)));
    }
    refreshBadge();
  } catch (error) {
    toast(error.message, true);
  }
}

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((other) => other.classList.toggle('is-active', other === button));
    state.filter = button.dataset.status;
    loadTeacherPanel();
  });
});

refreshBadge();
