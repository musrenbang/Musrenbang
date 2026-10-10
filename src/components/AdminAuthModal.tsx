import React, { useState } from 'react';
import { Lock, User, AlertCircle, LogIn, X } from 'lucide-react';
import { apiLogin } from '../utils/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: { user: string; name: string }) => void;
  isSuspended?: boolean;
}

export const AdminAuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  isSuspended = false
}) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user.trim()) {
      setError('Username / Email wajib diisi');
      return;
    }
    if (!pass) {
      setError('Password wajib diisi');
      return;
    }

    setLoading(true);
    const res = await apiLogin(user.trim(), pass);
    setLoading(false);

    if (res.ok && res.session) {
      onSuccess(res.session);
      onClose();
    } else {
      setError(res.message || 'Username atau password salah!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-blue-100 dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Top colored bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-sky-500 to-amber-400" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Lock className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100">
            Login Administrator
          </h3>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1 mb-5">
            Masuk untuk mengelola database survei Musrenbang
          </p>

          {/* Suspend warning banner */}
          {isSuspended && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>
                Akses sistem saat ini <b>ditangguhkan</b>. Hanya akun pemilik sistem (<b>jamesonly</b>) yang dapat masuk.
              </span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Username / Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="Contoh: jamesonly atau Super Admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Login Sekarang'}</span>
            </button>
          </form>

          {/* Helper hint for user */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <b className="text-slate-700 dark:text-slate-200">Akun Pengguna Default:</b><br />
            &bull; Pemilik Sistem: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-800 dark:text-slate-200">jamesonly</code> (pass: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-800 dark:text-slate-200">Katuas165</code>)<br />
            &bull; Administrator: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-800 dark:text-slate-200">Super Admin</code> (pass: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-800 dark:text-slate-200">Kayuawetsejahtera123</code>)
          </div>
        </div>
      </div>
    </div>
  );
};
