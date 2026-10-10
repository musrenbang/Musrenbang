import React from 'react';
import { Wifi, WifiOff, Sun, Moon } from 'lucide-react';

interface Props {
  isOnline: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onHomeClick?: () => void;
}

export const TopHeader: React.FC<Props> = ({ isOnline, isDark, onToggleTheme, onHomeClick }) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 text-white px-4 py-3 sm:py-3.5 shadow-lg shadow-blue-500/10 dark:shadow-black/40 border-b border-blue-400/20 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
        {/* Logo and title */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer select-none group text-center sm:text-left"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-md flex items-center justify-center shrink-0 border border-transparent dark:border-slate-700 transition-colors">
            <img src="/img/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide text-white group-hover:text-blue-100 dark:group-hover:text-blue-200 transition-colors">
                MUSRENBANG APPS 2027
              </h1>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 dark:bg-blue-500/20 border border-white/40 dark:border-blue-400/30 px-2.5 py-0.5 rounded-full text-white dark:text-blue-200 backdrop-blur-sm">
                Vers.1.1.2
              </span>
            </div>
            <p className="text-xs text-blue-100 dark:text-slate-300 font-medium hidden sm:block">
              Aplikasi Survey Musyawarah Perencanaan Pembangunan — Provinsi Sumatera Selatan
            </p>
          </div>
        </div>

        {/* Action controls: Dark mode switch + Connection status */}
        <div className="flex items-center gap-2.5">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-white/30 dark:border-slate-700 text-white dark:text-amber-300 transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span className="text-[11px] sm:text-xs font-medium">Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-100" />
                <span className="text-[11px] sm:text-xs font-medium">Gelap</span>
              </>
            )}
          </button>

          {/* Real-time Connection status indicator */}
          <div
            id="network-status-badge"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors ${
              isOnline
                ? 'online bg-emerald-500/25 border border-emerald-300/50 dark:bg-emerald-950/60 dark:border-emerald-500/40 text-emerald-100 dark:text-emerald-300'
                : 'offline bg-rose-500/30 border border-rose-300/60 dark:bg-rose-950/60 dark:border-rose-500/40 text-rose-100 dark:text-rose-300'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-400" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-300 dark:text-rose-400" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

