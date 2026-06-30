import { describe, it, expect } from "vitest";
import { extractCoordsFromUrl, getObjectCoords, haversineKm } from "@/lib/geo";
import type { TourismObject } from "@/types/hierarchy";

describe("extractCoordsFromUrl", () => {
  it("parses @lat,lng", () => {
    expect(extractCoordsFromUrl("https://maps.google.com/@46.4825,30.7233,15z")).toEqual({
      lat: 46.4825,
      lng: 30.7233,
    });
  });
  it("parses ?q=lat,lng", () => {
    expect(extractCoordsFromUrl("https://maps.google.com/?q=46.48,30.72")).toEqual({ lat: 46.48, lng: 30.72 });
  });
  it("parses &ll=lat,lng", () => {
    expect(extractCoordsFromUrl("https://x/?z=1&ll=46.10,30.20")).toEqual({ lat: 46.1, lng: 30.2 });
  });
  it("parses embedded !3d!4d", () => {
    expect(extractCoordsFromUrl("https://www.google.com/maps/embed?...!3d46.5!4d30.7")).toEqual({
      lat: 46.5,
      lng: 30.7,
    });
  });
  it("parses embedded !1d!2d", () => {
    expect(extractCoordsFromUrl("https://x!1d46.9!2d30.1")).toEqual({ lat: 46.9, lng: 30.1 });
  });
  it("returns null when no coords", () => {
    expect(extractCoordsFromUrl("https://example.org/place")).toBeNull();
  });
});

describe("getObjectCoords", () => {
  it("uses the first non-empty line of mapUrl", () => {
    const obj = { mapUrl: "\nhttps://maps.google.com/?q=46.1,30.2\nsecond" } as TourismObject;
    expect(getObjectCoords(obj)).toEqual({ lat: 46.1, lng: 30.2 });
  });
  it("returns null without mapUrl", () => {
    expect(getObjectCoords({} as TourismObject)).toBeNull();
  });
});

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm({ lat: 46.5, lng: 30.7 }, { lat: 46.5, lng: 30.7 })).toBe(0);
  });
  it("approximates a known distance (~1.11km per 0.01° lat)", () => {
    const d = haversineKm({ lat: 46.5, lng: 30.7 }, { lat: 46.51, lng: 30.7 });
    expect(d).toBeGreaterThan(1.0);
    expect(d).toBeLessThan(1.2);
  });
});
