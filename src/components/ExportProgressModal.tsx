import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  done: number;
  total: number;
}

export const ExportProgressModal: React.FC<Props> = ({ isOpen, done, total }) => {
  if (!isOpen) return null;

  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/40">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Ekspor Data Massal</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sistem memproses dokumen dalam pecahan baris agar browser tetap responsif.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-xs font-mono text-sky-300 font-semibold">
          Memproses data: {done} / {total} baris ({pct}%)
        </p>
      </div>
    </div>
  );
};
