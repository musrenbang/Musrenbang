import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Camera,
  Upload,
  Trash2,
  Navigation,
  Compass,
  CheckCircle,
  XCircle,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { SurveyRecord } from '../types';
import { WILAYAH_SUMSEL, getKabKotaList, getKecamatanList, getKelurahanList } from '../data/wilayahSumsel';
import { processPhotoWithWatermark, getWindDirection } from '../utils/watermark';

interface Props {
  editRecord: SurveyRecord | null;
  allSurveys: SurveyRecord[];
  onSave: (survey: SurveyRecord) => Promise<void>;
  onCancelEdit: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenLightbox: (src: string) => void;
}

export const SurveyForm: React.FC<Props> = ({
  editRecord,
  allSurveys,
  onSave,
  onCancelEdit,
  onShowToast,
  onOpenLightbox
}) => {
  // Form Fields
  const [tahun, setTahun] = useState('2027');
  const [surveyNo, setSurveyNo] = useState('');
  const [usulanNo, setUsulanNo] = useState('');
  const [petugas, setPetugas] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rt, setRt] = useState('');
  const [prov] = useState('Sumatera Selatan');
  const [kabkotaId, setKabkotaId] = useState('');
  const [kecamatanId, setKecamatanId] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [manualKelurahan, setManualKelurahan] = useState('');
  const [namaPejabat, setNamaPejabat] = useState('');
  const [hp, setHp] = useState('');

  // Flood details
  const [banjir, setBanjir] = useState<'Banjir' | 'Tidak Banjir'>('Tidak Banjir');
  const [tinggi, setTinggi] = useState('');
  const [lama, setLama] = useState('');
  const [luas, setLuas] = useState('');
  const [frekuensi, setFrekuensi] = useState('');
  const [eko, setEko] = useState('');
  const [fasos, setFasos] = useState('');
  const [trans, setTrans] = useState('');
  const [mukim, setMukim] = useState('');
  const [hak, setHak] = useState('');

  // Canal condition
  const [sedimen, setSedimen] = useState('');
  const [sampah, setSampah] = useState('');

  // Coordinates
  const [koorAwal, setKoorAwal] = useState('');
  const [koorTengah, setKoorTengah] = useState('');
  const [koorAkhir, setKoorAkhir] = useState('');
  const [activePoint, setActivePoint] = useState<'awal' | 'tengah' | 'akhir'>('awal');
  const activePointRef = useRef<'awal' | 'tengah' | 'akhir'>('awal');

  useEffect(() => {
    activePointRef.current = activePoint;
  }, [activePoint]);

  // GPS & Compass telemetry
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [compassDeg, setCompassDeg] = useState<number | null>(null);
  const [compassDir, setCompassDir] = useState<string>('');

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoSources, setPhotoSources] = useState<('camera' | 'upload' | 'archive')[]>([]);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<{ done: number; total: number } | null>(null);

  // Description & Status
  const [uraian, setUraian] = useState('');
  const [status, setStatus] = useState<string>('Belum Clean & Clear');

  // Errors map
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ awal?: L.Marker; tengah?: L.Marker; akhir?: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  // File input refs
  const camInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate data when editing
  useEffect(() => {
    if (editRecord) {
      setTahun(editRecord.tahun || '2027');
      setSurveyNo(editRecord.surveyNo || '');
      setUsulanNo(editRecord.usulanNo || '');
      setPetugas(editRecord.petugas || '');
      setAlamat(editRecord.alamat || '');
      setRt(editRecord.rt || '');
      setKabkotaId(editRecord.kabkotaId || '');
      setKecamatanId(editRecord.kecamatanId || '');
      setKelurahan(editRecord.kelurahan || '');
      setNamaPejabat(editRecord.namaPejabat || '');
      setHp(editRecord.hp || '');
      setBanjir((editRecord.banjir as any) || 'Tidak Banjir');
      setTinggi(editRecord.tinggi || '');
      setLama(editRecord.lama || '');
      setLuas(editRecord.luas || '');
      setFrekuensi(editRecord.frekuensi || '');
      setEko(editRecord.eko || '');
      setFasos(editRecord.fasos || '');
      setTrans(editRecord.trans || '');
      setMukim(editRecord.mukim || '');
      setHak(editRecord.hak || '');
      setSedimen(editRecord.sedimen || '');
      setSampah(editRecord.sampah || '');
      setKoorAwal(editRecord.koorAwal || '');
      setKoorTengah(editRecord.koorTengah || '');
      setKoorAkhir(editRecord.koorAkhir || '');
      setPhotos(editRecord.photos || []);
      setPhotoSources((editRecord.photos || []).map(() => 'archive'));
      setUraian(editRecord.uraian || '');
      setStatus(editRecord.status || 'Belum Clean & Clear');
    } else {
      resetForm();
    }
  }, [editRecord]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Sumatera Selatan Geofence Bounds
      const sumselBounds = L.latLngBounds([-6.0, 101.5], [-1.0, 106.7]);

      const map = L.map(mapContainerRef.current, {
        maxBounds: sumselBounds,
        maxBoundsViscosity: 0.9,
        minZoom: 7
      }).setView([-2.9909, 104.7565], 11);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', (e) => {
        const coordStr = `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`;
        const currentActive = activePointRef.current;
        if (currentActive === 'awal') {
          setKoorAwal(coordStr);
          setActivePoint('tengah');
          onShowToast(`Titik Awal diset: ${coordStr}. Lanjut ke Titik Tengah/Akhir.`, 'info');
        } else if (currentActive === 'tengah') {
          setKoorTengah(coordStr);
          setActivePoint('akhir');
          onShowToast(`Titik Tengah diset: ${coordStr}. Lanjut ke Titik Akhir.`, 'info');
        } else {
          setKoorAkhir(coordStr);
          onShowToast(`Titik Akhir diset: ${coordStr}`, 'info');
        }
      });

      mapRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update map markers whenever coordinates or active point changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const parse = (c: string) => {
      if (!c) return null;
      const parts = c.split(',').map((x) => parseFloat(x.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return L.latLng(parts[0], parts[1]);
      }
      return null;
    };

    const pAwal = parse(koorAwal);
    const pTengah = parse(koorTengah);
    const pAkhir = parse(koorAkhir);

    // Update marker Awal
    if (markersRef.current.awal) map.removeLayer(markersRef.current.awal);
    if (pAwal) {
      markersRef.current.awal = L.marker(pAwal, {
        title: 'Titik Awal'
      }).addTo(map).bindPopup('<b>A • Titik Awal</b><br>' + koorAwal);
    }

    // Update marker Tengah
    if (markersRef.current.tengah) map.removeLayer(markersRef.current.tengah);
    if (pTengah) {
      markersRef.current.tengah = L.marker(pTengah, {
        title: 'Titik Tengah'
      }).addTo(map).bindPopup('<b>B • Titik Tengah</b><br>' + koorTengah);
    }

    // Update marker Akhir
    if (markersRef.current.akhir) map.removeLayer(markersRef.current.akhir);
    if (pAkhir) {
      markersRef.current.akhir = L.marker(pAkhir, {
        title: 'Titik Akhir'
      }).addTo(map).bindPopup('<b>C • Titik Akhir</b><br>' + koorAkhir);
    }

    // Update Polyline
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    const linePoints: L.LatLng[] = [pAwal, pTengah, pAkhir].filter(Boolean) as L.LatLng[];
    if (linePoints.length >= 2) {
      polylineRef.current = L.polyline(linePoints, {
        color: banjir === 'Banjir' ? '#dc2626' : '#0b5fff',
        weight: 4,
        dashArray: banjir === 'Banjir' ? '6, 6' : undefined
      }).addTo(map);

      map.fitBounds(L.latLngBounds(linePoints), { padding: [40, 40], maxZoom: 15 });
    } else if (linePoints.length === 1) {
      map.setView(linePoints[0], 14);
    }
  }, [koorAwal, koorTengah, koorAkhir, banjir]);

  // Compass listener setup
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;
      if (typeof (e as any).webkitCompassHeading === 'number') {
        heading = (e as any).webkitCompassHeading;
      } else if (typeof e.alpha === 'number') {
        heading = (360 - e.alpha + 360) % 360;
      }
      if (heading != null) {
        setCompassDeg(Math.round(heading));
        setCompassDir(getWindDirection(heading));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const resetForm = () => {
    setTahun('2027');
    setSurveyNo('');
    setUsulanNo('');
    setPetugas('');
    setAlamat('');
    setRt('');
    setKabkotaId('');
    setKecamatanId('');
    setKelurahan('');
    setManualKelurahan('');
    setNamaPejabat('');
    setHp('');
    setBanjir('Tidak Banjir');
    setTinggi('');
    setLama('');
    setLuas('');
    setFrekuensi('');
    setEko('');
    setFasos('');
    setTrans('');
    setMukim('');
    setHak('');
    setSedimen('');
    setSampah('');
    setKoorAwal('');
    setKoorTengah('');
    setKoorAkhir('');
    setActivePoint('awal');
    setPhotos([]);
    setPhotoSources([]);
    setUraian('');
    setStatus('Belum Clean & Clear');
    setErrors({});
  };

  // GPS "Lokasi Saya"
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      onShowToast('Browser tidak mendukung GPS', 'error');
      return;
    }

    onShowToast('Mengambil koordinat GPS presisi...', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const coord = `${lat},${lng}`;
        const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : null;
        setGpsAccuracy(acc);

        if (activePoint === 'awal') {
          setKoorAwal(coord);
          setActivePoint('tengah');
          onShowToast(`Titik Awal tersimpan: ${coord} (Akurasi: ±${acc}m). Lanjut ke Titik Tengah.`, 'success');
        } else if (activePoint === 'tengah') {
          setKoorTengah(coord);
          setActivePoint('akhir');
          onShowToast(`Titik Tengah tersimpan: ${coord}. Lanjut ke Titik Akhir.`, 'success');
        } else {
          setKoorAkhir(coord);
          onShowToast(`Titik Akhir tersimpan: ${coord}.`, 'success');
        }
      },
      (err) => {
        let msg = 'Gagal mengambil GPS.';
        if (err.code === 1) msg = 'Izin lokasi GPS ditolak oleh pengguna.';
        else if (err.code === 2) msg = 'Sinyal GPS tidak ditemukan. Silakan klik peta.';
        onShowToast(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Photo handlers (Camera, File picker, Drag & Drop)
  const handlePhotoFiles = async (files: FileList | null, source: 'camera' | 'upload') => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const remainingSlots = 50 - photos.length;
    if (remainingSlots <= 0) {
      onShowToast('Batas maksimal 50 foto telah tercapai!', 'error');
      return;
    }

    const batch = fileArray.slice(0, remainingSlots);
    setIsProcessingPhoto(true);
    setPhotoProgress({ done: 0, total: batch.length });

    const selectedKab = WILAYAH_SUMSEL.find((k) => k.id === kabkotaId);
    const selectedKec = selectedKab?.kecamatan.find((c) => c.id === kecamatanId);
    const finalKel = kelurahan === '__manual__' ? manualKelurahan : kelurahan;

    const currentGps = koorAwal || (koorAkhir ? koorAkhir : '-');

    const newProcessedPhotos: string[] = [];
    const newSources: ('camera' | 'upload')[] = [];

    for (let i = 0; i < batch.length; i++) {
      try {
        const dataUrl = await processPhotoWithWatermark(batch[i], {
          source,
          gps: currentGps,
          accuracy: gpsAccuracy,
          compassDeg,
          compassDirection: compassDir,
          kecamatan: selectedKec?.name || '-',
          kelurahan: finalKel || '-',
          surveyNo: surveyNo || '-',
          usulanNo: usulanNo || '-'
        });
        newProcessedPhotos.push(dataUrl);
        newSources.push(source);
      } catch (err) {
        console.error('Photo processing failed', err);
      }
      setPhotoProgress({ done: i + 1, total: batch.length });
    }

    setPhotos((prev) => [...prev, ...newProcessedPhotos]);
    setPhotoSources((prev) => [...prev, ...newSources]);
    setIsProcessingPhoto(false);
    setPhotoProgress(null);

    if (newProcessedPhotos.length > 0) {
      onShowToast(
        `${newProcessedPhotos.length} foto berhasil dibakar geotag watermark & dikompres (<400KB).`,
        'success'
      );
    }
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoSources((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErr: { [key: string]: boolean } = {};

    if (!tahun) newErr.tahun = true;
    if (!surveyNo.trim()) newErr.surveyNo = true;
    if (!usulanNo.trim()) newErr.usulanNo = true;
    if (!petugas.trim()) newErr.petugas = true;
    if (!alamat.trim()) newErr.alamat = true;
    if (!rt.trim()) newErr.rt = true;
    if (!kabkotaId) newErr.kabkotaId = true;
    if (!kecamatanId) newErr.kecamatanId = true;

    const finalKel = kelurahan === '__manual__' ? manualKelurahan : kelurahan;
    if (!finalKel || !finalKel.trim()) newErr.kelurahan = true;

    if (!namaPejabat.trim()) newErr.namaPejabat = true;
    if (!hp.trim()) newErr.hp = true;

    // Check duplicate surveyNo
    const dup = allSurveys.find(
      (s) =>
        s.surveyNo &&
        s.surveyNo.toLowerCase() === surveyNo.trim().toLowerCase() &&
        s.id !== editRecord?.id
    );
    if (dup) {
      onShowToast(`No. ID Survey "${surveyNo}" sudah terdaftar pada data lain!`, 'error');
      newErr.surveyNo = true;
    }

    // Flood specific validations
    if (banjir === 'Banjir') {
      if (!eko) newErr.eko = true;
      if (!fasos) newErr.fasos = true;
      if (!trans) newErr.trans = true;
      if (!mukim) newErr.mukim = true;
    }

    // Coordinates check (Awal & Akhir wajib)
    const validCoord = (c: string) => {
      const p = c.split(',').map((x) => parseFloat(x.trim()));
      return p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]);
    };
    if (!validCoord(koorAwal) || !validCoord(koorAkhir)) {
      newErr.koor = true;
    }

    // Photos check (min 2)
    if (photos.length < 2) {
      newErr.photos = true;
    }

    setErrors(newErr);

    if (Object.keys(newErr).length > 0) {
      onShowToast('Masih ada kolom wajib yang belum lengkap. Mohon periksa kembali form.', 'error');
      // Scroll to first error
      const firstErrorEl = document.querySelector('.border-rose-500, .text-rose-600');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    const selectedKab = WILAYAH_SUMSEL.find((k) => k.id === kabkotaId);
    const selectedKec = selectedKab?.kecamatan.find((c) => c.id === kecamatanId);

    const record: SurveyRecord = {
      id: editRecord?.id || `SRV_${Date.now()}`,
      tahun,
      surveyNo: surveyNo.trim(),
      usulanNo: usulanNo.trim(),
      petugas: petugas.trim(),
      alamat: alamat.trim(),
      rt: rt.trim(),
      prov,
      kabkotaId,
      kabkota: selectedKab?.name || kabkotaId,
      kecamatanId,
      kecamatan: selectedKec?.name || kecamatanId,
      kelurahan: finalKel.trim(),
      namaPejabat: namaPejabat.trim(),
      hp: hp.trim(),
      banjir,
      tinggi,
      lama,
      luas,
      frekuensi,
      eko,
      fasos,
      trans,
      mukim,
      hak,
      sedimen,
      sampah,
      koorAwal: koorAwal.trim(),
      koorTengah: koorTengah.trim(),
      koorAkhir: koorAkhir.trim(),
      photos,
      uraian: uraian.trim(),
      status,
      createdBy: editRecord?.createdBy || 'admin',
      createdAt: editRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onSave(record);
      resetForm();
    } catch {
      onShowToast('Gagal menyimpan data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kabList = getKabKotaList();
  const kecList = kabkotaId ? getKecamatanList(kabkotaId) : [];
  const kelList = kabkotaId && kecamatanId ? getKelurahanList(kabkotaId, kecamatanId) : [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          {editRecord ? `Edit Data Survey — ${editRecord.surveyNo}` : 'New Data Survey'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Lengkapi seluruh seksi database survei. Kolom dengan tanda <span className="text-rose-500 font-bold">*</span> wajib diisi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SEKSI 1: TAHUN SURVEY */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>1. Tahun Survey</span>
            <span className="text-xs font-normal text-rose-500">*wajib</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tahun <span className="text-rose-500">*</span>
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.tahun ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* SEKSI 2: ID SURVEY */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>2. ID Survey &amp; Surveyor</span>
            <span className="text-xs font-normal text-rose-500">*wajib</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                a. No. ID Survey <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={surveyNo}
                onChange={(e) => setSurveyNo(e.target.value)}
                placeholder="Contoh: SRV-2027-001"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.surveyNo ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.surveyNo && <p className="text-[11px] text-rose-500 mt-1">Wajib diisi &amp; harus unik</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                b. No. ID Usulan Survey <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={usulanNo}
                onChange={(e) => setUsulanNo(e.target.value)}
                placeholder="Contoh: USL-2027-001"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.usulanNo ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.usulanNo && <p className="text-[11px] text-rose-500 mt-1">Wajib diisi</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                c. Petugas Surveyor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                placeholder="Nama lengkap surveyor"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.petugas ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.petugas && <p className="text-[11px] text-rose-500 mt-1">Wajib diisi</p>}
            </div>
          </div>
        </section>

        {/* SEKSI 3: INFORMASI LOKASI */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>3. Informasi Lokasi</span>
            <span className="text-xs font-normal text-rose-500">*wajib</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                a. Alamat / Lokasi Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Nama jalan / gang / patokan lokasi..."
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.alamat ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                b. RT / RW <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                placeholder="Contoh: RT 05 / RW 02"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.rt ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                c. Provinsi <span className="text-slate-400 dark:text-slate-500 font-normal">(terkunci)</span>
              </label>
              <input
                type="text"
                value={prov}
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                d. Kota / Kabupaten <span className="text-rose-500">*</span>
              </label>
              <select
                value={kabkotaId}
                onChange={(e) => {
                  setKabkotaId(e.target.value);
                  setKecamatanId('');
                  setKelurahan('');
                }}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.kabkotaId ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">-- Pilih Kota / Kab --</option>
                {kabList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                e. Kecamatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={kecamatanId}
                disabled={!kabkotaId}
                onChange={(e) => {
                  setKecamatanId(e.target.value);
                  setKelurahan('');
                }}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60 ${
                  errors.kecamatanId ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">-- Pilih Kecamatan --</option>
                {kecList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                f. Kelurahan / Desa <span className="text-rose-500">*</span>
              </label>
              <select
                value={kelurahan}
                disabled={!kecamatanId}
                onChange={(e) => setKelurahan(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60 ${
                  errors.kelurahan ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">-- Pilih Kelurahan --</option>
                {kelList.map((kel) => (
                  <option key={kel} value={kel}>
                    {kel}
                  </option>
                ))}
                <option value="__manual__">+ Ketik manual kelurahan...</option>
              </select>

              {kelurahan === '__manual__' && (
                <input
                  type="text"
                  value={manualKelurahan}
                  onChange={(e) => setManualKelurahan(e.target.value)}
                  placeholder="Ketik nama kelurahan..."
                  className="mt-2 w-full px-3 py-1.5 border border-blue-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                g. Nama RT / RW / Lurah / Camat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={namaPejabat}
                onChange={(e) => setNamaPejabat(e.target.value)}
                placeholder="Nama pejabat / tokoh setempat"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.namaPejabat ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                h. Contact Person (HP / WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.hp ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          </div>
        </section>

        {/* SEKSI 4: BANJIR / TIDAK BANJIR */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>4. Status Banjir &amp; Kerugian</span>
            <span className="text-xs font-normal text-rose-500">*wajib</span>
          </h3>

          <div className="flex gap-4">
            <label
              className={`flex-1 p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold transition-all ${
                banjir === 'Tidak Banjir'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="banjir"
                value="Tidak Banjir"
                checked={banjir === 'Tidak Banjir'}
                onChange={() => setBanjir('Tidak Banjir')}
                className="hidden"
              />
              <CheckCircle className={`w-4 h-4 ${banjir === 'Tidak Banjir' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Tidak Banjir</span>
            </label>

            <label
              className={`flex-1 p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold transition-all ${
                banjir === 'Banjir'
                  ? 'border-rose-600 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="banjir"
                value="Banjir"
                checked={banjir === 'Banjir'}
                onChange={() => setBanjir('Banjir')}
                className="hidden"
              />
              <XCircle className={`w-4 h-4 ${banjir === 'Banjir' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Banjir / Ada Genangan</span>
            </label>
          </div>

          {/* Conditional Flood Section */}
          {banjir === 'Banjir' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 dark:border-amber-800/60 space-y-5 animate-in fade-in duration-200">
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-2.5">
                  a. Data Genangan <span className="font-normal text-slate-500 dark:text-slate-400">(opsional)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Tinggi (cm)</label>
                    <input
                      type="text"
                      value={tinggi}
                      onChange={(e) => setTinggi(e.target.value)}
                      placeholder="... cm"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Lama (jam)</label>
                    <input
                      type="text"
                      value={lama}
                      onChange={(e) => setLama(e.target.value)}
                      placeholder="... jam"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Luas (m² / Ha)</label>
                    <input
                      type="text"
                      value={luas}
                      onChange={(e) => setLuas(e.target.value)}
                      placeholder="... m² / Ha"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Frekuensi / Tahun</label>
                    <input
                      type="text"
                      value={frekuensi}
                      onChange={(e) => setFrekuensi(e.target.value)}
                      placeholder="... kali"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-3">
                  b. Kerugian Jika Banjir <span className="text-rose-600 dark:text-rose-400 font-bold">*wajib diisi saat banjir</span>
                </h4>

                <div className="space-y-4">
                  {/* Ekonomi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      • Sektor Ekonomi <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        'Industri, Komersil, Perkantoran padat',
                        'Industri, Komersil, Perkantoran kurang padat',
                        'Kawasan Perumahan',
                        'Kawasan Tidak Produktif'
                      ].map((item) => (
                        <label
                          key={item}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            eko === item
                              ? 'border-amber-600 dark:border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input type="radio" name="eko" value={item} checked={eko === item} onChange={() => setEko(item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    {errors.eko && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Wajib dipilih saat status banjir</p>}
                  </div>

                  {/* Fasos */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      • Fasilitas Sosial &amp; Pemerintahan <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {['Padat', 'Sedikit / Kurang padat', 'Terbatas / Beberapa', 'Tidak terdapat'].map((item) => (
                        <label
                          key={item}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            fasos === item
                              ? 'border-amber-600 dark:border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input type="radio" name="fasos" value={item} checked={fasos === item} onChange={() => setFasos(item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    {errors.fasos && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Wajib dipilih saat status banjir</p>}
                  </div>

                  {/* Transportasi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      • Transportasi <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {['Padat', 'Sedikit / Kurang padat', 'Terbatas / Beberapa', 'Tidak terdapat'].map((item) => (
                        <label
                          key={item}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            trans === item
                              ? 'border-amber-600 dark:border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input type="radio" name="trans" value={item} checked={trans === item} onChange={() => setTrans(item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    {errors.trans && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Wajib dipilih saat status banjir</p>}
                  </div>

                  {/* Permukiman */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      • Permukiman <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {['Padat', 'Sedikit / Kurang padat', 'Terbatas / Beberapa', 'Tidak terdapat'].map((item) => (
                        <label
                          key={item}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            mukim === item
                              ? 'border-amber-600 dark:border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input type="radio" name="mukim" value={item} checked={mukim === item} onChange={() => setMukim(item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                    {errors.mukim && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Wajib dipilih saat status banjir</p>}
                  </div>

                  {/* Hak Milik */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      • Hak Milik <span className="text-slate-400 dark:text-slate-500 font-normal">(opsional)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {['> 80%', '80%', '< 40%', 'Tidak ada'].map((item) => (
                        <label
                          key={item}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            hak === item
                              ? 'border-amber-600 dark:border-amber-500 bg-amber-100/70 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input type="radio" name="hak" value={item} checked={hak === item} onChange={() => setHak(item)} />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SEKSI 5: KONDISI SALURAN */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>5. Kondisi Saluran Saat Ini</span>
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">opsional</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">a. Sedimentasi</label>
              <input
                type="text"
                value={sedimen}
                onChange={(e) => setSedimen(e.target.value)}
                placeholder="Contoh: Sedang (±30cm) / Penuh lumpur..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">b. Sampah</label>
              <input
                type="text"
                value={sampah}
                onChange={(e) => setSampah(e.target.value)}
                placeholder="Contoh: Banyak sampah rumah tangga / Eceng gondok..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </section>

        {/* SEKSI 6: KOORDINAT & MAPS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">
              6. Koordinat &amp; Peta (Geo Location)
            </h3>
            <span className="text-xs font-bold text-rose-500">*wajib min. 2 titik (Awal &amp; Akhir)</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Pilih tombol titik aktif di bawah, lalu <b>klik langsung pada peta</b> atau gunakan tombol{' '}
            <b>Lokasi Saya (GPS)</b>. Format koordinat: <code>latitude,longitude</code> (contoh: <code>-2.9834,104.7328</code>).
          </p>

          {/* Active Point Selector & GPS trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePoint('awal')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                activePoint === 'awal'
                  ? 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              📍 Titik Awal
            </button>

            <button
              type="button"
              onClick={() => setActivePoint('tengah')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                activePoint === 'tengah'
                  ? 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              📍 Titik Tengah (opsional)
            </button>

            <button
              type="button"
              onClick={() => setActivePoint('akhir')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                activePoint === 'akhir'
                  ? 'bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              📍 Titik Akhir
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Lokasi Saya (GPS)</span>
            </button>
          </div>

          {/* Real-time Telemetry Banner */}
          <div className="bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-sky-900 dark:text-sky-300 rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>
                Akurasi GPS:{' '}
                <b>{gpsAccuracy != null ? `± ${gpsAccuracy} meter` : '-'}</b>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>
                Arah Kompas:{' '}
                <b>
                  {compassDeg != null
                    ? `${compassDeg}° (${compassDir || getWindDirection(compassDeg)})`
                    : '-'}
                </b>
              </span>
            </div>
          </div>

          {/* Text input coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Titik Awal (lat,lng) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={koorAwal}
                onChange={(e) => setKoorAwal(e.target.value)}
                placeholder="-2.9834,104.7328"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.koor && !koorAwal ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Titik Tengah (opsional)
              </label>
              <input
                type="text"
                value={koorTengah}
                onChange={(e) => setKoorTengah(e.target.value)}
                placeholder="-2.9851,104.7352"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Titik Akhir (lat,lng) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={koorAkhir}
                onChange={(e) => setKoorAkhir(e.target.value)}
                placeholder="-2.9872,104.7379"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.koor && !koorAkhir ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          </div>

          {errors.koor && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Wajib mengisi minimal Titik Awal dan Titik Akhir dengan format koordinat yang valid.
            </p>
          )}

          {/* Interactive Leaflet Map */}
          <div
            ref={mapContainerRef}
            className="w-full h-80 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden z-10"
          />
        </section>

        {/* SEKSI 7: FOTO DOKUMENTASI & WATERMARK */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">
              7. Foto Dokumentasi (Geotag Watermark Permanen)
            </h3>
            <span className="text-xs font-bold text-rose-500">
              *wajib min. 2 foto, maks. 50 ({photos.length}/50)
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Setiap foto akan <b>otomatis dibakar watermark 5 baris</b> (Waktu, GPS, Akurasi, Kompas, Kecamatan/Kelurahan, No. ID Survey, ID Usulan) dan <b>dikompres otomatis &lt;400KB</b> langsung di browser.
          </p>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handlePhotoFiles(e.dataTransfer.files, 'upload');
            }}
            className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
              errors.photos && photos.length < 2
                ? 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
                : 'border-blue-300 dark:border-slate-700 bg-blue-50/40 dark:bg-slate-800/50 hover:bg-blue-50/70 dark:hover:bg-slate-800'
            }`}
          >
            <div className="w-14 h-14 mx-auto mb-3 bg-blue-600 dark:bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Camera className="w-7 h-7" />
            </div>

            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Ambil atau Unggah Foto Survei</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              JPG / PNG &bull; Seret &amp; letakkan file foto di sini atau gunakan tombol:
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => camInputRef.current?.click()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Kamera Langsung</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Galeri / File</span>
              </button>

              <input
                ref={camInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => handlePhotoFiles(e.target.files, 'camera')}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handlePhotoFiles(e.target.files, 'upload')}
              />
            </div>

            {/* Processing Progress Bar */}
            {isProcessingPhoto && photoProgress && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.round((photoProgress.done / photoProgress.total) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold mt-1">
                  Membakar watermark &amp; mengompres: {photoProgress.done}/{photoProgress.total} foto...
                </p>
              </div>
            )}
          </div>

          {errors.photos && photos.length < 2 && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              Wajib melampirkan minimal 2 foto dokumentasi.
            </p>
          )}

          {/* Photos Preview Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              {photos.map((src, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800 shadow-sm"
                >
                  <img
                    src={src}
                    alt={`Foto ${idx + 1}`}
                    onClick={() => onOpenLightbox(src)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  />

                  {/* Source Badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                    #{idx + 1}
                  </span>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center hover:bg-rose-700 transition-colors shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenLightbox(src)}
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEKSI 8: USULAN & DESKRIPSI LOKASI */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>8. Usulan &amp; Deskripsi Lokasi</span>
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">maks. 10.000 karakter</span>
          </h3>

          <div>
            <textarea
              value={uraian}
              onChange={(e) => setUraian(e.target.value)}
              maxLength={10000}
              rows={4}
              placeholder="Tuliskan uraian usulan teknis, justifikasi kebutuhan, atau keterangan survei lapangan..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {uraian.length.toLocaleString()} / 10.000 karakter
            </div>
          </div>
        </section>

        {/* SEKSI 9: STATUS */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50/80 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border-l-4 border-blue-600 dark:border-blue-500 flex items-center justify-between">
            <span>9. Status Kelayakan (Clean &amp; Clear)</span>
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">opsional</span>
          </h3>

          <div className="flex gap-4">
            <label
              className={`flex-1 p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold transition-all ${
                status === 'Clean & Clear'
                  ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="status"
                value="Clean & Clear"
                checked={status === 'Clean & Clear'}
                onChange={() => setStatus('Clean & Clear')}
                className="hidden"
              />
              <CheckCircle className={`w-4 h-4 ${status === 'Clean & Clear' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Clean &amp; Clear</span>
            </label>

            <label
              className={`flex-1 p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm font-bold transition-all ${
                status === 'Belum Clean & Clear'
                  ? 'border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="status"
                value="Belum Clean & Clear"
                checked={status === 'Belum Clean & Clear'}
                onChange={() => setStatus('Belum Clean & Clear')}
                className="hidden"
              />
              <XCircle className={`w-4 h-4 ${status === 'Belum Clean & Clear' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>Belum Clean &amp; Clear</span>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : editRecord ? 'Update Data Survey' : 'Save Data Survey'}</span>
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Form</span>
          </button>

          {editRecord && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-sm font-bold transition-colors"
            >
              Batal Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
