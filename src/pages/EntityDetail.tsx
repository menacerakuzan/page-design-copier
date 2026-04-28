import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { useParams } from "react-router-dom";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";
import { CONTENT_THEMES } from "@/config/contentThemes";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import NotFound from "@/pages/NotFound";

const tabsByType = {
  event: [
    { id: "overview", label: "Опис" },
    { id: "info", label: "Інформація" },
    { id: "contacts", label: "Контакти" },
  ],
  hotel: [
    { id: "overview", label: "Опис" },
    { id: "info", label: "Інформація" },
    { id: "contacts", label: "Контакти" },
  ],
  restaurant: [
    { id: "overview", label: "Опис" },
    { id: "info", label: "Інформація" },
    { id: "contacts", label: "Контакти" },
  ],
} as const;

const titleByType = {
  event: "Подія",
  hotel: "Готель",
  restaurant: "Ресторан",
} as const;

type PageType = "event" | "hotel" | "restaurant";

const EntityDetail = ({ type }: { type: PageType }) => {
  const params = useParams();
  const slug = params.slug ?? "";
  const pageKey = `detail-${type}-${slug}`;
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { data: snapshot } = useHierarchySnapshot();
  const { data: cardsData } = usePageContentCards(pageKey);
  const theme = CONTENT_THEMES[type];

  const object = useMemo(
    () => snapshot?.objects.find((item) => item.slug === slug && item.type === type),
    [snapshot, slug, type],
  );

  const cards = useMemo(() => {
    return (cardsData ?? []).filter((card) => card.pageKey === pageKey);
  }, [cardsData, pageKey]);

  const heroCard = cards.find((card) => card.sectionKey === "hero");
  const overviewCard = cards.find((card) => card.sectionKey === "overview");
  const infoCards = cards.filter((card) => card.sectionKey === "info").sort((a, b) => a.sortOrder - b.sortOrder);
  const contactCard = cards.find((card) => card.sectionKey === "contacts");

  if (!object) return <NotFound />;

  const city = snapshot?.cities.find((item) => item.id === object.cityId);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };
  const goTo = (id: string) => sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.pageBg, color: theme.text }}>
      <section className="px-4 pb-10 pt-10 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <BackButton to={`/napryamky/${city?.slug ?? "bilhorod-dnistrovskyi"}`} invert />
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-[52px] leading-none md:text-[84px] font-odesa-medium"
          >
            {heroCard?.title ?? object.name}
          </motion.h1>
          <p className="mt-4 text-[22px] text-[#fff2e8]/85 font-odesa-regular">
            {titleByType[type]} <span className="mx-2" style={{ color: theme.accent }}>•</span> {city?.name ?? "Одещина"}
          </p>
        </div>
      </section>

      <section className="sticky top-0 z-40 px-4 py-3 backdrop-blur md:px-10" style={{ backgroundColor: theme.stickyBg }}>
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 text-[16px] md:text-[22px] font-odesa-medium">
            {tabsByType[type].map((tab) => (
              <button key={tab.id} type="button" onClick={() => goTo(tab.id)} className="whitespace-nowrap opacity-85 hover:opacity-100">
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[1fr_430px]">
          <div className="space-y-10">
            <article className="relative overflow-hidden rounded-[28px] border border-[#fff2e8]/20">
              <img
                src={heroCard?.imageUrl ?? "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=2200&q=80"}
                alt={object.name}
                className="h-[300px] w-full object-cover md:h-[620px]"
              />
            </article>

            <section ref={setSectionRef("overview")} id="overview" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[40px] leading-none md:text-[56px] font-odesa-medium">Опис</h2>
              <p className="mt-6 text-[24px] leading-[1.26] md:text-[32px] font-odesa-regular text-[#fff2e8]/90">
                {String(overviewCard?.payload?.text ?? `${object.name} — новий матеріал, доданий через адмінку.`)}
              </p>
            </section>

            <section ref={setSectionRef("info")} id="info" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[40px] leading-none md:text-[56px] font-odesa-medium">Інформація</h2>
              <div className="mt-6 grid gap-4">
                {(infoCards.length ? infoCards : [{ id: "tmp", title: "Дані скоро будуть", subtitle: "" } as any]).map((item) => (
                  <article key={item.id} className="rounded-xl bg-[#0e3f74] p-4">
                    <h3 className="text-[28px] leading-none font-odesa-medium">{item.title}</h3>
                    {item.subtitle ? <p className="mt-2 text-[20px] text-[#fff2e8]/85">{item.subtitle}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside ref={setSectionRef("contacts")} id="contacts" className="scroll-mt-24 space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[24px] p-7" style={{ backgroundColor: theme.panelBg }}>
              <p className="text-[36px] leading-none font-odesa-medium">{object.name}</p>
              <p className="mt-4 text-[24px] leading-[1.2] text-[#fff2e8]/90 font-odesa-regular">
                {String(contactCard?.payload?.address ?? city?.name ?? "Одещина")}
              </p>
              <p className="mt-3 flex items-center gap-3 text-[24px] font-odesa-regular">
                <MapPin className="h-6 w-6" style={{ color: theme.accentSoft }} />
                {city?.name ?? "Одещина"}
              </p>
              <p className="mt-2 flex items-center gap-3 text-[24px] font-odesa-regular">
                <Phone className="h-6 w-6" style={{ color: theme.accentSoft }} />
                {String(contactCard?.payload?.phone ?? "+38 (000) 000 00 00")}
              </p>
              {contactCard?.href ? (
                <a
                  href={contactCard.href}
                  className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[20px] font-odesa-medium"
                  style={{ backgroundColor: theme.accent, color: "#002f5e" }}
                >
                  Детальніше <ArrowRight className="h-5 w-5" />
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default EntityDetail;

