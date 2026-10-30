/**
 * Друкований QR-постер A4 у браузері (Canvas 2D).
 *
 * Це порт `qr-postery/_generator/poster.mjs`, який рендерився через Chrome.
 * Усі координати нижче — CSS-пікселі того макета 1240×1754 (A4 @150 dpi),
 * зняті з еталонного рендера; на виході полотно масштабується (×2 → 300 dpi).
 * Якщо міняєте дизайн — міняйте обидва місця, інакше постери з адмінки та
 * з друкарського скрипта розійдуться.
 */
import QRCode from "qrcode";
import shieldSvg from "@/assets/emblem-shield.svg?raw";
import wordmarkSvg from "./wordmark.svg?raw";
import fontMedium from "@/assets/fonts/OdesaRegionType-Medium.woff2?url";
import fontSemi from "@/assets/fonts/OdesaRegionType-Semi.woff2?url";
import fontBold from "@/assets/fonts/OdesaRegionType-Bold.woff2?url";
import type { PosterItem } from "./item";

export const PAGE_W = 1240;
export const PAGE_H = 1754;

const NAVY = "#002F5E";
const CREAM = "#FFF2E8";
const WHITE = "#FFFFFF";
const FAMILY = '"QR Poster Odesa", "Odesa Region Type", sans-serif';

// ── геометрія макета (див. .inner / .block у poster.mjs) ───────────────────
const CONTENT_X = 142;          // 46 рамка + 96 падінг
const CONTENT_W = 956;
const CENTER_X = PAGE_W / 2;
const INNER_BOTTOM = 1406;      // 1754 − 46 − 302
const FIT_LIMIT = 1404;         // нижче починається темна хвиля з URL
const NAME_TOP = 525.76;
const QR_CARD = 456;            // 400 код + 2×24 падінг + 2×4 рамка
const QR_SIZE = 400;
const GAP = 44;
const QRBOX_H = QR_CARD + 15 + 21.6;

// ── векторні ресурси ───────────────────────────────────────────────────────
const SHIELD_VB = { x: 781, y: 742, w: 444, h: 555 };
const pathsOf = (svg: string) => Array.from(svg.matchAll(/\sd="([^"]+)"/g), m => m[1]);
const SHIELD_PATHS = pathsOf(shieldSvg);
const WORDMARK_PATH = pathsOf(wordmarkSvg)[0];
/** Ширина рядка «ОДЕЩИНА» у одиницях гліфа (em = 1000), базова лінія на y = 1000. */
const WORDMARK_W = Number(/viewBox="0 0 ([\d.]+)/.exec(wordmarkSvg)?.[1] ?? 6111);

const WAVES: [string, number][] = [
  ["M0 158 C 210 96 402 230 620 197 C 838 164 1030 62 1240 105 L1240 400 L0 400 Z", 0.14],
  ["M0 209 C 236 158 424 271 656 241 C 888 211 1052 145 1240 176 L1240 400 L0 400 Z", 0.22],
  ["M0 266 C 260 210 448 322 700 292 C 952 262 1088 205 1240 224 L1240 400 L0 400 Z", 1],
];

// ── шрифти ─────────────────────────────────────────────────────────────────
let fontsReady: Promise<void> | null = null;

/**
 * Власна гарнітура під окремим ім'ям: не залежимо від того, чи сайт уже
 * встиг підвантажити потрібні накреслення, і canvas не намалює текст
 * запасним шрифтом.
 */
export function ensurePosterFonts(): Promise<void> {
  if (!fontsReady) {
    const faces = ([[fontMedium, "500"], [fontSemi, "600"], [fontBold, "700"]] as const)
      .map(([url, weight]) => new FontFace("QR Poster Odesa", `url(${url})`, { weight }));
    fontsReady = Promise.all(faces.map(f => f.load())).then(loaded => {
      loaded.forEach(f => document.fonts.add(f));
    }).catch(err => {
      fontsReady = null;
      throw err;
    });
  }
  return fontsReady;
}

// ── текст ──────────────────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D;

const font = (ctx: Ctx, weight: number, size: number) => {
  ctx.font = `${weight} ${size}px ${FAMILY}`;
};

/** Ширина видимого рядка з трекінгом (без хвостового інтервалу після останньої літери). */
const textW = (ctx: Ctx, s: string, spacing = 0) =>
  ctx.measureText(s).width + spacing * Math.max(0, Array.from(s).length - 1);

/**
 * Малює рядок із трекінгом. Позицію кожної літери рахуємо за шириною
 * префікса, тож кернінг шрифту зберігається; `ctx.letterSpacing` є не в
 * усіх браузерах, тому на нього не покладаємось.
 */
function drawText(ctx: Ctx, s: string, x: number, y: number, spacing = 0, align: "left" | "center" | "css-center" = "left") {
  // "css-center" — як CSS без text-indent: хвостовий інтервал після останньої
  // літери входить у ширину рядка, тож видимий текст зсунутий на півінтервалу ліворуч.
  const start = align === "left" ? x : x - textW(ctx, s, spacing) / 2 - (align === "css-center" ? spacing / 2 : 0);
  if (!spacing) { ctx.fillText(s, start, y); return; }
  const chars = Array.from(s);
  let prefix = "";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, start + ctx.measureText(prefix).width + i * spacing, y);
    prefix += ch;
  });
}

/**
 * Жадібне перенесення лише за пробілами. Слова ніколи не розриваються — ні по
 * літерах, ні на дефісі; якщо слово ширше за колонку, fitLayout зменшує кегль.
 */
function wrapWords(ctx: Ctx, text: string, maxW: number, spacing = 0): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && textW(ctx, next, spacing) > maxW) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Аналог CSS `text-wrap: balance`: та сама кількість рядків, але найвужча рівна верстка. */
function wrapBalanced(ctx: Ctx, text: string, maxW: number, spacing = 0): string[] {
  const greedy = wrapWords(ctx, text, maxW, spacing);
  if (greedy.length < 2) return greedy;
  // Не вужче за найдовше слово: балансування не повинно рвати складені слова
  // на дефісі («історико-/краєзнавчий»), якщо вони вміщаються цілими.
  const widest = Math.max(...text.split(" ").map(w => textW(ctx, w, spacing)));
  let lo = Math.max(maxW / greedy.length, Math.min(widest, maxW)), hi = maxW, best = greedy;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    const attempt = wrapWords(ctx, text, mid, spacing);
    if (attempt.length === greedy.length && attempt.every(l => textW(ctx, l, spacing) <= mid + 0.5)) {
      best = attempt; hi = mid;
    } else lo = mid;
  }
  return best;
}

type TimeToken = { text: string; sep: boolean };

/**
 * Рядок часу «10:00–14:00 · 15:00–18:00»: кожен проміжок неподільний, рвемо
 * лише біля «·». Вільний текст (без проміжків) переноситься за словами.
 */
function wrapTime(ctx: Ctx, time: string, maxW: number): TimeToken[][] {
  const tokens: TimeToken[] = [];
  time.split(" · ").forEach((piece, i) => {
    if (i) tokens.push({ text: "·", sep: true });
    if (textW(ctx, piece) <= maxW) tokens.push({ text: piece, sep: false });
    else piece.split(" ").filter(Boolean).forEach(text => tokens.push({ text, sep: false }));
  });
  const space = ctx.measureText(" ").width;
  const tw = (t: TimeToken) => textW(ctx, t.text) + (t.sep ? 4 : 0);
  const lines: TimeToken[][] = [];
  let line: TimeToken[] = [];
  let w = 0;
  for (const t of tokens) {
    const add = (line.length ? space : 0) + tw(t);
    if (line.length && w + add > maxW) { lines.push(line); line = [t]; w = tw(t); }
    else { line.push(t); w += add; }
  }
  if (line.length) lines.push(line);
  return lines;
}

// ── розкладка ─────────────────────────────────────────────────────────────
type RowLayout = { y: number; days: string[]; time: TimeToken[][]; h: number };

type Layout = {
  nameSize: number;
  rowSize: number;
  nameLines: string[];
  placeTop: number;
  blockTop: number;
  blockH: number;
  infoH: number;
  rows: RowLayout[];
  /** Найдовше слово назви ширше за макет — треба менший кегль назви. */
  nameTooWide: boolean;
  /** Найдовше слово графіка ширше за колонку — треба менший кегль графіка. */
  rowsTooWide: boolean;
  fits: boolean;
};

const hasInfo = (item: PosterItem) => item.schedule.length > 0;

function layout(ctx: Ctx, item: PosterItem, nameSize: number, rowSize: number): Layout {
  font(ctx, 700, nameSize);
  const nameLines = wrapBalanced(ctx, item.name, CONTENT_W, -0.004 * nameSize);
  const nameTooWide = nameLines.some(l => textW(ctx, l, -0.004 * nameSize) > CONTENT_W);
  const nameH = nameLines.length * 1.06 * nameSize;
  const placeTop = NAME_TOP + nameH + 14;
  const placeBottom = item.place ? placeTop + 32.4 : NAME_TOP + nameH;

  const rows: RowLayout[] = [];
  let infoH = 0;
  let rowsTooWide = false;
  if (hasInfo(item)) {
    const infoW = CONTENT_W - QR_CARD - GAP;
    const hFs = 0.56 * rowSize, dFs = 0.5 * rowSize;
    infoH = 1.2 * hFs + 14;
    item.schedule.forEach((r, i) => {
      font(ctx, 600, dFs);
      const days = r.days ? wrapWords(ctx, r.days, infoW, 0.04 * dFs) : [];
      if (days.some(l => textW(ctx, l, 0.04 * dFs) > infoW)) rowsTooWide = true;
      font(ctx, 500, rowSize);
      const time = wrapTime(ctx, r.time, infoW);
      const space = ctx.measureText(" ").width;
      if (time.some(line => line.reduce((w, t, k) => w + (k ? space : 0) + textW(ctx, t.text) + (t.sep ? 4 : 0), 0) > infoW)) rowsTooWide = true;
      const last = i === item.schedule.length - 1;
      const h = 15 + days.length * 1.2 * dFs + 4 + time.length * 1.12 * rowSize + 15 + (last ? 0 : 1);
      rows.push({ y: infoH, days, time, h });
      infoH += h;
    });
  }

  const blockH = Math.max(QRBOX_H, infoH);
  const blockTop = placeBottom + Math.max(0, (INNER_BOTTOM - placeBottom - blockH) / 2);
  return {
    nameSize, rowSize, nameLines, placeTop, blockTop, blockH, infoH, rows, nameTooWide, rowsTooWide,
    fits: !nameTooWide && !rowsTooWide && blockTop + blockH <= FIT_LIMIT,
  };
}

/** Як у render.mjs: спершу зменшуємо назву, потім графік — доки блок не звільнить хвилю. */
function fitLayout(ctx: Ctx, item: PosterItem): Layout {
  let ns = 66, rs = 60;
  let l = layout(ctx, item, ns, rs);
  // Спершу — щоб жодне слово не довелося розривати.
  while (l.nameTooWide && ns > 24) { ns -= 2; l = layout(ctx, item, ns, rs); }
  while (l.rowsTooWide && rs > 24) { rs -= 1; l = layout(ctx, item, ns, rs); }
  while (!l.fits && ns > 38) { ns -= 2; l = layout(ctx, item, ns, rs); }
  while (!l.fits && rs > 42) { rs -= 1; l = layout(ctx, item, ns, rs); }
  // Нестандартно довгий вільний текст: дотискаємо ще, аби нічого не з'їхало на хвилю.
  while (!l.fits && rs > 28) { rs -= 2; l = layout(ctx, item, ns, rs); }
  return l;
}

// ── малювання ──────────────────────────────────────────────────────────────
function roundRect(ctx: Ctx | Path2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillShield(ctx: Ctx, x: number, y: number, scale: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-SHIELD_VB.x, -SHIELD_VB.y);
  ctx.fillStyle = color;
  for (const d of SHIELD_PATHS) ctx.fill(new Path2D(d));
  ctx.restore();
}

/**
 * Стилізований QR — порт qr.mjs: рівень корекції H (~30%), тиха зона 4 модулі,
 * круглі модулі злиті в «капсули», заокруглені очі, біла площадка з гербом.
 */
export function drawQr(ctx: Ctx, text: string, x: number, y: number, size: number, dark = NAVY, bg = WHITE) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "H" });
  const n = modules.size;
  const get = (c: number, r: number) => c >= 0 && r >= 0 && c < n && r < n && !!modules.get(r, c);
  const u = size / (n + 8);
  const off = 4 * u;
  const isEye = (c: number, r: number) => (c < 7 && r < 7) || (c >= n - 7 && r < 7) || (c < 7 && r >= n - 7);

  const badge = size * 0.26;
  const pad = u * 0.9;
  const bMin = (size - badge) / 2, bMax = (size + badge) / 2;
  const underBadge = (cx: number, cy: number) =>
    cx > bMin - pad && cx < bMax + pad && cy > bMin - pad && cy < bMax + pad;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = dark;
  const dots = new Path2D();
  const r = u * 0.5 * 0.92;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!get(col, row) || isEye(col, row)) continue;
      const cx = off + col * u + u / 2;
      const cy = off + row * u + u / 2;
      if (underBadge(cx, cy)) continue;
      dots.moveTo(cx + r, cy);
      dots.arc(cx, cy, r, 0, Math.PI * 2);
      if (get(col + 1, row) && !isEye(col + 1, row) && !underBadge(cx + u, cy)) dots.rect(cx, cy - r, u, r * 2);
      if (get(col, row + 1) && !isEye(col, row + 1) && !underBadge(cx, cy + u)) dots.rect(cx - r, cy, r * 2, u);
    }
  }
  ctx.fill(dots, "nonzero");

  for (const [ec, er] of [[0, 0], [n - 7, 0], [0, n - 7]]) {
    const ex = off + ec * u, ey = off + er * u;
    ctx.beginPath();
    roundRect(ctx, ex + u * 0.5, ey + u * 0.5, u * 6, u * 6, u * 1.75);
    ctx.lineWidth = u;
    ctx.strokeStyle = dark;
    ctx.stroke();
    ctx.beginPath();
    roundRect(ctx, ex + u * 2, ey + u * 2, u * 3, u * 3, u * 0.9);
    ctx.fill();
  }

  ctx.beginPath();
  roundRect(ctx, bMin - pad, bMin - pad, badge + pad * 2, badge + pad * 2, badge * 0.24);
  ctx.fillStyle = bg;
  ctx.fill();
  // Герб вписано в бокс 0.82×0.9 бейджа з вирівнюванням по центру (як SVG meet).
  const s = Math.min((badge * 0.82) / SHIELD_VB.w, (badge * 0.9) / SHIELD_VB.h);
  fillShield(ctx, bMin + badge * 0.09 + (badge * 0.82 - SHIELD_VB.w * s) / 2, bMin + badge * 0.05, s, dark);
  ctx.restore();
}

function drawPoster(ctx: Ctx, item: PosterItem) {
  const L = fitLayout(ctx, item);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  // хвилі
  ctx.save();
  ctx.translate(0, PAGE_H - 400);
  ctx.fillStyle = NAVY;
  for (const [d, alpha] of WAVES) { ctx.globalAlpha = alpha; ctx.fill(new Path2D(d)); }
  ctx.restore();

  // подвійна рамка
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  ctx.beginPath(); roundRect(ctx, 47, 47, 1146, 1660, 9); ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.beginPath(); roundRect(ctx, 57.5, 57.5, 1125, 1639, 3.5); ctx.stroke();
  ctx.restore();

  // герб + ОДЕЩИНА + гасло
  fillShield(ctx, 536, 118, 168 / SHIELD_VB.w, NAVY);
  const wm = 104 / 1000;
  ctx.save();
  ctx.translate(CENTER_X - (WORDMARK_W * wm) / 2, 421 - 1000 * wm);
  ctx.scale(wm, wm);
  ctx.fillStyle = NAVY;
  ctx.fill(new Path2D(WORDMARK_PATH));
  ctx.restore();

  ctx.fillStyle = NAVY;
  font(ctx, 500, 25);
  drawText(ctx, "ЗЕМЛЯ, ЩО ОБ'ЄДНУЄ", CENTER_X, 479.8, 0.26 * 25, "center");

  // назва
  const ns = L.nameSize, nameLH = 1.06 * ns;
  font(ctx, 700, ns);
  L.nameLines.forEach((line, i) => {
    drawText(ctx, line, CENTER_X, NAME_TOP + i * nameLH + (nameLH - ns) / 2 + 0.773 * ns, -0.004 * ns, "center");
  });

  if (item.place) {
    ctx.save();
    ctx.globalAlpha = 0.66;
    font(ctx, 500, 27);
    drawText(ctx, item.place, CENTER_X, L.placeTop + 23, 0.05 * 27, "css-center");
    ctx.restore();
  }

  // код + графік
  const info = hasInfo(item);
  const qrX = info ? CONTENT_X : CENTER_X - QR_CARD / 2;
  const qrTop = L.blockTop + (L.blockH - QRBOX_H) / 2;
  ctx.beginPath();
  roundRect(ctx, qrX, qrTop, QR_CARD, QR_CARD, 20);
  ctx.fillStyle = WHITE;
  ctx.fill();
  ctx.beginPath();
  roundRect(ctx, qrX + 2, qrTop + 2, QR_CARD - 4, QR_CARD - 4, 18);
  ctx.lineWidth = 4;
  ctx.strokeStyle = NAVY;
  ctx.stroke();
  drawQr(ctx, item.url, qrX + 28, qrTop + 28, QR_SIZE);

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = NAVY;
  font(ctx, 600, 18);
  drawText(ctx, "СКАНУЙТЕ ДЛЯ ДЕТАЛЕЙ", qrX + QR_CARD / 2, qrTop + QR_CARD + 15 + 16, 0.15 * 18, "css-center");
  ctx.restore();

  if (info) {
    const rs = L.rowSize, hFs = 0.56 * rs, dFs = 0.5 * rs;
    const ix = CONTENT_X + QR_CARD + GAP;
    const iw = CONTENT_W - QR_CARD - GAP;
    const top = L.blockTop + (L.blockH - L.infoH) / 2;
    ctx.fillStyle = NAVY;

    ctx.save();
    ctx.globalAlpha = 0.62;
    font(ctx, 600, hFs);
    drawText(ctx, item.infoTitle, ix, top + 0.893 * hFs, 0.15 * hFs);
    ctx.restore();

    L.rows.forEach((row, i) => {
      let y = top + row.y + 15;
      if (row.days.length) {
        ctx.save();
        ctx.globalAlpha = 0.62;
        font(ctx, 600, dFs);
        for (const line of row.days) { drawText(ctx, line, ix, y + 0.9 * dFs, 0.04 * dFs); y += 1.2 * dFs; }
        ctx.restore();
      }
      y += 4;
      font(ctx, 500, rs);
      const space = ctx.measureText(" ").width;
      for (const line of row.time) {
        let x = ix;
        line.forEach((t, k) => {
          if (k) x += space;
          if (t.sep) {
            ctx.save(); ctx.globalAlpha = 0.4;
            ctx.fillText(t.text, x + 2, y + 0.86 * rs);
            ctx.restore();
            x += textW(ctx, t.text) + 4;
          } else {
            ctx.fillText(t.text, x, y + 0.86 * rs);
            x += textW(ctx, t.text);
          }
        });
        y += 1.12 * rs;
      }
      if (i < L.rows.length - 1) {
        ctx.save();
        ctx.globalAlpha = 0x26 / 255;
        ctx.fillRect(ix, top + row.y + row.h - 1, iw, 1);
        ctx.restore();
      }
    });
  }

  // адреса сайту на темній хвилі
  ctx.fillStyle = CREAM;
  font(ctx, 600, 22);
  drawText(ctx, "TOURISM.OD.GOV.UA", CENTER_X, 1717, 0.16 * 22, "css-center");
}

/**
 * Рендерить постер у нове полотно. `scale` 2 дає 2480×3508 — A4 при 300 dpi,
 * стандарт для друку; 0.5 і менше годиться для прев'ю.
 */
export async function renderPoster(item: PosterItem, scale = 2): Promise<HTMLCanvasElement> {
  await ensurePosterFonts();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PAGE_W * scale);
  canvas.height = Math.round(PAGE_H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D недоступний у цьому браузері");
  ctx.scale(scale, scale);
  drawPoster(ctx, item);
  return canvas;
}
