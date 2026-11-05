/**
 * Лінійні малюнки для видів туризму (поле 100×100, лінія кольором тексту).
 * Ключ — назва виду з БД («Морський туризм» тощо).
 */

/** Келих вина і гроно винограду. */
function Gastro() {
  return (
    <>
      <path d="M31.5 33h19c-.6 9-4.2 15-9.5 15s-8.9-6-9.5-15z" fill="currentColor" fillOpacity=".22" stroke="none" />
      <path d="M30 20h22c0 17-4.5 28-11 28s-11-11-11-28zM41 48v22M32 72h18" />
      <path d="M70 40c0-6 3-9 8-11" />
      <path d="M70 40c-5-7-13-6-16-2 5 2 11 3 16 2z" />
      {[[65, 46], [74, 46], [69.5, 53.5], [61, 53.5], [78, 53.5], [65, 61], [74, 61], [69.5, 68.5]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" />
      ))}
    </>
  );
}

/** Вітрильник на хвилях і сонце. */
function Sea() {
  return (
    <>
      <circle cx="76" cy="22" r="6" />
      <path d="M50 64V16M53 20l21 40H53zM47 27 29 60h18z" />
      <path d="M20 64h60l-8 10H28z" />
      <path d="M12 84q6-5 12 0t12 0 12 0 12 0 12 0 12 0" />
    </>
  );
}

/** Храм із куполом і хрестом. */
function Religion() {
  return (
    <>
      <path d="M50 8v12M45.5 12.5h9" />
      <path d="M36 38c0-10 6-17 14-17s14 7 14 17z" />
      <path d="M38 38h24v9H38zM28 47h44v33H28z" />
      <path d="M45 80V69a5 5 0 0 1 10 0v11M35 56v9M65 56v9" />
      <path d="M16 80h68" />
    </>
  );
}

/** Колесо огляду. */
function Fun() {
  const cx = 50;
  const cy = 40;
  const r = 25;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  return (
    <>
      <circle cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r="4" />
      {pts.map(([x, y], i) => (
        <path key={`s${i}`} d={`M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}`} strokeOpacity=".6" />
      ))}
      {pts.map(([x, y], i) => (
        <rect key={`c${i}`} x={(x - 3).toFixed(1)} y={(y + 1).toFixed(1)} width="6" height="5" rx="1.5" />
      ))}
      <path d="M50 44 36 82M50 44l14 38M26 82h48" />
    </>
  );
}

/** Велосипед. */
function Sport() {
  return (
    <>
      <circle cx="28" cy="64" r="15" />
      <circle cx="74" cy="64" r="15" />
      <path d="M28 64 43 40l8 24zM43 40h22l9 24M65 40 51 64" />
      <path d="M38 35h10M61 33l4 7h6" />
      <circle cx="51" cy="64" r="3" />
    </>
  );
}

/** Дерево, сонце, пагорби й колоски. */
function Green() {
  return (
    <>
      <circle cx="72" cy="26" r="8" />
      <path d="M72 12v-4M72 44v-4M58 26h-4M90 26h-4M62 16l-3-3M85 39l-3-3M82 16l3-3M59 39l3-3" strokeOpacity=".7" />
      <path d="M8 80q24-18 46-6t38-4" />
      <path d="M34 72V54" />
      <circle cx="34" cy="44" r="12" />
      <path d="M58 76c1-6 0-11-2-15M64 76c0-7 2-11 4-14M58 61c-3-1-5-3-5-6M68 62c3 0 5-2 6-5" />
    </>
  );
}

/** Фортеця: стіна з зубцями й вежа з конусом. */
function History() {
  return (
    <>
      <path d="M16 82V56h6v-5h6v5h6v-5h6v5h6v-5h4v31" />
      <path d="M50 82V36h22v46" />
      <path d="M47 36 61 16l14 20z" />
      <path d="M58 48v8M64 48v8M58 66v8M64 66v8" />
      <path d="M24 82V72a6 6 0 0 1 12 0v10" />
      <path d="M10 82h80" />
    </>
  );
}

/** Спа: камінці, листок і крапля. */
function Health() {
  return (
    <>
      <ellipse cx="46" cy="74" rx="20" ry="6" />
      <ellipse cx="46" cy="62" rx="15" ry="5" />
      <ellipse cx="46" cy="52" rx="10" ry="4" />
      <path d="M50 46c-9-9-7-22 7-30 5 13 3 23-7 30zM50 46l6-22" />
      <path d="M76 44c-4-6-6-10-6-13a6 6 0 0 1 12 0c0 3-2 7-6 13z" />
      <path d="M16 84h60" strokeOpacity=".7" />
    </>
  );
}

const ART: Record<string, () => JSX.Element> = {
  "Гастрономічний туризм": Gastro,
  "Морський туризм": Sea,
  "Релігійний туризм": Religion,
  "Розважальний туризм": Fun,
  "Спортивний туризм": Sport,
  "Сільський та зелений туризм": Green,
  "Історико-культурний туризм": History,
  "Медико-оздоровчий туризм": Health,
};

export function MoodArt({ type, className }: { type: string; className?: string }) {
  const Art = ART[type];
  if (!Art) return null;
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <Art />
    </svg>
  );
}
