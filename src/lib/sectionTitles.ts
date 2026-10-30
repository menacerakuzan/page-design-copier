/**
 * Переклад заголовків секцій сторінок на англійську.
 *
 * Заголовок секції приходить або з шаблону DEFAULT_SECTIONS (код), або з
 * page_configs у БД, куди його зберіг адміністратор — і в обох випадках це
 * український рядок. Тому словник ключується САМЕ українським текстом: так
 * переклад працює і для дефолтів, і для вже збережених в базі конфігів, без
 * жодної міграції даних.
 *
 * Якщо адміністратор написав власний заголовок, якого немає в словнику —
 * повертаємо його як є (краще показати українською, ніж загубити текст).
 */
const SECTION_TITLE_EN: Record<string, string> = {
  // Район / місто
  "Про район": "About the district",
  "Про місто": "About the city",
  "Про село": "About the village",
  "Про селище": "About the settlement",
  "Населені пункти": "Settlements",
  "Міста": "Settlements",
  // Спільні
  "Туристичні об'єкти": "Attractions",
  "Події": "Events",
  "Ресторани": "Restaurants",
  "Готелі": "Hotels",
  "Контакти": "Contacts",
  "Карта": "Map",
  "Галерея": "Gallery",
  "Години роботи": "Opening hours",
  "Зручності": "Amenities",
  "Меню": "Menu",
  // Об'єкт
  "Про об'єкт": "About the place",
  "Пов'язані події": "Related events",
  "Ресторани поруч": "Restaurants nearby",
  "Готелі поруч": "Hotels nearby",
  "Пам'ятки поруч": "Attractions nearby",
  // Подія
  "Про подію": "About the event",
  "Дати та деталі": "Dates and details",
  "Місце проведення": "Venue",
  "Квитки": "Tickets",
  // Заклад / готель
  "Про заклад": "About the venue",
  "Про готель": "About the hotel",
  "Зручності та послуги": "Amenities and services",
  "Найближчі події": "Upcoming events",
};

export function sectionTitle(title: string | null | undefined, lang: "uk" | "en"): string {
  if (!title) return "";
  if (lang !== "en") return title;
  return SECTION_TITLE_EN[title.trim()] ?? title;
}

/**
 * Переклад назв видів туризму. Значення зберігаються в БД українською
 * (tourism_objects.tourism_types), тому словник так само ключується
 * українським рядком і не потребує міграції даних.
 */
const TOURISM_TYPE_EN: Record<string, string> = {
  "Гастрономічний туризм": "Gastronomic tourism",
  "Історико-культурний туризм": "Historical and cultural tourism",
  "Медико-оздоровчий туризм": "Health and wellness tourism",
  "Морський туризм": "Coastal tourism",
  "Релігійний туризм": "Religious tourism",
  "Розважальний туризм": "Entertainment tourism",
  "Сільський та зелений туризм": "Rural and green tourism",
  "Спортивний туризм": "Sports tourism",
};

export function tourismTypeLabel(name: string | null | undefined, lang: "uk" | "en"): string {
  if (!name) return "";
  if (lang !== "en") return name;
  return TOURISM_TYPE_EN[name.trim()] ?? name;
}
