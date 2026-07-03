// Підвантаження змінних із кореневих .env.local / .env у process.env — без
// залежностей. Значення, що ВЖЕ є в оточенні (напр. передані inline), не
// перезаписуються. Дає змогу просто робити `npm start` без ручного export.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../.."); // server/assistant -> корінь проєкту

function parseAndApply(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return; // файлу немає — не проблема
  }
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key || key in process.env) continue; // не чіпаємо вже задане
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

// .env.local має пріоритет, тож читаємо його першим (перше значення виграє).
parseAndApply(path.join(root, ".env.local"));
parseAndApply(path.join(root, ".env"));
