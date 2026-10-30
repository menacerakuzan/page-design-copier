import { useLocation } from "react-router-dom";
import { useWinterTheme } from "@/lib/winterTheme";
import Garland from "./Garland";
import Snowfall from "./Snowfall";
import Mykolai from "./Mykolai";
import WinterIntro from "./WinterIntro";

/**
 * Усі глобальні зимові прикраси. Підвантажується lazy з App лише тоді,
 * коли тема активна (див. src/lib/winterTheme.tsx), тож звичайні відвідувачі
 * цей чанк не отримують. В адмінці прикрас немає.
 */
export default function WinterLayer() {
  const { pathname } = useLocation();
  const { lightsOn } = useWinterTheme();
  if (pathname.startsWith("/admin")) return null;
  return (
    <>
      <WinterIntro />
      {lightsOn && <Snowfall />}
      <Garland />
      <Mykolai />
    </>
  );
}
