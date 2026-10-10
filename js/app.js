/* =====================================================
   MUSRENBANG APPS 2027 Vers.1.1.2
   Developer: M.Afifi Eka Putra, S.E - CV. Kayu Awet Sejahtera
   ===================================================== */

// ---------- Storage ----------
const LS_USERS = 'mrb_users', LS_SURVEYS = 'mrb_surveys', LS_SESSION = 'mrb_session', LS_SEED = 'mrb_seeded_v1', LS_SUSPEND = 'mrb_suspended_v1', LS_USERSV = 'mrb_users_v2';

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { toast('⚠️ Penyimpanan penuh! Kurangi jumlah/ukuran foto.', 'error'); return false; }
}
function getAllSurveys() { return lsGet(LS_SURVEYS, []); }
function setAllSurveys(arr) { return lsSet(LS_SURVEYS, arr); }

// ---------- Sync Google Sheets (mode-ganda: GAS internal / API untuk Netlify) ----------
// PENTING: tempel URL Web App (/exec) di bawah ini agar domain Netlify tersambung ke database.
// Lihat PANDUAN-INTEGRASI.md Bagian C. Jika dibuka via URL /exec GAS, baris ini diabaikan (otomatis).
const SHEETS_API_URL = '___TEMPEL_URL_EXEC_DISINI___';
const GASRUN = (typeof google !== 'undefined' && google.script && google.script.run) ? google.script.run : null;
function apiReady() {
  if (GASRUN) return true;
  return SHEETS_API_URL.indexOf('https://script.google.com/') === 0;
}
function gasCall(fn, arg) {
  if (GASRUN) {
    return new Promise((resolve, reject) => {
      try { GASRUN.withSuccessHandler(resolve).withFailureHandler(reject)[fn](arg); }
      catch (err) { reject(err); }
    });
  }
  return fetchCall(fn, arg);
}
function fetchCall(fn, arg) {
  if (!apiReady()) return Promise.reject(new Error('api-belum-dikonfigurasi'));
  if (fn === 'apiPull') {
    return fetch(SHEETS_API_URL + '?action=pull').then(r => r.json()).then(j => {
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'pull-gagal');
      return j.data || [];
    });
  }
  const body = fn === 'apiPush' ? { action: 'push', record: arg } : { action: 'delete', id: String(arg) };
  return fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  }).then(r => r.json()).then(j => {
    if (!j || j.ok !== true) throw new Error((j && j.error) || 'push-gagal');
    return j.data;
  });
}
function isNewer(a, b) { return String(a || '') > String(b || ''); }
async function autoSync() {
  if (!apiReady()) return;
  try {
    toast('🔄 Sinkronisasi database...', 'info', 2200);
    const server = await gasCall('apiPull');
    const map = {};
    getAllSurveys().forEach(s => { map[String(s.id)] = s; });
    (server || []).forEach(s => {
      const cur = map[String(s.id)];
      if (!cur || isNewer(s.updatedAt, cur.updatedAt)) map[String(s.id)] = s;
    });
    const merged = Object.values(map).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    setAllSurveys(merged);
    for (const s of merged) {
      const srv = (server || []).find(x => String(x.id) === String(s.id));
      if (!srv || isNewer(s.updatedAt, srv.updatedAt)) await gasCall('apiPush', s);
    }
    updateCounts();
    if (document.getElementById('view-admin').classList.contains('active') && currentAdminTab === 'big') renderBigTable();
    if (document.getElementById('view-monitoring').classList.contains('active')) { renderMonitoringMap(); renderMonTable(); }
    toast('✅ Sinkronisasi selesai (' + merged.length + ' data).', 'success', 2500);
  } catch (err) { console.warn('sync gagal', err); }
}
async function pushRecord(rec) {
  if (!apiReady()) return;
  try {
    const canonical = await gasCall('apiPush', rec);
    const data = getAllSurveys();
    const i = data.findIndex(s => String(s.id) === String(rec.id));
    if (i > -1 && canonical) { data[i] = canonical; setAllSurveys(data); }
  } catch (err) { console.warn('push gagal', err); toast('⚠️ Tersimpan lokal, sinkronisasi tertunda (offline?).', 'info', 3500); }
}
async function pushDelete(id) {
  if (!apiReady()) return;
  try { await gasCall('apiDelete', id); } catch (err) { console.warn('delete-sync gagal', err); }
}

// ---------- PWA + deteksi koneksi real-time ----------
let __lastNetState = null;
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    navigator.serviceWorker.register('sw.js').then(
      () => console.log('SW terdaftar'),
      err => console.warn('SW gagal', err)
    );
  } catch (err) { console.warn('SW gagal', err); }
}
function verifyRealConnection() {
  try {
    if (typeof apiReady === 'function' && apiReady() && !GASRUN && SHEETS_API_URL.indexOf('https://') === 0) {
      return Promise.race([
        fetch(SHEETS_API_URL + '?action=ping').then(r => !!r.ok).catch(() => false),
        new Promise(res => setTimeout(() => res(false), 6000))
      ]);
    }
  } catch (e) {}
  return Promise.resolve(navigator.onLine);
}
function updateOnlineStatus() {
  const badge = document.getElementById('network-status-badge');
  const paint = (online) => {
    if (!badge) return;
    badge.textContent = online ? '🟢 Online' : '🔴 Offline';
    badge.classList.toggle('offline', !online);
    badge.classList.toggle('online', online);
  };
  if (!navigator.onLine) {
    paint(false);
    if (__lastNetState !== false) toast('📴 Offline — mode offline penuh aktif.', 'info', 3000);
    __lastNetState = false;
    return;
  }
  verifyRealConnection().then(real => {
    paint(!!real);
    if (real) {
      if (__lastNetState === false) {
        toast('✅ Kembali online — sinkronisasi database...', 'success', 2500);
        try { autoSync(); } catch (e) {}
      }
      __lastNetState = true;
    } else {
      if (__lastNetState !== false) toast('📴 Koneksi tidak stabil — mode offline penuh aktif.', 'info', 3000);
      __lastNetState = false;
    }
  }).catch(() => { paint(false); __lastNetState = false; });
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ---------- Toast ----------
function toast(msg, type = 'info', ms = 3200) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, ms);
}

// ---------- Navigation ----------
function hideSplash() {
  const sp = document.getElementById('splash');
  if (sp) sp.classList.add('hide');
}
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // bottom navigation per view (mobile)
  document.getElementById('bottom-nav-admin').classList.toggle('show', id === 'view-admin');
  document.getElementById('bottom-nav-mon').classList.toggle('show', id === 'view-monitoring');
  document.body.classList.toggle('has-bottomnav', id === 'view-admin' || id === 'view-monitoring');
  updateCounts();
  if (id === 'view-admin-auth') refreshSuspendBanner();
  if (id === 'view-admin') setTimeout(() => { initFormMap(); }, 150);
  if (id === 'view-monitoring') setTimeout(() => { initMonMap(); renderMonitoringMap(); renderMonTable(); }, 150);
}
const ADMIN_TITLES = {
  home: ['🏠 Home', 'Dashboard Administrator'],
  new: ['\uD83D\uDCDD New Data Survey', 'Input database survey baru'],
  big: ['\uD83D\uDDC2\uFE0F Big Data Survey', 'Kelola seluruh database'],
  grafik: ['\uD83D\uDCCA Monitoring Report', 'Grafik & rekap data']
};
let currentAdminTab = 'home';
function adminNav(tab) {
  currentAdminTab = tab;
  ['home', 'new', 'big', 'grafik'].forEach(t => {
    document.getElementById('admin-' + t).style.display = (t === tab ? 'block' : 'none');
    document.getElementById('nav-' + t).classList.toggle('active', t === tab);
    const bn = document.getElementById('bn-' + t); if (bn) bn.classList.toggle('active', t === tab);
  });
  document.getElementById('admin-page-title').textContent = ADMIN_TITLES[tab][0];
  document.getElementById('admin-page-sub').textContent = ADMIN_TITLES[tab][1];
  updateAdminPageIcon(tab);
  if (tab === 'home') refreshAdminHome();
  if (tab === 'new') setTimeout(() => initFormMap(), 120);
  if (tab === 'big') { refreshAdminFilters(); renderBigTable(); }
  if (tab === 'grafik') renderAdminCharts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function toggleProfileMenu(e, id) {
  e.stopPropagation();
  const w = document.getElementById(id);
  const was = w.classList.contains('open');
  document.querySelectorAll('.profile-wrap.open').forEach(x => x.classList.remove('open'));
  if (!was) w.classList.add('open');
}
document.addEventListener('click', () => document.querySelectorAll('.profile-wrap.open').forEach(x => x.classList.remove('open')));
function fieldOKel(inp, ok, msg) {
  if (!inp) return !!ok;
  inp.classList.toggle('input-invalid', !ok);
  const wrap = inp.closest('.form-group');
  const err = wrap ? wrap.querySelector('.error-msg') : null;
  if (err) { if (msg) err.textContent = msg; err.classList.toggle('show', !ok); }
  return !!ok;
}
function toggleAccordion(e) {
  if (e) e.stopPropagation();
  document.getElementById('profile-accordion').classList.toggle('open');
}
function paShow(which) {
  document.getElementById('pa-menu').style.display = which === 'menu' ? '' : 'none';
  document.getElementById('pa-panel-password').style.display = which === 'password' ? '' : 'none';
  document.getElementById('pa-panel-profile').style.display = which === 'profile' ? '' : 'none';
  if (which === 'profile') {
    const s = lsGet(LS_SESSION, {});
    const di = document.getElementById('pa-dname');
    if (di) di.value = s.name || '';
    const ow = document.getElementById('owner-reset-wrap');
    if (ow) ow.innerHTML = isOwnerSession() ? ownerToolsHTML('btn-sm') : '';
  }
}
function refreshProfileUI() {
  const s = lsGet(LS_SESSION, {});
  const nm = s.name || 'Admin';
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('admin-username', nm); set('home-username', nm); set('dd-name', nm);
  set('dd-avatar', nm.trim().charAt(0).toUpperCase()); set('pa-avatar', nm.trim().charAt(0).toUpperCase()); set('pa-name', nm);
}
function openProfileModal(kind) {
  document.querySelectorAll('.profile-wrap.open').forEach(x => x.classList.remove('open'));
  const s = lsGet(LS_SESSION, null);
  if (!s) { toast('❌ Sesi berakhir. Silakan login kembali.', 'error'); showView('view-landing'); return; }
  if (kind === 'password') {
    document.getElementById('detail-title').textContent = '🔑 Ganti Password';
    document.getElementById('detail-body').innerHTML =
      '<p class="subtitle">Login sebagai <b>' + esc(s.user) + '</b>. Isi password lama dan password baru (minimal 4 karakter).</p>' +
      '<form onsubmit="return doChangePassword(event)">' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Password Lama <span class="req">*</span></label><input type="password" name="old" placeholder="Password saat ini"><div class="error-msg">wajib diisi</div></div>' +
      '<div class="form-group"><label>Password Baru <span class="req">*</span></label><input type="password" name="new" placeholder="Minimal 4 karakter"><div class="error-msg">wajib diisi</div></div>' +
      '<div class="form-group"><label>Konfirmasi Password Baru <span class="req">*</span></label><input type="password" name="new2" placeholder="Ulangi password baru"><div class="error-msg">wajib diisi</div></div>' +
      '</div><div class="btn-row"><button class="btn btn-warning" type="submit">🔑 Ganti Password</button><button class="btn btn-ghost" type="button" onclick="closeModal()">Batal</button></div></form>';
  } else {
    const users = dbVisibleUsers();
    const acc = users.find(u => u.user.toLowerCase() === String(s.user).toLowerCase()) || {};
    const ownerBlock = isOwnerSession() ? '<div class="owner-tools">' + ownerToolsHTML('') + '</div>' : '';
    document.getElementById('detail-title').textContent = '📝 Edit Profil';
    document.getElementById('detail-body').innerHTML =
      '<form onsubmit="return doEditProfile(event)">' +
      '<div class="form-group"><label>Username</label><input type="text" value="' + esc(acc.user || '') + '" disabled><div class="hint">Username tidak dapat diubah.</div></div>' +
      '<div class="form-group"><label>Nama Tampilan <span class="req">*</span></label><input type="text" name="dname" value="' + esc(acc.name || '') + '"><div class="error-msg">wajib diisi</div></div>' +
      '<div class="btn-row"><button class="btn btn-primary" type="submit">💾 Simpan Profil</button><button class="btn btn-ghost" type="button" onclick="closeModal()">Batal</button></div>' + ownerBlock + '</form>';
  }
  document.getElementById('detail-modal').classList.add('show');
}
function doEditProfile(e) {
  e.preventDefault();
  const s = lsGet(LS_SESSION, null);
  if (!s) return false;
  const f = e.target;
  const nameI = f.querySelector('[name=dname]');
  const name = nameI.value.trim();
  if (!fieldOKel(nameI, name !== '')) return false;
  const users = lsGet(LS_USERS, []);
  const acc = users.find(u => u.user.toLowerCase() === String(s.user).toLowerCase());
  if (acc && acc.user.toLowerCase() === OWNER_USER && !isOwnerSession()) { toast('❌ Akses ditolak. Akun pemilik sistem dilindungi.', 'error'); return false; }
  if (acc) { acc.name = name; dbSaveUsers(users); }
  lsSet(LS_SESSION, { user: s.user, name: name });
  refreshProfileUI();
  closeModal();
  if (f.closest('#profile-accordion')) paShow('menu');
  toast('✅ Profil berhasil diperbarui.', 'success');
  return false;
}
function adminBack() {
  if (currentAdminTab === 'home') showView('view-landing');
  else adminNav('home');
}
const TAB_ICONS = { home: '\u23FB', new: '\U0001F4DD', big: '\U0001F5C2\uFE0F', grafik: '\U0001F4CA' };
function updateAdminPageIcon(tab) {
  const b = document.getElementById('admin-page-icon');
  if (!b) return;
  b.textContent = TAB_ICONS[tab] || '\U0001F3E0';
  if (tab === 'home') { b.classList.add('power'); b.title = 'Keluar / Logout'; b.onclick = doLogout; }
  else { b.classList.remove('power'); b.title = 'Menu'; b.onclick = null; }
}
function refreshAdminHome() {
  renderStats('home-stats');
  const d = document.getElementById('home-date');
  if (d) d.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
const MON_TITLES = { peta: '\uD83D\uDDFA\uFE0F Peta Monitoring', report: '\uD83D\uDCCB Monitoring Report', grafik: '\uD83D\uDCCA Grafik Report' };
function monTab(tab) {
  ['peta', 'report', 'grafik'].forEach(t => {
    document.getElementById('mpane-' + t).classList.toggle('active', t === tab);
    document.getElementById('mtab-' + t).classList.toggle('active', t === tab);
    const bm = document.getElementById('bm-' + t); if (bm) bm.classList.toggle('active', t === tab);
  });
  document.getElementById('mon-page-title').textContent = MON_TITLES[tab];
  if (tab === 'peta') setTimeout(() => { if (monMap) { monMap.invalidateSize(); renderMonitoringMap(); } }, 120);
  if (tab === 'report') renderMonTable();
  if (tab === 'grafik') renderMonCharts();
}

// ---------- Counts & stats ----------
function updateCounts() {
  const n = getAllSurveys().length;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('landing-total', n); set('badge-total', n); set('big-total', n); set('mon-total', n);
  set('bn-badge', n); set('mon-total-mini', n);
  renderStats('admin-stats'); renderStats('mon-stats'); renderStats('home-stats');
}
function renderStats(elId) {
  const el = document.getElementById(elId); if (!el) return;
  const d = getAllSurveys();
  const banjir = d.filter(s => s.banjir === 'Banjir').length;
  const cc = d.filter(s => (s.status || '').includes('Clean & Clear') && !s.status.includes('Belum')).length;
  const th = d.filter(s => s.tahun === '2027').length;
  el.innerHTML =
    `<div class="stat-card s1"><div class="n">${d.length}</div><div class="l">Total Survey</div></div>` +
    `<div class="stat-card s2"><div class="n">${th}</div><div class="l">Tahun 2027</div></div>` +
    `<div class="stat-card s3"><div class="n">${banjir}</div><div class="l">Titik Banjir</div></div>` +
    `<div class="stat-card s4"><div class="n">${cc}</div><div class="l">Clean & Clear</div></div>`;
}

// =====================================================
// AUTH
// =====================================================
const ADMIN_ACCOUNTS = [
  { user: 'jamesonly', pass: 'Katuas165', name: 'Super Admin' },
  { user: 'Super Admin', pass: 'Kayuawetsejahtera123', name: 'Administrator 1' }
];
const LEGACY_USERS = ['kas 1', 'kas 2'];
const OWNER_USER = 'jamesonly';
function isOwnerSession() {
  const s = lsGet(LS_SESSION, {});
  return String(s.user || '').toLowerCase() === OWNER_USER;
}
// ---- Lapisan database user (SELECT/UPDATE/DELETE): jamesonly tak tersentuh non-pemilik ----
function dbAllUsers() { return lsGet(LS_USERS, []); }
function dbVisibleUsers() {
  const u = dbAllUsers();
  return isOwnerSession() ? u : u.filter(x => String(x.user || '').toLowerCase() !== OWNER_USER);
}
function dbSaveUsers(users) {
  if (!isOwnerSession()) {
    const before = dbAllUsers().find(u => String(u.user || '').toLowerCase() === OWNER_USER);
    const after = (users || []).find(u => String(u.user || '').toLowerCase() === OWNER_USER);
    if (JSON.stringify(before || null) !== JSON.stringify(after || null)) { toast('❌ Akses ditolak. Akun pemilik sistem dilindungi.', 'error'); return false; }
  }
  return lsSet(LS_USERS, users);
}
function dbDeleteUser(targetUser) {
  if (String(targetUser || '').toLowerCase() === OWNER_USER) { toast('❌ Akun pemilik sistem tidak dapat dihapus.', 'error'); return false; }
  if (!isOwnerSession()) { toast('❌ Akses ditolak. Fitur ini khusus pemilik sistem.', 'error'); return false; }
  return dbSaveUsers(dbAllUsers().filter(u => String(u.user || '').toLowerCase() !== String(targetUser || '').toLowerCase()));
}
// ---- Suspend switch (setara file flag .lockout di sisi klien) ----
function isSuspended() { try { return !!localStorage.getItem(LS_SUSPEND); } catch (e) { return false; } }
function refreshSuspendBanner() {
  const b = document.getElementById('suspend-banner');
  if (!b) return;
  const off = isSuspended();
  b.style.display = off ? 'block' : 'none';
  if (off) b.innerHTML = '⛔ Akses ditangguhkan sementara waktu, Silahkan menghubungi <b>CV. Kayu Awet Sejahtera</b>';
}
function toggleSuspend() {
  if (!isOwnerSession()) { toast('❌ Akses ditolak. Fitur ini khusus pemilik sistem.', 'error'); return; }
  if (isSuspended()) {
    if (!confirm('Aktifkan kembali akses login untuk semua user?')) return;
    try { localStorage.removeItem(LS_SUSPEND); } catch (e) {}
    toast('✅ Akses sistem diaktifkan kembali.', 'success');
  } else {
    if (!confirm('TANGGUHKAN akses login semua user lain? Anda (jamesonly) tetap bisa login.')) return;
    try { localStorage.setItem(LS_SUSPEND, new Date().toISOString()); } catch (e) {}
    toast('🔒 Akses sistem ditangguhkan untuk user lain.', 'success', 4000);
  }
  paShow('profile');
}
function ownerToolsHTML(sz) {
  const susp = isSuspended();
  return '<button class="btn btn-warning ' + sz + '" type="button" onclick="doResetDefault()">🔄 Reset Password ke Default</button> ' +
    '<button class="btn btn-danger ' + sz + '" type="button" onclick="toggleSuspend()">' + (susp ? '🔓 Aktifkan Kembali Akses' : '🔒 Suspend System Access') + '</button>' +
    '<p class="hint" style="margin-top:6px">Khusus pemilik sistem' + (susp ? ' — STATUS: akses user lain DITANGGUHKAN.' : '.') + '</p>';
}
function b64(s) {
  s = String(s == null ? '' : s);
  try {
    if (typeof TextEncoder !== 'undefined') {
      const bytes = new TextEncoder().encode(s);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    }
    return btoa(unescape(encodeURIComponent(s)));
  } catch (e) { return btoa(s); }
}
function seedAdmins() {
  let users = lsGet(LS_USERS, []);
  const migrated = lsGet(LS_USERSV, 0) === 1;
  const before = users.length;
  users = users.filter(u => LEGACY_USERS.indexOf((u.user || '').toLowerCase()) === -1);
  let changed = users.length !== before;
  ADMIN_ACCOUNTS.forEach(a => {
    const ex = users.find(u => u.user.toLowerCase() === a.user.toLowerCase());
    if (ex) {
      if (!migrated && (ex.pass !== b64(a.pass) || ex.name !== a.name)) { ex.pass = b64(a.pass); ex.name = a.name; changed = true; }
    } else {
      users.push({ name: a.name, user: a.user, pass: b64(a.pass), createdAt: new Date().toISOString() });
      changed = true;
    }
  });
  if (changed) lsSet(LS_USERS, users);
  if (!migrated) lsSet(LS_USERSV, 1);
}
function doResetDefault() {
  if (!isOwnerSession()) { toast('❌ Akses ditolak. Fitur ini khusus pemilik sistem.', 'error'); return; }
  if (!confirm('Kembalikan SELURUH password administrator ke password default?')) return;
  const users = lsGet(LS_USERS, []);
  users.forEach(u => {
    const d = ADMIN_ACCOUNTS.find(a => a.user.toLowerCase() === (u.user || '').toLowerCase());
    if (d) { u.pass = b64(d.pass); u.name = d.name; }
  });
  lsSet(LS_USERS, users);
  seedAdmins();
  toast('✅ Seluruh password administrator dikembalikan ke default.', 'success', 4000);
}
function doChangePassword(e) {
  e.preventDefault();
  const s = lsGet(LS_SESSION, null);
  if (!s) { toast('❌ Sesi berakhir. Silakan login kembali.', 'error'); showView('view-landing'); return false; }
  const f = e.target;
  const oldI = f.querySelector('[name=old]'), newI = f.querySelector('[name=new]'), cI = f.querySelector('[name=new2]');
  let ok = true;
  ok = fieldOKel(oldI, oldI.value !== '') && ok;
  ok = fieldOKel(newI, newI.value.length >= 4) && ok;
  ok = fieldOKel(cI, cI.value === newI.value && cI.value.length >= 4, cI.value !== newI.value ? 'konfirmasi tidak sama' : 'wajib diisi') && ok;
  if (!ok) return false;
  const users = lsGet(LS_USERS, []);
  const acc = users.find(u => u.user.toLowerCase() === String(s.user).toLowerCase());
  if (acc && acc.user.toLowerCase() === OWNER_USER && !isOwnerSession()) { toast('❌ Akses ditolak. Akun pemilik sistem dilindungi.', 'error'); return false; }
  if (!acc || acc.pass !== b64(oldI.value)) { toast('❌ Password lama salah!', 'error'); return false; }
  acc.pass = b64(newI.value);
  dbSaveUsers(users);
  oldI.value = ''; newI.value = ''; cI.value = '';
  closeModal();
  if (f.closest('#profile-accordion')) paShow('menu');
  toast('✅ Password berhasil diganti.', 'success');
  return false;
}
function fieldOK(inputId, errId, ok) {
  const inp = document.getElementById(inputId), err = document.getElementById(errId);
  if (ok) { inp.classList.remove('input-invalid'); err.classList.remove('show'); }
  else { inp.classList.add('input-invalid'); err.classList.add('show'); }
  return ok;
}
function doLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  let ok = true;
  ok = fieldOK('login-user', 'err-login-user', user !== '') && ok;
  ok = fieldOK('login-pass', 'err-login-pass', pass !== '') && ok;
  if (!ok) return false;
  if (isSuspended() && user.toLowerCase() !== OWNER_USER) { toast('⛔ Akses ditangguhkan sementara waktu, Silahkan menghubungi CV. Kayu Awet Sejahtera', 'error', 6000); return false; }
  const acc = lsGet(LS_USERS, []).find(u => u.user.toLowerCase() === user.toLowerCase() && u.pass === b64(pass));
  if (!acc) { toast('❌ Username atau password salah!', 'error'); return false; }
  lsSet(LS_SESSION, { user: acc.user, name: acc.name });
  toast('✅ Login berhasil. Selamat datang, <b>' + esc(acc.name) + '</b>!', 'success');
  enterAdmin(); return false;
}
function doLogout() {
  try { localStorage.removeItem(LS_SESSION); } catch (e) {}
  toast('👋 Anda telah logout.', 'info');
  showView('view-landing');
}
function enterAdmin() {
  const s = lsGet(LS_SESSION, null);
  document.getElementById('admin-username').textContent = s ? s.name : 'Admin';
  refreshProfileUI();
  showView('view-admin'); adminNav('home');
}
function enterMonitoring() { showView('view-monitoring'); monTab('peta'); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// =====================================================
// WILAYAH (Sumsel via API emsifa + fallback offline)
// =====================================================
const WIL_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const PROV_SUMSEL = '16';
const wilayahCache = { regencies: [], districts: {}, villages: {} };
const FALLBACK_KAB = ['Kota Palembang', 'Kota Prabumulih', 'Kota Pagar Alam', 'Kota Lubuk Linggau', 'Kabupaten Banyuasin', 'Kabupaten Empat Lawang', 'Kabupaten Lahat', 'Kabupaten Muara Enim', 'Kabupaten Musi Banyuasin', 'Kabupaten Musi Rawas', 'Kabupaten Musi Rawas Utara', 'Kabupaten Ogan Ilir', 'Kabupaten Ogan Komering Ilir', 'Kabupaten Ogan Komering Ulu', 'Kabupaten Ogan Komering Ulu Selatan', 'Kabupaten Ogan Komering Ulu Timur', 'Kabupaten Penukal Abab Lematang Ilir'];

async function fetchJSON(url) {
  const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
}
async function loadKabKota() {
  const sel = document.getElementById('f-kabkota');
  try {
    const data = await fetchJSON(`${WIL_BASE}/regencies/${PROV_SUMSEL}.json`);
    wilayahCache.regencies = data;
    sel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten --</option>' + data.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');
  } catch (e) {
    sel.innerHTML = '<option value="">-- Pilih Kota/Kabupaten --</option>' +
      FALLBACK_KAB.map((n, i) => `<option value="FB${i}">${esc(n)}</option>`).join('');
    toast('⚠️ API wilayah offline — memakai daftar statis Sumsel.', 'info');
  }
  fillKabFilters();
}
function kabNameById(id) {
  const f = wilayahCache.regencies.find(d => String(d.id) === String(id));
  if (f) return f.name;
  if (String(id).startsWith('FB')) { const i = parseInt(String(id).slice(2)); return FALLBACK_KAB[i] || id; }
  return id;
}
async function onKabKotaChange() {
  const kabId = document.getElementById('f-kabkota').value;
  const kecSel = document.getElementById('f-kecamatan'), kelSel = document.getElementById('f-kelurahan');
  kecSel.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  kelSel.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';
  clearErr('f-kecamatan'); clearErr('f-kelurahan');
  if (!kabId) return;
  if (String(kabId).startsWith('FB')) { addManualOption(kecSel); addManualOption(kelSel); return; }
  kecSel.innerHTML = '<option value="">Memuat...</option>';
  try {
    const data = await fetchJSON(`${WIL_BASE}/districts/${kabId}.json`);
    wilayahCache.districts[kabId] = data;
    kecSel.innerHTML = '<option value="">-- Pilih Kecamatan --</option>' + data.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');
  } catch (e) { kecSel.innerHTML = '<option value="">-- Pilih Kecamatan --</option>'; addManualOption(kecSel); }
}
async function onKecamatanChange() {
  const kecId = document.getElementById('f-kecamatan').value;
  const kelSel = document.getElementById('f-kelurahan');
  kelSel.innerHTML = '<option value="">-- Pilih Kelurahan --</option>';
  clearErr('f-kelurahan');
  if (!kecId) return;
  if (kecId === '__manual__') { manualPrompt(kelSel, 'kelurahan'); return; }
  kelSel.innerHTML = '<option value="">Memuat...</option>';
  try {
    const data = await fetchJSON(`${WIL_BASE}/villages/${kecId}.json`);
    wilayahCache.villages[kecId] = data;
    kelSel.innerHTML = '<option value="">-- Pilih Kelurahan --</option>' + data.map(d => `<option value="${esc(d.name)}">${esc(d.name)}</option>`).join('');
  } catch (e) { kelSel.innerHTML = '<option value="">-- Pilih Kelurahan --</option>'; addManualOption(kelSel); }
}
function addManualOption(sel) {
  sel.insertAdjacentHTML('beforeend', '<option value="__manual__">✏️ Ketik manual...</option>');
}
function manualPrompt(sel, label) {
  const v = prompt('Ketik nama ' + label + ':');
  if (v && v.trim()) {
    const opt = document.createElement('option'); opt.value = v.trim(); opt.textContent = v.trim();
    sel.appendChild(opt); sel.value = v.trim();
  } else sel.value = '';
}
document.addEventListener('change', e => {
  if (e.target && (e.target.id === 'f-kecamatan' || e.target.id === 'f-kelurahan') && e.target.value === '__manual__') {
    manualPrompt(e.target, e.target.id === 'f-kecamatan' ? 'kecamatan' : 'kelurahan/desa');
  }
});
function kecNameById(kabId, kecId) {
  if (kecId === '__manual__') return '';
  const arr = wilayahCache.districts[kabId] || [];
  const f = arr.find(d => String(d.id) === String(kecId));
  return f ? f.name : kecId;
}
function clearErr(fieldId) {
  const i = document.getElementById(fieldId); if (i) i.classList.remove('input-invalid');
  const e = document.getElementById('err-' + fieldId); if (e) e.classList.remove('show');
}

// =====================================================
// FORM: tahun, banjir, radio cards, koordinat, foto
// =====================================================
function fillTahunSelects() {
  const years = []; for (let y = 2025; y <= 2035; y++) years.push(y);
  document.getElementById('f-tahun').innerHTML = '<option value="">-- Pilih Tahun --</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  ['flt-tahun', 'mon-flt-tahun', 'mon-flt-tahun2'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = '<option value="">Tahun: Semua</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  });
}
function toggleBanjir() {
  const v = document.querySelector('input[name=banjir]:checked');
  const isBanjir = !!(v && v.value === 'Banjir');
  document.getElementById('banjir-detail').style.display = isBanjir ? 'block' : 'none';
  // Validasi kondisional: 4 grup "b. Kerugian Jika Banjir" wajib hanya saat Banjir
  const groups = [['eko', 'err-f-eko', 'g-eko'], ['fasos', 'err-f-fasos', 'g-fasos'], ['trans', 'err-f-trans', 'g-trans'], ['mukim', 'err-f-mukim', 'g-mukim']];
  groups.forEach(([name, errId, groupId]) => {
    document.querySelectorAll('input[name=' + name + ']').forEach(r => { r.required = isBanjir; if (!isBanjir) r.checked = false; });
    if (!isBanjir) {
      document.getElementById(errId).classList.remove('show');
      document.getElementById(groupId).style.outline = '';
    }
  });
  paintRadioCards();
}
document.addEventListener('change', e => { if (e.target.matches('input[type=radio]')) paintRadioCards(); });
document.addEventListener('click', e => { const l = e.target.closest('.radio-card,.check-card'); if (l) setTimeout(paintRadioCards, 30); });
function paintRadioCards() {
  document.querySelectorAll('.radio-card,.check-card').forEach(l => {
    const inp = l.querySelector('input'); l.classList.toggle('selected', !!(inp && inp.checked));
  });
}

// ---- Koordinat & peta form ----
let formMap = null, formMarkers = {}, formLine = null, activePoint = 'awal';
function parseCoord(str) {
  if (!str) return null;
  const p = String(str).split(',').map(s => parseFloat(s.trim()));
  if (p.length !== 2 || isNaN(p[0]) || isNaN(p[1])) return null;
  if (p[0] < -90 || p[0] > 90 || p[1] < -180 || p[1] > 180) return null;
  return p;
}
function initFormMap() {
  if (typeof L === 'undefined') { document.getElementById('form-map').innerHTML = '<p style="padding:20px">⚠️ Peta membutuhkan koneksi internet (Leaflet CDN).</p>'; return; }
  if (formMap) { formMap.invalidateSize(); return; }
  formMap = L.map('form-map').setView([-2.9909, 104.7565], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(formMap);
  formMap.on('click', e => {
    const v = e.latlng.lat.toFixed(6) + ',' + e.latlng.lng.toFixed(6);
    const map = { awal: 'f-koor-awal', tengah: 'f-koor-tengah', akhir: 'f-koor-akhir' };
    document.getElementById(map[activePoint]).value = v;
    refreshFormMap();
    toast('📍 ' + activePoint.toUpperCase() + ' diset: ' + v, 'info', 1800);
  });
  refreshFormMap();
}
function setActivePoint(p) {
  activePoint = p;
  ['awal', 'tengah', 'akhir'].forEach(k => document.getElementById('pb-' + k).classList.toggle('active', k === p));
  toast('Aktif: <b>Titik ' + p.toUpperCase() + '</b> — klik peta untuk menandai.', 'info', 1800);
}
// ---- Geo premium: akurasi GPS + kompas (state dibaca pengolah foto) ----
let geoPremium = { acc: null, compassDeg: null, compassText: '' };
let __compassOn = false;
const WIND_ID = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
function windID(deg) { return WIND_ID[Math.round((((deg % 360) + 360) % 360) / 45) % 8]; }
function updateGeoPremiumInfo() {
  const a = document.getElementById('gps-acc-val'), c = document.getElementById('compass-val');
  if (a) a.textContent = geoPremium.acc == null ? '-' : geoPremium.acc;
  if (c) c.textContent = geoPremium.compassDeg == null ? '-° (-)' : Math.round(geoPremium.compassDeg) + '° (' + geoPremium.compassText + ')';
}
function onDeviceOrientation(e) {
  let deg = null;
  if (e && typeof e.webkitCompassHeading === 'number') deg = e.webkitCompassHeading;
  else if (e && typeof e.alpha === 'number') deg = (360 - e.alpha + 360) % 360;
  if (deg == null || isNaN(deg)) return;
  deg = Math.round(((deg % 360) + 360) % 360);
  if (geoPremium.compassDeg === deg) return;
  geoPremium.compassDeg = deg;
  geoPremium.compassText = windID(deg);
  updateGeoPremiumInfo();
}
function enableCompass() {
  if (__compassOn || typeof window.DeviceOrientationEvent === 'undefined') return;
  __compassOn = true;
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(st => {
        if (st === 'granted') window.addEventListener('deviceorientation', onDeviceOrientation, true);
        else __compassOn = false;
      }).catch(() => { __compassOn = false; });
    } else {
      window.addEventListener('deviceorientationabsolute', onDeviceOrientation, true);
      window.addEventListener('deviceorientation', onDeviceOrientation, true);
    }
  } catch (err) { __compassOn = false; }
}
function useMyLocation() {
  if (!navigator.geolocation) { toast('Perangkat atau browser tidak mendukung GPS.', 'error'); return; }
  enableCompass();
  if (!window.isSecureContext) toast('GPS membutuhkan koneksi aman (HTTPS). Jika gagal, silakan klik peta secara manual.', 'info', 4500);
  toast('Mengambil lokasi GPS... mohon tunggu.', 'info', 3000);
  const order = ['awal', 'tengah', 'akhir'];
  const labels = { awal: 'Awal', tengah: 'Tengah', akhir: 'Akhir' };
  navigator.geolocation.getCurrentPosition(pos => {
    const v = pos.coords.latitude.toFixed(6) + ',' + pos.coords.longitude.toFixed(6);
    geoPremium.acc = (typeof pos.coords.accuracy === 'number') ? Math.round(pos.coords.accuracy) : null;
    updateGeoPremiumInfo();
    const map = { awal: 'f-koor-awal', tengah: 'f-koor-tengah', akhir: 'f-koor-akhir' };
    const input = document.getElementById(map[activePoint]);
    input.value = v;
    input.classList.remove('input-invalid');
    document.getElementById('err-f-koor').classList.remove('show');
    refreshFormMap(true);
    const idx = order.indexOf(activePoint);
    if (idx > -1 && idx < order.length - 1) {
      activePoint = order[idx + 1];
      ['awal', 'tengah', 'akhir'].forEach(k => document.getElementById('pb-' + k).classList.toggle('active', k === activePoint));
      toast('Titik ' + labels[order[idx]] + ' tersimpan: ' + v + '. Lanjut ke Titik ' + labels[activePoint] + '.', 'success', 4000);
    } else {
      toast('Semua titik koordinat telah terisi.', 'success');
    }
  }, err => {
    let msg = 'Gagal mengambil lokasi.';
    if (err.code === 1) msg = 'Izin lokasi ditolak. Mohon aktifkan izin lokasi pada browser lalu coba lagi.';
    else if (err.code === 2) msg = 'Sinyal GPS tidak tersedia. Coba lagi atau klik peta secara manual.';
    else if (err.code === 3) msg = 'Pengambilan lokasi melebihi batas waktu. Silakan coba lagi.';
    toast(msg, 'error', 5000);
  }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}
function refreshFormMap(fit = false) {
  document.getElementById('err-f-koor').classList.remove('show');
  if (!formMap || typeof L === 'undefined') return;
  const pts = [
    ['awal', document.getElementById('f-koor-awal').value, 'A — Titik Awal', 'green'],
    ['tengah', document.getElementById('f-koor-tengah').value, 'B — Titik Tengah', 'orange'],
    ['akhir', document.getElementById('f-koor-akhir').value, 'C — Titik Akhir', 'red']
  ];
  const latlngs = [];
  pts.forEach(([key, raw, label]) => {
    const c = parseCoord(raw);
    if (formMarkers[key]) { formMap.removeLayer(formMarkers[key]); formMarkers[key] = null; }
    if (c) {
      formMarkers[key] = L.marker(c).addTo(formMap).bindPopup('<b>' + label + '</b><br>' + c[0] + ',' + c[1]);
      latlngs.push(c);
    }
  });
  if (formLine) { formMap.removeLayer(formLine); formLine = null; }
  if (latlngs.length >= 2) formLine = L.polyline(latlngs, { color: '#0b5fff', weight: 4 }).addTo(formMap);
  if (fit && latlngs.length) formMap.fitBounds(latlngs.length > 1 ? latlngs : [latlngs[0]], { padding: [40, 40] });
}

// ---- Foto premium: watermark kondisional + kompresi <400KB + dropzone ----
let tempPhotos = [];
let tempPhotoSrc = [];
let __gpsCache = { t: 0, v: null };
function getUploadGPS() {
  const now = Date.now();
  if (__gpsCache.v && now - __gpsCache.t < 60000) return Promise.resolve(__gpsCache.v);
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(null); } }, 8000);
    navigator.geolocation.getCurrentPosition(pos => {
      if (done) return; done = true; clearTimeout(timer);
      const v = pos.coords.latitude.toFixed(6) + ',' + pos.coords.longitude.toFixed(6);
      __gpsCache = { t: Date.now(), v };
      resolve(v);
    }, () => { if (!done) { done = true; clearTimeout(timer); resolve(null); } },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  });
}
function stampNow() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}
function selText(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  if (el.tagName === 'SELECT' && el.selectedIndex >= 0 && el.options[el.selectedIndex]) return (el.options[el.selectedIndex].text || '').trim();
  return (el.value || '').trim();
}
function wmClean(v, max) {
  v = String(v || '').trim();
  if (!v || v === '__manual__' || v.indexOf('Pilih') === 0 || v.indexOf('--') === 0) return '-';
  return v.length > max ? v.slice(0, max) + '…' : v;
}
function buildWatermark(source, gps) {
  // Poin 1: a.No.ID Survey -> #f-survey-no | b.No.ID Usulan -> #f-usulan-no | Section 3 -> #f-kecamatan/#f-kelurahan
  const kec = wmClean(kecNameById(val('f-kabkota'), val('f-kecamatan')) || selText('f-kecamatan'), 28);
  const kel = wmClean(selText('f-kelurahan'), 28);
  return {
    time: stampNow() + (source === 'camera' ? ' (Live Survey)' : ' (Unggahan Foto)'),
    gps: 'GPS: ' + (gps || val('f-koor-awal') || '-') + ' | Akurasi: ' + (geoPremium.acc == null ? '-' : geoPremium.acc + ' m') + ' | Kompas: ' + (geoPremium.compassDeg == null ? '-' : Math.round(geoPremium.compassDeg) + '° (' + geoPremium.compassText + ')'),
    area: 'Kecamatan: ' + kec + ' / Kelurahan: ' + kel,
    survey: 'No. ID Survey: ' + wmClean(val('f-survey-no'), 24),
    usulan: 'ID Usulan: ' + wmClean(val('f-usulan-no'), 24)
  };
}
function drawWatermark(ctx, w, h, wm) {
  const lines = [wm.time, wm.gps, wm.area, wm.survey, wm.usulan];
  let fs = Math.max(13, Math.round(w * 0.026));
  const pad = Math.round(fs * 0.7);
  ctx.font = 'bold ' + fs + 'px Arial, sans-serif';
  const maxW = w - pad * 2 - 12;
  lines.forEach(t => { while (fs > 10 && ctx.measureText('  ' + t).width > maxW) { fs -= 1; ctx.font = 'bold ' + fs + 'px Arial, sans-serif'; } });
  const lh = Math.round(fs * 1.45), boxH = lines.length * lh + pad * 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, h - boxH, w, boxH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold ' + fs + 'px Arial, sans-serif';
  ctx.textBaseline = 'top';
  lines.forEach((t, i) => ctx.fillText('  ' + t, pad, h - boxH + pad + i * lh));
  ctx.restore();
}
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = ev => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = ev.target.result; };
    r.onerror = reject; r.readAsDataURL(file);
  });
}
async function processPhoto(file, source, gps) {
  const img = await fileToImage(file);
  const MAXB = 150 * 1024;
  let maxDim = 1280, quality = 0.80, url = '';
  for (let a = 0; a < 6; a++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    drawWatermark(ctx, w, h, buildWatermark(source, gps));
    url = cv.toDataURL('image/jpeg', quality);
    if (url.length * 0.75 <= MAXB || (quality <= 0.4 && maxDim <= 640)) break;
    if (quality > 0.45) quality = Math.round((quality - 0.12) * 100) / 100;
    else maxDim = Math.round(maxDim * 0.8);
  }
  return url;
}
function fotoProgress(show, frac, text) {
  const w = document.getElementById('foto-progress'), b = document.getElementById('foto-progress-bar'), t = document.getElementById('foto-progress-text');
  if (!w || !b) return;
  w.style.display = show ? 'block' : 'none';
  if (t) { t.style.display = show ? 'block' : 'none'; if (text) t.textContent = text; }
  if (show) b.style.width = Math.round((frac || 0) * 100) + '%';
}
function dropPhotos(e) {
  e.preventDefault();
  const z = document.getElementById('photo-zone');
  if (z) z.classList.remove('drag');
  const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
  if (!files.length) return;
  handlePhotos({ target: { files, value: '' } }, 'upload');
}
async function handlePhotos(e, source) {
  const input = e.target;
  const files = Array.from(input.files || []).filter(f => f.type && f.type.indexOf('image/') === 0);
  try { input.value = ''; } catch (err) {}
  if (!files.length) return;
  const room = 50 - tempPhotos.length;
  if (room <= 0) { toast('❌ Maksimal 50 foto!', 'error'); return; }
  const batch = files.slice(0, room);
  if (files.length > room) toast('⚠️ Hanya ' + room + ' foto ditambahkan (maks 50).', 'info', 3000);
  toast('⏳ Memproses ' + batch.length + ' foto (watermark + kompress)...', 'info', 2200);
  fotoProgress(true, 0, 'Menyiapkan GPS & watermark... 0/' + batch.length);
  const gps = await getUploadGPS();
  let okc = 0;
  for (let i = 0; i < batch.length; i++) {
    try { tempPhotos.push(await processPhoto(batch[i], source || 'upload', gps)); tempPhotoSrc.push(source || 'upload'); okc++; }
    catch (err) { console.warn('foto gagal diproses', err); }
    fotoProgress(true, (i + 1) / batch.length, 'Memproses foto ' + (i + 1) + '/' + batch.length + '...');
    renderPhotoPreview();
  }
  fotoProgress(false);
  renderPhotoPreview();
  toast(okc ? '✅ ' + okc + ' foto ditambahkan (watermark + <400KB).' : '❌ Semua foto gagal diproses.', okc ? 'success' : 'error');
}
function renderPhotoPreview() {
  const g = document.getElementById('foto-preview');
  document.getElementById('foto-count').textContent = tempPhotos.length;
  document.getElementById('err-f-foto').classList.toggle('show', false);
  g.innerHTML = tempPhotos.map((p, i) => {
    const src = tempPhotoSrc[i] || 'upload';
    const badge = src === 'camera' ? '<span class="src" title="Kamera Langsung">📷</span>' : (src === 'upload' ? '<span class="src" title="Galeri / File">📤</span>' : '');
    return `<div class="photo-item" data-src="${src}"><img src="${p}" onclick="openLightbox('${i}', 'temp')" alt="Foto ${i + 1}">${badge}<button type="button" class="del" onclick="delPhoto(${i})">✖</button><span class="num">${i + 1}</span></div>`;
  }).join('');
}
function delPhoto(i) { tempPhotos.splice(i, 1); tempPhotoSrc.splice(i, 1); renderPhotoPreview(); }
let lightboxPhotos = [];
function openLightbox(i, mode) {
  let src = '';
  if (mode === 'temp') src = tempPhotos[i];
  else if (i && typeof i === 'object' && i.src) src = i.src;
  else src = i;
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('show');
}

// =====================================================
// SAVE / EDIT SURVEY
// =====================================================
function radioVal(name) { const r = document.querySelector(`input[name=${name}]:checked`); return r ? r.value : ''; }
function reqText(id) {
  const el = document.getElementById(id); const v = el.value.trim();
  const bad = v === '';
  el.classList.toggle('input-invalid', bad);
  document.getElementById('err-' + id).classList.toggle('show', bad);
  return !bad;
}
function reqRadio(name, errId, groupId) {
  const ok = radioVal(name) !== '';
  document.getElementById(errId).classList.toggle('show', !ok);
  if (groupId) document.getElementById(groupId).style.outline = ok ? '' : '2px solid #e02424';
  return ok;
}
function saveSurvey(e) {
  e.preventDefault();
  let ok = true;
  ok = reqText('f-tahun') && ok;
  ok = reqText('f-survey-no') && ok;
  ok = reqText('f-usulan-no') && ok;
  ok = reqText('f-petugas') && ok;
  ok = reqText('f-alamat') && ok;
  ok = reqText('f-rt') && ok;
  ok = reqText('f-kabkota') && ok;
  ok = reqText('f-kecamatan') && ok;
  ok = reqText('f-kelurahan') && ok;
  ok = reqText('f-nama-pejabat') && ok;
  ok = reqText('f-hp') && ok;

  const banjir = radioVal('banjir') || 'Tidak Banjir';
  if (banjir === 'Banjir') {
    ok = reqRadio('eko', 'err-f-eko', 'g-eko') && ok;
    ok = reqRadio('fasos', 'err-f-fasos', 'g-fasos') && ok;
    ok = reqRadio('trans', 'err-f-trans', 'g-trans') && ok;
    ok = reqRadio('mukim', 'err-f-mukim', 'g-mukim') && ok;
  }
  const cA = parseCoord(document.getElementById('f-koor-awal').value.trim());
  const cC = parseCoord(document.getElementById('f-koor-akhir').value.trim());
  const koorOK = !!(cA && cC);
  document.getElementById('err-f-koor').classList.toggle('show', !koorOK);
  document.getElementById('f-koor-awal').classList.toggle('input-invalid', !cA);
  document.getElementById('f-koor-akhir').classList.toggle('input-invalid', !cC);
  ok = koorOK && ok;

  const fotoOK = tempPhotos.length >= 2;
  document.getElementById('err-f-foto').classList.toggle('show', !fotoOK);
  ok = fotoOK && ok;

  const kabId = document.getElementById('f-kabkota').value;
  const kecId = document.getElementById('f-kecamatan').value;
  const kelVal = document.getElementById('f-kelurahan').value;
  if (kecId === '__manual__' || kelVal === '__manual__') { toast('❌ Kecamatan/Kelurahan manual belum diisi.', 'error'); ok = false; }

  if (!ok) {
    toast('❌ Masih ada kolom wajib yang belum diisi!', 'error');
    const firstErr = document.querySelector('#survey-form .error-msg.show');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  const data = getAllSurveys();
  const editId = document.getElementById('edit-id').value;
  const surveyNo = document.getElementById('f-survey-no').value.trim();
  const dup = data.find(s => s.surveyNo.toLowerCase() === surveyNo.toLowerCase() && String(s.id) !== String(editId));
  if (dup) { toast('❌ No.ID Survey sudah digunakan data lain!', 'error'); return false; }

  const session = lsGet(LS_SESSION, {});
  const rec = {
    id: editId || ('S' + Date.now().toString(36) + Math.floor(Math.random() * 999)),
    tahun: document.getElementById('f-tahun').value,
    surveyNo, usulanNo: document.getElementById('f-usulan-no').value.trim(),
    petugas: document.getElementById('f-petugas').value.trim(),
    alamat: document.getElementById('f-alamat').value.trim(),
    rt: document.getElementById('f-rt').value.trim(),
    prov: 'Sumatera Selatan',
    kabkotaId: kabId, kabkota: kabNameById(kabId),
    kecamatanId: kecId, kecamatan: kecNameById(kabId, kecId),
    kelurahan: kelVal,
    namaPejabat: document.getElementById('f-nama-pejabat').value.trim(),
    hp: document.getElementById('f-hp').value.trim(),
    banjir, tinggi: val('f-tinggi'), lama: val('f-lama'), luas: val('f-luas'), frekuensi: val('f-frekuensi'),
    eko: radioVal('eko'), fasos: radioVal('fasos'), trans: radioVal('trans'), mukim: radioVal('mukim'), hak: radioVal('hak'),
    sedimen: val('f-sedimen'), sampah: val('f-sampah'),
    koorAwal: document.getElementById('f-koor-awal').value.trim(),
    koorTengah: document.getElementById('f-koor-tengah').value.trim(),
    koorAkhir: document.getElementById('f-koor-akhir').value.trim(),
    photos: [...tempPhotos],
    uraian: document.getElementById('f-uraian').value.trim(),
    status: radioVal('status'),
    createdBy: session.user || 'admin',
    createdAt: editId ? (data.find(s => String(s.id) === String(editId)) || {}).createdAt || new Date().toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (editId) { const i = data.findIndex(s => String(s.id) === String(editId)); if (i > -1) data[i] = rec; }
  else data.unshift(rec);
  if (!setAllSurveys(data)) return false;
  toast(editId ? '✅ Data berhasil diperbarui!' : '✅ Data survey berhasil disimpan!', 'success');
  pushRecord(rec);
  resetSurveyForm(); updateCounts(); adminNav('big');
  return false;
}
function val(id) { return document.getElementById(id).value.trim(); }

function resetSurveyForm() {
  document.getElementById('survey-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').textContent = 'New Data Survey';
  document.getElementById('btn-save').innerHTML = '💾 Save';
  document.getElementById('btn-cancel-edit').style.display = 'none';
  document.getElementById('f-prov').value = 'Sumatera Selatan';
  document.getElementById('f-kecamatan').innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
  document.getElementById('f-kelurahan').innerHTML = '<option value="">-- Pilih Kelurahan --</option>';
  document.querySelectorAll('#survey-form .error-msg').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('#survey-form .input-invalid').forEach(e => e.classList.remove('input-invalid'));
  ['g-eko', 'g-fasos', 'g-trans', 'g-mukim'].forEach(g => document.getElementById(g).style.outline = '');
  tempPhotos = []; tempPhotoSrc = []; renderPhotoPreview();
  document.getElementById('uraian-count').textContent = '0';
  document.querySelector('input[name=banjir][value="Tidak Banjir"]').checked = true;
  toggleBanjir(); refreshFormMap();
}
function cancelEdit() { resetSurveyForm(); toast('Edit dibatalkan.', 'info'); }

async function editSurvey(id) {
  const s = getAllSurveys().find(x => String(x.id) === String(id));
  if (!s) return;
  closeModal(); resetSurveyForm();
  document.getElementById('edit-id').value = s.id;
  document.getElementById('form-title').textContent = 'Edit Data Survey — ' + s.surveyNo;
  document.getElementById('btn-save').innerHTML = '💾 Update';
  document.getElementById('btn-cancel-edit').style.display = '';
  const set = (i, v) => document.getElementById(i).value = v || '';
  set('f-tahun', s.tahun); set('f-survey-no', s.surveyNo); set('f-usulan-no', s.usulanNo); set('f-petugas', s.petugas);
  set('f-alamat', s.alamat); set('f-rt', s.rt);
  // wilayah cascade
  document.getElementById('f-kabkota').value = s.kabkotaId || '';
  await onKabKotaChange();
  if (s.kecamatanId && s.kecamatanId !== '__manual__') {
    const kc = document.getElementById('f-kecamatan');
    if (![...kc.options].find(o => o.value === s.kecamatanId)) { const o = document.createElement('option'); o.value = s.kecamatanId; o.textContent = s.kecamatan; kc.appendChild(o); }
    kc.value = s.kecamatanId;
    await onKecamatanChange();
  }
  const kl = document.getElementById('f-kelurahan');
  if (s.kelurahan && ![...kl.options].find(o => o.value === s.kelurahan)) { const o = document.createElement('option'); o.value = s.kelurahan; o.textContent = s.kelurahan; kl.appendChild(o); }
  kl.value = s.kelurahan || '';
  set('f-nama-pejabat', s.namaPejabat); set('f-hp', s.hp);
  const br = document.querySelector(`input[name=banjir][value="${s.banjir}"]`) || document.querySelector('input[name=banjir][value="Tidak Banjir"]');
  br.checked = true; toggleBanjir();
  set('f-tinggi', s.tinggi); set('f-lama', s.lama); set('f-luas', s.luas); set('f-frekuensi', s.frekuensi);
  [['eko', s.eko], ['fasos', s.fasos], ['trans', s.trans], ['mukim', s.mukim], ['hak', s.hak], ['status', s.status]].forEach(([n, v]) => {
    if (v) { const r = document.querySelector(`input[name=${n}][value="${CSS.escape(v)}"]`); if (r) r.checked = true; }
  });
  set('f-sedimen', s.sedimen); set('f-sampah', s.sampah);
  set('f-koor-awal', s.koorAwal); set('f-koor-tengah', s.koorTengah); set('f-koor-akhir', s.koorAkhir);
  tempPhotos = [...(s.photos || [])]; tempPhotoSrc = (s.photos || []).map(() => 'arsip'); renderPhotoPreview();
  set('f-uraian', s.uraian); document.getElementById('uraian-count').textContent = (s.uraian || '').length;
  paintRadioCards(); refreshFormMap(true);
  adminNav('new');
  toast('✏️ Mode edit: <b>' + esc(s.surveyNo) + '</b>', 'info');
}
function deleteSurvey(id) {
  const s = getAllSurveys().find(x => String(x.id) === String(id));
  if (!s) return;
  if (!confirm('Hapus data ' + s.surveyNo + ' (' + s.alamat + ')?')) return;
  setAllSurveys(getAllSurveys().filter(x => String(x.id) !== String(id)));
  pushDelete(id);
  closeModal(); updateCounts(); renderBigTable();
  toast('🗑️ Data ' + s.surveyNo + ' dihapus.', 'success');
}

// =====================================================
// BIG DATA (Admin)
// =====================================================
function fillKabFilters() {
  const names = wilayahCache.regencies.length ? wilayahCache.regencies.map(d => d.name) : FALLBACK_KAB;
  [['flt-kab', 'Kota/Kab: Semua'], ['mon-flt-kab', 'Kota/Kab: Semua'], ['mon-flt-kab2', 'Kota/Kab: Semua']].forEach(([id, ph]) => {
    const el = document.getElementById(id); if (!el) return;
    const cur = el.value;
    el.innerHTML = `<option value="">${ph}</option>` + names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    el.value = cur;
  });
}
function distinctVals(arr, key) { return [...new Set(arr.map(s => s[key]).filter(Boolean))].sort(); }
function fillSelectKeep(id, values, placeholder) {
  const el = document.getElementById(id); if (!el) return;
  const cur = el.value;
  el.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (values.includes(cur)) el.value = cur;
}
function refreshAdminFilters() {
  const d = getAllSurveys();
  const kab = document.getElementById('flt-kab').value, kec = document.getElementById('flt-kec').value;
  fillSelectKeep('flt-kec', distinctVals(d.filter(s => !kab || s.kabkota === kab), 'kecamatan'), 'Kecamatan: Semua');
  fillSelectKeep('flt-kel', distinctVals(d.filter(s => (!kab || s.kabkota === kab) && (!kec || s.kecamatan === kec)), 'kelurahan'), 'Kelurahan: Semua');
}
function onFilterKabChange(who) {
  if (who === 'admin') {
    document.getElementById('flt-kec').value = ''; document.getElementById('flt-kel').value = '';
    bigPage = 1; refreshAdminFilters(); renderBigTable();
  } else if (who === 'mon') { renderMonitoringMap(); }
  else if (who === 'mon2') {
    document.getElementById('mon-flt-kec2').value = ''; document.getElementById('mon-flt-kel2').value = '';
    refreshMonFilters(); renderMonTable();
  }
}
function onFilterKecChange(who) {
  if (who === 'admin') { document.getElementById('flt-kel').value = ''; bigPage = 1; refreshAdminFilters(); renderBigTable(); }
  else if (who === 'mon2') { document.getElementById('mon-flt-kel2').value = ''; refreshMonFilters(); renderMonTable(); }
}
function resetAdminFilter() {
  ['big-search', 'flt-tahun', 'flt-kab', 'flt-kec', 'flt-kel'].forEach(id => document.getElementById(id).value = '');
  bigPage = 1; refreshAdminFilters(); renderBigTable();
}
function getFilteredAdmin() {
  const q = document.getElementById('big-search').value.trim().toLowerCase();
  const th = document.getElementById('flt-tahun').value, kb = document.getElementById('flt-kab').value,
    kc = document.getElementById('flt-kec').value, kl = document.getElementById('flt-kel').value;
  return getAllSurveys().filter(s =>
    (!q || s.surveyNo.toLowerCase().includes(q) || s.usulanNo.toLowerCase().includes(q)) &&
    (!th || s.tahun === th) && (!kb || s.kabkota === kb) && (!kc || s.kecamatan === kc) && (!kl || s.kelurahan === kl));
}
let bigPage = 1, bigPerPage = 10;
function bigSetPer(v) { bigPerPage = parseInt(v, 10) || 10; bigPage = 1; renderBigTable(); }
function bigGoto(p) { bigPage = p; renderBigTable(); }
function getBigPageRows() {
  const rows = getFilteredAdmin();
  const max = Math.max(1, Math.ceil(rows.length / bigPerPage));
  if (bigPage > max) bigPage = max;
  if (bigPage < 1) bigPage = 1;
  return { rows, max, page: rows.slice((bigPage - 1) * bigPerPage, bigPage * bigPerPage) };
}
// ---------- Ekspor massal Big Data: chunk processing + progress ----------
// Memproses maks 1.000 baris per siklus agar UI tidak freeze; output file
// dirakit identik 100% dengan fungsi ekspor asli (format & kolom sama).
const EXPORT_CHUNK = 1000;
function exportProgress(show, done, total) {
  const m = document.getElementById('export-progress-modal');
  const b = document.getElementById('export-progress-bar');
  const t = document.getElementById('export-progress-text');
  if (!m || !b || !t) return;
  m.classList.toggle('show', !!show);
  if (show) {
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    b.style.width = pct + '%';
    t.textContent = 'Memproses data: ' + done + ' / ' + total + ' baris... Mohon tunggu';
  }
}
const __nextTick = () => new Promise(res => setTimeout(res, 0));

async function exportExcelChunked(rows) {
  const total = rows.length;
  try {
    if (typeof XLSX !== 'undefined') {
      const data = [];
      for (let i = 0; i < total; i += EXPORT_CHUNK) {
        rows.slice(i, i + EXPORT_CHUNK).forEach((s, k) => data.push(fullRow(s, i + k)));
        exportProgress(true, Math.min(i + EXPORT_CHUNK, total), total);
        await __nextTick();
      }
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = Object.keys(fullRow(rows[0], 0)).map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Survey');
      XLSX.writeFile(wb, stampName('xlsx'));
      toast('Export Excel berhasil (' + total + ' data).', 'success');
      return;
    }
    const headers = Object.keys(fullRow(rows[0], 0));
    let body = '';
    for (let i = 0; i < total; i += EXPORT_CHUNK) {
      body += rows.slice(i, i + EXPORT_CHUNK).map(s => { const r = fullRow(s, 0); return '<tr>' + headers.map(h => '<td>' + esc(r[h]) + '</td>').join('') + '</tr>'; }).join('');
      exportProgress(true, Math.min(i + EXPORT_CHUNK, total), total);
      await __nextTick();
    }
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr>' + headers.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>' + body + '</table></body></html>';
    dlBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' }), stampName('xls'));
    toast('Export Excel berhasil - mode offline (' + total + ' data).', 'success');
  } catch (err) { console.error(err); toast('Export Excel gagal: ' + err.message, 'error'); }
}

async function exportPDFChunked(rows) {
  const total = rows.length;
  try {
    if (typeof window.jspdf !== 'undefined') {
      const body = [];
      for (let i = 0; i < total; i += EXPORT_CHUNK) {
        rows.slice(i, i + EXPORT_CHUNK).forEach((s, k) => body.push([i + k + 1, s.tahun, s.surveyNo, s.usulanNo, s.petugas, s.kabkota, s.kecamatan, s.kelurahan, s.banjir, s.status || '-']));
        exportProgress(true, Math.min(i + EXPORT_CHUNK, total), total);
        await __nextTick();
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('MUSRENBANG APPS 2027 - Laporan Data Survey', 14, 14);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Provinsi Sumatera Selatan | Total: ' + total + ' data | Dicetak: ' + new Date().toLocaleString('id-ID'), 14, 21);
      const head = [['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status']];
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({ startY: 26, head, body, styles: { fontSize: 7 }, headStyles: { fillColor: [8, 73, 196] } });
      } else {
        let y = 30; doc.setFontSize(8);
        body.forEach(r => { doc.text(r.join(' | ').slice(0, 175), 14, y); y += 6; if (y > 195) { doc.addPage(); y = 15; } });
      }
      doc.save(stampName('pdf'));
      toast('Export PDF berhasil (' + total + ' data).', 'success');
      return;
    }
    printReportFallback(rows);
  } catch (err) { console.error(err); toast('Export PDF gagal, membuka mode cetak...', 'error'); printReportFallback(rows); }
}

async function exportWordChunked(rows) {
  const total = rows.length;
  try {
    const th = ['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Alamat', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status'];
    let body = '';
    for (let i = 0; i < total; i += EXPORT_CHUNK) {
      body += rows.slice(i, i + EXPORT_CHUNK).map((s, k) => '<tr><td>' + (i + k + 1) + '</td><td>' + esc(s.tahun) + '</td><td>' + esc(s.surveyNo) + '</td><td>' + esc(s.usulanNo) + '</td><td>' + esc(s.petugas) + '</td><td>' + esc(s.alamat) + '</td><td>' + esc(s.kabkota) + '</td><td>' + esc(s.kecamatan) + '</td><td>' + esc(s.kelurahan) + '</td><td>' + esc(s.banjir) + '</td><td>' + esc(s.status || '-') + '</td></tr>').join('');
      exportProgress(true, Math.min(i + EXPORT_CHUNK, total), total);
      await __nextTick();
    }
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Calibri;font-size:10pt}th{background:#0849c4;color:#fff}th,td{border:1px solid #333;padding:4px}</style></head><body>' +
      '<h2 style="font-family:Calibri">MUSRENBANG APPS 2027 - Laporan Data Survey</h2>' +
      '<p style="font-family:Calibri">Provinsi Sumatera Selatan | Total: ' + total + ' data | Dicetak: ' + new Date().toLocaleString('id-ID') + '</p>' +
      '<table><tr>' + th.map(h => '<th>' + h + '</th>').join('') + '</tr>' + body + '</table>' +
      '<p style="font-family:Calibri;font-size:9pt">Developer Apps : M.Afifi Eka Putra, S.E - CV. Kayu Awet Sejahtera</p></body></html>';
    dlBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), stampName('doc'));
    toast('Export Word berhasil (' + total + ' data).', 'success');
  } catch (err) { console.error(err); toast('Export Word gagal: ' + err.message, 'error'); }
}

async function exportRowsChunked(rows, kind) {
  rows = rows || [];
  if (!rows.length) { toast('Tidak ada data untuk diexport.', 'error'); return; }
  if (rows.length <= 100) {
    if (kind === 'excel') exportExcel(rows, 'all');
    else if (kind === 'pdf') exportPDF(rows, 'all');
    else exportWord(rows, 'all');
    return;
  }
  exportProgress(true, 0, rows.length);
  try {
    if (kind === 'excel') await exportExcelChunked(rows);
    else if (kind === 'pdf') await exportPDFChunked(rows);
    else await exportWordChunked(rows);
  } catch (err) { console.error(err); toast('Export gagal: ' + err.message, 'error'); }
  exportProgress(false, rows.length, rows.length);
}
async function exportBigPage(kind) {
  const info = getBigPageRows();
  if (!info.page.length) { toast('Tidak ada data untuk diexport.', 'error'); return; }
  toast('⏳ Mengekspor ' + info.page.length + ' data yang tampil di halaman ini...', 'info', 2200);
  await exportRowsChunked(info.page, kind);
}
function renderBigTable() {
  refreshAdminFilters();
  const info = getBigPageRows();
  const rows = info.rows, max = info.max, start = (bigPage - 1) * bigPerPage;
  document.getElementById('big-total').textContent = rows.length;
  const tb = document.getElementById('big-tbody');
  const pi = document.getElementById('big-pageinfo'), pv = document.getElementById('big-prev'), nx = document.getElementById('big-next');
  if (!rows.length) { tb.innerHTML = '<tr><td colspan="8"><div class="empty-state">📭 Tidak ada data. <a href="#" onclick="adminNav(\'new\');return false">Tambah data baru</a></div></td></tr>'; if (pi) pi.textContent = 'Halaman 0 / 0'; if (pv) pv.disabled = true; if (nx) nx.disabled = true; return; }
  tb.innerHTML = info.page.map((s, i) => `<tr>
    <td>${start + i + 1}</td><td>${esc(s.tahun)}</td>
    <td><span class="id-link" onclick="openDetail('${s.id}','admin')">🔗 ${esc(s.surveyNo)}</span></td>
    <td>${esc(s.usulanNo)}</td><td>${esc(s.kabkota)}</td><td>${esc(s.kecamatan)}</td><td>${esc(s.kelurahan)}</td>
    <td style="white-space:nowrap"><button class="btn btn-primary btn-sm" onclick="openDetail('${s.id}','admin')">👁️</button>
    <button class="btn btn-warning btn-sm" onclick="editSurvey('${s.id}')">✏️</button>
    <button class="btn btn-danger btn-sm" onclick="deleteSurvey('${s.id}')">🗑️</button></td></tr>`).join('');
  if (pi) pi.textContent = 'Halaman ' + bigPage + ' / ' + max + ' • ' + info.page.length + ' dari ' + rows.length + ' data';
  if (pv) pv.disabled = bigPage <= 1;
  if (nx) nx.disabled = bigPage >= max;
}

// =====================================================
// DETAIL MODAL
// =====================================================
let detailMap = null;
function openDetail(id, mode) {
  const s = getAllSurveys().find(x => String(x.id) === String(id));
  if (!s) return;
  document.getElementById('detail-title').textContent = '📋 Detail — ' + s.surveyNo + (mode === 'mon' ? ' (Preview)' : '');
  const row = (l, v) => `<tr><td>${l}</td><td>${v ? esc(v) : '<i style="color:#9ca3af">-</i>'}</td></tr>`;
  document.getElementById('detail-body').innerHTML = `
    <div class="detail-section"><h4>📌 Identitas Survey</h4><table class="detail-table">
      ${row('Tahun', s.tahun)}${row('No.ID Survey', s.surveyNo)}${row('ID Usulan', s.usulanNo)}${row('Petugas', s.petugas)}
      ${row('Status', s.status)}${row('Diinput oleh', s.createdBy)}${row('Terakhir update', (s.updatedAt || '').slice(0, 16).replace('T', ' '))}
    </table></div>
    <div class="detail-section"><h4>📍 Informasi Lokasi</h4><table class="detail-table">
      ${row('Alamat', s.alamat)}${row('RT/RW', s.rt)}${row('Provinsi', s.prov)}
      ${row('Kota/Kabupaten', s.kabkota)}${row('Kecamatan', s.kecamatan)}${row('Kelurahan/Desa', s.kelurahan)}
      ${row('Nama RT/RW/Lurah/Camat', s.namaPejabat)}${row('HP', s.hp)}
    </table></div>
    <div class="detail-section"><h4>🌊 Banjir</h4><table class="detail-table">
      ${row('Status', s.banjir)}${row('Tinggi (cm)', s.tinggi)}${row('Lama (jam)', s.lama)}
      ${row('Luas (m²/Ha)', s.luas)}${row('Frekuensi/thn', s.frekuensi)}
      ${row('Ekonomi', s.eko)}${row('Fasos & Pemerintahan', s.fasos)}${row('Transportasi', s.trans)}
      ${row('Permukiman', s.mukim)}${row('Hak Milik', s.hak)}
    </table></div>
    <div class="detail-section"><h4>🔧 Kondisi Saluran</h4><table class="detail-table">
      ${row('Sedimentasi', s.sedimen)}${row('Sampah', s.sampah)}
    </table></div>
    <div class="detail-section"><h4>🧭 Koordinat</h4><table class="detail-table">
      ${row('Titik Awal', s.koorAwal)}${row('Titik Tengah', s.koorTengah)}${row('Titik Akhir', s.koorAkhir)}
    </table><div id="detail-map" class="map-box" style="height:260px;margin-top:10px"></div></div>
    <div class="detail-section"><h4>📷 Foto (${(s.photos || []).length})</h4>
      <div class="detail-photos">${(s.photos || []).map((p, i) => `<img src="${p}" onclick="openLightbox({src:'${p}'})" alt="Foto ${i + 1}">`).join('') || '<i style="color:#9ca3af">Tidak ada foto</i>'}</div></div>
    <div class="detail-section"><h4>📝 Usulan & Deskripsi</h4><p style="font-size:13.5px;white-space:pre-wrap">${s.uraian ? esc(s.uraian) : '<i style="color:#9ca3af">-</i>'}</p></div>
    <div class="btn-row">
      ${mode === 'admin' ? `<button class="btn btn-warning" onclick="editSurvey('${s.id}')">✏️ Edit Data</button>
      <button class="btn btn-danger" onclick="deleteSurvey('${s.id}')">🗑️ Hapus</button>` : ''}
      <button class="btn btn-ghost" onclick="closeModal()">Tutup</button>
    </div>`;
  document.getElementById('detail-modal').classList.add('show');
  // mini map
  setTimeout(() => {
    if (typeof L === 'undefined') { document.getElementById('detail-map').innerHTML = '<p style="padding:16px">⚠️ Peta butuh internet.</p>'; return; }
    if (detailMap) { detailMap.remove(); detailMap = null; }
    const pts = [parseCoord(s.koorAwal), parseCoord(s.koorTengah), parseCoord(s.koorAkhir)].filter(Boolean);
    detailMap = L.map('detail-map').setView(pts[0] || [-2.9909, 104.7565], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(detailMap);
    const labels = ['Awal', 'Tengah', 'Akhir'];
    [s.koorAwal, s.koorTengah, s.koorAkhir].forEach((raw, i) => { const c = parseCoord(raw); if (c) L.marker(c).addTo(detailMap).bindPopup(labels[i]); });
    if (pts.length >= 2) L.polyline(pts, { color: '#0b5fff', weight: 4 }).addTo(detailMap);
    if (pts.length) detailMap.fitBounds(pts.length > 1 ? pts : [pts[0]], { padding: [30, 30] });
  }, 120);
}
function closeModal() { document.getElementById('detail-modal').classList.remove('show'); }

// =====================================================
// MONITORING
// =====================================================
let monMap = null, monLayer = null;
const SUMSEL_BOUNDS = [[-6.0, 101.5], [-1.0, 106.7]]; // geofence mutlak Provinsi Sumatera Selatan
function initMonMap() {
  if (typeof L === 'undefined') { document.getElementById('mon-map').innerHTML = '<p style="padding:20px">⚠️ Peta membutuhkan koneksi internet (Leaflet CDN).</p>'; return; }
  if (monMap) { monMap.invalidateSize(); return; }
  monMap = L.map('mon-map', { maxBounds: SUMSEL_BOUNDS, maxBoundsViscosity: 1.0, minZoom: 7 }).setView([-2.9909, 104.7565], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(monMap);
  monLayer = (typeof L.markerClusterGroup === 'function') ? L.markerClusterGroup() : L.layerGroup();
  monLayer.addTo(monMap);
}
function getFilteredMapData() {
  const th = document.getElementById('mon-flt-tahun').value, kb = document.getElementById('mon-flt-kab').value;
  return getAllSurveys().filter(s => (!th || s.tahun === th) && (!kb || s.kabkota === kb));
}
function renderMonitoringMap() {
  if (!monMap || typeof L === 'undefined') return;
  monLayer.clearLayers();
  const rows = getFilteredMapData();
  const allPts = [];
  rows.forEach(s => {
    const pts = [parseCoord(s.koorAwal), parseCoord(s.koorTengah), parseCoord(s.koorAkhir)];
    const valid = pts.filter(Boolean);
    valid.forEach(p => allPts.push(p));
    const photos = (s.photos || []).slice(0, 3).map(p => `<img src="${p}">`).join('');
    const popup = `<b class="t">🔗 ${esc(s.surveyNo)}</b><br>
      <b>ID Usulan:</b> ${esc(s.usulanNo)}<br><b>Alamat:</b> ${esc(s.alamat)}, ${esc(s.kelurahan)}, ${esc(s.kecamatan)}<br>
      <b>Tahun:</b> ${esc(s.tahun)} &nbsp; <b>Petugas:</b> ${esc(s.petugas)}<br>
      <b>Status:</b> ${esc(s.banjir || '-')} ${photos}<br>
      <a href="#" onclick="openDetail('${s.id}','mon');return false">Lihat detail ➜</a>`;
    const labels = ['Titik Awal', 'Titik Tengah', 'Titik Akhir'];
    pts.forEach((c, i) => { if (c) L.marker(c).addTo(monLayer).bindPopup(`<b>${labels[i]} — ${esc(s.surveyNo)}</b><br>` + popup); });
    if (valid.length >= 2) L.polyline(valid, { color: s.banjir === 'Banjir' ? '#e02424' : '#0b5fff', weight: 3 }).addTo(monLayer).bindPopup(popup);
  });
  if (allPts.length) monMap.fitBounds(allPts, { padding: [40, 40] });
  if (monMap.getZoom() < 7) monMap.setZoom(7);
}
function refreshMonFilters() {
  const d = getAllSurveys();
  const kab = document.getElementById('mon-flt-kab2').value, kec = document.getElementById('mon-flt-kec2').value;
  fillSelectKeep('mon-flt-kec2', distinctVals(d.filter(s => !kab || s.kabkota === kab), 'kecamatan'), 'Kecamatan: Semua');
  fillSelectKeep('mon-flt-kel2', distinctVals(d.filter(s => (!kab || s.kabkota === kab) && (!kec || s.kecamatan === kec)), 'kelurahan'), 'Kelurahan: Semua');
}
function getFilteredMon() {
  const q = document.getElementById('mon-search').value.trim().toLowerCase();
  const th = document.getElementById('mon-flt-tahun2').value, kb = document.getElementById('mon-flt-kab2').value,
    kc = document.getElementById('mon-flt-kec2').value, kl = document.getElementById('mon-flt-kel2').value;
  return getAllSurveys().filter(s =>
    (!q || s.surveyNo.toLowerCase().includes(q) || s.usulanNo.toLowerCase().includes(q)) &&
    (!th || s.tahun === th) && (!kb || s.kabkota === kb) && (!kc || s.kecamatan === kc) && (!kl || s.kelurahan === kl));
}
function renderMonTable() {
  refreshMonFilters();
  const rows = getFilteredMon();
  const tb = document.getElementById('mon-tbody');
  if (!rows.length) { tb.innerHTML = '<tr><td colspan="7"><div class="empty-state">📭 Tidak ada data ditemukan.</div></td></tr>'; return; }
  tb.innerHTML = rows.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.tahun)}</td>
    <td><span class="id-link" onclick="openDetail('${s.id}','mon')">🔗 ${esc(s.surveyNo)}</span></td>
    <td>${esc(s.usulanNo)}</td><td>${esc(s.kabkota)}</td><td>${esc(s.kecamatan)}</td><td>${esc(s.kelurahan)}</td></tr>`).join('');
}

// =====================================================
// CHARTS
// =====================================================
const chartReg = {};
function makeChart(id, type, labels, values, title) {
  if (typeof Chart === 'undefined') return;
  const el = document.getElementById(id); if (!el) return;
  if (chartReg[id]) chartReg[id].destroy();
  const colors = ['#0b5fff', '#38bdf8', '#0849c4', '#f59e0b', '#dc2626', '#7c3aed', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6', '#6366f1'];
  chartReg[id] = new Chart(el, {
    type,
    data: { labels, datasets: [{ label: title, data: values, backgroundColor: labels.map((_, i) => colors[i % colors.length]), borderWidth: 1 }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: type !== 'bar', position: 'bottom' } }, scales: type === 'bar' ? { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { ticks: { maxRotation: 45 } } } : {} }
  });
}
function countBy(data, key, top = 0) {
  const m = {};
  data.forEach(s => { const k = s[key] || '(kosong)'; m[k] = (m[k] || 0) + 1; });
  let arr = Object.entries(m).sort((a, b) => b[1] - a[1]);
  if (top) arr = arr.slice(0, top);
  return { labels: arr.map(a => a[0]), values: arr.map(a => a[1]) };
}
function renderAdminCharts() {
  const d = getAllSurveys();
  let t = countBy(d, 'tahun'); makeChart('ch-tahun', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'petugas'); makeChart('ch-petugas', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'kecamatan'); makeChart('ch-kecamatan', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'kelurahan', 10); makeChart('ch-kelurahan', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'banjir'); makeChart('ch-banjir', 'doughnut', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'status'); makeChart('ch-status', 'doughnut', t.labels, t.values, 'Jumlah');
}
function renderMonCharts() {
  const d = getAllSurveys();
  let t = countBy(d, 'tahun'); makeChart('mch-tahun', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'petugas'); makeChart('mch-petugas', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'kecamatan'); makeChart('mch-kecamatan', 'bar', t.labels, t.values, 'Jumlah');
  t = countBy(d, 'kelurahan', 10); makeChart('mch-kelurahan', 'bar', t.labels, t.values, 'Jumlah');
}

// =====================================================
// EXPORT (Excel / PDF / Word)
// =====================================================
function stampName(ext) {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `MUSRENBANG-2027_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}
function fullRow(s, i) {
  return {
    'No': i + 1, 'Tahun': s.tahun, 'No.ID Survey': s.surveyNo, 'ID Usulan': s.usulanNo, 'Petugas': s.petugas,
    'Alamat': s.alamat, 'RT/RW': s.rt, 'Provinsi': s.prov, 'Kota/Kabupaten': s.kabkota, 'Kecamatan': s.kecamatan,
    'Kelurahan/Desa': s.kelurahan, 'Nama RT/RW/Lurah/Camat': s.namaPejabat, 'HP': s.hp,
    'Banjir': s.banjir, 'Tinggi (cm)': s.tinggi, 'Lama (jam)': s.lama, 'Luas': s.luas, 'Frekuensi/thn': s.frekuensi,
    'Ekonomi': s.eko, 'Fasos': s.fasos, 'Transportasi': s.trans, 'Permukiman': s.mukim, 'Hak Milik': s.hak,
    'Sedimentasi': s.sedimen, 'Sampah': s.sampah,
    'Titik Awal': s.koorAwal, 'Titik Tengah': s.koorTengah, 'Titik Akhir': s.koorAkhir,
    'Jml Foto': (s.photos || []).length, 'Uraian': (s.uraian || '').slice(0, 500), 'Status': s.status,
    'Diinput': s.createdBy, 'Update': (s.updatedAt || '').slice(0, 16).replace('T', ' ')
  };
}
function dlBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
}
function exportExcel(rows, who) {
  if (!rows.length) { toast('Tidak ada data untuk diexport.', 'error'); return; }
  try {
    if (typeof XLSX !== 'undefined') {
      const ws = XLSX.utils.json_to_sheet(rows.map(fullRow));
      ws['!cols'] = Object.keys(fullRow(rows[0], 0)).map(() => ({ wch: 22 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Survey');
      XLSX.writeFile(wb, stampName('xlsx'));
      toast('Export Excel berhasil (' + rows.length + ' data).', 'success');
      return;
    }
    const headers = Object.keys(fullRow(rows[0], 0));
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><tr>' +
      headers.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr>' +
      rows.map(s => { const r = fullRow(s, 0); return '<tr>' + headers.map(h => '<td>' + esc(r[h]) + '</td>').join('') + '</tr>'; }).join('') + '</table></body></html>';
    dlBlob(new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel' }), stampName('xls'));
    toast('Export Excel berhasil - mode offline (' + rows.length + ' data).', 'success');
  } catch (err) { console.error(err); toast('Export Excel gagal: ' + err.message, 'error'); }
}
function exportPDF(rows, who) {
  if (!rows.length) { toast('Tidak ada data untuk diexport.', 'error'); return; }
  try {
    if (typeof window.jspdf !== 'undefined') {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('MUSRENBANG APPS 2027 - Laporan Data Survey', 14, 14);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('Provinsi Sumatera Selatan | Total: ' + rows.length + ' data | Dicetak: ' + new Date().toLocaleString('id-ID'), 14, 21);
      const head = [['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status']];
      const body = rows.map((s, i) => [i + 1, s.tahun, s.surveyNo, s.usulanNo, s.petugas, s.kabkota, s.kecamatan, s.kelurahan, s.banjir, s.status || '-']);
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({ startY: 26, head, body, styles: { fontSize: 7 }, headStyles: { fillColor: [8, 73, 196] } });
      } else {
        let y = 30; doc.setFontSize(8);
        body.forEach(r => { doc.text(r.join(' | ').slice(0, 175), 14, y); y += 6; if (y > 195) { doc.addPage(); y = 15; } });
      }
      doc.save(stampName('pdf'));
      toast('Export PDF berhasil (' + rows.length + ' data).', 'success');
      return;
    }
    printReportFallback(rows);
  } catch (err) { console.error(err); toast('Export PDF gagal, membuka mode cetak...', 'error'); printReportFallback(rows); }
}
function printReportFallback(rows) {
  const w = window.open('', '_blank');
  if (!w) { toast('Popup diblokir browser. Mohon izinkan popup lalu coba lagi.', 'error'); return; }
  const th = ['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Alamat', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status'];
  const body = rows.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(s.tahun) + '</td><td>' + esc(s.surveyNo) + '</td><td>' + esc(s.usulanNo) + '</td><td>' + esc(s.petugas) + '</td><td>' + esc(s.alamat) + '</td><td>' + esc(s.kabkota) + '</td><td>' + esc(s.kecamatan) + '</td><td>' + esc(s.kelurahan) + '</td><td>' + esc(s.banjir) + '</td><td>' + esc(s.status || '-') + '</td></tr>').join('');
  w.document.write('<html><head><title>Laporan Musrenbang 2027</title><style>body{font-family:Arial}table{border-collapse:collapse;width:100%;font-size:10px}th{background:#0849c4;color:#fff}th,td{border:1px solid #333;padding:4px}</style></head><body>' +
    '<h2>MUSRENBANG APPS 2027 - Laporan Data Survey</h2><p>Provinsi Sumatera Selatan | Total: ' + rows.length + ' data | ' + new Date().toLocaleString('id-ID') + '</p>' +
    '<table><tr>' + th.map(h => '<th>' + h + '</th>').join('') + '</tr>' + body + '</table></body></html>');
  w.document.close(); w.focus();
  setTimeout(() => { w.print(); }, 500);
  toast('Mode cetak dibuka - pilih "Save as PDF" untuk menyimpan PDF.', 'info', 5000);
}
function exportWord(rows, who) {
  const total = rows.length;
  if (!total) { toast('Tidak ada data untuk diexport.', 'error'); return; }
  try {
    const th = ['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Alamat', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status'];
    const body = rows.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(s.tahun) + '</td><td>' + esc(s.surveyNo) + '</td><td>' + esc(s.usulanNo) + '</td><td>' + esc(s.petugas) + '</td><td>' + esc(s.alamat) + '</td><td>' + esc(s.kabkota) + '</td><td>' + esc(s.kecamatan) + '</td><td>' + esc(s.kelurahan) + '</td><td>' + esc(s.banjir) + '</td><td>' + esc(s.status || '-') + '</td></tr>').join('');
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Calibri;font-size:10pt}th{background:#0849c4;color:#fff}th,td{border:1px solid #333;padding:4px}</style></head><body>' +
      '<h2 style="font-family:Calibri">MUSRENBANG APPS 2027 - Laporan Data Survey</h2>' +
      '<p style="font-family:Calibri">Provinsi Sumatera Selatan | Total: ' + total + ' data | Dicetak: ' + new Date().toLocaleString('id-ID') + '</p>' +
      '<table><tr>' + th.map(h => '<th>' + h + '</th>').join('') + '</tr>' + body + '</table>' +
      '<p style="font-family:Calibri;font-size:9pt">Developer Apps : M.Afifi Eka Putra, S.E - CV. Kayu Awet Sejahtera</p></body></html>';
    dlBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), stampName('doc'));
    toast('Export Word berhasil (' + total + ' data).', 'success');
  } catch (err) { console.error(err); toast('Export Word gagal: ' + err.message, 'error'); }
}

// =====================================================
// SEED DATA (contoh)
// =====================================================
function svgPhoto(text, c1, c2) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><text x="320" y="220" font-size="44" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold">${text}</text><text x="320" y="270" font-size="22" text-anchor="middle" fill="white" font-family="Arial">MUSRENBANG 2027</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function seedIfEmpty() {
  try { if (localStorage.getItem(LS_SEED)) return; } catch (e) {}
  const now = new Date().toISOString();
  const demo = [
    {
      id: 'SEED1', tahun: '2027', surveyNo: 'SRV-2027-001', usulanNo: 'USL-2027-001', petugas: 'Andi Pratama',
      alamat: 'Jl. Merdeka No. 45', rt: 'RT 05 / RW 02', prov: 'Sumatera Selatan',
      kabkotaId: 'FB0', kabkota: 'Kota Palembang', kecamatanId: 'K1', kecamatan: 'Ilir Barat I', kelurahan: 'Bukit Lama',
      namaPejabat: 'H. Sulaiman (Lurah)', hp: '081278910001',
      banjir: 'Banjir', tinggi: '40', lama: '6', luas: '2 Ha', frekuensi: '4',
      eko: 'Kawasan Perumahan', fasos: 'Terbatas / Beberapa', trans: 'Sedikit / Kurang padat', mukim: 'Padat', hak: '80%',
      sedimen: 'Sedang (±30cm)', sampah: 'Banyak sampah rumah tangga',
      koorAwal: '-2.9834,104.7328', koorTengah: '-2.9851,104.7352', koorAkhir: '-2.9872,104.7379',
      photos: [svgPhoto('Foto Saluran 1', '#0b5fff', '#062f7e'), svgPhoto('Foto Genangan', '#0e9f6e', '#064e3b')],
      uraian: 'Usulan normalisasi saluran sepanjang ±500m di Jl. Merdeka. Genangan terjadi setiap musim hujan, merendam ±120 KK. Diperlukan pengerukan sedimentasi dan pemasangan turap.',
      status: 'Belum Clean & Clear', createdBy: 'admin', createdAt: now, updatedAt: now
    },
    {
      id: 'SEED2', tahun: '2027', surveyNo: 'SRV-2027-002', usulanNo: 'USL-2027-002', petugas: 'Siti Rahma',
      alamat: 'Jl. Lintas Timur Km. 12', rt: 'RT 03 / RW 01', prov: 'Sumatera Selatan',
      kabkotaId: 'FB4', kabkota: 'Kabupaten Banyuasin', kecamatanId: 'K2', kecamatan: 'Talang Kelapa', kelurahan: 'Sukomoro',
      namaPejabat: 'Budi Santoso (Kades)', hp: '081278910002',
      banjir: 'Tidak Banjir', tinggi: '', lama: '', luas: '', frekuensi: '',
      eko: '', fasos: '', trans: '', mukim: '', hak: '',
      sedimen: 'Ringan', sampah: 'Sedikit',
      koorAwal: '-2.9995,104.7120', koorTengah: '', koorAkhir: '-3.0042,104.7188',
      photos: [svgPhoto('Foto Lokasi 1', '#f59e0b', '#92400e'), svgPhoto('Foto Lokasi 2', '#7c3aed', '#4c1d95')],
      uraian: 'Usulan pembangunan drainase baru di kawasan permukiman Sukomoro untuk antisipasi pengembangan perumahan.',
      status: 'Clean & Clear', createdBy: 'admin', createdAt: now, updatedAt: now
    },
    {
      id: 'SEED3', tahun: '2026', surveyNo: 'SRV-2026-015', usulanNo: 'USL-2026-015', petugas: 'Andi Pratama',
      alamat: 'Jl. Raya Indralaya', rt: 'RT 08 / RW 03', prov: 'Sumatera Selatan',
      kabkotaId: 'FB11', kabkota: 'Kabupaten Ogan Ilir', kecamatanId: 'K3', kecamatan: 'Indralaya', kelurahan: 'Tanjung Sejaro',
      namaPejabat: 'Drs. Herman (Camat)', hp: '081278910003',
      banjir: 'Banjir', tinggi: '60', lama: '12', luas: '5 Ha', frekuensi: '6',
      eko: 'Industri, Komersil, Perkantoran kurang padat', fasos: 'Padat', trans: 'Padat', mukim: 'Sedikit / Kurang padat', hak: '> 80%',
      sedimen: 'Berat (±80cm)', sampah: 'Banyak + eceng gondok',
      koorAwal: '-3.2094,104.6521', koorTengah: '-3.2110,104.6540', koorAkhir: '-3.2135,104.6562',
      photos: [svgPhoto('Foto Banjir 1', '#e02424', '#7f1d1d'), svgPhoto('Foto Banjir 2', '#06b6d4', '#164e63'), svgPhoto('Foto Saluran', '#84cc16', '#365314')],
      uraian: 'Banjir tahunan merendam jalan raya Indralaya dan 2 sekolah. Usulan pelebaran saluran primer dan pintu air.',
      status: 'Belum Clean & Clear', createdBy: 'admin', createdAt: now, updatedAt: now
    }
  ];
  lsSet(LS_SURVEYS, demo);
  try { localStorage.setItem(LS_SEED, '1'); } catch (e) {}
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(hideSplash, 2600);
  setTimeout(autoSync, 1200);
  try {
    seedIfEmpty();
    seedAdmins();
    fillTahunSelects();
    loadKabKota();
    updateCounts();
    paintRadioCards();
    toggleBanjir();
    registerSW();
    updateOnlineStatus();
  } catch (err) { console.warn('init parsial', err); }
  // tutup modal saat klik overlay
  try {
    document.getElementById('detail-modal').addEventListener('click', e => {
      if (e.target.id === 'detail-modal') closeModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); document.getElementById('lightbox').classList.remove('show'); } });
  } catch (err) { console.warn('init listener', err); }
});
// Pengaman terakhir: paksa splash hilang walau INIT gagal total
setTimeout(function () { try { hideSplash(); } catch (e) {} }, 6000);
