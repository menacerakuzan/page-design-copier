// Декоративні SVG-елементи, що доповнюють туристичний дизайн.
// Колір задається через text-* (currentColor), розмір — через className.

type DecorProps = { className?: string };

/** Роза вітрів — повільно обертається, символ подорожей */
export const CompassRose = ({ className = "" }: DecorProps) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 7" />
    <circle cx="100" cy="100" r="74" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
    <g stroke="currentColor" strokeWidth="1.5" opacity="0.65">
      <line x1="33" y1="33" x2="48" y2="48" />
      <line x1="167" y1="33" x2="152" y2="48" />
      <line x1="33" y1="167" x2="48" y2="152" />
      <line x1="167" y1="167" x2="152" y2="152" />
    </g>
    <path d="M100 14 L111 100 L100 186 L89 100 Z" fill="currentColor" opacity="0.85" />
    <path d="M14 100 L100 89 L186 100 L100 111 Z" fill="currentColor" opacity="0.4" />
    <circle cx="100" cy="100" r="7" fill="currentColor" />
  </svg>
);

/** Пунктирний маршрут із точкою старту та пін-фінішем */
export const RoutePath = ({ className = "" }: DecorProps) => (
  <svg viewBox="0 0 1200 220" className={className} preserveAspectRatio="none" aria-hidden="true">
    <path
      d="M30 180 C 200 60, 430 230, 640 120 S 1010 30, 1160 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="dash-flow"
    />
    <circle cx="30" cy="180" r="7" fill="currentColor" />
    <g transform="translate(1160 96)">
      <path d="M0 -26 C 12 -26, 16 -16, 16 -10 C 16 0, 0 14, 0 14 C 0 14, -16 0, -16 -10 C -16 -16, -12 -26, 0 -26 Z" fill="currentColor" />
      <circle cx="0" cy="-9" r="5.5" fill="#fff" opacity="0.9" />
    </g>
  </svg>
);

/** Силует чайки */
export const Seagull = ({ className = "" }: DecorProps) => (
  <svg viewBox="0 0 64 30" className={className} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
    <path d="M3 21 C 13 8, 24 9, 32 19 C 40 9, 51 8, 61 21" />
  </svg>
);

/** Сонце з променями */
export const SunBurst = ({ className = "" }: DecorProps) => (
  <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
    <circle cx="60" cy="60" r="22" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const x1 = 60 + Math.cos(a) * 34;
        const y1 = 60 + Math.sin(a) * 34;
        const x2 = 60 + Math.cos(a) * 48;
        const y2 = 60 + Math.sin(a) * 48;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
  </svg>
);

/** Хвилі — морський штрих під заголовками */
export const WaveLines = ({ className = "" }: DecorProps) => (
  <svg viewBox="0 0 120 26" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M3 8 C 13 0, 23 16, 33 8 C 43 0, 53 16, 63 8 C 73 0, 83 16, 93 8 C 103 0, 113 16, 117 6" opacity="0.9" />
    <path d="M13 20 C 23 12, 33 28, 43 20 C 53 12, 63 28, 73 20 C 83 12, 93 28, 103 20" opacity="0.45" />
  </svg>
);
