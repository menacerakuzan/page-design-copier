import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, ArrowRight } from "lucide-react";
import { Img } from "@/components/Img";
import { ObjectCard } from "@/components/ObjectCard";
import { useLang } from "@/lib/langContext";
import type { TourismObject } from "@/types/hierarchy";

/**
 * Місцевий відмінок для назви району в реченні "Ще в ...районі" — усі назви
 * районів в БД мають вигляд "[Прикметник]ський/цький/зький район" (напр.
 * "Одеський район", "Білгород-Дністровський район"), тож відмінювання можна
 * вивести правилом, без словника винятків: "-ий район" → "-ому районі".
 * Якщо колись з'явиться назва іншої форми (не на "-ий район") — просто
 * повертаємо як є, замість вигаданого невірного відмінка.
 */
function districtLocativeUk(name: string): string {
  return /ий район$/i.test(name) ? name.replace(/ий район$/i, "ому районі") : name;
}

/** Детерміністичний "випадковий" вибір — стабільний для одного object.id за
 *  сеанс (не перемішується при кожному ре-рендері), але різний для кожного
 *  об'єкта, з якого дивляться. */
function pickRandom<T>(items: T[], seed: string, count: number): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

/**
 * "Ще в цьому районі" — 4 випадкові об'єкти того ж району в кінці сторінки
 * об'єкта, щоб продовжувати знайомство з районом далі без повернення на
 * список. Розмите фонове фото + картки поверх — окремий, помітний блок.
 */
export const DistrictDiscoverMore = ({
  currentObjectId,
  districtId,
  districtSlug,
  districtName,
  districtNameEn,
  allObjects,
}: {
  currentObjectId: string;
  districtId: string;
  districtSlug: string;
  districtName: string;
  districtNameEn?: string;
  allObjects: TourismObject[];
}) => {
  const { tl, lang } = useLang();

  const picks = useMemo(() => {
    // Лише тур. об'єкти (attraction) — раніше сюди потрапляли й події, бо
    // фільтр був тільки за районом, без урахування типу.
    const candidates = allObjects.filter(
      (o) => o.districtId === districtId && o.id !== currentObjectId && o.type === "attraction",
    );
    return pickRandom(candidates, currentObjectId, 4);
  }, [allObjects, districtId, currentObjectId]);

  if (picks.length === 0) return null;

  const backdropImage = picks.find((p) => p.imageUrl)?.imageUrl;

  return (
    <section className="relative overflow-hidden py-20" style={{ backgroundColor: "#001a3d" }}>
      {backdropImage && (
        <>
          <Img
            w={1200}
            src={backdropImage}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            style={{ filter: "blur(18px)", transform: "scale(1.1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#001a3d]/70 via-[#001a3d]/90 to-[#001a3d]" />
        </>
      )}
      {/* Той самий патерн, що й на секціях тур. об'єктів (ObjectSection) —
          щоб блок читався як продовження сайту, а не окрема вставка. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/attractionpattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.08 }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <Compass className="mb-3 h-7 w-7" style={{ color: "#df9b3b" }} strokeWidth={1.5} />
          <h2 className="font-odesa-bold text-[28px] leading-none text-[#fff2e8] md:text-[44px]">
            {lang === "en"
              ? `More in the ${districtNameEn || districtName} district`
              : `Ще в ${districtLocativeUk(districtName)}`}
          </h2>
          <p className="mt-3 max-w-[480px] text-[14px] font-odesa-regular text-[#fff2e8]/60 md:text-[16px]">
            {tl(
              "Ось кілька місць, які варто відвідати, поки ви тут",
              "A few more places worth visiting while you're here",
            )}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {picks.map((obj, idx) => (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, y: 32, scale: 0.9, rotate: idx % 2 === 0 ? -3 : 3 }}
              whileInView={{ opacity: 1, y: 0, scale: 1, rotate: idx % 2 === 0 ? -1.5 : 1.5 }}
              whileHover={{ rotate: 0, y: -4, transition: { duration: 0.25 } }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <ObjectCard obj={obj} idx={idx} lang={lang} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <Link
            to={`/raion/${districtSlug}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/25 px-6 py-3 text-[14px] font-odesa-medium text-[#fff2e8] transition-colors hover:bg-white/10"
          >
            {tl("Усі об'єкти району", "All objects in this district")} <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DistrictDiscoverMore;
