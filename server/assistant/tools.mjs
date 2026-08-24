// Опис інструментів (OpenAI function calling) + виконавці на боці сервера.
//
// districtSlug/citySlug НЕ справжні URL-slug'и (ті латиницею, напр.
// "bolhradskyy-rayon", і модель їх ніколи не бачила) — це україномовна назва
// району/міста. Раніше параметр так і звався ("slug"), що саме по собі
// підштовхувало модель вигадувати щось на кшталт "bolgrad" замість
// "Болградський", і пошук мовчки повертав 0 об'єктів. Тепер: (1) явно просимо
// україномовну назву в описі, і (2) де можливо — enum з РЕАЛЬНИХ назв із
// каталогу, щоб модель фізично не могла передати щось інше.

import { searchObjects, getObjectDetails } from "./catalog.mjs";

// toolDefs будується per-request (динамічно, з актуальним каталогом), а не як
// статичний const — бо enum районів/міст має відповідати реальним даним.
export function buildToolDefs(catalog) {
  const districtNames = [...new Set((catalog?.districts ?? []).map((d) => d.name).filter(Boolean))];
  const cityNames = [...new Set((catalog?.cities ?? []).map((c) => c.name).filter(Boolean))];
  const tourismTypeNames = [...new Set(catalog?.tourismTypes ?? [])];

  return [
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
            tourismType: tourismTypeNames.length
              ? {
                  type: "string",
                  enum: tourismTypeNames,
                  description:
                    "Точна категорія туризму зі списку (НЕ вигадуй підтеми на кшталт 'органічні продукти' чи " +
                    "'екологічні продукти' — їх нема в даних, це лише зашумить пошук і поверне 0 результатів; " +
                    "натомість обирай найближчу реальну категорію зі списку, напр. 'Гастрономічний туризм'). " +
                    "Якщо не впевнений — краще взагалі не передавай цей параметр і поклався на query.",
                }
              : {
                  type: "string",
                  description: "Категорія/вид туризму (напр. 'історичний', 'активний', 'гастрономічний').",
                },
            districtSlug: districtNames.length
              ? { type: "string", enum: districtNames, description: "Точна назва району українською зі списку (НЕ вигадуй і не транслітеруй)." }
              : { type: "string", description: "Назва району українською." },
            citySlug: cityNames.length
              ? { type: "string", enum: cityNames, description: "Точна назва населеного пункту українською зі списку (НЕ вигадуй і не транслітеруй)." }
              : { type: "string", description: "Назва населеного пункту українською." },
            limit: { type: "integer", minimum: 1, maximum: 20, description: "Скільки об'єктів повернути (за замовч. 8)." },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_object_details",
        description:
          "ПОВНА інформація про один конкретний об'єкт: розгорнутий опис, історія, деталі, контакти, години. " +
          "ЗАВЖДИ викликай для будь-якого поглибленого питання про названий об'єкт ('розкажи більше', 'яка історія', " +
          "'що там є', адреса/телефон/години) — search_objects повертає лише короткий сніпет, повний текст ТІЛЬКИ тут. " +
          "Ніколи не відповідай 'у базі немає інформації' про конкретний об'єкт, не викликавши цей інструмент.",
        parameters: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "Slug об'єкта з search_objects, або точна назва об'єкта українською, якщо slug невідомий.",
            },
          },
          required: ["slug"],
          additionalProperties: false,
        },
      },
    },
  ];
}

// Виконати виклик інструмента за іменем. Повертає рядок (JSON) для tool-повідомлення.
export async function runTool(name, args) {
  if (name === "search_objects") {
    const result = await searchObjects(args || {});
    return JSON.stringify(result);
  }
  if (name === "get_object_details") {
    const result = await getObjectDetails(args?.slug || "");
    return JSON.stringify(result);
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

// Людяний статус-лейбл для індикатора обдумування під час роботи інструмента.
export function toolStatusLabel(name, lang = "uk") {
  if (name === "search_objects") {
    return lang === "en" ? "Searching places… 🔎" : "Шукаю варіанти… 🔎";
  }
  if (name === "get_object_details") {
    return lang === "en" ? "Reading details… 📖" : "Читаю деталі… 📖";
  }
  return lang === "en" ? "Working… ⚙️" : "Обробляю… ⚙️";
}
