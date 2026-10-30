// Selection: 20 objects — 10 museums outside Odesa city + 10 museum-adjacent
// heritage sites (galleries, catacombs-museum, fortress, wine-culture centre,
// churches), all in small towns / villages of Odesa oblast, all with hours.
export const SELECTED = [
  // ── музеї ────────────────────────────────────────────────────────────
  'baltskyy-istorychnyy-muzey-3y5opy',
  'bilhorod-dnistrovskyy-krayeznavchyy-muzey-gmh1xy',
  'muzey-chystoyi-vody-s9a4p0',
  'bolhradskyy-istoryko-etnohrafichnyy-muzey-dgtv21',
  'krayeznavchyy-muzey-oleksandra-sharonova-vxhzae',
  'izmayilskyy-istoryko-krayeznavchyy-muzey-prydunav-ya-mm2q2t',
  'kodymskyy-istoryko-krayeznavchyy-muzey-v8b2fl',
  'podilskyy-miskyy-krayeznavchyy-muzey-x81kp4',
  'rozdilnyanskyy-narodnyy-istoryko-krayeznavchyy-muzey-4tgw52',
  'shabivskyy-krayeznavchyy-muzey-3ix8eu',
  // ── музейні / спадщинні об'єкти ──────────────────────────────────────
  'izmayilska-kartynna-halereya-714x73',
  'nerubayski-katakomby-638h15',
  'park-miniatyur-x50ucr',
  'tsentr-kultury-vyna-shabo-bqalqv',
  'akkermanska-fortetsya-8xgh8g',
  'kostol-sv-stanislava-bf5xhf',
  'spaso-preobrazhenskyy-sobor-shnu1g',
  'sobor-svyatytelya-i-chudotvortsya-mykolaya-v-bolhradi-sndlr2',
  'svyato-mykolayivska-tserkva-busd4v',
  'pelikan-siti-llmzbk',
];

const DAY = "(?:Пн|Вт|Ср|Чт|Пт|Сб|Нд|Вс|понеділок|вівторок|середа|четвер|п['’]ятниця|субота|неділя)";
// A label is one day, or a range / list of them: "Пн", "Пн-Чт", "Пн-Пт, Нд".
const LABEL = `${DAY}(?:\\s*[-–—,]\\s*${DAY})*`;
const SPAN  = "\\d{1,2}[:.]\\d{2}\\s*[-–—]\\s*\\d{1,2}[:.]\\d{2}";
// A value is one or more time spans (a lunch break splits them), or a closed marker.
const VALUE = `(?:${SPAN}(?:\\s*[/·,;]\\s*${SPAN})*|зачинено|вихідн\\S*|цілодобово)`;
const ROW = new RegExp(`(${LABEL})\\s*[-–—:]?\\s*(${VALUE})`, 'giu');

/** Turn a free-form hours string into [{days, time}] rows. */
export function parseHours(raw) {
  const norm = String(raw).replace(/\s+/gu, ' ').trim();
  const rows = [];
  for (const m of norm.matchAll(ROW)) {
    rows.push({ days: tidyDays(m[1]), time: tidyTime(m[2]) });
  }
  // Nothing matched the day/time shape (e.g. "За попереднім записом") —
  // keep the original text as a single unlabelled row.
  return rows.length ? rows : [{ days: '', time: norm }];
}

const tidyDays = d =>
  d.replace(/\s*[-–—]\s*/gu, '–')
   .replace(/\s*,\s*/gu, ', ')
   .replace(/\bВс\b/u, 'Нд').replace(/Вс$/u, 'Нд')
   .replace(/^./u, c => c.toUpperCase());

const tidyTime = t =>
  t.replace(/(\d)\s*[-–—]\s*(\d)/gu, '$1–$2')
   .replace(/\b(\d):(\d{2})/gu, '0$1:$2')
   .replace(/\s*[/·,;]\s*/gu, ' · ')
   .replace(/^вихідн\S*$/iu, 'зачинено')
   .replace(/[;,.\s]+$/u, '');
