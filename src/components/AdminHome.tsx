import React, { useState } from 'react';
import {
  FilePlus,
  Database,
  BarChart3,
  Calendar,
  Lock,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { SurveyRecord, SystemStatus } from '../types';
import { apiChangePassword, apiUpdateProfile, apiToggleSuspend, apiResetDefaultPasswords } from '../utils/api';

interface Props {
  userSession: { user: string; name: string };
  surveys: SurveyRecord[];
  systemStatus: SystemStatus;
  onNavigate: (tab: 'home' | 'new' | 'big' | 'grafik') => void;
  onSessionUpdate: (newSession: { user: string; name: string }) => void;
  onStatusUpdate: (status: SystemStatus) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminHome: React.FC<Props> = ({
  userSession,
  surveys,
  systemStatus,
  onNavigate,
  onSessionUpdate,
  onStatusUpdate,
  onShowToast
}) => {
  const isOwner = userSession.user.toLowerCase() === 'jamesonly';

  // Profile modal states
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'menu' | 'profile' | 'password'>('menu');
  const [displayName, setDisplayName] = useState(userSession.name);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Stats calculation
  const total = surveys.length;
  const count2027 = surveys.filter((s) => s.tahun === '2027').length;
  const countBanjir = surveys.filter((s) => s.banjir === 'Banjir').length;
  const countCC = surveys.filter((s) => (s.status || '').includes('Clean & Clear') && !s.status?.includes('Belum')).length;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      onShowToast('Nama tampilan wajib diisi', 'error');
      return;
    }
    const res = await apiUpdateProfile(displayName.trim());
    if (res.ok) {
      onSessionUpdate({ user: userSession.user, name: displayName.trim() });
      onShowToast('Profil berhasil diperbarui', 'success');
      setActiveProfileTab('menu');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass) {
      onShowToast('Password lama wajib diisi', 'error');
      return;
    }
    if (newPass.length < 4) {
      onShowToast('Password baru minimal 4 karakter', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      onShowToast('Konfirmasi password tidak cocok', 'error');
      return;
    }

    const res = await apiChangePassword(oldPass, newPass);
    if (res.ok) {
      onShowToast('Password berhasil diganti', 'success');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setActiveProfileTab('menu');
    } else {
      onShowToast(res.message || 'Gagal mengganti password', 'error');
    }
  };

  const handleToggleSuspend = async () => {
    const willSuspend = !systemStatus.suspended;
    if (
      !confirm(
        willSuspend
          ? 'TANGGUHKAN akses login semua user lain? Anda (jamesonly) tetap bisa masuk.'
          : 'Aktifkan kembali akses login untuk semua pengguna?'
      )
    )
      return;

    const res = await apiToggleSuspend();
    onStatusUpdate(res);
    onShowToast(
      res.suspended
        ? 'Akses sistem berhasil ditangguhkan untuk user lain.'
        : 'Akses sistem berhasil diaktifkan kembali.',
      'info'
    );
  };

  const handleResetPasswords = async () => {
    if (!confirm('Kembalikan SELURUH password administrator ke password default?')) return;
    const ok = await apiResetDefaultPasswords();
    if (ok) {
      onShowToast('Seluruh password administrator berhasil dikembalikan ke default.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Stats Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 dark:shadow-black/50 border border-transparent dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 dark:bg-slate-800/80 text-white dark:text-blue-200 backdrop-blur-sm mb-2 border border-white/20 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5" />
              {todayStr}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat Datang, {userSession.name}!
            </h2>
            <p className="text-sm text-blue-100 dark:text-slate-300 font-medium mt-1">
              Panel Administrator &mdash; MUSRENBANG APPS 2027 Vers.1.1.2
            </p>
          </div>

          {/* User Account / Profile Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-white/30 dark:border-slate-700 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-white transition-all backdrop-blur-sm"
            >
              <div className="w-7 h-7 rounded-full bg-white dark:bg-blue-600 text-blue-700 dark:text-white font-black flex items-center justify-center text-sm shadow">
                {userSession.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <span className="block font-bold">{userSession.name}</span>
                <span className="text-[10px] text-blue-200 dark:text-slate-300 block font-normal">
                  {isOwner ? 'Super Admin (Owner)' : 'Administrator'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 text-slate-800 dark:text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                {activeProfileTab === 'menu' && (
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveProfileTab('profile')}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span>Edit Nama Tampilan</span>
                    </button>

                    <button
                      onClick={() => setActiveProfileTab('password')}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span>Ganti Password</span>
                    </button>

                    {isOwner && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                        <button
                          onClick={handleResetPasswords}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Reset Password ke Default</span>
                        </button>

                        <button
                          onClick={handleToggleSuspend}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors ${
                            systemStatus.suspended
                              ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
                              : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>
                            {systemStatus.suspended ? 'Aktifkan Kembali Akses' : 'Suspend System Access'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeProfileTab === 'profile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-1">Edit Profil</h4>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        Nama Tampilan
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveProfileTab('menu')}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Kembali
                      </button>
                    </div>
                  </form>
                )}

                {activeProfileTab === 'password' && (
                  <form onSubmit={handleChangePassword} className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 border-b dark:border-slate-800 pb-1">Ganti Password</h4>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                        Password Lama
                      </label>
                      <input
                        type="password"
                        value={oldPass}
                        onChange={(e) => setOldPass(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">
                        Ulangi Password
                      </label>
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                      >
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveProfileTab('menu')}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Kembali
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Live Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/15 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold block text-white">{total}</span>
            <span className="text-xs text-blue-100 dark:text-slate-300 font-semibold">Total Survey</span>
          </div>

          <div className="bg-white/15 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold block text-white">{count2027}</span>
            <span className="text-xs text-blue-100 dark:text-slate-300 font-semibold">Tahun 2027</span>
          </div>

          <div className="bg-white/15 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold block text-amber-300">{countBanjir}</span>
            <span className="text-xs text-blue-100 dark:text-slate-300 font-semibold">Titik Banjir</span>
          </div>

          <div className="bg-white/15 dark:bg-slate-800/60 border border-white/20 dark:border-slate-700 rounded-2xl p-3.5 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold block text-emerald-300">{countCC}</span>
            <span className="text-xs text-blue-100 dark:text-slate-300 font-semibold">Clean &amp; Clear</span>
          </div>
        </div>
      </div>

      {/* System Suspend Status Notice if active */}
      {systemStatus.suspended && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              <b>Status Sistem: DITANGGUHKAN.</b> Akses login untuk pengguna selain pemilik sistem (jamesonly) dinonaktifkan.
            </span>
          </div>
          {isOwner && (
            <button
              onClick={handleToggleSuspend}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition-colors shrink-0"
            >
              Aktifkan Kembali
            </button>
          )}
        </div>
      )}

      {/* Action / Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: New Data Survey */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <FilePlus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
              Menu Input &mdash; New Data Survey
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Input data survei lapangan lengkap:
              <br />&bull; Semua kolom bertanda bintang (<b>*</b>) wajib diisi.
              <br />&bull; Minimal <b>2 titik koordinat</b> (Awal &amp; Akhir) via klik peta/GPS.
              <br />&bull; Lampirkan minimal <b>2 foto</b> dokumentasi (watermark geotag otomatis).
            </p>
          </div>
          <button
            onClick={() => onNavigate('new')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <FilePlus className="w-4 h-4" />
            <span>Mulai Input Data</span>
          </button>
        </div>

        {/* Card 2: Big Data Survey */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
              Menu Data &mdash; Big Data Survey
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Kelola seluruh database survei:
              <br />&bull; Pencarian instan dan filter wilayah bertingkat.
              <br />&bull; Buka rincian survei, foto lightbox, dan peta titik.
              <br />&bull; Edit data, hapus data, serta ekspor massal ke Excel, PDF, atau Word.
            </p>
          </div>
          <button
            onClick={() => onNavigate('big')}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-sky-500/20"
          >
            <Database className="w-4 h-4" />
            <span>Buka Big Data ({total})</span>
          </button>
        </div>

        {/* Card 3: Monitoring Report */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
              Menu Grafik &mdash; Monitoring Report
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Pantau visualisasi dan ringkasan data:
              <br />&bull; Rekapitulasi jumlah survei per-tahun dan per-petugas.
              <br />&bull; Peringkat kecamatan dan 10 kelurahan terbanyak.
              <br />&bull; Diagram proporsi titik banjir dan status clean &amp; clear.
            </p>
          </div>
          <button
            onClick={() => onNavigate('grafik')}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Lihat Grafik &amp; Laporan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
