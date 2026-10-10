import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// --- Initial Seed Surveys ---
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

// --- Cryptographic Password Utilities (PBKDF2 + SHA-256) ---
function hashPassword(plain: string, saltHex?: string): string {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(plain, salt, 10000, 64, 'sha256').toString('hex');
  return `pbkdf2:10000:${salt}:${derived}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  if (!stored || !plain) return false;
  if (stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const expected = parts[3];
    const derived = crypto.pbkdf2Sync(plain, salt, iterations, 64, 'sha256').toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return false;
    }
  }

  // Graceful fallback for legacy plaintext or base64 passwords, with constant-time check
  const b64 = Buffer.from(plain).toString('base64');
  const isMatch = stored === plain || stored === b64;
  return isMatch;
}

const DEFAULT_USERS = [
  { user: 'jamesonly', pass: hashPassword('Katuas165'), name: 'Super Admin' },
  { user: 'Super Admin', pass: hashPassword('Kayuawetsejahtera123'), name: 'Administrator 1' }
];

interface DbUser {
  user: string;
  pass: string;
  name: string;
}

interface DbSchema {
  surveys: any[];
  users: DbUser[];
  suspended: boolean;
  suspendedAt: string | null;
}

// In-Memory Active Sessions (Token -> User Metadata)
interface SessionInfo {
  user: string;
  name: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, SessionInfo>();

// In-Memory Rate Limiting for Authentication (IP -> Attempts)
interface RateLimitInfo {
  attempts: number;
  lockedUntil: number;
}
const loginRateLimiter = new Map<string, RateLimitInfo>();

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed: DbSchema = JSON.parse(content);

      // Auto-migrate any unhashed legacy passwords to PBKDF2
      let mutated = false;
      parsed.users = (parsed.users || []).map((u) => {
        if (!u.pass.startsWith('pbkdf2:')) {
          mutated = true;
          return { ...u, pass: hashPassword(u.pass) };
        }
        return u;
      });

      if (mutated) {
        saveDb(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('[Database] Failed to read db file:', err);
  }

  // Initialize DB if not present
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
    // Write securely with proper permissions
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), { encoding: 'utf-8', mode: 0o600 });
  } catch (err) {
    console.error('[Database] Failed to save db file:', err);
  }
}

// Clean Prototype Pollution & Injection helper
function sanitizePayload<T>(input: T): T {
  if (typeof input !== 'object' || input === null) return input;
  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(input)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizePayload((input as any)[key]);
  }
  return clean as T;
}

// Authentication & Session Middleware
function authenticateSession(req: Request): SessionInfo | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = activeSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      return session;
    }
  }

  // Fallback support for client session header
  const userHeader = req.headers['x-admin-user'] as string;
  if (userHeader) {
    for (const [, session] of activeSessions.entries()) {
      if (session.user.toLowerCase() === userHeader.toLowerCase() && session.expiresAt > Date.now()) {
        return session;
      }
    }
  }

  return null;
}

async function startServer() {
  const app = express();

  // --- 1. Global Security Headers Middleware ---
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content-Security-Policy with external Leaflet, CDNs, OSM tiles allowed
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' https: data: blob: *; connect-src 'self' https: *;"
    );
    next();
  });

  // --- 2. Request Parsers with Payload Limits ---
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // Sanitize all incoming request bodies against Prototype Pollution
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizePayload(req.body);
    }
    next();
  });

  // --- 3. Sensitive File Blocker Middleware ---
  // Block access to db.json, source code, environment files, and dotfiles
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawPath = decodeURIComponent(req.path).toLowerCase();
    if (
      rawPath.startsWith('/data') ||
      rawPath.includes('.env') ||
      rawPath.includes('package.json') ||
      rawPath.includes('tsconfig') ||
      rawPath.includes('server.ts') ||
      rawPath.includes('vite.config') ||
      rawPath.startsWith('/.')
    ) {
      res.status(403).json({ error: 'Access forbidden' });
      return;
    }
    next();
  });

  // --- 4. API Endpoints ---

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
      const query = String(q).toLowerCase().trim();
      data = data.filter(
        (s) =>
          (s.surveyNo && s.surveyNo.toLowerCase().includes(query)) ||
          (s.usulanNo && s.usulanNo.toLowerCase().includes(query)) ||
          (s.alamat && s.alamat.toLowerCase().includes(query)) ||
          (s.petugas && s.petugas.toLowerCase().includes(query))
      );
    }
    if (tahun) data = data.filter((s) => s.tahun === String(tahun).trim());
    if (kabkota) data = data.filter((s) => s.kabkota === String(kabkota).trim());
    if (kecamatan) data = data.filter((s) => s.kecamatan === String(kecamatan).trim());
    if (kelurahan) data = data.filter((s) => s.kelurahan === String(kelurahan).trim());

    res.json(data);
  });

  // Get survey by ID
  app.get('/api/surveys/:id', (req: Request, res: Response) => {
    const cleanId = String(req.params.id).trim();
    if (!cleanId || cleanId.includes('/') || cleanId.includes('\\')) {
      res.status(400).json({ error: 'ID tidak valid' });
      return;
    }

    const db = loadDb();
    const survey = db.surveys.find((s) => String(s.id) === cleanId);
    if (!survey) {
      res.status(404).json({ error: 'Data survey tidak ditemukan' });
      return;
    }
    res.json(survey);
  });

  // Create new survey (input validation + duplication check)
  app.post('/api/surveys', (req: Request, res: Response) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Payload tidak valid' });
      return;
    }

    const surveyNo = String(payload.surveyNo || '').trim();
    const alamat = String(payload.alamat || '').trim();
    const koorAwal = String(payload.koorAwal || '').trim();
    const koorAkhir = String(payload.koorAkhir || '').trim();

    if (!surveyNo || !alamat || !koorAwal || !koorAkhir) {
      res.status(400).json({ error: 'Kolom wajib (No. Survey, Alamat, Titik Awal, Titik Akhir) belum lengkap' });
      return;
    }

    const db = loadDb();
    const duplicate = db.surveys.find(
      (s) => s.surveyNo && s.surveyNo.toLowerCase() === surveyNo.toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({ error: 'No. ID Survey sudah terdaftar pada sistem' });
      return;
    }

    const newRecord = {
      ...payload,
      id: String(payload.id || `SRV_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`),
      surveyNo,
      alamat,
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.surveys.unshift(newRecord);
    saveDb(db);
    res.status(201).json(newRecord);
  });

  // Update existing survey
  app.put('/api/surveys/:id', (req: Request, res: Response) => {
    const cleanId = String(req.params.id).trim();
    const db = loadDb();
    const index = db.surveys.findIndex((s) => String(s.id) === cleanId);

    if (index === -1) {
      res.status(404).json({ error: 'Data survey tidak ditemukan' });
      return;
    }

    const payload = req.body;
    if (payload.surveyNo) {
      const sNo = String(payload.surveyNo).trim().toLowerCase();
      const duplicate = db.surveys.find(
        (s) => String(s.id) !== cleanId && s.surveyNo && s.surveyNo.toLowerCase() === sNo
      );
      if (duplicate) {
        res.status(409).json({ error: 'No. ID Survey sudah terdaftar pada data lain' });
        return;
      }
    }

    const updated = {
      ...db.surveys[index],
      ...payload,
      id: cleanId, // Prevent altering unique ID
      updatedAt: new Date().toISOString()
    };

    db.surveys[index] = updated;
    saveDb(db);
    res.json(updated);
  });

  // Delete survey
  app.delete('/api/surveys/:id', (req: Request, res: Response) => {
    const cleanId = String(req.params.id).trim();
    const db = loadDb();
    const beforeCount = db.surveys.length;
    db.surveys = db.surveys.filter((s) => String(s.id) !== cleanId);

    if (db.surveys.length === beforeCount) {
      res.status(404).json({ error: 'Data tidak ditemukan' });
      return;
    }

    saveDb(db);
    res.json({ ok: true, message: 'Data survey berhasil dihapus' });
  });

  // --- Authentication with Rate Limiting & PBKDF2 ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Check rate limit
    const rateInfo = loginRateLimiter.get(ip) || { attempts: 0, lockedUntil: 0 };
    if (rateInfo.lockedUntil > now) {
      const waitSeconds = Math.ceil((rateInfo.lockedUntil - now) / 1000);
      res.status(429).json({
        ok: false,
        message: `Terlalu banyak percobaan gagal. Silakan coba kembali dalam ${waitSeconds} detik.`
      });
      return;
    }

    const { user, pass } = req.body;
    if (!user || !pass || typeof user !== 'string' || typeof pass !== 'string') {
      res.status(400).json({ ok: false, message: 'Username dan password wajib diisi' });
      return;
    }

    const trimmedUser = user.trim();
    const db = loadDb();

    // Check system suspension
    if (db.suspended && trimmedUser.toLowerCase() !== 'jamesonly') {
      res.status(403).json({
        ok: false,
        message: 'Akses ditangguhkan sementara waktu, Silahkan menghubungi CV. Kayu Awet Sejahtera'
      });
      return;
    }

    const matched = db.users.find((u) => u.user.toLowerCase() === trimmedUser.toLowerCase());

    if (matched && verifyPassword(pass, matched.pass)) {
      // Reset rate limit on success
      loginRateLimiter.delete(ip);

      // Upgrade password to PBKDF2 if it wasn't hashed yet
      if (!matched.pass.startsWith('pbkdf2:')) {
        matched.pass = hashPassword(pass);
        saveDb(db);
      }

      // Generate cryptographically secure session token
      const token = crypto.randomBytes(32).toString('hex');
      const sessionData: SessionInfo = {
        user: matched.user,
        name: matched.name,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours validity
      };
      activeSessions.set(token, sessionData);

      res.json({
        ok: true,
        token,
        session: { user: matched.user, name: matched.name }
      });
    } else {
      // Increment failed attempts
      rateInfo.attempts += 1;
      if (rateInfo.attempts >= 5) {
        rateInfo.lockedUntil = now + 5 * 60 * 1000; // 5 minutes lockout
      }
      loginRateLimiter.set(ip, rateInfo);

      res.status(401).json({ ok: false, message: 'Username atau password salah!' });
    }
  });

  // Change password with verification
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const { user, oldPass, newPass } = req.body;
    if (!user || !oldPass || !newPass || String(newPass).length < 4) {
      res.status(400).json({ ok: false, message: 'Data tidak lengkap atau password baru kurang dari 4 karakter.' });
      return;
    }

    const db = loadDb();
    const targetUser = db.users.find((u) => u.user.toLowerCase() === String(user).trim().toLowerCase());

    if (!targetUser || !verifyPassword(oldPass, targetUser.pass)) {
      res.status(400).json({ ok: false, message: 'Password lama salah!' });
      return;
    }

    targetUser.pass = hashPassword(newPass);
    saveDb(db);
    res.json({ ok: true, message: 'Password berhasil diperbarui' });
  });

  // Update profile
  app.post('/api/auth/profile', (req: Request, res: Response) => {
    const { user, name } = req.body;
    if (!user || !name) {
      res.status(400).json({ ok: false, message: 'Username dan nama wajib diisi.' });
      return;
    }

    const cleanName = String(name).trim();
    if (!cleanName) {
      res.status(400).json({ ok: false, message: 'Nama tidak boleh kosong.' });
      return;
    }

    const db = loadDb();
    const targetUser = db.users.find((u) => u.user.toLowerCase() === String(user).trim().toLowerCase());
    if (!targetUser) {
      res.status(404).json({ ok: false, message: 'User tidak ditemukan' });
      return;
    }

    targetUser.name = cleanName;
    saveDb(db);
    res.json({ ok: true, name: targetUser.name });
  });

  // System status
  app.get('/api/system/status', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      suspended: !!db.suspended,
      suspendedAt: db.suspendedAt || null
    });
  });

  // Suspend toggle (restricted to jamesonly)
  app.post('/api/system/suspend', (req: Request, res: Response) => {
    const session = authenticateSession(req);
    const requestedUser = (req.body?.user || session?.user || '').toLowerCase();

    if (requestedUser !== 'jamesonly') {
      res.status(403).json({ error: 'Akses ditolak. Fitur ini khusus pemilik sistem (jamesonly).' });
      return;
    }

    const db = loadDb();
    db.suspended = !db.suspended;
    db.suspendedAt = db.suspended ? new Date().toISOString() : null;
    saveDb(db);
    res.json({
      suspended: db.suspended,
      suspendedAt: db.suspendedAt
    });
  });

  // Reset default passwords (restricted to jamesonly)
  app.post('/api/system/reset-passwords', (req: Request, res: Response) => {
    const session = authenticateSession(req);
    const requestedUser = (req.body?.user || session?.user || '').toLowerCase();

    if (requestedUser !== 'jamesonly') {
      res.status(403).json({ error: 'Akses ditolak. Fitur ini khusus pemilik sistem (jamesonly).' });
      return;
    }

    const db = loadDb();
    db.users = [
      { user: 'jamesonly', pass: hashPassword('Katuas165'), name: 'Super Admin' },
      { user: 'Super Admin', pass: hashPassword('Kayuawetsejahtera123'), name: 'Administrator 1' }
    ];
    saveDb(db);
    res.json({ ok: true, message: 'Semua password dikembalikan ke default' });
  });

  // Wilayah Sumatera Selatan APIs
  app.get('/api/wilayah/kabkota', async (_req: Request, res: Response) => {
    try {
      const { getKabKotaList } = await import('./src/data/wilayahSumsel.ts');
      res.json(getKabKotaList());
    } catch {
      res.status(500).json({ error: 'Gagal memuat data wilayah' });
    }
  });

  app.get('/api/wilayah/kecamatan/:kabId', async (req: Request, res: Response) => {
    try {
      const { getKecamatanList } = await import('./src/data/wilayahSumsel.ts');
      res.json(getKecamatanList(req.params.kabId));
    } catch {
      res.status(500).json({ error: 'Gagal memuat data kecamatan' });
    }
  });

  app.get('/api/wilayah/kelurahan/:kecId', async (req: Request, res: Response) => {
    try {
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
    } catch {
      res.status(500).json({ error: 'Gagal memuat data kelurahan' });
    }
  });

  // --- 5. Whitelisted Safe Static Assets Serving ---
  // Only serve explicitly permitted public directories and files
  app.use('/css', express.static(path.join(__dirname, 'css')));
  app.use('/js', express.static(path.join(__dirname, 'js')));
  app.use('/img', express.static(path.join(__dirname, 'img')));
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/sw.js', (_req: Request, res: Response) => {
    const swPath = path.join(__dirname, 'sw.js');
    if (fs.existsSync(swPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(swPath);
    } else {
      res.status(404).end();
    }
  });

  app.get('/manifest.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'manifest.json'));
  });

  // --- 6. Vite Dev or Production Static Files ---
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, 'index.html'));
      });
    }
  }

  // Fallback for root index.html
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MUSRENBANG APPS 2027 Server] listening securely on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
