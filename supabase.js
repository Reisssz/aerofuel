// ═══════════════════════════════════════════════════════════════
// AEROFUEL — SUPABASE CLIENT
// Configure SUPABASE_URL and SUPABASE_KEY with your project values
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://SEU-PROJETO.supabase.co';   // <-- substitua
const SUPABASE_KEY  = 'SUA-ANON-KEY';                       // <-- substitua

// ── Minimal fetch-based Supabase client (no SDK dependency) ───

const _headers = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${_getToken() || SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
});

function _getToken() {
  try { return JSON.parse(localStorage.getItem('aerofuel_session') || '{}').access_token; }
  catch { return null; }
}

async function _req(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const r = await fetch(url, {
    method,
    headers: _headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ message: r.statusText }));
    throw new Error(err.message || err.error_description || 'Erro na requisição');
  }
  if (r.status === 204) return null;
  return r.json();
}

// ── Auth ───────────────────────────────────────────────────────

export const auth = {
  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.message || 'Credenciais inválidas');
    localStorage.setItem('aerofuel_session', JSON.stringify(data));
    return data;
  },

  async signOut() {
    localStorage.removeItem('aerofuel_session');
    localStorage.removeItem('aerofuel_user');
  },

  getSession() {
    try { return JSON.parse(localStorage.getItem('aerofuel_session') || 'null'); }
    catch { return null; }
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('aerofuel_user') || 'null'); }
    catch { return null; }
  },
};

// ── Profiles ───────────────────────────────────────────────────

export const profiles = {
  async getByAuthId(authId) {
    const rows = await _req('GET', `/profiles?auth_id=eq.${authId}&select=*`);
    return rows?.[0] || null;
  },
  async update(id, data) {
    return _req('PATCH', `/profiles?id=eq.${id}`, data);
  },
};

// ── Appointments ───────────────────────────────────────────────

export const appointments = {
  async getAll() {
    return _req('GET', '/appointments?select=*,profiles(name,email,phone)&order=scheduled_date.asc,scheduled_time.asc');
  },

  async getByUser(userId) {
    return _req('GET', `/appointments?pilot_id=eq.${userId}&select=*&order=scheduled_date.asc,scheduled_time.asc`);
  },

  async getByDate(date) {
    return _req('GET', `/appointments?scheduled_date=eq.${date}&select=*`);
  },

  async create(payload) {
    return _req('POST', '/appointments', payload);
  },

  async update(id, data) {
    return _req('PATCH', `/appointments?id=eq.${id}`, data);
  },

  async cancel(id) {
    return _req('PATCH', `/appointments?id=eq.${id}`, { status: 'Cancelado' });
  },
};

// ── Availability ───────────────────────────────────────────────

export const availability = {
  async getSlotsForDate(date) {
    const booked = await appointments.getByDate(date);
    const slotMap = {};
    (booked || []).forEach(a => {
      if (a.status !== 'Cancelado') {
        slotMap[a.scheduled_time] = (slotMap[a.scheduled_time] || 0) + 1;
      }
    });

    const slots = [];
    for (let h = 6; h < 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const count = slotMap[t] || 0;
        let status = 'av';
        if (count >= 3) status = 'full';
        else if (count >= 2) status = 'few';
        slots.push({ time: t, status, remaining: 3 - count });
      }
    }
    return slots;
  },

  async getWeekStatus(startDate) {
    // Returns { 'YYYY-MM-DD': 'av'|'few'|'full'|'closed' }
    const result = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const dow = d.getDay();
      if (dow === 0 || dow === 6) { result[ds] = 'closed'; continue; }
      const booked = await appointments.getByDate(ds);
      const active = (booked || []).filter(a => a.status !== 'Cancelado').length;
      if (active >= 32) result[ds] = 'full';
      else if (active >= 24) result[ds] = 'few';
      else result[ds] = 'av';
    }
    return result;
  },
};

export default { auth, profiles, appointments, availability };