import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { SELECTED, parseHours } from './data.mjs';
import { posterHtml } from './poster.mjs';
import { buildContactSheet } from './contact-sheet.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = process.argv[2] || path.resolve(HERE, '..');
const BASE = 'https://tourism.od.gov.ua/mistse/';

// all.json лежить поруч зі скриптом, у _generator/. Раніше шлях вказував на
// каталог рівнем вище — і рендер падав з ENOENT одразу на старті.
const all = JSON.parse(fs.readFileSync(path.join(HERE, 'all.json'), 'utf8'));
const bySlug = Object.fromEntries(all.map(o => [o.slug, o]));

const items = SELECTED.map((slug, i) => {
  const o = bySlug[slug];
  if (!o) throw new Error('missing object: ' + slug);
  return {
    n: i + 1, slug,
    // Only collapse whitespace — never touch hyphens, they are part of
    // compound names ("історико-краєзнавчий", "Білгород-Дністровський").
    name: o.name.replace(/\s+/g, ' ').trim(),
    place: `${o.city} · ${o.district}`,
    city: o.city, district: o.district,
    url: BASE + slug,
    schedule: parseHours(o.hours),
  };
});

// Filenames: 01-<slug>.png, ASCII-safe and stable.
const fileBase = it => `${String(it.n).padStart(2, '0')}-${it.slug}`;

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'pdf'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'svg-qr'), { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--font-render-hinting=none', '--disable-lcd-text'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 }); // → 2480×3508 (300 dpi A4)

const report = [];
for (const it of items) {
  await page.setContent(posterHtml(it), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // Shrink the title (then the schedule) until nothing collides with the URL band.
  const fit = await page.evaluate(() => {
    const LIMIT = 1404;            // stay clear of the navy wave footer
    const name = document.querySelector('.name');
    const info = document.querySelector('.info');
    const block = document.querySelector('.block');
    const bottom = () => block.getBoundingClientRect().bottom;
    // Стартові значення мусять збігатися з CSS у poster.mjs (.name / .info):
    // цикл лише ЗМЕНШУЄ від них, тож якщо лишити тут старі числа, він
    // затре збільшений у CSS розмір графіка вже на першій ітерації.
    let ns = 66, rs = 60;
    while (bottom() > LIMIT && ns > 38) { ns -= 2; name.style.fontSize = ns + 'px'; }
    while (bottom() > LIMIT && rs > 42) { rs -= 1; info.style.fontSize = rs + 'px'; }
    return { nameSize: ns, rowSize: rs, bottom: Math.round(bottom()), fits: bottom() <= LIMIT };
  });

  const base = fileBase(it);
  await page.screenshot({ path: path.join(OUT, `${base}.png`), type: 'png' });
  await page.pdf({
    path: path.join(OUT, 'pdf', `${base}.pdf`),
    width: '1240px', height: '1754px', printBackground: true, pageRanges: '1',
  });

  const qr = await page.evaluate(() => document.querySelector('.qrbox svg').outerHTML);
  fs.writeFileSync(path.join(OUT, 'svg-qr', `${base}.svg`), qr);

  report.push({ ...it, ...fit });
  console.log(`${fit.fits ? '✓' : '✗'} ${base}  name=${fit.nameSize}px rows=${fit.rowSize}px bottom=${fit.bottom}`);
}

await browser.close();

fs.writeFileSync(
  path.join(OUT, 'index.json'),
  JSON.stringify(report.map(({ n, name, place, url, slug, schedule }) =>
    ({ n, file: fileBase({ n, slug }) + '.png', name, place, url, schedule })), null, 2) + '\n',
);
const sheet = buildContactSheet(OUT);
if (sheet) console.log(`contact sheet: ${sheet.count} постерів → ${sheet.width}×${sheet.height}`);
console.log(`\n${report.length} posters → ${OUT}`);
