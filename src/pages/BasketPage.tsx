import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, ArrowRight, MapPin, MapPinOff } from "lucide-react";
import { Img } from "@/components/Img";
import { useLang } from "@/lib/langContext";
import { useBasket } from "@/lib/basketContext";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { getObjectCoords } from "@/lib/geo";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";
import type { TourismObject } from "@/types/hierarchy";

const NAVY = "#002f5e";
const CREAM = "#fff2e8";
const GOLD = "#df9b3b";

const BasketPage = () => {
  const { t, tl, lang } = useLang();
  const { ids, remove, clear, count } = useBasket();
  const { data: snapshot } = useHierarchySnapshot();
  const navigate = useNavigate();

  // Об'єкти кошика в порядку додавання (пропускаємо ті, що зникли з БД).
  const items = useMemo<TourismObject[]>(() => {
    if (!snapshot) return [];
    const byId = new Map(snapshot.objects.map((o) => [o.id, o]));
    return ids.map((id) => byId.get(id)).filter((o): o is TourismObject => Boolean(o));
  }, [snapshot, ids]);

  const withCoords = useMemo(() => items.filter((o) => getObjectCoords(o)), [items]);
  const canBuild = withCoords.length >= 2;

  return (
    <div className="relative min-h-screen bg-[#fff2e8]">
      {/* Легкий фоновий патерн. ВАЖЛИВО: absolute (у потоці сторінки), а не
          fixed — інакше при overscroll на iOS патерн «відклеюється» від бежевого
          фону і крізь нього видно синій html/body. Так само зроблено на робочих
          сторінках (патерн absolute усередині секції). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/beigepattern.svg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.1 }}
      />
      {/* ── Шапка ─────────────────────────────────────────────── */}
      <header className="container-edge pt-safe relative z-10">
        <div className="flex items-center justify-between pb-6 pt-6">
          <Link
            to="/"
            className="w-fit rounded-full bg-[#002f5e] px-5 py-2 text-[14px] leading-none text-[#fff2e8] font-odesa-medium transition-colors hover:bg-[#0f3f74]"
          >
            ← {t("home")}
          </Link>
          {count > 0 && (
            <button
              type="button"
              onClick={clear}
              className="rounded-full px-4 py-2 text-[13px] font-odesa-medium text-[#002f5e]/55 transition-colors hover:text-[#9f1f47]"
            >
              {t("clearBasket")}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pb-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8]">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[30px] leading-none text-[#002f5e] font-odesa-bold">{t("basketTitle")}</h1>
            {count > 0 && (
              <p className="mt-1 text-[13px] text-[#002f5e]/55 font-odesa-regular">
                {count} {t("inBasketCount")}
              </p>
            )}
          </div>
        </div>
        <p className="max-w-[520px] pb-6 pt-2 text-[15px] leading-[1.5] text-[#002f5e]/60 font-odesa-regular">
          {t("basketDesc")}
        </p>
      </header>

      {/* ── Список / порожній стан ────────────────────────────── */}
      <main className="container-edge relative z-10" style={{ paddingBottom: "calc(184px + env(safe-area-inset-bottom))" }}>
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-[#002f5e]/10 bg-white px-6 py-16 text-center shadow-[0_18px_40px_-30px_rgba(0,47,94,0.4)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#002f5e]/5 text-[#002f5e]/40">
              <ShoppingCart className="h-7 w-7" />
            </span>
            <p className="mt-5 text-[20px] text-[#002f5e] font-odesa-semi">{t("emptyBasket")}</p>
            <p className="mt-2 max-w-[320px] text-[14px] leading-[1.5] text-[#002f5e]/55 font-odesa-regular">
              {t("emptyBasketDesc")}
            </p>
            <Link
              to="/districts"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#002f5e] px-6 py-3 text-[14px] text-[#fff2e8] font-odesa-medium transition-transform hover:-translate-y-0.5"
            >
              {t("exploreObjects")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {items.map((obj) => {
                const hasCoords = Boolean(getObjectCoords(obj));
                return (
                  <motion.li
                    key={obj.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-stretch gap-3 overflow-hidden rounded-[22px] border border-[#002f5e]/10 bg-white p-2.5 shadow-[0_14px_34px_-26px_rgba(0,47,94,0.4)]">
                      {/* Фото */}
                      <Link
                        to={objectDetailPath(obj.type, obj.slug)}
                        className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[16px] bg-[#002f5e]/10"
                      >
                        {obj.imageUrl ? (
                          <Img w={200} src={obj.imageUrl} alt={obj.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[#002f5e]/30">
                            <MapPin className="h-6 w-6" />
                          </span>
                        )}
                      </Link>

                      {/* Текст */}
                      <Link to={objectDetailPath(obj.type, obj.slug)} className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                        <span className="text-[11px] uppercase tracking-wider font-odesa-semi" style={{ color: objectTypeColor[obj.type] }}>
                          {objectTypeLabel(obj.type, lang)}
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[16px] leading-tight text-[#002f5e] font-odesa-semi">
                          {tl(obj.name, obj.nameEn)}
                        </span>
                        {tl(obj.subtitle, obj.subtitleEn) && (
                          <span className="mt-0.5 line-clamp-2 text-[13px] leading-[1.35] text-[#002f5e]/55 font-odesa-regular">
                            {tl(obj.subtitle, obj.subtitleEn)}
                          </span>
                        )}
                        {!hasCoords && (
                          <span className="mt-1 inline-flex w-fit items-center gap-1 text-[11px] text-[#9f1f47]/80 font-odesa-medium">
                            <MapPinOff className="h-3 w-3" /> {t("noCoords")}
                          </span>
                        )}
                      </Link>

                      {/* Видалити */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => remove(obj.id)}
                        aria-label={t("removeFromBasket")}
                        className="tap flex shrink-0 items-center justify-center self-center rounded-full text-[#002f5e]/40 transition-colors hover:bg-[#9f1f47]/10 hover:text-[#9f1f47]"
                      >
                        <Trash2 className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </main>

      {/* ── Липка кнопка «Створити маршрут» ───────────────────── */}
      {/* Прозора fixed-обгортка + кнопка як absolute-дитина: Safari не семплить
          низ екрана (той самий приём, що і в MobileNav / на сторінці маршруту).
          ВАЖЛИВО: жодного framer-motion/transform у цьому піддереві — transform
          створює композитний шар, який Safari семплить як колір нижньої панелі
          (незалежно від position:absolute), і низ перестає бути прозорим. */}
      {count > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
          <div
            className="pointer-events-auto absolute inset-x-4 mx-auto max-w-[560px]"
            style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              disabled={!canBuild}
              onClick={() => navigate("/marshrut")}
              className="group/cta flex w-full items-center justify-between gap-3 rounded-full py-2 pl-7 pr-2 text-[16px] font-odesa-bold shadow-[0_18px_40px_-14px_rgba(0,47,94,0.6)] transition-all disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: canBuild ? NAVY : "#6b7f95", color: CREAM }}
            >
              <span className="flex flex-col items-start leading-tight">
                {t("buildRoute")}
                {!canBuild && (
                  <span className="text-[11px] font-odesa-regular opacity-80">{t("needTwoStops")}</span>
                )}
              </span>
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform group-hover/cta:translate-x-1"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                <ArrowRight className="h-5 w-5" />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasketPage;
