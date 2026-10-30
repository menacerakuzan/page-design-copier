/**
 * Рядок репертуару: "01.10 – Назва вистави – 18:00".
 *
 * Раніше рядок ділився лише по довгому тире «—». Але контент-менеджери
 * вводять і коротке «–», і дефіс «-» — тоді поділу не відбувалось, і весь
 * рядок потрапляв і в плашку з датою, і в назву (текст дублювався). А тире
 * всередині назви («Ісус Христос — суперзірка») навпаки різало назву навпіл.
 *
 * Тому розбираємо за СТРУКТУРОЮ, а не за символом: дата — на початку
 * рядка, час — у кінці, усе між ними — назва (разом з будь-якими тире в ній).
 */
const DATE_AT_START = /^(\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?)\s*[-–—]?\s*/;
const TIME_AT_END = /\s*[-–—]?\s*(\d{1,2}:\d{2}(?:\s*[-–—]\s*\d{1,2}:\d{2})?)$/;

export function parseRepertoire(text: string): { date: string; title: string; time: string }[] {
  return text.split("\n").flatMap(raw => {
    let rest = raw.trim();
    if (!rest) return [];
    let date = "";
    let time = "";
    const d = rest.match(DATE_AT_START);
    if (d) { date = d[1]; rest = rest.slice(d[0].length); }
    const t = rest.match(TIME_AT_END);
    if (t && t.index !== undefined) { time = t[1].replace(/\s*[-–—]\s*/, "–"); rest = rest.slice(0, t.index); }
    const title = rest.replace(/^[\s\-–—]+|[\s\-–—]+$/g, "");
    // Рядок без розпізнаної назви (напр. лише дата) лишаємо як назву цілком,
    // щоб нічого з того, що ввів менеджер, не зникло.
    if (!title) return date || time ? [{ date: "", title: raw.trim(), time: "" }] : [];
    return [{ date, title, time }];
  });
}
