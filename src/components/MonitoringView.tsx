import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Map as MapIcon,
  FileSpreadsheet,
  BarChart3,
  Search,
  FileText,
  FileCode,
  Eye,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { SurveyRecord } from '../types';
import { getKabKotaList, getKecamatanList, getKelurahanList } from '../data/wilayahSumsel';
import { MonitoringReportCharts } from './MonitoringReportCharts';

interface Props {
  surveys: SurveyRecord[];
  onViewDetail: (survey: SurveyRecord) => void;
  onExport: (format: 'excel' | 'pdf' | 'word', rows: SurveyRecord[]) => void;
  onBackToLanding: () => void;
}

export const MonitoringView: React.FC<Props> = ({
  surveys,
  onViewDetail,
  onExport,
  onBackToLanding
}) => {
  const [activeTab, setActiveTab] = useState<'peta' | 'report' | 'grafik'>('peta');

  // Filter states
  const [filterTahun, setFilterTahun] = useState('');
  const [filterKab, setFilterKab] = useState('');
  const [filterKec, setFilterKec] = useState('');
  const [filterKel, setFilterKel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const kabList = getKabKotaList();
  const kecList = filterKab ? getKecamatanList(filterKab) : [];
  const kelList = filterKab && filterKec ? getKelurahanList(filterKab, filterKec) : [];

  // Summary stats
  const total = surveys.length;
  const count2027 = surveys.filter((s) => s.tahun === '2027').length;
  const countBanjir = surveys.filter((s) => s.banjir === 'Banjir').length;
  const countCC = surveys.filter(
    (s) => (s.status || '').includes('Clean & Clear') && !s.status?.includes('Belum')
  ).length;

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

  // Leaflet Map Init
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Sumatera Selatan Geofence
      const sumselBounds = L.latLngBounds([-6.0, 101.5], [-1.0, 106.7]);

      const map = L.map(mapContainerRef.current, {
        maxBounds: sumselBounds,
        maxBoundsViscosity: 0.9,
        minZoom: 7
      }).setView([-2.9909, 104.7565], 9);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapRef.current = map;
    }

    if (activeTab === 'peta' && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 150);
    }

    // Refresh markers
    const map = mapRef.current;
    const layer = layerGroupRef.current;
    if (map && layer) {
      layer.clearLayers();
      const allCoords: L.LatLng[] = [];

      filteredSurveys.forEach((s) => {
        const parse = (c: string) => {
          if (!c) return null;
          const p = c.split(',').map((x) => parseFloat(x.trim()));
          if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) {
            return L.latLng(p[0], p[1]);
          }
          return null;
        };

        const pAwal = parse(s.koorAwal);
        const pTengah = parse(s.koorTengah || '');
        const pAkhir = parse(s.koorAkhir);
        const points = [pAwal, pTengah, pAkhir].filter(Boolean) as L.LatLng[];
        points.forEach((p) => allCoords.push(p));

        const isBanjir = s.banjir === 'Banjir';

        const popupContent = `
          <div class="popup-card-content" style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <b style="color: #3b82f6; font-size: 13px;">${s.surveyNo}</b><br/>
            <b>ID Usulan:</b> ${s.usulanNo}<br/>
            <b>Lokasi:</b> ${s.alamat}, ${s.kelurahan}, ${s.kecamatan}<br/>
            <b>Status:</b> <span style="color: ${isBanjir ? '#ef4444' : '#10b981'}; font-weight: bold;">${s.banjir}</span><br/>
            <b>Tahun:</b> ${s.tahun} | <b>Petugas:</b> ${s.petugas}<br/>
            ${
              s.photos && s.photos.length > 0
                ? `<div style="display:flex; gap:4px; margin-top:6px; overflow:hidden;">
                    ${s.photos.slice(0, 2).map((p) => `<img src="${p}" style="width:60px; height:45px; object-fit:cover; border-radius:4px;" />`).join('')}
                   </div>`
                : ''
            }
          </div>
        `;

        // Add markers
        if (pAwal) {
          L.circleMarker(pAwal, {
            radius: 8,
            fillColor: isBanjir ? '#dc2626' : '#0b5fff',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
          })
            .addTo(layer)
            .bindPopup(`<b>Titik Awal • ${s.surveyNo}</b><br/>` + popupContent);
        }

        if (pAkhir) {
          L.circleMarker(pAkhir, {
            radius: 8,
            fillColor: isBanjir ? '#b91c1c' : '#0369a1',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
          })
            .addTo(layer)
            .bindPopup(`<b>Titik Akhir • ${s.surveyNo}</b><br/>` + popupContent);
        }

        // Add Polyline
        if (points.length >= 2) {
          L.polyline(points, {
            color: isBanjir ? '#dc2626' : '#0b5fff',
            weight: 3.5,
            dashArray: isBanjir ? '5, 5' : undefined
          })
            .addTo(layer)
            .bindPopup(popupContent);
        }
      });

      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40], maxZoom: 14 });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [activeTab, filteredSurveys]);

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Top Banner and Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-colors shadow-sm"
            title="Kembali ke Dashboard Awal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
              Dashboard Monitoring Publik
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pemantauan sebaran titik survei &amp; laporan hasil Musrenbang Sumatera Selatan
            </p>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('peta')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'peta'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Peta Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'report'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Monitoring Report</span>
          </button>

          <button
            onClick={() => setActiveTab('grafik')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'grafik'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Grafik Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-sky-500 dark:from-blue-700 dark:to-sky-600 rounded-2xl p-4 text-white shadow-sm">
          <span className="text-2xl sm:text-3xl font-extrabold block">{total}</span>
          <span className="text-xs text-blue-100 font-semibold">Total Data Survey</span>
        </div>

        <div className="bg-gradient-to-br from-blue-700 to-indigo-600 dark:from-indigo-800 dark:to-blue-800 rounded-2xl p-4 text-white shadow-sm">
          <span className="text-2xl sm:text-3xl font-extrabold block">{count2027}</span>
          <span className="text-xs text-blue-100 font-semibold">Tahun 2027</span>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-500 dark:from-amber-700 dark:to-amber-600 rounded-2xl p-4 text-white shadow-sm">
          <span className="text-2xl sm:text-3xl font-extrabold block">{countBanjir}</span>
          <span className="text-xs text-amber-100 font-semibold">Titik Banjir</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-500 dark:from-emerald-700 dark:to-teal-600 rounded-2xl p-4 text-white shadow-sm">
          <span className="text-2xl sm:text-3xl font-extrabold block">{countCC}</span>
          <span className="text-xs text-emerald-100 font-semibold">Clean &amp; Clear</span>
        </div>
      </div>

      {/* TAB 1: PETA MONITORING */}
      <div className={activeTab === 'peta' ? 'bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors' : 'hidden'}>
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
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
            onChange={(e) => setFilterKab(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Kota / Kabupaten: Semua</option>
            {kabList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-auto">
            Menampilkan: <b className="text-slate-800 dark:text-slate-200">{filteredSurveys.length}</b> titik lokasi
          </span>
        </div>

        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="w-full h-[520px] rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden z-10"
        />

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          💡 Titik merah menandakan titik banjir / genangan. Klik marker untuk melihat info lengkap dan cuplikan foto.
        </p>
      </div>

      {/* TAB 2: MONITORING REPORT (TABLE) */}
      {activeTab === 'report' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No. ID Survey / ID Usulan / Petugas / Alamat..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onExport('excel', filteredSurveys)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => onExport('pdf', filteredSurveys)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => onExport('word', filteredSurveys)}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <FileCode className="w-4 h-4" />
                <span>Export Word</span>
              </button>
            </div>
          </div>

          {/* Table */}
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
                    <th className="py-3 px-3.5 font-bold text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900">
                  {filteredSurveys.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-slate-500">
                        Tidak ada data yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSurveys.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-2.5 px-3.5 text-slate-400 dark:text-slate-500 font-mono text-xs">{idx + 1}</td>
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-100">{s.tahun}</td>
                        <td className="py-2.5 px-3.5">
                          <button
                            onClick={() => onViewDetail(s)}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-left"
                          >
                            {s.surveyNo}
                          </button>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">{s.usulanNo}</td>
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
                          <button
                            onClick={() => onViewDetail(s)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                            title="Buka Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GRAFIK REPORT */}
      {activeTab === 'grafik' && (
        <MonitoringReportCharts surveys={filteredSurveys} onExport={onExport} />
      )}
    </div>
  );
};
