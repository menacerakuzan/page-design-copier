import { useAfisha } from "./afisha/useAfisha";
import { AfPanel } from "./afisha/AfPanel";

/**
 * «Афіша»: найближчі вистави тижня — заокруглена винна «панель» на кремовій
 * сторінці. Інші варіанти («Квитки», «Розклад») — у useful/.
 */
export function Afisha() {
  const a = useAfisha();
  if (!a.ready || a.total === 0) return null;
  return <AfPanel a={a} />;
}
