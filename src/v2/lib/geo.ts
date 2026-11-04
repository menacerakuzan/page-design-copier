export const ODESA = { lat: 46.4825, lon: 30.7233 };

/** Відстань від Одеси по прямій, км (гаверсинус). */
export function kmFromOdesa(lat: number, lon: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(lat - ODESA.lat);
  const dLon = r(lon - ODESA.lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(ODESA.lat)) * Math.cos(r(lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
