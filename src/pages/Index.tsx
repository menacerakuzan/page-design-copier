import { ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, Twitter, Instagram, Facebook, Diamond } from "lucide-react";
import emblem from "@/assets/odeshchyna-emblem.svg";
import seaHero from "@/assets/sea-hero.jpg";

const navLeft = ["Про Регіон", "Історія"];
const navRight = ["Блог", "Контакти"];

const cards = [
  { num: "01", title: "Історична", title2: "спадщина" },
  { num: "02", title: "Культура", title2: "та традиції" },
  { num: "03", title: "Природні", title2: "багатства" },
  { num: "04", title: "Морський", title2: "відпочинок" },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sea-deep text-cream font-sans">
      {/* Hero background image */}
      <img
        src={seaHero}
        alt="Чорне море Одещини"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sea-deep/40 via-sea/30 to-sea-deep/80" />

      {/* Browser chrome (faux) */}
      <div className="relative z-10 flex items-center gap-3 px-6 pt-5 text-cream/70">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-4 flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/95 text-sea shadow-sm">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/95 text-sea shadow-sm">
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="mx-4 flex h-9 flex-1 items-center justify-center rounded-full bg-cream/95 px-4 text-sm font-medium text-sea">
          odesa.tourism.ua
        </div>
        <Search className="h-4 w-4" />
        <div className="flex flex-col gap-1">
          <span className="h-1 w-1 rounded-full bg-cream/70" />
          <span className="h-1 w-1 rounded-full bg-cream/70" />
          <span className="h-1 w-1 rounded-full bg-cream/70" />
        </div>
      </div>

      {/* Navigation pill */}
      <header className="relative z-20 mx-auto mt-6 flex max-w-6xl items-center justify-between rounded-b-[3rem] bg-cream px-12 py-5 text-sea shadow-2xl shadow-sea-deep/40">
        <nav className="flex items-center gap-8 font-sans text-sm">
          {navLeft.map((item) => (
            <a key={item} href="#" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <Diamond className="h-2.5 w-2.5 fill-sea" strokeWidth={0} />
              {item}
            </a>
          ))}
        </nav>
        <h1 className="font-display text-2xl font-semibold tracking-[0.35em]">ОДЕЩИНА</h1>
        <nav className="flex items-center gap-8 font-sans text-sm">
          {navRight.map((item) => (
            <a key={item} href="#" className="flex items-center gap-2 transition-opacity hover:opacity-70">
              <Diamond className="h-2.5 w-2.5 fill-sea" strokeWidth={0} />
              {item}
            </a>
          ))}
        </nav>
      </header>

      {/* Side scroll buttons */}
      <div className="absolute left-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-sea shadow-lg transition-transform hover:-translate-y-0.5">
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-sea shadow-lg transition-transform hover:translate-y-0.5">
          <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Decorative right-side lines */}
      <div className="pointer-events-none absolute right-0 top-1/3 z-10 hidden h-px w-1/3 bg-cream/40 md:block" />
      <div className="pointer-events-none absolute right-0 top-[58%] z-10 hidden h-px w-2/5 bg-cream/40 md:block" />
      <div className="pointer-events-none absolute right-0 top-[68%] z-10 hidden h-px w-1/4 bg-cream/40 md:block" />

      {/* Hero content */}
      <main className="relative z-10 flex flex-col items-center px-6 pb-32 pt-16 text-center">
        <img src={emblem} alt="Емблема Одещини" className="h-44 w-44 md:h-56 md:w-56" />

        <h2 className="mt-12 font-display text-5xl font-medium leading-tight text-cream md:text-7xl">
          Досліджуй Одещину
        </h2>
        <p className="mt-6 font-display text-xl text-cream/90 md:text-2xl">
          Серце Південного Колориту
        </p>

        <button className="mt-16 rounded-md bg-cream px-8 py-3 font-sans text-sm font-medium text-sea transition-transform hover:-translate-y-0.5 hover:shadow-xl">
          Онлайн-гід
        </button>

        {/* Socials */}
        <div className="mt-14 flex items-center gap-2 rounded-md bg-cream px-4 py-2 text-sea">
          <Twitter className="h-4 w-4" />
          <Instagram className="h-4 w-4" />
          <Facebook className="h-4 w-4" />
        </div>
      </main>

      {/* Bottom cards row */}
      <section className="relative z-10 mx-auto -mt-8 grid max-w-6xl grid-cols-2 gap-8 px-8 pb-12 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.num} className="flex items-start gap-3 border-t border-cream/40 pt-4">
            <span className="font-display text-3xl font-semibold text-cream">{c.num}</span>
            <div className="text-xs text-cream/80">
              <div>{c.title}</div>
              <div>{c.title2}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Index;
