import React from 'react';
import { FileSpreadsheet, FileText, FileCode } from 'lucide-react';
import { SurveyRecord } from '../types';

interface Props {
  surveys: SurveyRecord[];
  onExport: (format: 'excel' | 'pdf' | 'word', rows: SurveyRecord[]) => void;
}

export const MonitoringReportCharts: React.FC<Props> = ({ surveys, onExport }) => {
  // Helpers for counting
  const countBy = (key: keyof SurveyRecord, top = 0) => {
    const map: { [k: string]: number } = {};
    surveys.forEach((s) => {
      const val = String(s[key] || '(kosong)').trim();
      map[val] = (map[val] || 0) + 1;
    });
    let arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (top > 0) arr = arr.slice(0, top);
    return arr;
  };

  const dataTahun = countBy('tahun');
  const dataPetugas = countBy('petugas');
  const dataKecamatan = countBy('kecamatan', 10);
  const dataKelurahan = countBy('kelurahan', 10);
  const dataBanjir = countBy('banjir');
  const dataStatus = countBy('status');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            Monitoring Report &mdash; Grafik Analisis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualisasi agregasi data survei berdasarkan tahun, wilayah, petugas, dan status.
          </p>
        </div>

        {/* Quick export */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onExport('excel', surveys)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => onExport('pdf', surveys)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => onExport('word', surveys)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Word</span>
          </button>
        </div>
      </div>

      {/* 6 Grid Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Chart 1: Data per-Tahun */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
            <span>📅 Data per-Tahun</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">{dataTahun.length} periode</span>
          </h4>
          <BarList data={dataTahun} total={surveys.length} color="bg-blue-500 dark:bg-blue-600" />
        </div>

        {/* Chart 2: Data per-Petugas */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
            <span>👤 Data per-Petugas Surveyor</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">{dataPetugas.length} surveyor</span>
          </h4>
          <BarList data={dataPetugas} total={surveys.length} color="bg-sky-500 dark:bg-sky-600" />
        </div>

        {/* Chart 3: Data per-Kecamatan */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
            <span>🏙️ Data per-Kecamatan (Top 10)</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">persebaran</span>
          </h4>
          <BarList data={dataKecamatan} total={surveys.length} color="bg-indigo-500 dark:bg-indigo-600" />
        </div>

        {/* Chart 4: Data per-Kelurahan */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center justify-between">
            <span>🏡 Data per-Kelurahan (Top 10)</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">titik lokasi</span>
          </h4>
          <BarList data={dataKelurahan} total={surveys.length} color="bg-teal-500 dark:bg-teal-600" />
        </div>

        {/* Chart 5: Banjir vs Tidak Banjir */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3">
            🌊 Status Banjir vs Tidak Banjir
          </h4>
          <DonutSummary data={dataBanjir} total={surveys.length} />
        </div>

        {/* Chart 6: Status Clean & Clear */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3">
            ✅ Status Clean &amp; Clear
          </h4>
          <DonutSummary data={dataStatus} total={surveys.length} />
        </div>
      </div>
    </div>
  );
};

// Reusable Bar List visualizer
const BarList: React.FC<{ data: [string, number][]; total: number; color: string }> = ({
  data,
  total,
  color
}) => {
  if (data.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Belum ada data</p>;
  }

  const maxVal = Math.max(...data.map((d) => d[1]), 1);

  return (
    <div className="space-y-2.5 text-xs">
      {data.map(([label, count]) => {
        const pct = Math.round((count / (total || 1)) * 100);
        const barWidth = Math.round((count / maxVal) * 100);

        return (
          <div key={label} className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{label}</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                <b className="text-slate-700 dark:text-slate-200">{count}</b> ({pct}%)
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-300`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Reusable Donut Summary visualizer
const DonutSummary: React.FC<{ data: [string, number][]; total: number }> = ({ data, total }) => {
  if (data.length === 0) {
    return <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Belum ada data</p>;
  }

  const colors = ['#0b5fff', '#f59e0b', '#dc2626', '#10b981', '#64748b'];

  return (
    <div className="space-y-3 py-1">
      {/* Visual Proportion Bar */}
      <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
        {data.map(([label, count], i) => {
          const pct = (count / (total || 1)) * 100;
          return (
            <div
              key={label}
              className="h-full transition-all duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: colors[i % colors.length]
              }}
              title={`${label}: ${count}`}
            />
          );
        })}
      </div>

      {/* Legend list */}
      <div className="space-y-2 pt-1 text-xs">
        {data.map(([label, count], i) => {
          const pct = Math.round((count / (total || 1)) * 100);
          return (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate max-w-[75%]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{label}</span>
              </div>
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                <b className="text-slate-700 dark:text-slate-200">{count}</b> ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
