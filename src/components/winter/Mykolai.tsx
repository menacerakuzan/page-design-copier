import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useLang } from "@/lib/langContext";

/**
 * Святий Миколай визирає з правого краю (лише десктоп): махає рукою і
 * пропонує зимові події. Персонаж свідомо Миколай, а не «Дід Мороз» —
 * для українського державного сайту це наша традиція, а не радянська.
 * Закривається хрестиком до кінця сесії.
 */

const DISMISS_KEY = "odesa-winter-mykolai";

export function MykolaiFigure({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 220" className={className} aria-hidden="true">
      {/* посох */}
      <path d="M30 216V72" stroke="#c8952f" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 74c0-26 22-30 26-14 3 11-9 15-13 8" fill="none" stroke="#e3b04b" strokeWidth="5" strokeLinecap="round" />
      {/* подарунок */}
      <rect x="98" y="192" width="34" height="26" rx="3" fill="#e8304f" />
      <rect x="112" y="192" width="6" height="26" fill="#ffc23d" />
      <rect x="98" y="201" width="34" height="6" fill="#ffc23d" />
      <path d="M115 192c-8-10-16-4-10 0m10 0c8-10 16-4 10 0" fill="none" stroke="#ffc23d" strokeWidth="3" strokeLinecap="round" />
      {/* ризи */}
      <path d="M34 220c3-58 18-90 46-96 28 6 43 38 46 96z" fill="#1d4f91" />
      <path d="M80 124c-14 4-24 22-28 52 10-20 18-30 28-34z" fill="#2b67b3" opacity=".7" />
      <path d="M48 142q32 24 64 0" fill="none" stroke="#f4f7fb" strokeWidth="10" strokeLinecap="round" />
      <path d="M80 150v70" stroke="#f4f7fb" strokeWidth="12" />
      {[172, 198].map((y) => (
        <path key={y} d={`M80 ${y - 5}v10M75 ${y}h10`} stroke="#e8304f" strokeWidth="2.6" strokeLinecap="round" />
      ))}
      {/* рука з посохом */}
      <path d="M52 140q-16 6-20 20" stroke="#1d4f91" strokeWidth="13" strokeLinecap="round" fill="none" />
      <circle cx="31" cy="160" r="7" fill="#f3cfb1" />
      {/* рука, що махає */}
      <g className="winter-wave" style={{ transformOrigin: "108px 138px" }}>
        <path d="M108 138q20-10 26-34" stroke="#1d4f91" strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="135" cy="98" r="7.5" fill="#f3cfb1" />
      </g>
      {/* обличчя */}
      <circle cx="80" cy="92" r="22" fill="#f3cfb1" />
      <circle cx="66" cy="99" r="4.5" fill="#f29aa0" opacity=".6" />
      <circle cx="94" cy="99" r="4.5" fill="#f29aa0" opacity=".6" />
      <circle cx="72" cy="90" r="2.2" fill="#22303f" />
      <circle cx="88" cy="90" r="2.2" fill="#22303f" />
      <path d="M67 84q5-4 10 0M83 84q5-4 10 0" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* борода і вуса */}
      <path d="M57 95c-3 26 9 50 23 54 14-4 26-28 23-54-6 9-14 12-23 12s-17-3-23-12z" fill="#fff" />
      <path d="M62 112c4 14 10 26 18 30 8-4 14-16 18-30-6 8-12 10-18 10s-12-2-18-10z" fill="#e3ebf5" />
      <circle cx="80" cy="98" r="3.4" fill="#e9a98f" />
      <path d="M69 105q6-7 11-2 5-5 11 2-6 4-11 1-5 3-11-1z" fill="#f7f9fc" stroke="#d5dfeb" strokeWidth=".8" />
      {/* митра */}
      <path d="M58 76c0-26 10-42 22-52 12 10 22 26 22 52q-22-8-44 0z" fill="#c8243f" stroke="#e3b04b" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M58 76q22-8 44 0v6q-22-8-44 0z" fill="#e3b04b" />
      <path d="M80 36v24M72 46h16" stroke="#ffd877" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Mykolai() {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  const [visible, setVisible] = useState(false);
  const home = pathname === "/";

  // Виходить не одразу — після заставки і першого погляду на сторінку.
  // На головній — лише коли перший екран прокручено: герой лишається чистим.
  // Біля підвалу ховається, щоб не перекривати водяний знак «ОДЕЩИНА».
  const [ready, setReady] = useState(!home);
  const [nearFooter, setNearFooter] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const footer = document.querySelector("footer");
      setNearFooter(!!footer && footer.getBoundingClientRect().top < window.innerHeight * 0.75);
      if (home) setReady(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const id = home ? 0 : window.setTimeout(() => setVisible(true), 4500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(id);
    };
  }, [home]);
  useEffect(() => {
    if (home) setVisible(ready);
  }, [home, ready]);

  if (dismissed || pathname.startsWith("/admin") || pathname.startsWith("/podiyi")) return null;

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* не запам'ятаємо */ }
  };

  return (
    <AnimatePresence>
      {visible && !nearFooter && (
        <motion.aside
          aria-label={lang === "en" ? "Season's greetings" : "Святкове вітання"}
          className="fixed bottom-24 right-0 z-[46] hidden items-end md:flex print:hidden"
          initial={{ x: 180 }}
          animate={{ x: 34 }}
          whileHover={{ x: 0 }}
          exit={{ x: 200 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16 }}
        >
          <div className="relative mb-24 mr-1 max-w-[220px] rounded-2xl rounded-br-sm bg-[#fff2e8] p-3.5 pr-8 text-[14px] leading-snug text-[#002f5e] shadow-[0_14px_34px_-12px_rgba(0,30,70,0.55)] ring-1 ring-[#002f5e]/10">
            <p className="font-odesa-medium">{lang === "en" ? "Happy holidays!" : "Зі святами!"}</p>
            <Link to="/podiyi" className="mt-1 inline-block text-[#9f1f47] underline underline-offset-4 hover:text-[#002f5e]">
              {lang === "en" ? "Winter events in Odesa region →" : "Зимові події Одещини →"}
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label={lang === "en" ? "Hide greeting" : "Сховати вітання"}
              className="absolute right-1.5 top-1.5 rounded-full p-1 text-[#002f5e]/60 hover:bg-[#002f5e]/10 hover:text-[#002f5e]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <MykolaiFigure className="h-[190px] w-[138px] drop-shadow-[0_12px_18px_rgba(0,25,60,0.35)]" />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
