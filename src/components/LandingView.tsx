import React from 'react';
import {
  ShieldCheck,
  Eye,
  MapPin,
  Camera,
  BarChart3,
  FileDown,
  Download,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface Props {
  totalSurveys: number;
  onEnterAdmin: () => void;
  onEnterMonitoring: () => void;
}

export const LandingView: React.FC<Props> = ({
  totalSurveys,
  onEnterAdmin,
  onEnterMonitoring
}) => {
  return (
    <div className="space-y-6 pb-12 transition-colors duration-200">
      {/* Hero Brand Section */}
      <div className="text-center pt-4 sm:pt-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-white dark:bg-slate-800 rounded-3xl p-2.5 shadow-xl border border-blue-100 dark:border-slate-700 flex items-center justify-center transition-colors">
          <img src="/img/logo.png" alt="Logo Musrenbang 2027" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
          MUSRENBANG APPS 2027
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium transition-colors">
          Survey Musyawarah Perencanaan Pembangunan<br />
          Provinsi Sumatera Selatan
        </p>

        {/* Stat Pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 shadow-sm transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <b>{totalSurveys}</b> Data Survey Terdaftar
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-900/60 text-sky-800 dark:text-sky-300 shadow-sm transition-colors">
            <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            17 Kota/Kabupaten Sumsel
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 shadow-sm transition-colors">
            <FileDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Word / Excel / PDF Ready
          </span>
        </div>
      </div>

      {/* Main Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Admin Card */}
        <div
          onClick={onEnterAdmin}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md hover:shadow-xl border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer overflow-hidden flex items-center gap-4 dark:border-slate-800"
        >
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-blue-600 dark:bg-blue-500" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Dashboard Admin
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola penuh database survey: input form 9-seksi, edit data, watermark foto, dan ekspor dokumen.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Monitoring Card */}
        <div
          onClick={onEnterMonitoring}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md hover:shadow-xl border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-400 transition-all cursor-pointer overflow-hidden flex items-center gap-4 dark:border-slate-800"
        >
          <div className="w-1.5 absolute left-0 top-0 bottom-0 bg-emerald-600 dark:bg-emerald-500" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
            <Eye className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Dashboard Monitoring
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lihat peta sebaran lokasi survei, filter wilayah, rekapitulasi data, grafik, dan cetak laporan.
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="w-10 h-10 mx-auto rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Peta Digital & GPS</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Geofence Sumsel & Live Kompas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="w-10 h-10 mx-auto rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Watermark Geotag</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">5 Baris Info & Kompresi &lt;400KB</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="w-10 h-10 mx-auto rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Grafik Laporan</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">6 Analitik Visual Interaktif</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
          <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <FileDown className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Ekspor Dokumen</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Excel 31 Kolom, PDF, & Word</p>
        </div>
      </div>

      {/* PWA Installation Card */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-slate-900 dark:to-blue-950/40 rounded-2xl p-5 border border-blue-200/80 dark:border-blue-900/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Instal Aplikasi di Android / iPhone / PC
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            <b>Android / Chrome:</b> ketuk menu browser (titik tiga) &rarr; pilih <b>Install App / Tambahkan ke Layar Utama</b>.<br />
            <b>iPhone / Safari:</b> ketuk ikon <b>Bagikan (Share)</b> di bawah &rarr; pilih <b>Add to Home Screen</b>.<br />
            Aplikasi dapat dibuka fullscreen seperti aplikasi bawaan dan dapat bekerja secara offline.
          </p>
        </div>
      </div>

      {/* 3-Step Guide */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span>📖</span> Alur Kerja Aplikasi
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Login Administrator</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masuk menggunakan akun Super Admin atau Administrator untuk membuka menu pengelolaan data survei.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Input Data Survei Lapangan</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Isi form lengkap 9-seksi: tentukan minimal 2 titik koordinat (Awal & Akhir) via klik peta/GPS, serta lampirkan minimal 2 foto dengan geotag watermark otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Monitoring & Ekspor Dokumen</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pantau seluruh sebaran titik di peta interaktif, filter berdasarkan kota/kabupaten dan tahun, lalu ekspor laporan siap cetak ke Excel, PDF, atau Word.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

