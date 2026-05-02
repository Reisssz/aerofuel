// ── Shared auth guard & helpers ────────────────────────────────

export function requireAuth(role) {
  const user = JSON.parse(localStorage.getItem('aerofuel_user') || 'null');
  if (!user) { location.href = '/index.html'; return null; }
  if (role && user.role !== role) { location.href = '/index.html'; return null; }
  return user;
}

export function saveUser(user) {
  localStorage.setItem('aerofuel_user', JSON.stringify(user));
}

export function getUser() {
  try { return JSON.parse(localStorage.getItem('aerofuel_user') || 'null'); }
  catch { return null; }
}

export function logout() {
  localStorage.removeItem('aerofuel_session');
  localStorage.removeItem('aerofuel_user');
  location.href = '/index.html';
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'2-digit' });
}

export function fmtCurrency(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

export function fmtReg(el) {
  let v = el.value.replace(/[^A-Za-z-]/g, '').toUpperCase();
  if (v.length > 2 && v[2] !== '-') v = v.slice(0,2) + '-' + v.slice(2).replace(/-/g,'');
  el.value = v.slice(0, 6);
}

export function fmtPhone(el) {
  let n = el.value.replace(/\D/g, '');
  if (n.length <= 2) el.value = `(${n}`;
  else if (n.length <= 7) el.value = `(${n.slice(0,2)}) ${n.slice(2)}`;
  else el.value = `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7,11)}`;
}

export function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === 'ok' ? 'var(--ok-bg)' : type === 'err' ? 'var(--err-bg)' : 'var(--ink-60)';
  el.style.color = type === 'ok' ? '#4ADE80' : type === 'err' ? '#F87171' : 'var(--white)';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
}

export function initSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}