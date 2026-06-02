// ─── Page section configuration ──────────────────────────────────────────────

export type PageEntityType =
  | "district"
  | "city"
  | "attraction"
  | "event"
  | "restaurant"
  | "hotel";

// All possible section block types across entity pages
export type PageSectionKind =
  // shared
  | "description"          // Rich text description block
  | "gallery"              // Image gallery / slideshow
  | "map"                  // Embedded map (Google / OSM)
  | "custom_text"          // Free-form Markdown/rich text
  // district & city
  | "cities_list"          // Grid/carousel of cities (district only)
  | "places_attraction"    // Carousel of attraction cards
  | "places_event"         // Carousel of event cards
  | "places_restaurant"    // Carousel of restaurant cards
  | "places_hotel"         // Carousel of hotel cards
  // place-specific
  | "contact_info"         // Address, phone, website
  | "hours"                // Working hours / schedule
  | "event_dates"          // Event date range + ticket info
  | "amenities"            // Hotel/restaurant amenities list
  | "menu_link"            // Link to menu (restaurant)
  | "related_events"       // Nearby or related events
  | "related_attractions"  // Nearby attractions
  | "related_restaurants"  // Nearby restaurants
  | "related_hotels"       // Nearby hotels
  | "ticket_info"          // Where to buy tickets (event)
  | "video"                // Embedded video block
  | "quote"                // Pull-quote / highlight text
  | "stat_strip"           // 3-4 statistics / facts row
  | "divider";             // Visual divider

export const SECTION_KIND_META: Record<PageSectionKind, { label: string; description: string; icon: string; applicableTo: PageEntityType[] }> = {
  description:         { label: "Опис",                   description: "Текстовий блок з описом",                     icon: "AlignLeft",     applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  gallery:             { label: "Галерея",                description: "Карусель зображень",                          icon: "Image",         applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  map:                 { label: "Карта",                  description: "Вбудована карта Google Maps",                 icon: "Map",           applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  custom_text:         { label: "Вільний текст",          description: "Довільний текстовий блок",                    icon: "FileText",      applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  cities_list:         { label: "Міста",                  description: "Карточки міст, пов'язаних з районом",         icon: "Building2",     applicableTo: ["district"] },
  places_attraction:   { label: "Тур. об'єкти",           description: "Карусель туристичних об'єктів",               icon: "Landmark",      applicableTo: ["district","city"] },
  places_event:        { label: "Події",                  description: "Карусель подій",                              icon: "Calendar",      applicableTo: ["district","city"] },
  places_restaurant:   { label: "Ресторани",              description: "Карусель ресторанів",                         icon: "UtensilsCrossed",applicableTo: ["district","city"] },
  places_hotel:        { label: "Готелі",                 description: "Карусель готелів",                            icon: "BedDouble",     applicableTo: ["district","city"] },
  contact_info:        { label: "Контакти",               description: "Адреса, телефон, сайт",                       icon: "Phone",         applicableTo: ["attraction","event","restaurant","hotel"] },
  hours:               { label: "Години роботи",          description: "Розклад роботи",                              icon: "Clock",         applicableTo: ["restaurant","hotel","attraction"] },
  event_dates:         { label: "Дати події",             description: "Дати проведення та деталі",                   icon: "CalendarDays",  applicableTo: ["event"] },
  amenities:           { label: "Зручності",              description: "Послуги та зручності",                        icon: "Star",          applicableTo: ["hotel","restaurant"] },
  menu_link:           { label: "Меню",                   description: "Посилання на меню ресторану",                  icon: "BookOpen",      applicableTo: ["restaurant"] },
  related_events:      { label: "Пов'язані події",        description: "Блок з картками подій",                       icon: "Calendar",      applicableTo: ["attraction","restaurant","hotel"] },
  related_attractions: { label: "Поряд: пам'ятки",        description: "Туристичні об'єкти поруч",                    icon: "Landmark",      applicableTo: ["event","restaurant","hotel"] },
  related_restaurants: { label: "Поряд: ресторани",       description: "Ресторани поруч",                             icon: "UtensilsCrossed",applicableTo: ["attraction","event","hotel"] },
  related_hotels:      { label: "Поряд: готелі",          description: "Готелі поруч",                                icon: "BedDouble",     applicableTo: ["attraction","event","restaurant"] },
  ticket_info:         { label: "Де придбати квитки",     description: "Інформація про квитки",                       icon: "Ticket",        applicableTo: ["event"] },
  video:               { label: "Відео",                  description: "Відеоблок або ролик",                          icon: "PlayCircle",    applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  quote:               { label: "Цитата / виноска",       description: "Виділена цитата або слоган",                  icon: "Quote",         applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  stat_strip:          { label: "Факти / статистика",     description: "Стрічка з 3-4 фактами або цифрами",           icon: "BarChart2",     applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
  divider:             { label: "Розділювач",             description: "Візуальний розділювач секцій",                icon: "Minus",         applicableTo: ["district","city","attraction","event","restaurant","hotel"] },
};

// ─── Per-section item filter (which specific entities to show) ─────────────────
export type SectionFilter = {
  /** If set — show only these specific entity IDs (empty array = show all related) */
  entityIds?: string[];
  /** Max number of items to display */
  limit?: number;
};

// ─── A single section block on a page ──────────────────────────────────────────
export type PageSection = {
  id: string;
  kind: PageSectionKind;
  /** Display title for this block (can be customised) */
  title: string;
  /** Optional subtitle or description shown in the section header */
  subtitle?: string;
  /** Background colour (CSS hex or var) */
  bgColor?: string;
  /** Text colour override */
  textColor?: string;
  visible: boolean;
  sortOrder: number;
  /** Entity-level filter for list sections */
  filter?: SectionFilter;
  /** Free-form extra payload for custom blocks */
  payload?: Record<string, string>;
};

// ─── Config for a whole entity page ────────────────────────────────────────────
export type PageConfig = {
  id: string;
  /** "district" | "city" | "attraction" | "event" | "restaurant" | "hotel" */
  entityType: PageEntityType;
  /**
   * "default" = applied to ALL entities of this type as a base template;
   * specific entity ID = overrides the default for that specific entity
   */
  entityId: string;
  sections: PageSection[];
  updatedAt: string;
};

// ─── Default section templates ──────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_SECTIONS: Record<PageEntityType, Omit<PageSection, "id">[]> = {
  district: [
    { kind: "description",       title: "Про район",            visible: true, sortOrder: 1 },
    { kind: "cities_list",       title: "Міста",                visible: true, sortOrder: 2, bgColor: "#ffdfc6" },
    { kind: "places_attraction", title: "Туристичні об'єкти",   visible: true, sortOrder: 3, bgColor: "#001a3d" },
    { kind: "places_event",      title: "Події",                visible: true, sortOrder: 4, bgColor: "#3d0820" },
    { kind: "places_restaurant", title: "Ресторани",            visible: true, sortOrder: 5, bgColor: "#2a1200" },
    { kind: "places_hotel",      title: "Готелі",               visible: true, sortOrder: 6, bgColor: "#062820" },
  ],
  city: [
    { kind: "description",       title: "Про місто",            visible: true, sortOrder: 1 },
    { kind: "places_attraction", title: "Туристичні об'єкти",   visible: true, sortOrder: 2, bgColor: "#001a3d" },
    { kind: "places_event",      title: "Події",                visible: true, sortOrder: 3, bgColor: "#3d0820" },
    { kind: "places_restaurant", title: "Ресторани",            visible: true, sortOrder: 4, bgColor: "#2a1200" },
    { kind: "places_hotel",      title: "Готелі",               visible: true, sortOrder: 5, bgColor: "#062820" },
  ],
  attraction: [
    { kind: "description",       title: "Про об'єкт",           visible: true, sortOrder: 1 },
    { kind: "contact_info",      title: "Контакти",             visible: true, sortOrder: 2 },
    { kind: "map",               title: "Карта",                visible: true, sortOrder: 3 },
    { kind: "gallery",           title: "Галерея",              visible: true, sortOrder: 4 },
    { kind: "related_events",    title: "Пов'язані події",      visible: true, sortOrder: 5, bgColor: "#3d0820" },
    { kind: "related_restaurants",title: "Ресторани поруч",     visible: true, sortOrder: 6, bgColor: "#2a1200" },
    { kind: "related_hotels",    title: "Готелі поруч",         visible: true, sortOrder: 7, bgColor: "#062820" },
  ],
  event: [
    { kind: "description",       title: "Про подію",            visible: true, sortOrder: 1 },
    { kind: "event_dates",       title: "Дати та деталі",       visible: true, sortOrder: 2 },
    { kind: "contact_info",      title: "Контакти",             visible: true, sortOrder: 3 },
    { kind: "map",               title: "Місце проведення",     visible: true, sortOrder: 4 },
    { kind: "ticket_info",       title: "Квитки",               visible: true, sortOrder: 5 },
    { kind: "gallery",           title: "Галерея",              visible: true, sortOrder: 6 },
    { kind: "related_attractions",title: "Пам'ятки поруч",      visible: true, sortOrder: 7, bgColor: "#001a3d" },
  ],
  restaurant: [
    { kind: "description",       title: "Про заклад",           visible: true, sortOrder: 1 },
    { kind: "contact_info",      title: "Контакти",             visible: true, sortOrder: 2 },
    { kind: "hours",             title: "Години роботи",        visible: true, sortOrder: 3 },
    { kind: "amenities",         title: "Зручності",            visible: true, sortOrder: 4 },
    { kind: "menu_link",         title: "Меню",                 visible: true, sortOrder: 5 },
    { kind: "map",               title: "Карта",                visible: true, sortOrder: 6 },
    { kind: "gallery",           title: "Галерея",              visible: true, sortOrder: 7 },
    { kind: "related_hotels",    title: "Готелі поруч",         visible: false, sortOrder: 8, bgColor: "#062820" },
  ],
  hotel: [
    { kind: "description",       title: "Про готель",           visible: true, sortOrder: 1 },
    { kind: "contact_info",      title: "Контакти",             visible: true, sortOrder: 2 },
    { kind: "amenities",         title: "Зручності та послуги", visible: true, sortOrder: 3 },
    { kind: "map",               title: "Карта",                visible: true, sortOrder: 4 },
    { kind: "gallery",           title: "Галерея",              visible: true, sortOrder: 5 },
    { kind: "related_attractions",title: "Пам'ятки поруч",      visible: true, sortOrder: 6, bgColor: "#001a3d" },
    { kind: "related_restaurants",title: "Ресторани поруч",     visible: true, sortOrder: 7, bgColor: "#2a1200" },
    { kind: "related_events",    title: "Найближчі події",      visible: false, sortOrder: 8, bgColor: "#3d0820" },
  ],
};

export const makeDefaultConfig = (entityType: PageEntityType, entityId: string): PageConfig => ({
  id: `${entityType}-${entityId}-${uid()}`,
  entityType,
  entityId,
  sections: DEFAULT_SECTIONS[entityType].map(s => ({ ...s, id: uid() })),
  updatedAt: new Date().toISOString(),
});
