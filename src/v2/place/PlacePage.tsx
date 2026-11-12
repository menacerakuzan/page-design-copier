import "@/v2/v2.css";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import type { TourismObjectType } from "@/types/hierarchy";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { objectDetailPath } from "@/lib/entityLinks";
import NotFound from "@/pages/NotFound";
import { plain, useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { GridBackdrop } from "@/v2/districts/parts";
import { usePlacePage } from "./usePlacePage";
import { PlaceSpread } from "./VariantSpread";

/** Тип schema.org для «багатих» карток Google (як на старій сторінці). */
const SCHEMA: Record<TourismObjectType, string> = {
  attraction: "TouristAttraction",
  restaurant: "Restaurant",
  hotel: "LodgingBusiness",
  event: "TouristAttraction",
};

/**
 * Сторінка туристичного об'єкта (місце, подія, ресторан, готель), вигляд
 * «Розворот» (обраний власником). Невибрані «Путівник» і «Фотоплівка» та
 * сторінка порівняння — у useful/v2/place/.
 */
function PlaceBody({ type, slug }: { type: TourismObjectType; slug: string | undefined }) {
  const { t, tl, lang } = useV2();
  const data = usePlacePage(type, slug);
  const o = data.o;

  // Перехід з місця на місце («Поруч») — на початок сторінки.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  const desc = o ? data.subtitle || plain(tl(o.description, o.descriptionEn)).slice(0, 200) : undefined;
  useSeo({
    title: data.name || t("navDistricts"),
    description: desc,
    image: o?.imageUrl,
    lang,
    videoUrl: o?.reelUrl,
    breadcrumbs: o
      ? [
          { name: t("home"), path: "/" },
          { name: t("navDistricts"), path: "/districts" },
          ...(data.district ? [{ name: data.district.name, path: `/raion/${data.district.slug}` }] : []),
          ...(data.city ? [{ name: data.cityName, path: `/napryamky/${data.city.slug}` }] : []),
          { name: data.name, path: objectDetailPath(type, o.slug) },
        ]
      : undefined,
    entitySchema: o
      ? {
          "@type": SCHEMA[type],
          name: data.name,
          description: desc || data.name,
          image: o.imageUrl,
          url: `https://tourism.od.gov.ua${objectDetailPath(type, o.slug)}`,
          ...(o.address ? { address: { "@type": "PostalAddress", streetAddress: tl(o.address, o.addressEn), addressCountry: "UA" } } : {}),
          ...(o.phone ? { telephone: o.phone } : {}),
          ...(data.coords ? { geo: { "@type": "GeoCoordinates", latitude: data.coords.lat, longitude: data.coords.lng } } : {}),
        }
      : undefined,
  });

  if (!data.loading && !o) return <NotFound />;

  return (
    <div className="v2 min-h-screen">
      {/* Сторінка починається з фото на весь екран — шапка поверх нього */}
      <Header overHero />
      <main key={`${type}-${slug}`} id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <GridBackdrop opacity={0.05} />
        <div className="relative">
          {!o ? (
            <div className="flex justify-center py-40">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : (
            <PlaceSpread data={data} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Нова сторінка туристичного об'єкта (/mistse/:slug, /podiyi/:slug,
 * /restorany/:slug, /hoteli/:slug). Стара src/pages/EntityDetail лишається до
 * кінця редизайну.
 */
export default function PlacePage({ type }: { type: TourismObjectType }) {
  const { slug } = useParams();
  return <PlaceBody type={type} slug={slug} />;
}
