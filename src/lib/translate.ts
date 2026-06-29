export async function translateText(text: string, from = "uk", to = "en"): Promise<string> {
  if (!text?.trim()) return "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translate request failed");
  const data = await res.json() as Array<Array<Array<string>>>;
  return data[0].map((chunk) => chunk[0]).join("");
}

// Перекладає HTML зберігаючи теги — витягує текстові вузли, перекладає, вставляє назад
export async function translateHtml(html: string, from = "uk", to = "en"): Promise<string> {
  if (!html?.trim()) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const textNodes: Text[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      textNodes.push(node as Text);
    } else {
      node.childNodes.forEach(walk);
    }
  };
  walk(doc.body);

  await Promise.all(textNodes.map(async (node) => {
    const translated = await translateText(node.textContent!, from, to);
    node.textContent = translated;
  }));

  return doc.body.innerHTML;
}

export async function translateFields<T extends Record<string, string>>(
  fields: T,
  from = "uk",
  to = "en",
): Promise<T> {
  const entries = Object.entries(fields).filter(([, v]) => v.trim());
  const results = await Promise.all(
    entries.map(async ([key, value]) => [key, await translateText(value, from, to)] as const),
  );
  return Object.fromEntries(results) as T;
}
