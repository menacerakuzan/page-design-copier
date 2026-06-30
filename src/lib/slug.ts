const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
};

/** Transliterate Ukrainian → ASCII and produce a URL-safe slug. */
export const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[а-яіїєґь]/g, (c) => CYRILLIC_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
