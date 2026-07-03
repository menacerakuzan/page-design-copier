// Опис інструментів (OpenAI function calling) + виконавці на боці сервера.

import { searchObjects } from "./catalog.mjs";

export const toolDefs = [
  {
    type: "function",
    function: {
      name: "search_objects",
      description:
        "Пошук реальних туристичних об'єктів у базі Одещини (місця, події, ресторани, готелі). " +
        "Використовуй перед тим, як радити будь-що. Повертає компактний список зі slug — саме ці slug вставляй у директиви [[obj:slug]].",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Ключові слова: назва, тема, вподобання (напр. 'море пляж', 'замок історія').",
          },
          type: {
            type: "string",
            enum: ["attraction", "event", "restaurant", "hotel"],
            description: "Тип об'єкта.",
          },
          tourismType: {
            type: "string",
            description: "Категорія/вид туризму (напр. 'історичний', 'активний', 'гастрономічний').",
          },
          districtSlug: { type: "string", description: "Slug району для звуження пошуку." },
          citySlug: { type: "string", description: "Slug населеного пункту для звуження пошуку." },
          limit: { type: "integer", minimum: 1, maximum: 20, description: "Скільки об'єктів повернути (за замовч. 8)." },
        },
        additionalProperties: false,
      },
    },
  },
];

// Виконати виклик інструмента за іменем. Повертає рядок (JSON) для tool-повідомлення.
export async function runTool(name, args) {
  if (name === "search_objects") {
    const result = await searchObjects(args || {});
    return JSON.stringify(result);
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

// Людяний статус-лейбл для індикатора обдумування під час роботи інструмента.
export function toolStatusLabel(name, lang = "uk") {
  if (name === "search_objects") {
    return lang === "en" ? "Searching places… 🔎" : "Шукаю варіанти… 🔎";
  }
  return lang === "en" ? "Working… ⚙️" : "Обробляю… ⚙️";
}
