import { describe, it, beforeEach, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderRoute } from "@/test/render";
import { tableData } from "@/test/msw/handlers";
import { regionRow, districtRow, cityRow, objectRow, contentCardRow } from "@/test/fixtures";
import DistrictPage from "./DistrictPage";
import CityPage from "./CityPage";
import EntityDetail from "./EntityDetail";
import DistrictsPage from "./DistrictsPage";

/**
 * Регресійні тести на конкретні пункти аудиту вебдоступності Мінцифри
 * (Центр компетенцій з цифрової доступності ДП «Дія», 24.08.2026).
 *
 * Кожен тест названий номером пункту зі звіту — якщо колись хтось випадково
 * відкотить виправлення, впаде саме той тест, і буде видно, яку вимогу
 * порушено. Без цього всі правки доступності — «невидимі» й ламаються тихо.
 */
beforeEach(() => {
  tableData.regions = [regionRow];
  tableData.districts = [districtRow];
  tableData.cities = [cityRow];
  tableData.tourism_objects = [objectRow];
  tableData.content_cards = [contentCardRow];
  tableData.page_configs = [];
});

const opts = { timeout: 4000 };

describe("аудит вебдоступності — структура сторінок", () => {
  it("§7: на сторінці є <main> як ціль швидкого переходу до вмісту", async () => {
    const { container } = renderRoute("/raion/:districtSlug", "/raion/odeskyi", <DistrictPage />);
    await screen.findAllByText(/Одеський район/, undefined, opts);
    const main = container.querySelector("main");
    expect(main, "має бути landmark <main>").not.toBeNull();
    // Без tabindex focus() на контейнері мовчки не спрацьовує і Tab
    // продовжив би з наступного посилання шапки замість основного вмісту.
    expect(main?.getAttribute("tabindex")).toBe("-1");
    expect(main?.getAttribute("id")).toBe("main-content");
  });

  it("§17.2.2: шапка обгорнута у <header>", async () => {
    const { container } = renderRoute("/raion/:districtSlug", "/raion/odeskyi", <DistrictPage />);
    await screen.findAllByText(/Одеський район/, undefined, opts);
    expect(container.querySelector("header"), "шапка має бути <header>").not.toBeNull();
  });

  it("рівно один <h1> на сторінку, і це НЕ назва сайту", async () => {
    const { container } = renderRoute("/raion/:districtSlug", "/raion/odeskyi", <DistrictPage />);
    await screen.findAllByText(/Одеський район/, undefined, opts);
    const h1s = container.querySelectorAll("h1");
    expect(h1s.length, "має бути рівно один h1").toBe(1);
    // Раніше <h1> був «ОДЕЩИНА» на КОЖНІЙ сторінці — тобто головний заголовок
    // не описував тему сторінки (порушення 2.4.6 / 1.3.1).
    expect(h1s[0].textContent?.trim()).not.toBe("ОДЕЩИНА");
  });

  it("§2.1.4: емблема доступна скринридеру (role=img + назва)", async () => {
    const { container } = renderRoute("/raion/:districtSlug", "/raion/odeskyi", <DistrictPage />);
    await screen.findAllByText(/Одеський район/, undefined, opts);
    // Емблема головної намальована CSS-маскою по <div>; перевіряємо, що
    // подібні декоративні шари або приховані, або мають доступну назву.
    const imgRoles = container.querySelectorAll('[role="img"]');
    imgRoles.forEach((el) => {
      expect(
        el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"),
        "role=img без доступної назви",
      ).toBeTruthy();
    });
  });
});

describe("аудит вебдоступності — кнопки й посилання", () => {
  it("§4: жодної кнопки без доступної назви", async () => {
    const { container } = renderRoute("/mistse/:slug", "/mistse/muzei", <EntityDetail type="attraction" />);
    await screen.findAllByText(/Музей/, undefined, opts);
    const unnamed: string[] = [];
    container.querySelectorAll("button").forEach((b) => {
      const hasText = (b.textContent ?? "").trim().length > 0;
      const hasLabel = b.getAttribute("aria-label") || b.getAttribute("aria-labelledby") || b.getAttribute("title");
      if (!hasText && !hasLabel) unnamed.push(b.outerHTML.slice(0, 90));
    });
    expect(unnamed, `кнопки без назви:\n${unnamed.join("\n")}`).toEqual([]);
  });

  it("§3.2.1: картка не є одним гігантським <a> з купою вкладеного тексту", async () => {
    const { container } = renderRoute("/districts", "/districts", <DistrictsPage />);
    await screen.findAllByText(/Одеський район/, undefined, opts);
    // Ім'я посилання не має злипатися з усього вмісту картки. Беремо найдовше
    // доступне ім'я серед посилань і вимагаємо розумної межі.
    const tooLong: string[] = [];
    container.querySelectorAll("a").forEach((a) => {
      const name = (a.getAttribute("aria-label") ?? a.textContent ?? "").replace(/\s+/g, " ").trim();
      if (name.length > 160) tooLong.push(`${name.slice(0, 80)}… (${name.length} симв.)`);
    });
    expect(tooLong, `посилання з надто довгим іменем:\n${tooLong.join("\n")}`).toEqual([]);
  });

  it("§4.1.6 / 4.1.3: кнопки-розгорталки мають aria-expanded, перемикачі — aria-pressed", async () => {
    const { container } = renderRoute("/mistse/:slug", "/mistse/muzei", <EntityDetail type="attraction" />);
    await screen.findAllByText(/Музей/, undefined, opts);
    // Значення мають бути валідними булевими рядками, а не порожніми.
    container.querySelectorAll("[aria-expanded]").forEach((el) => {
      expect(["true", "false"]).toContain(el.getAttribute("aria-expanded"));
    });
    container.querySelectorAll("[aria-pressed]").forEach((el) => {
      expect(["true", "false"]).toContain(el.getAttribute("aria-pressed"));
    });
  });
});

describe("аудит вебдоступності — зображення та медіа", () => {
  it("§2.1.1: у кожного <img> є атрибут alt (порожній = декоративне)", async () => {
    const { container } = renderRoute("/napryamky/:citySlug", "/napryamky/bilyaivka", <CityPage />);
    await screen.findAllByText(/Біляївка/, undefined, opts);
    const missing: string[] = [];
    container.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) missing.push(img.getAttribute("src") ?? "(без src)");
    });
    expect(missing, `<img> без alt:\n${missing.join("\n")}`).toEqual([]);
  });

  it("§2.1.1: alt не дублює видимий заголовок поруч", async () => {
    const { container } = renderRoute("/napryamky/:citySlug", "/napryamky/bilyaivka", <CityPage />);
    await screen.findAllByText(/Біляївка/, undefined, opts);
    // Дублювання (alt === сусідній заголовок) змушувало незрячого чути назву двічі.
    const dupes: string[] = [];
    container.querySelectorAll("img[alt]").forEach((img) => {
      const alt = (img.getAttribute("alt") ?? "").trim();
      if (!alt) return;
      const card = img.closest("article, a, div");
      const heading = card?.querySelector("h2, h3, h4");
      if (heading && heading.textContent?.trim() === alt) dupes.push(alt);
    });
    expect(dupes, `alt дублює заголовок:\n${dupes.join("\n")}`).toEqual([]);
  });

  it("§2.2.2: фонове відео має кнопку паузи", async () => {
    const { container } = renderRoute("/raion/:districtSlug", "/raion/odeskyi", <DistrictPage />);
    await screen.findAllByText(/Одеський район/, undefined, opts);
    const video = container.querySelector("video");
    if (!video) return; // у фікстурі може не бути відео — тоді вимога не застосовна
    const pauseBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      /пауз|зупинити|pause|відтворити|play/i.test(b.getAttribute("aria-label") ?? ""),
    );
    expect(pauseBtn, "автоматичне відео без кнопки паузи (WCAG 2.2.2)").toBeTruthy();
  });
});

describe("аудит вебдоступності — переклад інтерфейсу", () => {
  it("англійська версія не показує українських заголовків секцій", async () => {
    // sectionTitle() має перекладати і дефолтні заголовки, і збережені в БД.
    const { sectionTitle, tourismTypeLabel } = await import("@/lib/sectionTitles");
    expect(sectionTitle("Про район", "en")).toBe("About the district");
    expect(sectionTitle("Населені пункти", "en")).toBe("Settlements");
    expect(sectionTitle("Про район", "uk")).toBe("Про район");
    // Невідомий (написаний адміном вручну) заголовок повертається як є —
    // краще показати українською, ніж загубити текст.
    expect(sectionTitle("Власний заголовок", "en")).toBe("Власний заголовок");
    expect(tourismTypeLabel("Морський туризм", "en")).toBe("Coastal tourism");
    expect(tourismTypeLabel("Морський туризм", "uk")).toBe("Морський туризм");
  });

  it("обидві локалі мають однаковий набір ключів", async () => {
    const { translations } = await import("@/lib/i18n");
    const uk = Object.keys(translations.uk).sort();
    const en = Object.keys(translations.en).sort();
    const onlyUk = uk.filter((k) => !en.includes(k));
    const onlyEn = en.filter((k) => !uk.includes(k));
    expect(onlyUk, `ключі лише в uk: ${onlyUk.join(", ")}`).toEqual([]);
    expect(onlyEn, `ключі лише в en: ${onlyEn.join(", ")}`).toEqual([]);
  });

  it("жодне значення перекладу не порожнє", async () => {
    const { translations } = await import("@/lib/i18n");
    (["uk", "en"] as const).forEach((loc) => {
      Object.entries(translations[loc]).forEach(([k, v]) => {
        expect(String(v).trim().length, `${loc}.${k} порожній`).toBeGreaterThan(0);
      });
    });
  });
});
