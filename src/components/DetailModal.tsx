import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { X, Pencil, Trash2, MapPin, Calendar, User, Phone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SurveyRecord } from '../types';

interface Props {
  survey: SurveyRecord | null;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (survey: SurveyRecord) => void;
  onDelete: (id: string) => void;
  onOpenLightbox: (src: string) => void;
}

export const DetailModal: React.FC<Props> = ({
  survey,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onOpenLightbox
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!survey || !mapContainerRef.current) return;

    const parse = (c: string) => {
      if (!c) return null;
      const p = c.split(',').map((x) => parseFloat(x.trim()));
      if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) {
        return L.latLng(p[0], p[1]);
      }
      return null;
    };

    const pAwal = parse(survey.koorAwal);
    const pTengah = parse(survey.koorTengah || '');
    const pAkhir = parse(survey.koorAkhir);
    const points = [pAwal, pTengah, pAkhir].filter(Boolean) as L.LatLng[];

    const timer = setTimeout(() => {
      if (mapContainerRef.current) {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        if ((mapContainerRef.current as any)._leaflet_id) {
          delete (mapContainerRef.current as any)._leaflet_id;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(points[0] || [-2.9909, 104.7565], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        if (pAwal) L.marker(pAwal).addTo(map).bindPopup('Titik Awal');
        if (pTengah) L.marker(pTengah).addTo(map).bindPopup('Titik Tengah');
        if (pAkhir) L.marker(pAkhir).addTo(map).bindPopup('Titik Akhir');

        if (points.length >= 2) {
          L.polyline(points, {
            color: survey.banjir === 'Banjir' ? '#dc2626' : '#0b5fff',
            weight: 4
          }).addTo(map);
          map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
        }

        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 150);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [survey]);

  if (!survey) return null;

  const isBanjir = survey.banjir === 'Banjir';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-blue-100 dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 my-auto transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-sky-600 dark:from-slate-800 dark:via-blue-950 dark:to-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
              Rincian Survei
            </span>
            <h3 className="text-lg sm:text-xl font-black mt-0.5">{survey.surveyNo}</h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          {/* Status & Identitas Grid */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span> Identitas Survei
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Tahun</span>
                <strong className="text-slate-800 dark:text-slate-100 font-bold">{survey.tahun}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">No. ID Usulan</span>
                <strong className="text-slate-800 dark:text-slate-100 font-bold">{survey.usulanNo}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Petugas Surveyor</span>
                <strong className="text-slate-800 dark:text-slate-100 font-bold">{survey.petugas}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Status Kelayakan</span>
                <strong
                  className={`font-bold ${
                    survey.status?.includes('Clean & Clear') && !survey.status?.includes('Belum')
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {survey.status || '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* Informasi Lokasi */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>📍</span> Informasi Lokasi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Alamat</span>
                <strong className="text-slate-800 dark:text-slate-100">{survey.alamat}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">RT / RW</span>
                <strong className="text-slate-800 dark:text-slate-100">{survey.rt}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Kota / Kabupaten</span>
                <strong className="text-slate-800 dark:text-slate-100">{survey.kabkota}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Kecamatan / Kelurahan</span>
                <strong className="text-slate-800 dark:text-slate-100">
                  {survey.kecamatan} &bull; {survey.kelurahan}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Pejabat Setempat</span>
                <strong className="text-slate-800 dark:text-slate-100">{survey.namaPejabat}</strong>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Contact Person HP</span>
                <strong className="text-slate-800 dark:text-slate-100">{survey.hp}</strong>
              </div>
            </div>
          </div>

          {/* Kondisi Banjir & Kerugian */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🌊</span> Kondisi Banjir &amp; Kerugian
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Status Banjir</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    isBanjir
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                  }`}
                >
                  {survey.banjir}
                </span>
              </div>
              {isBanjir && (
                <>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Tinggi Genangan</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.tinggi ? `${survey.tinggi} cm` : '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Lama Genangan</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.lama ? `${survey.lama} jam` : '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Luas Genangan</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.luas || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Frekuensi / Tahun</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.frekuensi ? `${survey.frekuensi} kali` : '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Kerugian Ekonomi</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.eko || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Fasilitas Sosial</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.fasos || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Transportasi</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.trans || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 text-xs block">Permukiman</span>
                    <strong className="text-slate-800 dark:text-slate-100">{survey.mukim || '-'}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Kondisi Saluran */}
          {(survey.sedimen || survey.sampah) && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                Kondisi Saluran Saat Ini
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Sedimentasi</span>
                  <strong className="text-slate-800 dark:text-slate-100">{survey.sedimen || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Sampah</span>
                  <strong className="text-slate-800 dark:text-slate-100">{survey.sampah || '-'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Koordinat & Mini Peta */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🗺️</span> Titik Koordinat
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Titik Awal (A)</span>
                <code className="text-blue-700 dark:text-blue-400 font-bold text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded block">{survey.koorAwal}</code>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Titik Tengah (B)</span>
                <code className="text-blue-700 dark:text-blue-400 font-bold text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded block">{survey.koorTengah || '-'}</code>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">Titik Akhir (C)</span>
                <code className="text-blue-700 dark:text-blue-400 font-bold text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded block">{survey.koorAkhir}</code>
              </div>
            </div>

            {/* Mini Map */}
            <div
              ref={mapContainerRef}
              className="w-full h-44 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            />
          </div>

          {/* Foto Dokumentasi */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center justify-between">
              <span>📸 Foto Dokumentasi ({survey.photos?.length || 0})</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">Klik untuk perbesar</span>
            </h4>

            {survey.photos && survey.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {survey.photos.map((src, i) => (
                  <div
                    key={i}
                    onClick={() => onOpenLightbox(src)}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:scale-105 transition-transform bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={src} alt={`Dokumentasi ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">Tidak ada foto dokumentasi terlampir</p>
            )}
          </div>

          {/* Usulan & Deskripsi Lokasi */}
          {survey.uraian && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                Usulan Teknis &amp; Deskripsi Lokasi
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {survey.uraian}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 dark:bg-slate-900/90 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 shrink-0">
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  onEdit(survey);
                  onClose();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Hapus data survei ${survey.surveyNo}?`)) {
                    onDelete(survey.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data</span>
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
