import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  FileCode,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { SurveyRecord } from '../types';
import { getKabKotaList, getKecamatanList, getKelurahanList } from '../data/wilayahSumsel';

interface Props {
  surveys: SurveyRecord[];
  onViewDetail: (survey: SurveyRecord) => void;
  onEdit: (survey: SurveyRecord) => void;
  onDelete: (id: string) => void;
  onExport: (format: 'excel' | 'pdf' | 'word', rows: SurveyRecord[]) => void;
}

export const BigDataTable: React.FC<Props> = ({
  surveys,
  onViewDetail,
  onEdit,
  onDelete,
  onExport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKab, setFilterKab] = useState('');
  const [filterKec, setFilterKec] = useState('');
  const [filterKel, setFilterKel] = useState('');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter cascades
  const kabList = getKabKotaList();
  const kecList = filterKab ? getKecamatanList(filterKab) : [];
  const kelList = filterKab && filterKec ? getKelurahanList(filterKab, filterKec) : [];

  // Filtered surveys
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (s.surveyNo && s.surveyNo.toLowerCase().includes(q)) ||
          (s.usulanNo && s.usulanNo.toLowerCase().includes(q)) ||
          (s.alamat && s.alamat.toLowerCase().includes(q)) ||
          (s.petugas && s.petugas.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filterTahun && s.tahun !== filterTahun) return false;
      if (filterKab) {
        const selectedKabObj = kabList.find((k) => k.id === filterKab);
        const kabName = selectedKabObj?.name || filterKab;
        if (s.kabkota !== kabName && s.kabkotaId !== filterKab) return false;
      }
      if (filterKec) {
        const selectedKecObj = kecList.find((c) => c.id === filterKec);
        const kecName = selectedKecObj?.name || filterKec;
        if (s.kecamatan !== kecName && s.kecamatanId !== filterKec) return false;
      }
      if (filterKel && s.kelurahan !== filterKel) return false;

      return true;
    });
  }, [surveys, searchQuery, filterTahun, filterKab, filterKec, filterKel, kabList, kecList]);

  // Pagination calculation
  const totalItems = filteredSurveys.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const pageRows = filteredSurveys.slice(startIndex, startIndex + perPage);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterTahun('');
    setFilterKab('');
    setKecamatanListState('');
    setFilterKel('');
    setPage(1);
  };

  const setKecamatanListState = (val: string) => {
    setFilterKec(val);
    setFilterKel('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">Big Data Survey</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Daftar seluruh survei lapangan. Klik <b>No. ID Survey</b> untuk rincian data lengkap.
        </p>
      </div>

      {/* Toolbar: Search & Export */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari No. ID Survey / ID Usulan / Petugas / Alamat..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onExport('excel', filteredSurveys)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-colors"
            title="Ekspor tabel lengkap 31 kolom ke format Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => onExport('pdf', filteredSurveys)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-colors"
            title="Cetak format PDF Landscape A4"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => onExport('word', filteredSurveys)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-colors"
            title="Unduh dokumen Word (.doc)"
          >
            <FileCode className="w-4 h-4" />
            <span>Export Word</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
        <select
          value={filterTahun}
          onChange={(e) => {
            setFilterTahun(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Tahun: Semua</option>
          {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={filterKab}
          onChange={(e) => {
            setFilterKab(e.target.value);
            setKecamatanListState('');
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Kota/Kab: Semua</option>
          {kabList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        <select
          value={filterKec}
          disabled={!filterKab}
          onChange={(e) => {
            setFilterKec(e.target.value);
            setFilterKel('');
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs disabled:opacity-60 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Kecamatan: Semua</option>
          {kecList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterKel}
          disabled={!filterKec}
          onChange={(e) => {
            setFilterKel(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs disabled:opacity-60 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Kelurahan: Semua</option>
          {kelList.map((kel) => (
            <option key={kel} value={kel}>
              {kel}
            </option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="col-span-2 sm:col-span-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filter</span>
        </button>
      </div>

      {/* Table Display */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-gradient-to-r from-blue-700 to-sky-600 dark:from-slate-800 dark:via-blue-950 dark:to-slate-800 text-white">
              <tr>
                <th className="py-3 px-3.5 font-bold">No</th>
                <th className="py-3 px-3.5 font-bold">Tahun</th>
                <th className="py-3 px-3.5 font-bold">No. ID Survey</th>
                <th className="py-3 px-3.5 font-bold">ID Usulan</th>
                <th className="py-3 px-3.5 font-bold">Kota/Kabupaten</th>
                <th className="py-3 px-3.5 font-bold">Kecamatan</th>
                <th className="py-3 px-3.5 font-bold">Kelurahan</th>
                <th className="py-3 px-3.5 font-bold">Status</th>
                <th className="py-3 px-3.5 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-base font-semibold mb-1">Tidak ada data ditemukan</p>
                    <p className="text-xs">Coba sesuaikan kata kunci pencarian atau bersihkan filter wilayah.</p>
                  </td>
                </tr>
              ) : (
                pageRows.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2.5 px-3.5 text-slate-400 dark:text-slate-500 font-mono text-xs">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-100">{s.tahun}</td>
                    <td className="py-2.5 px-3.5">
                      <button
                        onClick={() => onViewDetail(s)}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 text-left"
                      >
                        <span>{s.surveyNo}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-slate-600 dark:text-slate-300">{s.usulanNo}</td>
                    <td className="py-2.5 px-3.5">{s.kabkota}</td>
                    <td className="py-2.5 px-3.5">{s.kecamatan}</td>
                    <td className="py-2.5 px-3.5">{s.kelurahan}</td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.banjir === 'Banjir'
                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                            : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                        }`}
                      >
                        {s.banjir}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewDetail(s)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(s)}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                          title="Edit Data"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Tampilkan:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
          >
            <option value={10}>10 baris</option>
            <option value={25}>25 baris</option>
            <option value={50}>50 baris</option>
          </select>
          <span className="text-slate-400 dark:text-slate-600">|</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Halaman <b>{currentPage}</b> dari <b>{totalPages}</b> ({totalItems} total data)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors"
          >
            <span>Berikutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
