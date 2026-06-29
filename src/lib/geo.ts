import type { TourismObject } from "@/types/hierarchy";

export interface LatLng { lat: number; lng: number }

export function extractCoordsFromUrl(url: string): LatLng | null {
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  const q = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
  const ll = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ll) return { lat: parseFloat(ll[1]), lng: parseFloat(ll[2]) };
  // !3d<lat>!4d<lng> or !1d<lat>!2d<lng> (embedded Maps URLs)
  const d3 = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (d3) return { lat: parseFloat(d3[1]), lng: parseFloat(d3[2]) };
  const d1 = url.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
  if (d1) return { lat: parseFloat(d1[1]), lng: parseFloat(d1[2]) };
  return null;
}

export function getObjectCoords(obj: TourismObject): LatLng | null {
  if (!obj.mapUrl) return null;
  const firstLine = obj.mapUrl.split("\n").find(Boolean) ?? "";
  return extractCoordsFromUrl(firstLine);
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(sin2));
}
