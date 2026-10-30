import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

/**
 * Збирає `_contact-sheet.png` — усі постери однією картинкою для швидкого
 * перегляду добірки.
 *
 * Раніше цей файл існував, але жоден скрипт його не перегенеровував: після
 * будь-якої зміни макета контакт-шіт мовчки лишався зі старим дизайном.
 * Тепер render.mjs викликає цей крок останнім, тож картинка завжди
 * відповідає реальним постерам.
 */
const CREAM = [0xff, 0xf2, 0xe8];
const COLS = 5;
const GAP = 20;
const SHEET_W = 1900;

export function buildContactSheet(outDir) {
  const files = fs.readdirSync(outDir)
    .filter(f => /^\d{2}-.*\.png$/.test(f))
    .sort();
  if (!files.length) return null;

  const rows = Math.ceil(files.length / COLS);
  const cellW = Math.floor((SHEET_W - GAP * (COLS + 1)) / COLS);
  const first = PNG.sync.read(fs.readFileSync(path.join(outDir, files[0])));
  const cellH = Math.round(cellW * (first.height / first.width));
  const sheetH = GAP + rows * (cellH + GAP);

  const sheet = new PNG({ width: SHEET_W, height: sheetH });
  for (let i = 0; i < sheet.data.length; i += 4) {
    sheet.data[i] = CREAM[0]; sheet.data[i + 1] = CREAM[1];
    sheet.data[i + 2] = CREAM[2]; sheet.data[i + 3] = 255;
  }

  files.forEach((file, idx) => {
    const src = PNG.sync.read(fs.readFileSync(path.join(outDir, file)));
    const ox = GAP + (idx % COLS) * (cellW + GAP);
    const oy = GAP + Math.floor(idx / COLS) * (cellH + GAP);
    // Боксовий ресемплінг: постер зменшується у ціле число разів із
    // усередненням, інакше дрібний текст і модулі QR перетворюються на кашу.
    const kx = src.width / cellW, ky = src.height / cellH;
    for (let y = 0; y < cellH; y++) {
      for (let x = 0; x < cellW; x++) {
        const x0 = Math.floor(x * kx), x1 = Math.min(src.width, Math.ceil((x + 1) * kx));
        const y0 = Math.floor(y * ky), y1 = Math.min(src.height, Math.ceil((y + 1) * ky));
        let r = 0, g = 0, b = 0, n = 0;
        for (let sy = y0; sy < y1; sy++) {
          for (let sx = x0; sx < x1; sx++) {
            const i = ((sy * src.width) + sx) << 2;
            r += src.data[i]; g += src.data[i + 1]; b += src.data[i + 2]; n++;
          }
        }
        const j = (((oy + y) * SHEET_W) + (ox + x)) << 2;
        sheet.data[j] = r / n; sheet.data[j + 1] = g / n;
        sheet.data[j + 2] = b / n; sheet.data[j + 3] = 255;
      }
    }
  });

  const out = path.join(outDir, '_contact-sheet.png');
  fs.writeFileSync(out, PNG.sync.write(sheet));
  return { out, count: files.length, width: SHEET_W, height: sheetH };
}

// Дозволяє запустити крок окремо: `node contact-sheet.mjs [outDir]`
if (process.argv[1] && process.argv[1].endsWith('contact-sheet.mjs')) {
  const dir = process.argv[2] || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const r = buildContactSheet(dir);
  console.log(r ? `contact sheet: ${r.count} постерів → ${r.width}×${r.height}` : 'постерів не знайдено');
}
