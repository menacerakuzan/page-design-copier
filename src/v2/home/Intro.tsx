import { Fragment, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Coastline } from "./intro/Coastline";
import { useV2 } from "@/v2/i18n";
import { EASE } from "@/v2/components/ui";

/** *…* — акцент фірмовим ss02. */
const PHRASE = {
  uk: "Одещина — *земля, що об'єднує:* море і степ, Дунай і лимани, старі фортеці й молоде вино — і десятки культур, що живуть поруч.",
  en: "Odesa Region is *the land that unites:* sea and steppe, the Danube and estuaries, old fortresses and young wine — and dozens of cultures side by side.",
};

function words(phrase: string) {
  const out: { text: string; accent: boolean }[] = [];
  let accent = false;
  for (const part of phrase.split("*")) {
    for (const w of part.split(/ +/).filter(Boolean)) out.push({ text: w, accent });
    accent = !accent;
  }
  return out;
}

/** Вступ: одна фраза по центру, слова проявляються по черзі, нижче — живий елемент. */
export function Intro() {
  const { lang } = useV2();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const list = words(PHRASE[lang]);

  return (
    <section aria-label={lang === "en" ? "About the region" : "Про край"} className="relative pb-9 pt-11 sm:pb-20 sm:pt-16">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-6 flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-o-wine sm:mb-8"
        >
          <span className="h-px w-8 bg-o-wine/40" aria-hidden="true" />
          {lang === "en" ? "Welcome" : "Ласкаво просимо"}
          <span className="h-px w-8 bg-o-wine/40" aria-hidden="true" />
        </motion.p>
        <p
          ref={ref}
          aria-label={PHRASE[lang].replace(/\*/g, "")}
          className="mx-auto max-w-[1000px] text-center text-[26px] font-medium leading-[1.3] tracking-[-0.015em] sm:text-[36px] lg:text-[44px]"
        >
          {list.map((w, i) => (
            <Fragment key={i}>
              <motion.span
                aria-hidden="true"
                initial={reduce ? false : { opacity: 0, y: "0.35em", filter: "blur(6px)" }}
                animate={inView || reduce ? { opacity: 1, y: "0em", filter: "blur(0px)" } : undefined}
                transition={{ duration: 0.7, delay: i * 0.035, ease: EASE }}
                className={`inline-block ${w.accent ? "ital text-o-wine" : ""}`}
              >
                {w.text}
              </motion.span>{" "}
            </Fragment>
          ))}
        </p>

        <div className="mt-6 sm:mt-8">
          <Coastline />
        </div>
      </div>
    </section>
  );
}
