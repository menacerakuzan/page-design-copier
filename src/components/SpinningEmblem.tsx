import emblemShield from "@/assets/emblem-shield.svg";
import emblemRing from "@/assets/emblem-ring.svg";

/**
 * Емблема Одещини (щит + кільце з написом навколо) як заміна кнопки паузи на
 * відео. Щит нерухомий, кільце крутиться, поки курсор над батьківським
 * елементом із класом `group` — саме такий hover-ефект, як у вихідній емблемі
 * на головній, тільки тепер розкладений на два шари (мітка/кільце з
 * gemini-svg-2.svg розділені на emblem-shield.svg + emblem-ring.svg з тим
 * самим viewBox, щоб ідеально накладались одне на одне).
 *
 * Дві вкладені обгортки навмисно: зовнішня — без жодного свого position,
 * щоб className від виклику (напр. "absolute left-3 top-3") ставив
 * позиціонування без конфлікту. Внутрішня — завжди "relative" (не залежить
 * від className) і саме вона є точкою відліку для двох "absolute inset-0"
 * шарів маски нижче. Раніше "relative" й "absolute" стояли на ОДНОМУ елементі
 * одночасно — обидва задають CSS position, і яка з двох Tailwind-утиліт
 * "перемагає" залежить від порядку в згенерованому стилі, а не від порядку
 * класів у рядку; тому емблема іноді рендерилась у звичайному потоці й
 * губилась замість накладання на відео.
 */
export function SpinningEmblem({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="relative h-full w-full">
        <div
          className="emblem-ring-spin absolute inset-0"
          style={{
            backgroundColor: "#fff2e8",
            WebkitMaskImage: `url(${emblemRing})`,
            maskImage: `url(${emblemRing})`,
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "#fff2e8",
            WebkitMaskImage: `url(${emblemShield})`,
            maskImage: `url(${emblemShield})`,
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      </div>
    </div>
  );
}

export default SpinningEmblem;
