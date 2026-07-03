// Парсер inline-директив у відповіді асистента. Директиви — це «генеративний UI»:
// модель вставляє їх у текст, а фронтенд рендерить реальні картки/кнопки/чіпси
// (дані беруться з БД-snapshot, не з моделі).
//
//   [[obj:SLUG]]
//   [[route: slug1, slug2 | Назва маршруту]]
//   [[chips: Варіант A | Варіант B]]

export type AssistantSegment =
  | { kind: "text"; text: string }
  | { kind: "obj"; slug: string }
  | { kind: "route"; slugs: string[]; title: string }
  | { kind: "chips"; options: string[] };

const DIRECTIVE_RE = /\[\[(obj|route|chips):([\s\S]*?)\]\]/g;

export function parseAssistantMessage(input: string): AssistantSegment[] {
  const segments: AssistantSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  DIRECTIVE_RE.lastIndex = 0;
  while ((m = DIRECTIVE_RE.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ kind: "text", text: input.slice(last, m.index) });
    }
    const kind = m[1];
    const body = m[2].trim();

    if (kind === "obj") {
      const slug = body.split(/[\s|,]/)[0].trim();
      if (slug) segments.push({ kind: "obj", slug });
    } else if (kind === "route") {
      const [left, right = ""] = body.split("|");
      const slugs = left
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (slugs.length) segments.push({ kind: "route", slugs, title: right.trim() });
    } else if (kind === "chips") {
      const options = body
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (options.length) segments.push({ kind: "chips", options });
    }
    last = DIRECTIVE_RE.lastIndex;
  }

  if (last < input.length) {
    segments.push({ kind: "text", text: input.slice(last) });
  }
  return segments;
}
