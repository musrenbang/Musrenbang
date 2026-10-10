export interface SurveyRecord {
  id: string;
  tahun: string;
  surveyNo: string;
  usulanNo: string;
  petugas: string;
  alamat: string;
  rt: string;
  prov: string;
  kabkotaId: string;
  kabkota: string;
  kecamatanId: string;
  kecamatan: string;
  kelurahan: string;
  namaPejabat: string;
  hp: string;
  banjir: 'Banjir' | 'Tidak Banjir' | string;
  tinggi?: string;
  lama?: string;
  luas?: string;
  frekuensi?: string;
  eko?: string;
  fasos?: string;
  trans?: string;
  mukim?: string;
  hak?: string;
  sedimen?: string;
  sampah?: string;
  koorAwal: string;
  koorTengah?: string;
  koorAkhir: string;
  photos: string[];
  uraian?: string;
  status?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  user: string;
  name: string;
  pass: string; // base64 encoded or hashed
  createdAt?: string;
}

export interface SystemStatus {
  suspended: boolean;
  suspendedAt: string | null;
  message?: string;
}

export interface KabKotaItem {
  id: string;
  name: string;
}

export interface KecamatanItem {
  id: string;
  kabkotaId: string;
  name: string;
}

export interface KelurahanItem {
  id: string;
  kecamatanId: string;
  name: string;
}
