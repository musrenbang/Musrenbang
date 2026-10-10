import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// Initial seed surveys
const INITIAL_SURVEYS = [
  {
    id: 'SEED1',
    tahun: '2027',
    surveyNo: 'SRV-2027-001',
    usulanNo: 'USL-2027-001',
    petugas: 'Andi Pratama',
    alamat: 'Jl. Merdeka No. 45',
    rt: 'RT 05 / RW 02',
    prov: 'Sumatera Selatan',
    kabkotaId: '1671',
    kabkota: 'Kota Palembang',
    kecamatanId: '167101',
    kecamatan: 'Ilir Barat I',
    kelurahan: 'Bukit Lama',
    namaPejabat: 'H. Sulaiman (Lurah)',
    hp: '081278910001',
    banjir: 'Banjir',
    tinggi: '40',
    lama: '6',
    luas: '2 Ha',
    frekuensi: '4',
    eko: 'Kawasan Perumahan',
    fasos: 'Terbatas / Beberapa',
    trans: 'Sedikit / Kurang padat',
    mukim: 'Padat',
    hak: '80%',
    sedimen: 'Sedang (±30cm)',
    sampah: 'Banyak sampah rumah tangga',
    koorAwal: '-2.9834,104.7328',
    koorTengah: '-2.9851,104.7352',
    koorAkhir: '-2.9872,104.7379',
    photos: [],
    uraian: 'Usulan normalisasi saluran primer sepanjang ±500m di Jl. Merdeka Bukit Lama. Genangan air terjadi setiap musim hujan lebat, merendam ±120 KK. Diperlukan pengerukan sedimentasi, pemasangan turap beton, serta penambahan grill penangkap sampah.',
    status: 'Belum Clean & Clear',
    createdBy: 'admin',
    createdAt: '2026-10-08T08:00:00.000Z',
    updatedAt: '2026-10-08T08:00:00.000Z'
  },
  {
    id: 'SEED2',
    tahun: '2027',
    surveyNo: 'SRV-2027-002',
    usulanNo: 'USL-2027-002',
    petugas: 'Siti Rahma',
    alamat: 'Jl. Lintas Timur Km. 12',
    rt: 'RT 03 / RW 01',
    prov: 'Sumatera Selatan',
    kabkotaId: '1607',
    kabkota: 'Kabupaten Banyuasin',
    kecamatanId: '160701',
    kecamatan: 'Talang Kelapa',
    kelurahan: 'Sukomoro',
    namaPejabat: 'Budi Santoso (Kades)',
    hp: '081278910002',
    banjir: 'Tidak Banjir',
    tinggi: '',
    lama: '',
    luas: '',
    frekuensi: '',
    eko: '',
    fasos: '',
    trans: '',
    mukim: '',
    hak: '',
    sedimen: 'Ringan',
    sampah: 'Sedikit',
    koorAwal: '-2.9995,104.7120',
    koorTengah: '-3.0018,104.7154',
    koorAkhir: '-3.0042,104.7188',
    photos: [],
    uraian: 'Usulan pembangunan drainase baru di kawasan permukiman Sukomoro sepanjang 800m untuk antisipasi perluasan kawasan perumahan baru dan memperlancar pembuangan air ke sungai penerima.',
    status: 'Clean & Clear',
    createdBy: 'admin',
    createdAt: '2026-10-08T09:30:00.000Z',
    updatedAt: '2026-10-08T09:30:00.000Z'
  },
  {
    id: 'SEED3',
    tahun: '2026',
    surveyNo: 'SRV-2026-015',
    usulanNo: 'USL-2026-015',
    petugas: 'Andi Pratama',
    alamat: 'Jl. Raya Indralaya Km. 32',
    rt: 'RT 08 / RW 03',
    prov: 'Sumatera Selatan',
    kabkotaId: '1610',
    kabkota: 'Kabupaten Ogan Ilir',
    kecamatanId: '161001',
    kecamatan: 'Indralaya',
    kelurahan: 'Tanjung Sejaro',
    namaPejabat: 'Drs. Herman (Camat)',
    hp: '081278910003',
    banjir: 'Banjir',
    tinggi: '60',
    lama: '12',
    luas: '5 Ha',
    frekuensi: '6',
    eko: 'Industri, Komersil, Perkantoran kurang padat',
    fasos: 'Padat',
    trans: 'Padat',
    mukim: 'Sedikit / Kurang padat',
    hak: '> 80%',
    sedimen: 'Berat (±80cm)',
    sampah: 'Banyak + eceng gondok',
    koorAwal: '-3.2094,104.6521',
    koorTengah: '-3.2110,104.6540',
    koorAkhir: '-3.2135,104.6562',
    photos: [],
    uraian: 'Banjir tahunan luapan sungai merendam badan jalan raya arteri Indralaya dan 2 sekolah dasar. Diperlukan pengerukan sedimen total, pembersihan eceng gondok berkala, serta perbaikan gorong-gorong box culvert.',
    status: 'Belum Clean & Clear',
    createdBy: 'admin',
    createdAt: '2026-10-07T14:15:00.000Z',
    updatedAt: '2026-10-07T14:15:00.000Z'
  }
];

const DEFAULT_USERS = [
  { user: 'jamesonly', pass: 'Katuas165', name: 'Super Admin' },
  { user: 'Super Admin', pass: 'Kayuawetsejahtera123', name: 'Administrator 1' }
];

interface DbSchema {
  surveys: any[];
  users: { user: string; pass: string; name: string }[];
  suspended: boolean;
  suspendedAt: string | null;
}

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read db file:', err);
  }

  // Create initial DB
  const initialDb: DbSchema = {
    surveys: INITIAL_SURVEYS,
    users: DEFAULT_USERS,
    suspended: false,
    suspendedAt: null
  };
  saveDb(initialDb);
  return initialDb;
}

function saveDb(db: DbSchema) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db file:', err);
  }
}

async function startServer() {
  const app = express();

  // Parse JSON payloads up to 50MB (supporting multiple base64 survey photos)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      status: 'ok',
      version: '1.1.2',
      appName: 'MUSRENBANG APPS 2027',
      totalSurveys: db.surveys.length,
      time: new Date().toISOString()
    });
  });

  // Get surveys (supports search & filter)
  app.get('/api/surveys', (req: Request, res: Response) => {
    const db = loadDb();
    let data = [...db.surveys];
    const { q, tahun, kabkota, kecamatan, kelurahan } = req.query;

    if (q) {
      const query = String(q).toLowerCase();
      data = data.filter(
        (s) =>
          (s.surveyNo && s.surveyNo.toLowerCase().includes(query)) ||
          (s.usulanNo && s.usulanNo.toLowerCase().includes(query)) ||
          (s.alamat && s.alamat.toLowerCase().includes(query))
      );
    }
    if (tahun) data = data.filter((s) => s.tahun === String(tahun));
    if (kabkota) data = data.filter((s) => s.kabkota === String(kabkota));
    if (kecamatan) data = data.filter((s) => s.kecamatan === String(kecamatan));
    if (kelurahan) data = data.filter((s) => s.kelurahan === String(kelurahan));

    res.json(data);
  });

  // Get survey by ID
  app.get('/api/surveys/:id', (req: Request, res: Response) => {
    const db = loadDb();
    const survey = db.surveys.find((s) => String(s.id) === String(req.params.id));
    if (!survey) {
      res.status(404).json({ error: 'Data survey tidak ditemukan' });
      return;
    }
    res.json(survey);
  });

  // Create new survey
  app.post('/api/surveys', (req: Request, res: Response) => {
    const db = loadDb();
    const payload = req.body;

    if (!payload.surveyNo || !payload.alamat || !payload.koorAwal || !payload.koorAkhir) {
      res.status(400).json({ error: 'Kolom wajib belum lengkap' });
      return;
    }

    // Check duplicate surveyNo
    const duplicate = db.surveys.find(
      (s) => s.surveyNo && s.surveyNo.toLowerCase() === String(payload.surveyNo).trim().toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({ error: 'No. ID Survey sudah terdaftar pada sistem' });
      return;
    }

    const newRecord = {
      ...payload,
      id: payload.id || `SRV_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.surveys.unshift(newRecord);
    saveDb(db);
    res.status(201).json(newRecord);
  });

  // Update existing survey
  app.put('/api/surveys/:id', (req: Request, res: Response) => {
    const db = loadDb();
    const id = req.params.id;
    const index = db.surveys.findIndex((s) => String(s.id) === String(id));

    if (index === -1) {
      res.status(404).json({ error: 'Data survey tidak ditemukan' });
      return;
    }

    const payload = req.body;
    // Check duplicate surveyNo against other records
    if (payload.surveyNo) {
      const duplicate = db.surveys.find(
        (s) =>
          String(s.id) !== String(id) &&
          s.surveyNo &&
          s.surveyNo.toLowerCase() === String(payload.surveyNo).trim().toLowerCase()
      );
      if (duplicate) {
        res.status(409).json({ error: 'No. ID Survey sudah terdaftar pada data lain' });
        return;
      }
    }

    const updated = {
      ...db.surveys[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };

    db.surveys[index] = updated;
    saveDb(db);
    res.json(updated);
  });

  // Delete survey
  app.delete('/api/surveys/:id', (req: Request, res: Response) => {
    const db = loadDb();
    const id = req.params.id;
    const beforeCount = db.surveys.length;
    db.surveys = db.surveys.filter((s) => String(s.id) !== String(id));

    if (db.surveys.length === beforeCount) {
      res.status(404).json({ error: 'Data tidak ditemukan' });
      return;
    }

    saveDb(db);
    res.json({ ok: true, message: 'Data survey berhasil dihapus' });
  });

  // Authentication
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { user, pass } = req.body;
    const db = loadDb();

    if (!user || !pass) {
      res.status(400).json({ ok: false, message: 'Username dan password wajib diisi' });
      return;
    }

    // Check system suspension
    if (db.suspended && String(user).toLowerCase() !== 'jamesonly') {
      res.status(403).json({
        ok: false,
        message: 'Akses ditangguhkan sementara waktu, Silahkan menghubungi CV. Kayu Awet Sejahtera'
      });
      return;
    }

    const matched = db.users.find(
      (u) => u.user.toLowerCase() === String(user).trim().toLowerCase() && u.pass === String(pass)
    );

    if (matched) {
      res.json({
        ok: true,
        session: { user: matched.user, name: matched.name }
      });
    } else {
      res.status(401).json({ ok: false, message: 'Username atau password salah!' });
    }
  });

  // Change password
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { user, oldPass, newPass } = req.body;
    const db = loadDb();

    const targetUser = db.users.find((u) => u.user.toLowerCase() === String(user).trim().toLowerCase());
    if (!targetUser || targetUser.pass !== oldPass) {
      res.status(400).json({ ok: false, message: 'Password lama salah!' });
      return;
    }

    targetUser.pass = newPass;
    saveDb(db);
    res.json({ ok: true, message: 'Password berhasil diperbarui' });
  });

  // Update profile
  app.post('/api/auth/profile', (req: Request, res: Response) => {
    const { user, name } = req.body;
    const db = loadDb();

    const targetUser = db.users.find((u) => u.user.toLowerCase() === String(user).trim().toLowerCase());
    if (!targetUser) {
      res.status(404).json({ ok: false, message: 'User tidak ditemukan' });
      return;
    }

    targetUser.name = name;
    saveDb(db);
    res.json({ ok: true, name: targetUser.name });
  });

  // System status & suspension
  app.get('/api/system/status', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      suspended: !!db.suspended,
      suspendedAt: db.suspendedAt || null
    });
  });

  app.post('/api/system/suspend', (_req: Request, res: Response) => {
    const db = loadDb();
    db.suspended = !db.suspended;
    db.suspendedAt = db.suspended ? new Date().toISOString() : null;
    saveDb(db);
    res.json({
      suspended: db.suspended,
      suspendedAt: db.suspendedAt
    });
  });

  app.post('/api/system/reset-passwords', (_req: Request, res: Response) => {
    const db = loadDb();
    db.users = [...DEFAULT_USERS];
    saveDb(db);
    res.json({ ok: true, message: 'Semua password dikembalikan ke default' });
  });

  // Wilayah Sumatera Selatan APIs
  app.get('/api/wilayah/kabkota', async (_req: Request, res: Response) => {
    const { getKabKotaList } = await import('./src/data/wilayahSumsel.ts');
    res.json(getKabKotaList());
  });

  app.get('/api/wilayah/kecamatan/:kabId', async (req: Request, res: Response) => {
    const { getKecamatanList } = await import('./src/data/wilayahSumsel.ts');
    res.json(getKecamatanList(req.params.kabId));
  });

  app.get('/api/wilayah/kelurahan/:kecId', async (req: Request, res: Response) => {
    const { WILAYAH_SUMSEL } = await import('./src/data/wilayahSumsel.ts');
    const kecId = req.params.kecId;
    let foundKel: string[] = [];
    for (const kab of WILAYAH_SUMSEL) {
      const kec = kab.kecamatan.find((c) => c.id === kecId || c.name.toLowerCase() === kecId.toLowerCase());
      if (kec) {
        foundKel = kec.kelurahan;
        break;
      }
    }
    res.json(foundKel);
  });

  // Serve static files (root & public)
  app.use(express.static(__dirname));
  app.use(express.static(path.join(__dirname, 'public')));

  // --- Vite Dev or Production Static Files ---
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MUSRENBANG APPS 2027 Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
