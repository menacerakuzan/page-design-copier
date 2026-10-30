import fs from 'node:fs';
import path from 'node:path';
import { qrSvg } from './qr.mjs';

const NAVY = '#002F5E';
const CREAM = '#FFF2E8';
const REPO = '/opt/tourism/page-design-copier';
const FONTS = path.join(REPO, 'src/assets/fonts');

const b64 = p => fs.readFileSync(p).toString('base64');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const WEIGHTS = [['Regular', 400], ['Medium', 500], ['Semi', 600], ['Bold', 700], ['Heavy', 800]];
const fontFaces = WEIGHTS.map(([file, w]) => `@font-face{
  font-family:"Odesa Region Type";font-style:normal;font-weight:${w};font-display:block;
  src:url(data:font/woff2;base64,${b64(path.join(FONTS, `OdesaRegionType-${file}.woff2`))}) format("woff2");}`).join('\n');

const SHIELD_VB = '781 742 444 555';
// Brand shield, cropped to its artwork and recoloured for the cream ground.
const shieldRaw = fs.readFileSync(path.join(REPO, 'src/assets/emblem-shield.svg'), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '').replace(/<style>[\s\S]*?<\/style>/, '')
  .replace(/\sid="[^"]*"|\sdata-name="[^"]*"/g, '')
  .replace(/class="cls-\d"/g, `fill="${NAVY}"`)
  .replace(/viewBox="[^"]*"/, `viewBox="${SHIELD_VB}"`);
const shieldBody = shieldRaw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const SHIELD_LOGO = { viewBox: SHIELD_VB, body: shieldBody };

export function posterHtml(item) {
  // Keep each range atomic — a line may only break at the "·" between them.
  const timeHtml = t => esc(t).split(' · ').map(x => `<span>${x}</span>`).join(' <em>·</em> ');
  const rows = item.schedule.map(r => `<div class="row">
      <div class="d">${esc(r.days)}</div><div class="t">${timeHtml(r.time)}</div>
    </div>`).join('');

  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><style>
${fontFaces}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1240px;height:1754px}
body{background:${CREAM};color:${NAVY};
  font-family:"Odesa Region Type",sans-serif;font-weight:500;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.page{position:relative;width:1240px;height:1754px;overflow:hidden}

/* ── decorative ground ───────────────────────────────────────────── */
.waves{position:absolute;left:0;right:0;bottom:0;height:400px}
.frame{position:absolute;inset:46px;border:2px solid ${NAVY};border-radius:10px}
.frame::after{content:"";position:absolute;inset:9px;border:1px solid ${NAVY}33;border-radius:4px}

.inner{position:absolute;inset:46px;display:flex;flex-direction:column;
  align-items:center;padding:72px 96px 302px;text-align:center}

/* ── lockup ──────────────────────────────────────────────────────── */
.shield{width:168px;height:210px;display:block}
.shield svg{width:100%;height:100%;display:block}
.wordmark{margin-top:14px;font-weight:500;font-size:104px;line-height:.94;
  letter-spacing:.045em;text-indent:.045em;
  font-feature-settings:"ss02" 1;font-variant-alternates:styleset(ss02)}
.tagline{margin-top:18px;font-weight:500;font-size:25px;letter-spacing:.26em;
  text-indent:.26em}

/* ── object ──────────────────────────────────────────────────────── */
.name{margin-top:38px;font-weight:700;font-size:66px;line-height:1.06;
  letter-spacing:-.004em;text-wrap:balance;hyphens:none}
.place{margin-top:14px;font-weight:500;font-size:27px;letter-spacing:.05em;
  opacity:.66}

/* ── code + schedule, side by side ───────────────────────────────── */
.block{margin:auto 0;width:100%;display:flex;align-items:center;gap:44px;
  text-align:left}
.qrbox{flex:none;display:flex;flex-direction:column;align-items:center}
/* Біла картка під кодом: на кремовому тлі QR має нижчий контраст, а сканери
   очікують чисту світлу «тиху зону». Картка дає і контраст, і візуальну
   рамку, і збігається з кольором площадки під емблемою всередині коду. */
.qrcard{background:#FFFFFF;padding:24px;border-radius:20px;
  border:4px solid ${NAVY}}
.qrcard svg{width:400px;height:400px;display:block}
.qrbox .cap{margin-top:15px;font-weight:600;font-size:18px;letter-spacing:.15em;
  opacity:.55}
.info{flex:1;min-width:0;font-size:60px}
.info .h{font-weight:600;font-size:.56em;letter-spacing:.15em;opacity:.62;
  margin-bottom:14px}
.row{padding:15px 0;border-bottom:1px solid ${NAVY}26}
.row:last-child{border-bottom:0}
.d{font-weight:600;font-size:.5em;letter-spacing:.04em;opacity:.62;
  overflow-wrap:normal;hyphens:none}
.t span{white-space:nowrap}
.t em{font-style:normal;opacity:.4;padding:0 2px}
.t{margin-top:4px;font-weight:500;font-size:1em;line-height:1.12;
  font-variant-numeric:tabular-nums;overflow-wrap:normal;hyphens:none}

.url{position:absolute;left:0;right:0;bottom:30px;text-align:center;
  font-weight:600;font-size:22px;letter-spacing:.16em;color:${CREAM};z-index:2}
</style></head><body><div class="page">

  <svg class="waves" viewBox="0 0 1240 400" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 158 C 210 96 402 230 620 197 C 838 164 1030 62 1240 105 L1240 400 L0 400 Z" fill="${NAVY}" opacity=".14"/>
    <path d="M0 209 C 236 158 424 271 656 241 C 888 211 1052 145 1240 176 L1240 400 L0 400 Z" fill="${NAVY}" opacity=".22"/>
    <path d="M0 266 C 260 210 448 322 700 292 C 952 262 1088 205 1240 224 L1240 400 L0 400 Z" fill="${NAVY}"/>
  </svg>

  <div class="frame"></div>

  <div class="inner">
    <div class="shield">${shieldRaw}</div>
    <div class="wordmark">ОДЕЩИНА</div>
    <div class="tagline">ЗЕМЛЯ, ЩО ОБ'ЄДНУЄ</div>

    <div class="name" id="name">${esc(item.name)}</div>
    <div class="place">${esc(item.city)} · ${esc(item.district)}</div>

    <div class="block">
      <div class="qrbox">
        <div class="qrcard">
          ${qrSvg(item.url, { size: 400, dark: NAVY, bg: '#FFFFFF', logo: SHIELD_LOGO })}
        </div>
        <div class="cap">СКАНУЙТЕ ДЛЯ ДЕТАЛЕЙ</div>
      </div>
      <div class="info">
        <div class="h">ГРАФІК РОБОТИ</div>
        ${rows}
      </div>
    </div>
  </div>

  <div class="url">TOURISM.OD.GOV.UA</div>
</div></body></html>`;
}
