import { Navigate, useLocation } from "react-router-dom";

const isV2Path = (pathname: string) => pathname === "/v2" || pathname.startsWith("/v2/");

/**
 * Поки йшов редизайн, новий дизайн відкривався через /v2/<шлях> або ?v2.
 * Тепер він єдиний, а такі посилання вже розіслані — тож тихо ведемо на
 * звичайну адресу (/v2/raion/x → /raion/x, /podiyi?v2 → /podiyi).
 */
export function LegacyV2Redirect() {
  const { pathname, search, hash } = useLocation();
  const p = new URLSearchParams(search);
  if (!isV2Path(pathname) && !p.has("v2")) return null;
  p.delete("v2");
  const rest = p.toString();
  const path = isV2Path(pathname) ? pathname.slice(3) || "/" : pathname;
  return <Navigate to={`${path}${rest ? `?${rest}` : ""}${hash}`} replace />;
}
