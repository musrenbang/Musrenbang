import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SurveyRecord } from '../types';

function stampFilename(ext: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  return `MUSRENBANG-2027_${dateStr}.${ext}`;
}

export function formatFullSurveyRow(s: SurveyRecord, index: number) {
  return {
    'No': index + 1,
    'Tahun': s.tahun,
    'No.ID Survey': s.surveyNo,
    'ID Usulan': s.usulanNo,
    'Petugas': s.petugas,
    'Alamat': s.alamat,
    'RT/RW': s.rt,
    'Provinsi': s.prov,
    'Kota/Kabupaten': s.kabkota,
    'Kecamatan': s.kecamatan,
    'Kelurahan/Desa': s.kelurahan,
    'Nama RT/RW/Lurah/Camat': s.namaPejabat,
    'HP': s.hp,
    'Banjir': s.banjir,
    'Tinggi (cm)': s.tinggi || '-',
    'Lama (jam)': s.lama || '-',
    'Luas': s.luas || '-',
    'Frekuensi/thn': s.frekuensi || '-',
    'Ekonomi': s.eko || '-',
    'Fasos': s.fasos || '-',
    'Transportasi': s.trans || '-',
    'Permukiman': s.mukim || '-',
    'Hak Milik': s.hak || '-',
    'Sedimentasi': s.sedimen || '-',
    'Sampah': s.sampah || '-',
    'Titik Awal': s.koorAwal,
    'Titik Tengah': s.koorTengah || '-',
    'Titik Akhir': s.koorAkhir,
    'Jml Foto': (s.photos || []).length,
    'Uraian': (s.uraian || '').slice(0, 500),
    'Status': s.status || '-',
    'Diinput': s.createdBy,
    'Update': (s.updatedAt || '').slice(0, 16).replace('T', ' ')
  };
}

export async function exportToExcel(
  rows: SurveyRecord[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const total = rows.length;
  if (!total) return;

  const chunkSize = 500;
  const data: ReturnType<typeof formatFullSurveyRow>[] = [];

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    chunk.forEach((s, idx) => {
      data.push(formatFullSurveyRow(s, i + idx));
    });
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, total), total);
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const colKeys = Object.keys(data[0] || {});
  ws['!cols'] = colKeys.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Survey');
  XLSX.writeFile(wb, stampFilename('xlsx'));
}

export async function exportToPDF(
  rows: SurveyRecord[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const total = rows.length;
  if (!total) return;

  const chunkSize = 500;
  const tableBody: string[][] = [];

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    chunk.forEach((s, idx) => {
      tableBody.push([
        String(i + idx + 1),
        s.tahun,
        s.surveyNo,
        s.usulanNo,
        s.petugas,
        s.kabkota,
        s.kecamatan,
        s.kelurahan,
        s.banjir,
        s.status || '-'
      ]);
    });
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, total), total);
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MUSRENBANG APPS 2027 - Laporan Data Survey', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Provinsi Sumatera Selatan | Total: ${total} data | Dicetak: ${new Date().toLocaleString('id-ID')}`,
    14,
    20
  );

  const head = [
    ['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status']
  ];

  autoTable(doc, {
    startY: 25,
    head,
    body: tableBody,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [11, 95, 255] }
  });

  doc.save(stampFilename('pdf'));
}

export async function exportToWord(
  rows: SurveyRecord[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const total = rows.length;
  if (!total) return;

  const chunkSize = 500;
  const th = ['No', 'Tahun', 'No.ID Survey', 'ID Usulan', 'Petugas', 'Alamat', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Banjir', 'Status'];
  let body = '';

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    body += chunk
      .map(
        (s, idx) => `<tr>
          <td>${i + idx + 1}</td>
          <td>${escapeHtml(s.tahun)}</td>
          <td>${escapeHtml(s.surveyNo)}</td>
          <td>${escapeHtml(s.usulanNo)}</td>
          <td>${escapeHtml(s.petugas)}</td>
          <td>${escapeHtml(s.alamat)}</td>
          <td>${escapeHtml(s.kabkota)}</td>
          <td>${escapeHtml(s.kecamatan)}</td>
          <td>${escapeHtml(s.kelurahan)}</td>
          <td>${escapeHtml(s.banjir)}</td>
          <td>${escapeHtml(s.status || '-')}</td>
        </tr>`
      )
      .join('');

    if (onProgress) {
      onProgress(Math.min(i + chunkSize, total), total);
      await new Promise((r) => setTimeout(r, 10));
    }
  }

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Calibri, sans-serif; }
        h2 { color: #0b5fff; }
        table { border-collapse: collapse; width: 100%; font-size: 9pt; }
        th { background: #0b5fff; color: #ffffff; padding: 6px; border: 1px solid #333333; }
        td { border: 1px solid #cccccc; padding: 5px; }
      </style>
    </head>
    <body>
      <h2>MUSRENBANG APPS 2027 - Laporan Data Survey</h2>
      <p>Provinsi Sumatera Selatan | Total: ${total} data | Dicetak: ${new Date().toLocaleString('id-ID')}</p>
      <table>
        <tr>${th.map((h) => `<th>${h}</th>`).join('')}</tr>
        ${body}
      </table>
      <br>
      <p style="font-size: 8.5pt; color: #64748b;">Developer Apps : M.Afifi Eka Putra, S.E — CV. Kayu Awet Sejahtera</p>
    </body>
  </html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = stampFilename('doc');
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 600);
}

function escapeHtml(str: string | undefined): string {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

export const exportWord = exportToWord;
