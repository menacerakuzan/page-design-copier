export async function translateText(text: string, from = "uk", to = "en"): Promise<string> {
  if (!text?.trim()) return "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translate request failed");
  const data = await res.json() as Array<Array<Array<string>>>;
  return data[0].map((chunk) => chunk[0]).join("");
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
