/**
 * Вивантаження постерів. Модуль важкий (qrcode, jsPDF, JSZip), тому його
 * підвантажують динамічно лише в момент натискання кнопки — у загальний
 * бандл сайту він не потрапляє.
 */
import { renderPoster } from "./render";
import { posterFileBase, type PosterItem } from "./item";

export { renderPoster } from "./render";

const toBlob = (canvas: HTMLCanvasElement, type = "image/png", quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Не вдалося створити зображення"))), type, quality));

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Один постер у PNG 2480×3508 (A4, 300 dpi). */
export async function downloadPosterPng(item: PosterItem) {
  const canvas = await renderPoster(item, 2);
  saveBlob(await toBlob(canvas), `${posterFileBase(item)}.png`);
}

/** Прев'ю для адмінки — менша роздільність, щоб не гальмувати інтерфейс. */
export async function posterPreviewUrl(item: PosterItem, scale = 0.5) {
  const canvas = await renderPoster(item, scale);
  return URL.createObjectURL(await toBlob(canvas));
}

type Progress = (done: number, total: number) => void;

/** Між постерами віддаємо керування браузеру — інтерфейс не зависає на великих добірках. */
const yieldToUi = () => new Promise(r => setTimeout(r, 0));

/** Багатосторінковий PDF A4 — один постер на сторінку, готовий до друку. */
export async function downloadPostersPdf(items: PosterItem[], onProgress?: Progress, fileName = "qr-postery.pdf") {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.setProperties({ title: "QR-постери — tourism.od.gov.ua" });
  for (let i = 0; i < items.length; i++) {
    if (i) pdf.addPage("a4", "portrait");
    const canvas = await renderPoster(items[i], 2);
    // JPEG ~0.95 замість PNG: на однотонному макеті різниці на друку не видно,
    // а файл на десятки постерів стає в рази меншим і відкривається швидше.
    const bytes = new Uint8Array(await (await toBlob(canvas, "image/jpeg", 0.95)).arrayBuffer());
    pdf.addImage(bytes, "JPEG", 0, 0, 210, 297, undefined, "NONE");
    onProgress?.(i + 1, items.length);
    await yieldToUi();
  }
  saveBlob(pdf.output("blob"), fileName);
}

/** ZIP з окремими PNG — для типографії чи для розсилки об'єктам. */
export async function downloadPostersZip(items: PosterItem[], onProgress?: Progress, fileName = "qr-postery.zip") {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (let i = 0; i < items.length; i++) {
    const canvas = await renderPoster(items[i], 2);
    zip.file(`${posterFileBase(items[i], i + 1)}.png`, await toBlob(canvas));
    onProgress?.(i + 1, items.length);
    await yieldToUi();
  }
  // PNG уже стиснутий — повторне стискання лише гає час.
  saveBlob(await zip.generateAsync({ type: "blob", compression: "STORE" }), fileName);
}
