import { describe, it, expect } from "vitest";
import { parseRepertoire } from "./repertoire";

describe("parseRepertoire", () => {
  it("коротке тире «–» як роздільник (реальні дані театру муз. комедії)", () => {
    expect(parseRepertoire("01.10 – SQUIRT: The Las Vegas Show – 18:00")).toEqual([
      { date: "01.10", title: "SQUIRT: The Las Vegas Show", time: "18:00" },
    ]);
  });

  it("тире всередині назви не ріже назву", () => {
    expect(parseRepertoire("02.10 – Ісус Христос — суперзірка – 18:00")).toEqual([
      { date: "02.10", title: "Ісус Христос — суперзірка", time: "18:00" },
    ]);
  });

  it("довге тире «—» і дефіс «-» теж працюють", () => {
    expect(parseRepertoire("03.10 — Ромео і Джульєтта — 16:00")[0]).toEqual(
      { date: "03.10", title: "Ромео і Джульєтта", time: "16:00" },
    );
    expect(parseRepertoire("04.10 - Канкан - 16:00")[0]).toEqual(
      { date: "04.10", title: "Канкан", time: "16:00" },
    );
  });

  it("дужки й дефіси в назві зберігаються", () => {
    expect(parseRepertoire("08.10 – Фантастична плутанина (мала сцена) – 18:00")[0].title)
      .toBe("Фантастична плутанина (мала сцена)");
  });

  it("дата й текст у плашці ніколи не дублюють назву", () => {
    const text = [
      "01.10 – SQUIRT: The Las Vegas Show – 18:00",
      "06.10 – Freedom Jazz – 18:00",
      "12.10 – ALENA OMARGALIEVA – 18:00",
    ].join("\n");
    for (const r of parseRepertoire(text)) {
      expect(r.date).toMatch(/^\d{2}\.\d{2}$/);
      expect(r.title).not.toContain(r.date);
      expect(r.title).not.toContain(r.time);
    }
  });

  it("рядок без дати чи часу не губиться", () => {
    expect(parseRepertoire("Прем'єра сезону")).toEqual([{ date: "", title: "Прем'єра сезону", time: "" }]);
    expect(parseRepertoire("15.10 – Гала-концерт")).toEqual([{ date: "15.10", title: "Гала-концерт", time: "" }]);
  });

  it("порожні рядки пропускаються", () => {
    expect(parseRepertoire("\n01.10 – A – 18:00\n\n")).toHaveLength(1);
  });
});
