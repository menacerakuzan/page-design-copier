import { describe, it, expect } from "vitest";
import { parseHours } from "./hours";
import { posterFileBase, posterItemFromObject } from "./item";
import type { City, District, TourismObject } from "@/types/hierarchy";

describe("parseHours (порт qr-postery/_generator/data.mjs)", () => {
  it("розбиває рядки днів і нормалізує тире та нулі", () => {
    expect(parseHours("Ср-Нд 10:00-17:00, Пн-Вт вихідний")).toEqual([
      { days: "Ср–Нд", time: "10:00–17:00" },
      { days: "Пн–Вт", time: "зачинено" },
    ]);
    expect(parseHours("Пн-Пт 9:00-18:00")).toEqual([{ days: "Пн–Пт", time: "09:00–18:00" }]);
  });

  it("кілька проміжків в один день — через «·»", () => {
    expect(parseHours("Пн-Пт 09:00-13:00 / 14:00-18:00")[0].time).toBe("09:00–13:00 · 14:00–18:00");
  });

  it("повні назви днів і «Вс» → «Нд»", () => {
    expect(parseHours("вівторок-неділя: 10:00-19:00   понеділок: зачинено")).toEqual([
      { days: "Вівторок–неділя", time: "10:00–19:00" },
      { days: "Понеділок", time: "зачинено" },
    ]);
    expect(parseHours("Сб-Вс 10:00-16:00")[0].days).toBe("Сб–Нд");
  });

  it("нерозпізнаний текст лишається одним рядком, порожній — без рядків", () => {
    expect(parseHours("За попереднім записом")).toEqual([{ days: "", time: "За попереднім записом" }]);
    expect(parseHours("")).toEqual([]);
    expect(parseHours(undefined)).toEqual([]);
  });
});

const districts: District[] = [{ id: "d1", regionId: "r", name: "Подільський район", slug: "podilskyi" }];
const cities: City[] = [{ id: "c1", districtId: "d1", name: "Балта", slug: "balta" }];
const base: TourismObject = {
  id: "o1", districtId: "d1", cityId: "c1", type: "attraction",
  name: "Балтський  історичний\nмузей", slug: "baltskyy-muzey", published: true,
};

describe("posterItemFromObject", () => {
  it("будує назву, місце, графік і посилання на сторінку місця", () => {
    const item = posterItemFromObject({ ...base, hours: "Ср-Нд 10:00-17:00" }, cities, districts);
    expect(item).toMatchObject({
      name: "Балтський історичний музей",
      place: "Балта · Подільський район",
      url: "https://tourism.od.gov.ua/mistse/baltskyy-muzey",
      infoTitle: "ГРАФІК РОБОТИ",
      schedule: [{ days: "Ср–Нд", time: "10:00–17:00" }],
    });
  });

  it("посилання враховує тип об'єкта", () => {
    expect(posterItemFromObject({ ...base, type: "event" }).url).toBe("https://tourism.od.gov.ua/podiyi/baltskyy-muzey");
    expect(posterItemFromObject({ ...base, type: "hotel" }).url).toBe("https://tourism.od.gov.ua/hoteli/baltskyy-muzey");
  });

  it("без графіка — дати події, далі адреса, далі лише код", () => {
    expect(posterItemFromObject({ ...base, eventDates: "12–14 вересня" })).toMatchObject({
      infoTitle: "ДАТА ПРОВЕДЕННЯ", schedule: [{ days: "", time: "12–14 вересня" }],
    });
    expect(posterItemFromObject({ ...base, address: "вул. Соборна, 1" }).infoTitle).toBe("АДРЕСА");
    expect(posterItemFromObject(base)).toMatchObject({ infoTitle: "", schedule: [] });
  });

  it("об'єкт без населеного пункту показує лише район", () => {
    expect(posterItemFromObject({ ...base, cityId: null }, cities, districts).place).toBe("Подільський район");
  });

  it("задовгий вільний текст обрізається по слову з трикрапкою", () => {
    const long = "дуже довгий опис ".repeat(30);
    const { time } = posterItemFromObject({ ...base, address: long }).schedule[0];
    expect(time.length).toBeLessThanOrEqual(221);
    expect(time.endsWith("…")).toBe(true);
    expect(time).not.toMatch(/\s…$/);
  });

  it("назва файлу — ASCII і стабільна", () => {
    const item = posterItemFromObject(base);
    expect(posterFileBase(item)).toBe("qr-baltskyy-muzey");
    expect(posterFileBase(item, 3)).toBe("03-baltskyy-muzey");
  });
});
