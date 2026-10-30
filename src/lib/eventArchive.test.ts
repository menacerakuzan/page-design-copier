import { describe, expect, it } from "vitest";
import { eventArchiveDate, isEventArchived, kyivToday, lastDateInText } from "./eventArchive";

const ev = (over: Record<string, unknown> = {}) => ({ type: "event" as const, ...over });

describe("lastDateInText", () => {
  it("бере останню дату репертуару в поточному році", () => {
    expect(lastDateInText("01.11 — Концерт — 13:00\n28.11 — Pianoбой — 18:00\n04.11 — X — 18:00", "2026-10-29")).toBe("2026-11-28");
  });
  it("поважає явний рік", () => {
    expect(lastDateInText("24.04 – 03.05.2026", "2026-10-29")).toBe("2026-05-03");
    expect(lastDateInText("03.05.27", "2026-10-29")).toBe("2027-05-03");
  });
  it("січнева афіша, внесена в грудні, — наступного року", () => {
    expect(lastDateInText("10.01 — Щедрик — 18:00", "2026-12-20")).toBe("2027-01-10");
  });
  it("ігнорує час і сміття", () => {
    expect(lastDateInText("Вистава — 18:00", "2026-10-29")).toBeNull();
    expect(lastDateInText(undefined, "2026-10-29")).toBeNull();
  });
});

describe("isEventArchived", () => {
  it("ручна дата має пріоритет над репертуаром", () => {
    const o = ev({ archiveAfter: "2026-12-31", repertoire: "01.10 — X — 18:00" });
    expect(eventArchiveDate(o, "2026-10-29")).toEqual({ date: "2026-12-31", source: "manual" });
    expect(isEventArchived(o, "2026-10-29")).toBe(false);
  });
  it("в останній день подія ще актуальна, наступного — в архіві", () => {
    const o = ev({ archiveAfter: "2026-10-31" });
    expect(isEventArchived(o, "2026-10-31")).toBe(false);
    expect(isEventArchived(o, "2026-11-01")).toBe(true);
  });
  it("жовтнева афіша йде в архів у листопаді", () => {
    const o = ev({ repertoire: "07.10 — Музичні хіти — 17:00\n30.10 — Баядерка — 17:00" });
    expect(isEventArchived(o, "2026-10-29")).toBe(false);
    expect(isEventArchived(o, "2026-10-31")).toBe(true);
  });
  it("подія без дат і не-події ніколи не архівуються", () => {
    expect(isEventArchived(ev(), "2030-01-01")).toBe(false);
    expect(isEventArchived({ type: "attraction", archiveAfter: "2020-01-01" } as never, "2030-01-01")).toBe(false);
  });
});

describe("kyivToday", () => {
  it("рахує дату за Києвом, а не UTC", () => {
    // 22:30 UTC 31 жовтня = 00:30 1 листопада в Києві (зимовий час, UTC+2)
    expect(kyivToday(new Date("2026-10-31T22:30:00Z"))).toBe("2026-11-01");
  });
});
