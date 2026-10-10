export interface WatermarkMeta {
  source: 'camera' | 'upload' | 'archive';
  gps: string;
  accuracy: number | null;
  compassDeg: number | null;
  compassDirection: string;
  kecamatan: string;
  kelurahan: string;
  surveyNo: string;
  usulanNo: string;
}

const WIND_DIRECTIONS = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];

export function getWindDirection(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const idx = Math.round(norm / 45) % 8;
  return WIND_DIRECTIONS[idx];
}

export function formatTimestamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export async function processPhotoWithWatermark(file: File, meta: WatermarkMeta): Promise<string> {
  const img = await fileToImage(file);
  const MAX_BYTES = 150 * 1024; // 150 KB limit
  let maxDim = 1280;
  let quality = 0.80;
  let dataUrl = '';

  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia');

    // Draw base image
    ctx.drawImage(img, 0, 0, width, height);

    // Draw 5-line Watermark
    drawWatermarkOverlay(ctx, width, height, meta);

    dataUrl = canvas.toDataURL('image/jpeg', quality);

    // Check size (< 150KB)
    const estimatedBytes = dataUrl.length * 0.75;
    if (estimatedBytes <= MAX_BYTES || (quality <= 0.4 && maxDim <= 640)) {
      break;
    }

    if (quality > 0.45) {
      quality = Math.round((quality - 0.12) * 100) / 100;
    } else {
      maxDim = Math.round(maxDim * 0.8);
    }
  }

  return dataUrl;
}

function drawWatermarkOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  meta: WatermarkMeta
) {
  const now = formatTimestamp();
  const sourceLabel = meta.source === 'camera' ? '(Live Survey)' : '(Unggahan Foto)';
  const accText = meta.accuracy != null ? `${meta.accuracy} m` : '-';
  const compassText =
    meta.compassDeg != null
      ? `${Math.round(meta.compassDeg)}° (${meta.compassDirection || getWindDirection(meta.compassDeg)})`
      : '-';

  const lines = [
    ` ${now} ${sourceLabel}`,
    ` GPS: ${meta.gps || '-'} | Akurasi: ${accText} | Kompas: ${compassText}`,
    ` Kecamatan: ${meta.kecamatan || '-'} / Kelurahan: ${meta.kelurahan || '-'}`,
    ` No. ID Survey: ${meta.surveyNo || '-'}`,
    ` ID Usulan: ${meta.usulanNo || '-'}`
  ];

  let fontSize = Math.max(13, Math.round(width * 0.026));
  const pad = Math.round(fontSize * 0.7);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;

  const maxWidth = width - pad * 2 - 12;
  lines.forEach((t) => {
    while (fontSize > 10 && ctx.measureText(t).width > maxWidth) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }
  });

  const lineHeight = Math.round(fontSize * 1.45);
  const boxHeight = lines.length * lineHeight + pad * 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, height - boxHeight, width, boxHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    ctx.fillText(line, pad, height - boxHeight + pad + i * lineHeight);
  });
  ctx.restore();
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
