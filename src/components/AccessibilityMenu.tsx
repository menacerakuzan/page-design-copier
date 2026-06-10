import { useState, useEffect, useRef } from "react";
import { useLang } from "@/lib/langContext";
import type { TranslationKey } from "@/lib/i18n";
import {
  Eye, Contrast, Palette, Link2, Type, Circle, ImageOff, VideoOff, MousePointer2, RotateCcw, X, Globe, Search,
} from "lucide-react";

type FontSize = "normal" | "large" | "xlarge";

type Settings = {
  invertColors: boolean;
  grayscale: boolean;
  highSaturation: boolean;
  highlightLinks: boolean;
  fontSize: FontSize;
  highContrast: boolean;
  hideImages: boolean;
  hideVideos: boolean;
  bigCursor: boolean;
};

const DEFAULT: Settings = {
  invertColors: false,
  grayscale: false,
  highSaturation: false,
  highlightLinks: false,
  fontSize: "normal",
  highContrast: false,
  hideImages: false,
  hideVideos: false,
  bigCursor: false,
};

function applySettings(s: Settings) {
  const root = document.documentElement;

  const filters: string[] = [];
  if (s.invertColors) filters.push("invert(1)");
  if (s.grayscale) filters.push("grayscale(1)");
  if (s.highSaturation) filters.push("saturate(2)");
  if (s.highContrast) filters.push("contrast(1.6)");
  root.style.filter = filters.length ? filters.join(" ") : "";

  const upsertStyle = (id: string, css: string | null) => {
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (css) {
      if (!el) { el = document.createElement("style"); el.id = id; document.head.appendChild(el); }
      el.textContent = css;
    } else {
      el?.remove();
    }
  };

  // Font size — zoom the whole page proportionally
  if (s.fontSize === "large") {
    document.body.style.zoom = "1.15";
  } else if (s.fontSize === "xlarge") {
    document.body.style.zoom = "1.3";
  } else {
    document.body.style.zoom = "";
  }
  upsertStyle("a11y-fontsize", null);

  upsertStyle("a11y-links", s.highlightLinks ? "a { outline: 2px solid #df9b3b !important; outline-offset: 2px !important; }" : null);
  upsertStyle("a11y-images", s.hideImages ? "img { visibility: hidden !important; }" : null);
  upsertStyle("a11y-videos", s.hideVideos ? "video, iframe { visibility: hidden !important; }" : null);

  root.style.cursor = s.bigCursor
    ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%23002f5e' stroke='white' stroke-width='1.5' d='M4 4l6.5 16.5 3-6 6-3z'/%3E%3C/svg%3E\") 0 0, auto"
    : "";
}

const STORAGE_KEY = "a11y-settings";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

const TOGGLE_BUTTONS: { key: keyof Omit<Settings, "fontSize">; labelKey: TranslationKey; Icon: any }[] = [
  { key: "invertColors", labelKey: "invertColors", Icon: Eye },
  { key: "grayscale", labelKey: "grayscale", Icon: Contrast },
  { key: "highSaturation", labelKey: "highSaturation", Icon: Palette },
  { key: "highlightLinks", labelKey: "highlightLinks", Icon: Link2 },
  { key: "highContrast", labelKey: "highContrast", Icon: Circle },
  { key: "hideImages", labelKey: "hideImages", Icon: ImageOff },
  { key: "hideVideos", labelKey: "hideVideos", Icon: VideoOff },
  { key: "bigCursor", labelKey: "bigCursor", Icon: MousePointer2 },
];

interface Props {
  onSearchClick?: () => void;
  align?: "left" | "right";
}

export function AccessibilityMenu({ onSearchClick, align = "left" }: Props) {
  const { lang, setLang, t } = useLang();
  const onLangChange = setLang;
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applySettings(settings);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (key: keyof Omit<Settings, "fontSize">) =>
    setSettings((s) => ({ ...s, [key]: !s[key as keyof Settings] }));

  const reset = () => setSettings(DEFAULT);

  const activeCount =
    Object.entries(settings).filter(([k, v]) => k === "fontSize" ? v !== "normal" : v === true).length;

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      {/* Search icon */}
      {onSearchClick && (
        <button
          type="button"
          onClick={onSearchClick}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2e8] text-[#002f5e] border border-[#002f5e]/30 transition-all hover:bg-[#fff2e8]/90"
          aria-label="Пошук"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      {/* Accessibility trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-[#fff2e8] px-4 py-2.5 text-[#002f5e] border border-[#002f5e]/30 transition-all hover:bg-[#fff2e8]/90 font-odesa-medium"
        aria-label="Меню доступності"
      >
        <Eye className="h-5 w-5" />
        <span className="text-[13px] leading-none">
          {lang === "uk" ? "Укр" : "Eng"}
        </span>
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#9f1f47] text-[10px] text-[#fff2e8] font-odesa-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute bottom-14 z-50 w-[310px] rounded-2xl bg-[#fff2e8] text-[#002f5e] border border-[#002f5e]/20 overflow-hidden ${align === "right" ? "right-0" : "left-0"}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#002f5e]/10">
            <span className="text-[14px] font-odesa-semi">{t("accessibility")}</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-[#002f5e]/10 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Lang switcher */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-[#002f5e]/10">
            <Globe className="h-4 w-4 mr-1 opacity-50" />
            <span className="text-[12px] opacity-50 mr-2 font-odesa-regular">{t("language")}:</span>
            {(["uk", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => onLangChange(l)}
                className={`rounded-full px-3 py-1 text-[12px] transition-colors font-odesa-medium ${lang === l ? "bg-[#002f5e] text-[#fff2e8]" : "hover:bg-[#002f5e]/10"}`}>
                {l === "uk" ? "Укр" : "Eng"}
              </button>
            ))}
          </div>

          {/* Font size */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-[#002f5e]/10">
            <Type className="h-4 w-4 mr-1 opacity-50" />
            <span className="text-[12px] opacity-50 mr-2 font-odesa-regular">{t("fontSize")}:</span>
            {([["normal", "A"], ["large", "A+"], ["xlarge", "A++"]] as const).map(([size, label]) => (
              <button key={size} type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: size }))}
                className={`rounded-full px-3 py-1 text-[12px] transition-colors font-odesa-medium ${settings.fontSize === size ? "bg-[#002f5e] text-[#fff2e8]" : "hover:bg-[#002f5e]/10"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Toggle buttons grid */}
          <div className="grid grid-cols-3 gap-2 p-3">
            {TOGGLE_BUTTONS.map(({ key, labelKey, Icon }) => (
              <button key={key} type="button" onClick={() => toggle(key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center text-[11px] leading-tight transition-all font-odesa-regular border ${
                  settings[key]
                    ? "bg-[#002f5e] text-[#fff2e8] border-[#002f5e]"
                    : "bg-white/60 text-[#002f5e] border-[#002f5e]/10 hover:bg-[#002f5e]/8"
                }`}>
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Reset */}
          <div className="px-3 pb-3">
            <button type="button" onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#002f5e] py-2.5 text-[12px] text-[#fff2e8] transition-opacity hover:opacity-80 font-odesa-medium">
              <RotateCcw className="h-4 w-4" />
              {t("reset")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
