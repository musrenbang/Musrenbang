import React from 'react';
import { Home, FilePlus, Database, BarChart3, LogOut, Map, FileSpreadsheet } from 'lucide-react';

interface Props {
  mode: 'admin' | 'monitoring';
  activeTab: string;
  onTabChange: (tab: string) => void;
  surveyCount?: number;
  onLogout?: () => void;
  onHomeClick?: () => void;
}

export const BottomNav: React.FC<Props> = ({
  mode,
  activeTab,
  onTabChange,
  surveyCount = 0,
  onLogout,
  onHomeClick
}) => {
  if (mode === 'admin') {
    return (
      <nav className="fixed bottom-9 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl px-2 py-1.5 flex justify-around items-center transition-colors">
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold transition-colors ${
            activeTab === 'home' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onTabChange('new')}
          className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold transition-colors ${
            activeTab === 'new' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <FilePlus className="w-5 h-5 mb-0.5" />
          <span>Input</span>
        </button>

        <button
          onClick={() => onTabChange('big')}
          className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold relative transition-colors ${
            activeTab === 'big' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-5 h-5 mb-0.5" />
          <span>Big Data</span>
          {surveyCount > 0 && (
            <span className="absolute top-0 right-3 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full min-w-4 text-center">
              {surveyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('grafik')}
          className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold transition-colors ${
            activeTab === 'grafik' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Grafik</span>
        </button>

        <button
          onClick={onLogout}
          className="flex-1 flex flex-col items-center py-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span>Keluar</span>
        </button>
      </nav>
    );
  }

  // Monitoring Mode Bottom Nav
  return (
    <nav className="fixed bottom-9 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl px-2 py-1.5 flex justify-around items-center transition-colors">
      <button
        onClick={onHomeClick}
        className="flex-1 flex flex-col items-center py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Awal</span>
      </button>

      <button
        onClick={() => onTabChange('peta')}
        className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'peta' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Map className="w-5 h-5 mb-0.5" />
        <span>Peta</span>
      </button>

      <button
        onClick={() => onTabChange('report')}
        className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'report' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <FileSpreadsheet className="w-5 h-5 mb-0.5" />
        <span>Report</span>
      </button>

      <button
        onClick={() => onTabChange('grafik')}
        className={`flex-1 flex flex-col items-center py-1 text-[10px] font-bold transition-colors ${
          activeTab === 'grafik' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span>Grafik</span>
      </button>
    </nav>
  );
};
