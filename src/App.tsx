import React, { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { TopHeader } from './components/TopHeader';
import { AppFooter } from './components/AppFooter';
import { BottomNav } from './components/BottomNav';
import { LandingView } from './components/LandingView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminHome } from './components/AdminHome';
import { SurveyForm } from './components/SurveyForm';
import { BigDataTable } from './components/BigDataTable';
import { MonitoringReportCharts } from './components/MonitoringReportCharts';
import { MonitoringView } from './components/MonitoringView';
import { DetailModal } from './components/DetailModal';
import { LightboxModal } from './components/LightboxModal';
import { ExportProgressModal } from './components/ExportProgressModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  apiFetchSurveys,
  apiSaveSurvey,
  apiDeleteSurvey,
  apiGetSystemStatus,
  getLocalSession,
  setLocalSession
} from './utils/api';
import { exportToExcel, exportToPDF, exportToWord } from './utils/exportUtils';
import { SurveyRecord, SystemStatus } from './types';
import { Home, FilePlus, Database, BarChart3, LogOut, ArrowLeft } from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<'landing' | 'admin' | 'monitoring'>('landing');
  const [adminTab, setAdminTab] = useState<'home' | 'new' | 'big' | 'grafik'>('home');
  const [monTab, setMonTab] = useState<'peta' | 'report' | 'grafik'>('peta');

  const [userSession, setUserSession] = useState<{ user: string; name: string } | null>(() => getLocalSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ suspended: false, suspendedAt: null });

  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [editRecord, setEditRecord] = useState<SurveyRecord | null>(null);
  const [detailSurvey, setDetailSurvey] = useState<SurveyRecord | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [exportProgress, setExportProgress] = useState<{ isOpen: boolean; done: number; total: number }>({
    isOpen: false,
    done: 0,
    total: 0
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Global Dark Mode Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mrb_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mrb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mrb_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi kembali online • sinkronisasi database aktif.', 'success');
      loadSurveys();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Mode offline aktif • data tersimpan lokal di browser.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Load surveys and system status on mount
  const loadSurveys = useCallback(async () => {
    try {
      const data = await apiFetchSurveys();
      setSurveys(data);
    } catch (err) {
      console.warn('Failed to fetch surveys', err);
    }
  }, []);

  useEffect(() => {
    loadSurveys();
    apiGetSystemStatus().then((status) => setSystemStatus(status));
  }, [loadSurveys]);

  // Handle Save
  const handleSaveSurvey = async (record: SurveyRecord) => {
    const saved = await apiSaveSurvey(record);
    await loadSurveys();
    setEditRecord(null);
    setAdminTab('big');
    showToast(
      record.id === editRecord?.id
        ? `Data survey "${saved.surveyNo}" berhasil diperbarui!`
        : `Data survey "${saved.surveyNo}" berhasil disimpan!`,
      'success'
    );
  };

  // Handle Delete
  const handleDeleteSurvey = async (id: string) => {
    await apiDeleteSurvey(id);
    await loadSurveys();
    showToast('Data survey berhasil dihapus.', 'info');
  };

  // Handle Export with chunked progress
  const handleExport = async (format: 'excel' | 'pdf' | 'word', rows: SurveyRecord[]) => {
    if (!rows.length) {
      showToast('Tidak ada data untuk diekspor.', 'error');
      return;
    }

    if (rows.length > 300) {
      setExportProgress({ isOpen: true, done: 0, total: rows.length });
    }

    try {
      const onProgress = (done: number, total: number) => {
        setExportProgress({ isOpen: true, done, total });
      };

      if (format === 'excel') {
        await exportToExcel(rows, onProgress);
        showToast(`Berhasil mengekspor ${rows.length} data ke Excel (.xlsx)`, 'success');
      } else if (format === 'pdf') {
        await exportToPDF(rows, onProgress);
        showToast(`Berhasil mengekspor ${rows.length} data ke PDF (.pdf)`, 'success');
      } else {
        await exportToWord(rows, onProgress);
        showToast(`Berhasil mengekspor ${rows.length} data ke Word (.doc)`, 'success');
      }
    } catch (err) {
      console.error('Export error', err);
      showToast('Terjadi kesalahan saat memproses ekspor.', 'error');
    } finally {
      setExportProgress({ isOpen: false, done: 0, total: 0 });
    }
  };

  // Handle Enter Admin
  const handleEnterAdmin = () => {
    if (userSession) {
      setView('admin');
      setAdminTab('home');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Handle Login Success
  const handleLoginSuccess = (session: { user: string; name: string }) => {
    setUserSession(session);
    setLocalSession(session);
    setView('admin');
    setAdminTab('home');
    showToast(`Login berhasil. Selamat datang, ${session.name}!`, 'success');
  };

  // Handle Logout
  const handleLogout = () => {
    setUserSession(null);
    setLocalSession(null);
    setView('landing');
    showToast('Anda telah keluar dari sesi admin.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans antialiased pb-12 sm:pb-16 selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Animated Splash Screen */}
      {showSplash && <SplashScreen onDismiss={() => setShowSplash(false)} />}

      {/* Top Header */}
      <TopHeader
        isOnline={isOnline}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onHomeClick={() => {
          setView('landing');
          setEditRecord(null);
        }}
      />

      {/* Main App Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: LANDING */}
        {view === 'landing' && (
          <LandingView
            totalSurveys={surveys.length}
            onEnterAdmin={handleEnterAdmin}
            onEnterMonitoring={() => {
              setView('monitoring');
              setMonTab('peta');
            }}
          />
        )}

        {/* VIEW 2: ADMIN */}
        {view === 'admin' && userSession && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Desktop Sidebar */}
            <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 hidden lg:block sticky top-24 transition-colors">
              {/* User box */}
              <div className="bg-gradient-to-br from-blue-700 to-sky-600 dark:from-blue-900 dark:to-slate-800 rounded-2xl p-4 text-white text-center mb-4 shadow-md shadow-blue-500/15">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/20 border-2 border-white/50 text-white font-black text-lg flex items-center justify-center mb-2 shadow-inner">
                  {userSession.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-bold text-sm truncate">{userSession.name}</h4>
                <span className="text-[11px] text-blue-200 dark:text-blue-300 block">
                  {userSession.user.toLowerCase() === 'jamesonly' ? 'Super Admin (Owner)' : 'Administrator'}
                </span>
              </div>

              {/* Navigation buttons */}
              <div className="space-y-1.5 text-xs font-bold">
                <button
                  onClick={() => {
                    setAdminTab('home');
                    setEditRecord(null);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                    adminTab === 'home'
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home Admin</span>
                </button>

                <button
                  onClick={() => setAdminTab('new')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                    adminTab === 'new'
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FilePlus className="w-4 h-4" />
                  <span>New Data Survey</span>
                </button>

                <button
                  onClick={() => {
                    setAdminTab('big');
                    setEditRecord(null);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                    adminTab === 'big'
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4" />
                    <span>Big Data Survey</span>
                  </div>
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {surveys.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setAdminTab('grafik');
                    setEditRecord(null);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                    adminTab === 'grafik'
                      ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Monitoring Report</span>
                </button>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setView('landing');
                      setEditRecord(null);
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Dashboard Awal</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Admin Content Subviews */}
            <div className="flex-1 w-full min-w-0">
              {adminTab === 'home' && (
                <AdminHome
                  userSession={userSession}
                  surveys={surveys}
                  systemStatus={systemStatus}
                  onNavigate={(tab) => {
                    setAdminTab(tab);
                    setEditRecord(null);
                  }}
                  onSessionUpdate={(newS) => setUserSession(newS)}
                  onStatusUpdate={(newSt) => setSystemStatus(newSt)}
                  onShowToast={showToast}
                />
              )}

              {adminTab === 'new' && (
                <SurveyForm
                  editRecord={editRecord}
                  allSurveys={surveys}
                  onSave={handleSaveSurvey}
                  onCancelEdit={() => {
                    setEditRecord(null);
                    setAdminTab('big');
                  }}
                  onShowToast={showToast}
                  onOpenLightbox={(src) => setLightboxSrc(src)}
                />
              )}

              {adminTab === 'big' && (
                <BigDataTable
                  surveys={surveys}
                  onViewDetail={(s) => setDetailSurvey(s)}
                  onEdit={(s) => {
                    setEditRecord(s);
                    setAdminTab('new');
                  }}
                  onDelete={handleDeleteSurvey}
                  onExport={handleExport}
                />
              )}

              {adminTab === 'grafik' && (
                <MonitoringReportCharts surveys={surveys} onExport={handleExport} />
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: MONITORING (PUBLIC PREVIEW) */}
        {view === 'monitoring' && (
          <MonitoringView
            surveys={surveys}
            onViewDetail={(s) => setDetailSurvey(s)}
            onExport={handleExport}
            onBackToLanding={() => setView('landing')}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        isSuspended={systemStatus.suspended}
      />

      {/* Survey Detail Modal */}
      <DetailModal
        survey={detailSurvey}
        isAdmin={view === 'admin' && !!userSession}
        onClose={() => setDetailSurvey(null)}
        onEdit={(s) => {
          setEditRecord(s);
          setAdminTab('new');
        }}
        onDelete={handleDeleteSurvey}
        onOpenLightbox={(src) => setLightboxSrc(src)}
      />

      {/* Lightbox Modal */}
      <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* Export Chunk Processing Progress Modal */}
      <ExportProgressModal
        isOpen={exportProgress.isOpen}
        done={exportProgress.done}
        total={exportProgress.total}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Mobile Bottom Navigation */}
      {view === 'admin' && userSession && (
        <BottomNav
          mode="admin"
          activeTab={adminTab}
          onTabChange={(tab) => {
            setAdminTab(tab as any);
            setEditRecord(null);
          }}
          surveyCount={surveys.length}
          onLogout={handleLogout}
        />
      )}

      {view === 'monitoring' && (
        <BottomNav
          mode="monitoring"
          activeTab={monTab}
          onTabChange={(tab) => setMonTab(tab as any)}
          onHomeClick={() => setView('landing')}
        />
      )}

      {/* Fixed Footer */}
      <AppFooter />
    </div>
  );
}
