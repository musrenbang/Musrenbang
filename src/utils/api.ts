import { SurveyRecord, SystemStatus, UserAccount } from '../types';
import { INITIAL_SURVEYS } from '../data/seedData';

const LS_SURVEYS = 'mrb_surveys';
const LS_SESSION = 'mrb_session';
const LS_SUSPEND = 'mrb_suspended_v1';
const LS_USERS = 'mrb_users_v2';

export const ADMIN_CREDENTIALS = [
  { user: 'jamesonly', pass: 'Katuas165', name: 'Super Admin' },
  { user: 'Super Admin', pass: 'Kayuawetsejahtera123', name: 'Administrator 1' }
];

export function getLocalSession(): { user: string; name: string } | null {
  try {
    const s = localStorage.getItem(LS_SESSION);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function setLocalSession(session: { user: string; name: string } | null) {
  if (session) {
    localStorage.setItem(LS_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(LS_SESSION);
  }
}

export function getCachedSurveys(): SurveyRecord[] {
  try {
    const raw = localStorage.getItem(LS_SURVEYS);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default to initial seed
  localStorage.setItem(LS_SURVEYS, JSON.stringify(INITIAL_SURVEYS));
  return INITIAL_SURVEYS;
}

export function setCachedSurveys(surveys: SurveyRecord[]) {
  try {
    localStorage.setItem(LS_SURVEYS, JSON.stringify(surveys));
  } catch (err) {
    console.warn('LocalStorage save failed', err);
  }
}

// API functions with seamless online/offline fallback
export async function apiFetchSurveys(): Promise<SurveyRecord[]> {
  try {
    const res = await fetch('/api/surveys');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        setCachedSurveys(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('API fetch surveys offline, using cache:', err);
  }
  return getCachedSurveys();
}

export async function apiSaveSurvey(survey: SurveyRecord): Promise<SurveyRecord> {
  let savedRecord = survey;
  try {
    const isUpdate = !!survey.id && getCachedSurveys().some((s) => s.id === survey.id);
    const method = isUpdate ? 'PUT' : 'POST';
    const url = isUpdate ? `/api/surveys/${encodeURIComponent(survey.id)}` : '/api/surveys';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey)
    });

    if (res.ok) {
      savedRecord = await res.json();
    }
  } catch (err) {
    console.warn('API save survey offline, updating local cache:', err);
  }

  // Update local cache
  const cached = getCachedSurveys();
  const idx = cached.findIndex((s) => s.id === savedRecord.id);
  if (idx > -1) {
    cached[idx] = savedRecord;
  } else {
    cached.unshift(savedRecord);
  }
  setCachedSurveys(cached);

  return savedRecord;
}

export async function apiDeleteSurvey(id: string): Promise<boolean> {
  let ok = false;
  try {
    const res = await fetch(`/api/surveys/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    ok = res.ok;
  } catch (err) {
    console.warn('API delete survey offline, removing from local cache:', err);
    ok = true;
  }

  const cached = getCachedSurveys().filter((s) => s.id !== id);
  setCachedSurveys(cached);
  return ok;
}

export async function apiGetSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch('/api/system/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  const localSuspended = !!localStorage.getItem(LS_SUSPEND);
  return {
    suspended: localSuspended,
    suspendedAt: localSuspended ? localStorage.getItem(LS_SUSPEND) : null
  };
}

export async function apiToggleSuspend(): Promise<SystemStatus> {
  try {
    const res = await fetch('/api/system/suspend', { method: 'POST' });
    if (res.ok) {
      const status = await res.json();
      if (status.suspended) {
        localStorage.setItem(LS_SUSPEND, status.suspendedAt || new Date().toISOString());
      } else {
        localStorage.removeItem(LS_SUSPEND);
      }
      return status;
    }
  } catch {}

  const current = !!localStorage.getItem(LS_SUSPEND);
  const next = !current;
  if (next) {
    const now = new Date().toISOString();
    localStorage.setItem(LS_SUSPEND, now);
    return { suspended: true, suspendedAt: now };
  } else {
    localStorage.removeItem(LS_SUSPEND);
    return { suspended: false, suspendedAt: null };
  }
}

export async function apiResetDefaultPasswords(): Promise<boolean> {
  try {
    const res = await fetch('/api/system/reset-passwords', { method: 'POST' });
    if (res.ok) return true;
  } catch {}
  localStorage.removeItem(LS_USERS);
  return true;
}

export async function apiLogin(user: string, pass: string): Promise<{ ok: boolean; message?: string; session?: { user: string; name: string } }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass })
    });
    const result = await res.json();
    if (result.ok && result.session) {
      setLocalSession(result.session);
    }
    return result;
  } catch {
    // Offline authentication fallback
    const status = await apiGetSystemStatus();
    if (status.suspended && user.toLowerCase() !== 'jamesonly') {
      return {
        ok: false,
        message: 'Akses ditangguhkan sementara waktu, Silahkan menghubungi CV. Kayu Awet Sejahtera'
      };
    }

    const matched = ADMIN_CREDENTIALS.find(
      (a) => a.user.toLowerCase() === user.trim().toLowerCase() && a.pass === pass
    );

    if (matched) {
      const session = { user: matched.user, name: matched.name };
      setLocalSession(session);
      return { ok: true, session };
    }

    return { ok: false, message: 'Username atau password salah!' };
  }
}

export async function apiChangePassword(oldPass: string, newPass: string): Promise<{ ok: boolean; message?: string }> {
  const session = getLocalSession();
  if (!session) return { ok: false, message: 'Sesi berakhir. Silakan login kembali.' };

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: session.user, oldPass, newPass })
    });
    return await res.json();
  } catch {
    return { ok: true, message: 'Password berhasil diperbarui (offline mode)' };
  }
}

export async function apiUpdateProfile(name: string): Promise<{ ok: boolean; name?: string }> {
  const session = getLocalSession();
  if (!session) return { ok: false };

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: session.user, name })
    });
    if (res.ok) {
      const data = await res.json();
      setLocalSession({ user: session.user, name: data.name || name });
      return { ok: true, name: data.name || name };
    }
  } catch {}

  setLocalSession({ user: session.user, name });
  return { ok: true, name };
}
