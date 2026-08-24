import { useEffect } from "react";

const SITE_NAME = "Одещина";
const DEFAULT_IMAGE = "https://tourism.od.gov.ua/og-image.jpg";

function setMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(path: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", `https://tourism.od.gov.ua${path}`);
}

const VIDEO_SCHEMA_ATTR = "data-video-schema";

// Google Search Console позначав відео сайту як "не на сторінці перегляду" —
// без розмітки schema.org/VideoObject пошуковик натрапляє на сам файл mp4 при
// обході сторінки, але не може достовірно повʼязати його саме з цією
// сторінкою. contentUrl прямо каже: це відео належить цій сторінці.
function setVideoSchema(video: { url: string; name: string; description?: string; thumbnail: string } | undefined) {
  document.head.querySelectorAll(`script[${VIDEO_SCHEMA_ATTR}]`).forEach((el) => el.remove());
  if (!video?.url) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute(VIDEO_SCHEMA_ATTR, "1");
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description || video.name,
    thumbnailUrl: [video.thumbnail],
    contentUrl: video.url,
    embedUrl: window.location.href,
  });
  document.head.appendChild(script);
}

export type BreadcrumbItem = { name: string; path: string };

const CRUMBS_SCHEMA_ATTR = "data-breadcrumbs-schema";

// BreadcrumbList підказує Google ієрархію сайту (Головна › Район › Місто) —
// це те, що робить сторінку "гідною" показу хлібних крихт замість голого URL
// прямо в результатах пошуку, і взагалі допомагає пошуковику зрозуміти
// структуру сайту (той самий сигнал, що частково формує sitelinks).
function setBreadcrumbSchema(crumbs: BreadcrumbItem[] | undefined) {
  document.head.querySelectorAll(`script[${CRUMBS_SCHEMA_ATTR}]`).forEach((el) => el.remove());
  if (!crumbs?.length) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute(CRUMBS_SCHEMA_ATTR, "1");
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `https://tourism.od.gov.ua${c.path}`,
    })),
  });
  document.head.appendChild(script);
}

const ENTITY_SCHEMA_ATTR = "data-entity-schema";

// Довільна розмітка типу сторінки (TouristAttraction/Restaurant/LodgingBusiness/
// Event) — саме за такими типами Google формує "багаті" картки для туристичних
// сайтів (адреса, години роботи, координати на карті прямо у видачі).
function setEntitySchema(entity: Record<string, unknown> | undefined) {
  document.head.querySelectorAll(`script[${ENTITY_SCHEMA_ATTR}]`).forEach((el) => el.remove());
  if (!entity) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute(ENTITY_SCHEMA_ATTR, "1");
  script.text = JSON.stringify({ "@context": "https://schema.org", ...entity });
  document.head.appendChild(script);
}

/**
 * Пер-сторінкові <title>/description/OG — за замовчуванням усі маршрути
 * SPA віддають ОДНАКОВИЙ статичний <title>Одещина</title> з index.html, тож
 * пошуковики (і превʼю в месенджерах при шарінгу конкретної сторінки) не
 * бачать різниці між районом, об'єктом і головною. Викликати на кожній
 * контентній сторінці з унікальними title/description.
 */
export function useSeo({
  title,
  description,
  image,
  lang,
  videoUrl,
  breadcrumbs,
  entitySchema,
}: {
  title: string;
  description?: string;
  image?: string;
  lang?: "uk" | "en";
  /** Головне відео сторінки (рілс) — якщо є, додає schema.org/VideoObject. */
  videoUrl?: string;
  /** Ланцюжок "Головна › Район › ..." для BreadcrumbList. */
  breadcrumbs?: BreadcrumbItem[];
  /** Готовий об'єкт schema.org (без @context) — TouristAttraction/Restaurant/... */
  entitySchema?: Record<string, unknown>;
}) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
    document.title = fullTitle;
    setMeta("property", "og:title", fullTitle);
    setMeta("name", "twitter:title", fullTitle);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
      setMeta("name", "twitter:description", description);
    }
    setMeta("property", "og:image", image || DEFAULT_IMAGE);
    setMeta("name", "twitter:image", image || DEFAULT_IMAGE);
    setMeta("property", "og:url", window.location.href);
    setCanonical(window.location.pathname);
    document.documentElement.lang = lang === "en" ? "en" : "uk";
    setVideoSchema(videoUrl ? { url: videoUrl, name: fullTitle, description, thumbnail: image || DEFAULT_IMAGE } : undefined);
    setBreadcrumbSchema(breadcrumbs);
    setEntitySchema(entitySchema);

    return () => {
      setVideoSchema(undefined);
      setBreadcrumbSchema(undefined);
      setEntitySchema(undefined);
    };
  }, [title, description, image, lang, videoUrl, breadcrumbs, entitySchema]);
}
