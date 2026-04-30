import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  History,
  Layers,
  Palette,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { colorPresets } from "@/data/adminMockData";
import {
  cities as seedCities,
  districts as seedDistricts,
  regions as seedRegions,
  tourismObjects as seedObjects,
} from "@/data/hierarchyMockData";
import { ContentCardEntity } from "@/types/cms";
import { City, District, Region, TourismObject, TourismObjectType } from "@/types/hierarchy";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import {
  deleteCity,
  deleteDistrict,
  deleteRegion,
  deleteContentCard,
  deleteTourismObject,
  insertCity,
  insertContentCard,
  insertDistrict,
  insertRegion,
  insertTourismObject,
  loadChangeLogs,
  loadHierarchySnapshot,
  rollbackChange,
  syncContentCardsFromFallback,
  upsertContentCard,
  upsertTourismObject,
} from "@/lib/adminRepository";
import { validateContentCardDraft, validateObjectDraft } from "@/lib/adminValidation";

const typeLabels: Record<TourismObjectType, string> = {
  event: "Події",
  hotel: "Готелі",
  restaurant: "Ресторани",
  attraction: "Об'єкти",
};

const cardTypeOptions = [
  "event",
  "hotel",
  "restaurant",
  "attraction",
  "destination",
  "offer",
  "info",
  "text",
] as const;

const cardTypeLabels: Record<(typeof cardTypeOptions)[number], string> = {
  event: "Подія",
  hotel: "Готель",
  restaurant: "Ресторан",
  attraction: "Локація",
  destination: "Напрямок",
  offer: "Пропозиція",
  info: "Інфо",
  text: "Текст",
};

type AdminTab = "workspace" | "hierarchy" | "history";
type BuilderType = "event" | "hotel" | "restaurant" | "attraction";
type ObjectEditorStep = "general" | "builder" | "seo" | "history";

const builderTypeLabels: Record<BuilderType, string> = {
  event: "Подія",
  hotel: "Готель",
  restaurant: "Ресторан",
  attraction: "Локація",
};

const builderTypeTheme: Record<BuilderType, { bg: string; panel: string; accent: string; text: string }> = {
  event: { bg: "#002f5e", panel: "#174773", accent: "#df9b3b", text: "#fff2e8" },
  hotel: { bg: "#df9b3b", panel: "#e8ac4e", accent: "#9f1f47", text: "#002f5e" },
  restaurant: { bg: "#9f1f47", panel: "#b53461", accent: "#df9b3b", text: "#fff2e8" },
  attraction: { bg: "#002f5e", panel: "#174773", accent: "#df9b3b", text: "#fff2e8" },
};

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .replace(/[^\x00-\x7F]/g, "");

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("workspace");
  const [selectedType, setSelectedType] = useState<TourismObjectType>("event");
  const [builderType, setBuilderType] = useState<BuilderType>("event");

  const [objects, setObjects] = useState<TourismObject[]>(seedObjects);
  const [regions, setRegions] = useState<Region[]>(seedRegions);
  const [districts, setDistricts] = useState<District[]>(seedDistricts);
  const [cities, setCities] = useState<City[]>(seedCities);
  const [contentCards, setContentCards] = useState<ContentCardEntity[]>([]);
  const [changeLogs, setChangeLogs] = useState<any[]>([]);

  const [selectedObjectId, setSelectedObjectId] = useState(seedObjects[0]?.id ?? "");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [payloadDraft, setPayloadDraft] = useState("{}");
  const [pageFilter, setPageFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [objectDistrictFilter, setObjectDistrictFilter] = useState("all");
  const [objectCityFilter, setObjectCityFilter] = useState("all");
  const [cardDistrictFilter, setCardDistrictFilter] = useState("all");
  const [cardCityFilter, setCardCityFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [savingState, setSavingState] = useState("");
  const [builderDraft, setBuilderDraft] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    href: "",
    description: "",
    address: "",
    phone: "",
    mapUrl: "",
    hours: "",
    eventDates: [{ from: "", to: "", label: "Основні дати" }],
    workSlots: [{ days: "ПН-НД", from: "10:00", to: "20:00" }],
    amenities: [] as string[],
    payments: [] as string[],
    rating: "4.8",
    gallery: [] as string[],
    sections: {
      hero: true,
      overview: true,
      info: true,
      gallery: true,
      contacts: true,
      map: true,
    },
    districtId: "",
    cityId: "",
    showOnMain: true,
    mainSection: "directions",
    published: true,
  });
  const [builderTagInput, setBuilderTagInput] = useState("");
  const [builderPaymentInput, setBuilderPaymentInput] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState("all");
  const [selectedDistrictId, setSelectedDistrictId] = useState("all");
  const [selectedCityId, setSelectedCityId] = useState("all");
  const [objectEditorStep, setObjectEditorStep] = useState<ObjectEditorStep>("general");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [objectCardsEdits, setObjectCardsEdits] = useState<ContentCardEntity[]>([]);

  const [presetByObjectId, setPresetByObjectId] = useState<Record<string, string>>({
    "obj-event-bessarabia": "event-default",
    "obj-hotel-fortetsia": "hotel-sand",
    "obj-restaurant-rybnyi": "restaurant-berry",
  });

  const filteredObjects = useMemo(
    () =>
      objects
        .filter((obj) => obj.type === selectedType)
        .filter((obj) => (objectDistrictFilter === "all" ? true : obj.districtId === objectDistrictFilter))
        .filter((obj) => (objectCityFilter === "all" ? true : obj.cityId === objectCityFilter))
        .filter((obj) => {
          if (selectedCityId !== "all") return obj.cityId === selectedCityId;
          if (selectedDistrictId !== "all") return obj.districtId === selectedDistrictId;
          if (selectedRegionId !== "all") {
            const d = districts.find((x) => x.id === obj.districtId);
            return d?.regionId === selectedRegionId;
          }
          return true;
        }),
    [objects, selectedType, objectDistrictFilter, objectCityFilter, selectedCityId, selectedDistrictId, selectedRegionId, districts],
  );

  const selectedObject =
    objects.find((obj) => obj.id === selectedObjectId) ?? filteredObjects[0] ?? objects[0];

  const selectedRegionForSidebar =
    selectedRegionId !== "all" ? regions.find((region) => region.id === selectedRegionId) ?? null : null;
  const districtForSidebar =
    selectedDistrictId !== "all" ? districts.find((district) => district.id === selectedDistrictId) ?? null : null;
  const cityForSidebar =
    selectedCityId !== "all" ? cities.find((city) => city.id === selectedCityId) ?? null : null;

  const cardPageOptions = useMemo(
    () => Array.from(new Set(contentCards.map((card) => card.pageKey))).sort((a, b) => a.localeCompare(b)),
    [contentCards],
  );

  const filteredCards = useMemo(() => {
    return contentCards
      .filter((card) => (pageFilter === "all" ? true : card.pageKey === pageFilter))
      .filter((card) => (sectionFilter === "all" ? true : card.sectionKey === sectionFilter))
      .filter((card) => (cardDistrictFilter === "all" ? true : card.districtId === cardDistrictFilter))
      .filter((card) => (cardCityFilter === "all" ? true : card.cityId === cardCityFilter))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }, [contentCards, pageFilter, sectionFilter, cardDistrictFilter, cardCityFilter]);

  const sectionOptions = useMemo(() => {
    const source =
      pageFilter === "all" ? contentCards : contentCards.filter((card) => card.pageKey === pageFilter);
    return Array.from(new Set(source.map((card) => card.sectionKey))).sort((a, b) => a.localeCompare(b));
  }, [contentCards, pageFilter]);

  const visualPageCards = useMemo(() => {
    if (pageFilter === "all") return [];
    return contentCards
      .filter((card) => card.pageKey === pageFilter)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [contentCards, pageFilter]);

  const selectedCard =
    contentCards.find((card) => card.id === selectedCardId) ?? filteredCards[0] ?? contentCards[0];

  const selectedObjectRoute = selectedObject
    ? selectedObject.type === "event"
      ? `/podiyi/${selectedObject.slug}`
      : selectedObject.type === "hotel"
        ? `/hoteli/${selectedObject.slug}`
        : selectedObject.type === "restaurant"
          ? `/restorany/${selectedObject.slug}`
          : `/napryamky/${cities.find((city) => city.id === selectedObject.cityId)?.slug ?? ""}`
    : "";

  const builderDistrictOptions = useMemo(() => districts, [districts]);
  const builderCityOptions = useMemo(
    () =>
      cities.filter((city) =>
        builderDraft.districtId ? city.districtId === builderDraft.districtId : true,
      ),
    [cities, builderDraft.districtId],
  );

  useEffect(() => {
    if (!selectedCard) return;
    setPayloadDraft(JSON.stringify(selectedCard.payload ?? {}, null, 2));
  }, [selectedCard?.id]);

  useEffect(() => {
    if (!selectedObject) {
      setObjectCardsEdits([]);
      return;
    }
    const detailPageKey = `detail-${selectedObject.type}-${selectedObject.slug}`;
    const related = contentCards
      .filter((card) => {
        const payloadObjectId = String((card.payload as any)?.objectId ?? "");
        const href = card.href ?? "";
        const byPayload = payloadObjectId === selectedObject.id;
        const byDetailPage = card.pageKey === detailPageKey;
        const byHref = href.includes(`/${selectedObject.slug}`);
        return byPayload || byDetailPage || byHref;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
    setObjectCardsEdits(related);
  }, [selectedObject?.id, selectedObject?.slug, selectedObject?.type, contentCards]);

  const selectedDistricts = selectedObject
    ? districts.filter((d) => d.id === selectedObject.districtId || d.regionId === regions[0]?.id)
    : districts;
  const cityOptions = selectedObject
    ? cities.filter((c) => c.districtId === selectedObject.districtId)
    : cities;

  const loadAllData = async () => {
    try {
      setLoading(true);
      setErrorText("");
      const snap = await loadHierarchySnapshot();
      setRegions(snap.regions);
      setDistricts(snap.districts);
      setCities(snap.cities);
      setObjects(snap.objects);
      setContentCards(snap.contentCards);
      if (snap.objects.length) setSelectedObjectId((prev) => prev || snap.objects[0].id);
      if (snap.contentCards.length) setSelectedCardId((prev) => prev || snap.contentCards[0].id);
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося завантажити дані");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const logs = await loadChangeLogs();
      setChangeLogs(logs);
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося завантажити історію");
    }
  };

  useEffect(() => {
    void loadAllData();
    void loadLogs();
  }, []);

  const updateObject = (patch: Partial<TourismObject>) => {
    if (!selectedObject) return;
    const next = { ...selectedObject, ...patch };
    const nextObjects = objects.map((obj) => (obj.id === selectedObject.id ? next : obj));
    setObjects(nextObjects);
  };

  const saveObject = async () => {
    if (!selectedObject) return;
    const validationError = validateObjectDraft(selectedObject, objects, districts, cities);
    if (validationError) {
      setErrorText(validationError);
      return;
    }
    setErrorText("");
    setSavingState("Зберігаємо об'єкт...");
    try {
      await upsertTourismObject(selectedObject);
      await loadLogs();
      setSavingState("Об'єкт збережено");
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка збереження об'єкта");
    } finally {
      window.setTimeout(() => setSavingState(""), 1000);
    }
  };

  const createObject = async () => {
    const districtId =
      selectedDistrictId !== "all"
        ? selectedDistrictId
        : selectedCityId !== "all"
          ? cities.find((c) => c.id === selectedCityId)?.districtId ?? districts[0]?.id
          : districts[0]?.id;
    const cityId =
      selectedCityId !== "all"
        ? selectedCityId
        : cities.find((city) => city.districtId === districtId)?.id ?? cities[0]?.id;
    if (!districtId || !cityId) {
      setErrorText("Спочатку додайте район і місто");
      return;
    }
    const now = Date.now();
    const uid = Math.random().toString(36).slice(2, 8);
    const newObject: TourismObject = {
      id: `obj-${selectedType}-${now}-${uid}`,
      districtId,
      cityId,
      type: selectedType,
      name: `Новий ${typeLabels[selectedType].toLowerCase()}`,
      slug: `${selectedType}-${now}-${uid}`,
      published: false,
    };
    const nextObjects = [newObject, ...objects];
    setObjects(nextObjects);
    setSelectedObjectId(newObject.id);

    const validationError = validateObjectDraft(newObject, nextObjects, districts, cities);
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setErrorText("");
    try {
      await insertTourismObject(newObject);
      const city = cities.find((item) => item.id === cityId);
      const detailPageKey = `detail-${selectedType}-${newObject.slug}`;
      const href =
        selectedType === "event"
          ? `/podiyi/${newObject.slug}`
          : selectedType === "hotel"
            ? `/hoteli/${newObject.slug}`
            : selectedType === "restaurant"
              ? `/restorany/${newObject.slug}`
              : city
                ? `/napryamky/${city.slug}`
                : null;
      await insertContentCard({
        id: `card-detail-hero-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "hero",
        cardType: selectedType,
        title: newObject.name,
        subtitle: city?.name ?? null,
        imageUrl: null,
        href,
        cityId: newObject.cityId,
        districtId: newObject.districtId,
        regionId: districts.find((d) => d.id === newObject.districtId)?.regionId ?? null,
        sortOrder: 1,
        published: false,
        payload: { objectId: newObject.id },
      });
      await insertContentCard({
        id: `card-detail-overview-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "overview",
        cardType: "text",
        title: "Опис",
        subtitle: null,
        imageUrl: null,
        href: null,
        cityId: newObject.cityId,
        districtId: newObject.districtId,
        regionId: districts.find((d) => d.id === newObject.districtId)?.regionId ?? null,
        sortOrder: 2,
        published: false,
        payload: { objectId: newObject.id, text: "" },
      });
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка створення об'єкта");
    }
  };

  const saveObjectCards = async () => {
    if (!selectedObject) return;
    setSavingState("Зберігаємо секції сторінки...");
    setErrorText("");
    try {
      const knownIds = new Set(contentCards.map((card) => card.id));
      const nextCards = objectCardsEdits.map((card, idx) => ({
        ...card,
        sortOrder: idx + 1,
        cityId: selectedObject.cityId,
        districtId: selectedObject.districtId,
        payload: { ...(card.payload ?? {}), objectId: selectedObject.id },
      }));
      const existingRelatedIds = contentCards
        .filter((card) => String((card.payload as any)?.objectId ?? "") === selectedObject.id)
        .map((card) => card.id);
      const removedIds = existingRelatedIds.filter((id) => !nextCards.some((card) => card.id === id));
      for (const id of removedIds) {
        await deleteContentCard(id);
      }
      for (const card of nextCards) {
        if (knownIds.has(card.id)) {
          await upsertContentCard(card);
        } else {
          await insertContentCard(card);
        }
      }
      await loadAllData();
      await loadLogs();
      setSavingState("Секції сторінки збережено");
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка збереження секцій сторінки");
    } finally {
      window.setTimeout(() => setSavingState(""), 1200);
    }
  };

  const addObjectCard = () => {
    if (!selectedObject) return;
    const now = Date.now();
    const detailPageKey = `detail-${selectedObject.type}-${selectedObject.slug}`;
    setObjectCardsEdits((prev) => [
      ...prev,
      {
        id: `card-${selectedObject.type}-${now}`,
        pageKey: detailPageKey,
        sectionKey: "overview",
        cardType: selectedObject.type,
        title: "Новий блок",
        subtitle: null,
        imageUrl: null,
        href: selectedObjectRoute || null,
        cityId: selectedObject.cityId,
        districtId: selectedObject.districtId,
        regionId: districts.find((d) => d.id === selectedObject.districtId)?.regionId ?? null,
        sortOrder: prev.length + 1,
        published: true,
        payload: { objectId: selectedObject.id },
      },
    ]);
  };

  const removeObject = async () => {
    if (!selectedObject) return;
    const confirmText = window.prompt(
      `Щоб видалити об'єкт, введіть його назву:\n${selectedObject.name}`,
    );
    if (confirmText !== selectedObject.name) return;

    const toDeleteId = selectedObject.id;
    const nextObjects = objects.filter((obj) => obj.id !== toDeleteId);
    setObjects(nextObjects);
    setSelectedObjectId(
      nextObjects.find((obj) => obj.type === selectedType)?.id ?? nextObjects[0]?.id ?? "",
    );

    try {
      await deleteTourismObject(toDeleteId);
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка видалення об'єкта");
    }
  };

  const updateCard = (patch: Partial<ContentCardEntity>) => {
    if (!selectedCard) return;
    const next = { ...selectedCard, ...patch };
    const nextCards = contentCards.map((card) => (card.id === selectedCard.id ? next : card));
    setContentCards(nextCards);
    if (patch.id && patch.id !== selectedCard.id) {
      setSelectedCardId(patch.id);
    }
  };

  const saveCard = async () => {
    if (!selectedCard) return;
    const validationError = validateContentCardDraft(
      selectedCard,
      contentCards,
      regions,
      districts,
      cities,
    );
    if (validationError) {
      setErrorText(validationError);
      return;
    }
    setErrorText("");
    setSavingState("Зберігаємо картку...");
    try {
      await upsertContentCard(selectedCard);
      await loadLogs();
      setSavingState("Картку збережено");
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка збереження картки");
    } finally {
      window.setTimeout(() => setSavingState(""), 1000);
    }
  };

  const createCard = async () => {
    const now = Date.now();
    const newCard: ContentCardEntity = {
      id: `card-${now}`,
      pageKey: pageFilter === "all" ? "index" : pageFilter,
      sectionKey: sectionFilter === "all" ? "new-section" : sectionFilter,
      cardType: "attraction",
      title: "Нова картка",
      subtitle: null,
      imageUrl: null,
      href: null,
      cityId: null,
      districtId: null,
      regionId: regions[0]?.id ?? null,
      sortOrder: filteredCards.length + 1,
      published: false,
      payload: {},
    };
    const nextCards = [newCard, ...contentCards];
    setContentCards(nextCards);
    setSelectedCardId(newCard.id);

    const validationError = validateContentCardDraft(newCard, nextCards, regions, districts, cities);
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setErrorText("");
    try {
      await insertContentCard(newCard);
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка створення картки");
    }
  };

  const removeCard = async () => {
    if (!selectedCard) return;
    const confirmText = window.prompt(
      `Щоб видалити картку, введіть її назву:\n${selectedCard.title}`,
    );
    if (confirmText !== selectedCard.title) return;

    const nextCards = contentCards.filter((card) => card.id !== selectedCard.id);
    setContentCards(nextCards);
    setSelectedCardId(nextCards[0]?.id ?? "");

    try {
      await deleteContentCard(selectedCard.id);
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка видалення картки");
    }
  };

  const rollback = async (id: string) => {
    if (!window.confirm("Виконати rollback цієї зміни?")) return;
    try {
      await rollbackChange(id);
      await loadAllData();
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося виконати rollback");
    }
  };

  const createCityWithTemplates = async () => {
    const districtId = districts[0]?.id;
    if (!districtId) {
      setErrorText("Спочатку додайте район");
      return;
    }
    const district = districts.find((item) => item.id === districtId);
    if (!district) return;
    const now = Date.now();
    const name = `Нове місто ${cities.length + 1}`;
    const slug = slugify(name) || `city-${now}`;
    const city: City = {
      id: `city-${now}`,
      districtId,
      name,
      slug,
    };
    try {
      await insertCity(city);
      const regionId = district.regionId;
      const pageKey = `city-${slug}`;
      const templateCards: ContentCardEntity[] = [
        {
          id: `card-city-main-${now}`,
          pageKey,
          sectionKey: "main",
          cardType: "text",
          title: "Опис району",
          subtitle: null,
          imageUrl: null,
          href: null,
          cityId: city.id,
          districtId: district.id,
          regionId,
          sortOrder: 1,
          published: true,
          payload: { text: `${name} — нова сторінка міста. Заповніть опис у адмінці.` },
        },
        {
          id: `card-city-info-1-${now}`,
          pageKey,
          sectionKey: "info",
          cardType: "info",
          title: "Історія та культура",
          subtitle: null,
          imageUrl: null,
          href: null,
          cityId: city.id,
          districtId: district.id,
          regionId,
          sortOrder: 1,
          published: true,
          payload: {},
        },
      ];
      for (const card of templateCards) {
        await insertContentCard(card);
      }
      await insertContentCard({
        id: `card-direction-${now}`,
        pageKey: "index",
        sectionKey: "directions",
        cardType: "destination",
        title: name,
        subtitle: null,
        imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
        href: `/napryamky/${slug}`,
        cityId: city.id,
        districtId: district.id,
        regionId,
        sortOrder: Date.now(),
        published: true,
        payload: {},
      });
      await loadAllData();
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося створити місто з шаблоном");
    }
  };

  const createFromTemplate = async () => {
    const title = builderDraft.title.trim();
    if (!title) {
      setErrorText("Вкажіть назву");
      return;
    }
    if (!builderDraft.districtId || !builderDraft.cityId) {
      setErrorText("Оберіть район та місто");
      return;
    }
    const city = cities.find((c) => c.id === builderDraft.cityId);
    const district = districts.find((d) => d.id === builderDraft.districtId);
    if (!city || !district) {
      setErrorText("Невірна прив'язка місто/район");
      return;
    }
    if (city.districtId !== district.id) {
      setErrorText("Місто не належить обраному району");
      return;
    }
    const now = Date.now();
    const uid = Math.random().toString(36).slice(2, 8);
    const slug = slugify(title) || `${builderType}-${now}`;
    const objectId = `obj-${builderType}-${now}-${uid}`;
    const cardId = `card-${builderType}-${now}-${uid}`;
    const detailPageKey = `detail-${builderType}-${slug}`;
    const regionId = district.regionId;
    const cityPageKey = `city-${city.slug}`;
    const citySectionByType: Record<BuilderType, string> = {
      event: "media",
      hotel: "hotels",
      restaurant: "restaurants",
      attraction: "media",
    };
    const citySection = citySectionByType[builderType];

    const href =
      builderDraft.href.trim() ||
      (builderType === "event"
        ? `/podiyi/${slug}`
        : builderType === "hotel"
          ? `/hoteli/${slug}`
          : builderType === "restaurant"
            ? `/restorany/${slug}`
            : "");

    const newObject: TourismObject = {
      id: objectId,
      districtId: district.id,
      cityId: city.id,
      type: builderType,
      name: title,
      slug,
      published: builderDraft.published,
    };

    const validationObject = validateObjectDraft(newObject, [newObject, ...objects], districts, cities);
    if (validationObject) {
      setErrorText(validationObject);
      return;
    }

    const citySectionCards = contentCards.filter(
      (card) => card.pageKey === cityPageKey && card.sectionKey === citySection,
    );
    const maxCitySort = citySectionCards.length ? Math.max(...citySectionCards.map((c) => c.sortOrder)) : 0;
    const newCard: ContentCardEntity = {
      id: cardId,
      pageKey: cityPageKey,
      sectionKey: citySection,
      cardType: builderType,
      title,
      subtitle: builderDraft.subtitle.trim() || city.name,
      imageUrl: builderDraft.imageUrl.trim() || null,
      href: href || null,
      cityId: city.id,
      districtId: district.id,
      regionId,
      sortOrder: maxCitySort + 1,
      published: builderDraft.published,
      payload:
        builderType === "event"
          ? { badgeTop: "до", badgeDay: "1", badgeMonth: "травень", objectId }
          : builderType === "hotel"
            ? { rating: "4.8", objectId }
            : { objectId },
    };

    const validationCard = validateContentCardDraft(
      newCard,
      [newCard, ...contentCards],
      regions,
      districts,
      cities,
    );
    if (validationCard) {
      setErrorText(validationCard);
      return;
    }

    const detailCards: ContentCardEntity[] = [
      ...(builderDraft.sections.hero
        ? [{
        id: `card-detail-hero-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "hero",
        cardType: builderType,
        title,
        subtitle: builderDraft.subtitle.trim() || city.name,
        imageUrl: builderDraft.imageUrl.trim() || null,
        href: null,
        cityId: city.id,
        districtId: district.id,
        regionId,
        sortOrder: 1,
        published: builderDraft.published,
        payload: { objectId },
      }]
        : []),
      ...(builderDraft.sections.overview
        ? [{
        id: `card-detail-overview-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "overview",
        cardType: "text",
        title: "Опис",
        subtitle: null,
        imageUrl: null,
        href: null,
        cityId: city.id,
        districtId: district.id,
        regionId,
        sortOrder: 1,
        published: builderDraft.published,
        payload: {
          objectId,
          text:
            builderDraft.description.trim() ||
            `${title} — нова сторінка, створена в конструкторі. Заповніть текст у секції overview.`,
        },
      }]
        : []),
      ...(builderDraft.sections.info
        ? [{
        id: `card-detail-info-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "info",
        cardType: "info",
        title:
          builderType === "event"
            ? "Дати і час"
            : builderType === "hotel"
              ? "Зручності та сервіси"
              : "Меню та атмосфера",
        subtitle: builderDraft.hours.trim() || "Додайте параметри",
        imageUrl: null,
        href: null,
        cityId: city.id,
        districtId: district.id,
        regionId,
        sortOrder: 1,
        published: builderDraft.published,
        payload: {
          mapUrl: builderDraft.mapUrl.trim() || null,
          objectId,
          eventDates: builderDraft.eventDates,
          workSlots: builderDraft.workSlots,
          amenities: builderDraft.amenities,
          payments: builderDraft.payments,
          rating: builderDraft.rating,
          gallery: builderDraft.gallery,
        },
      }]
        : []),
      ...(builderDraft.sections.contacts
        ? [{
        id: `card-detail-contacts-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "contacts",
        cardType: "info",
        title: "Контакти",
        subtitle: builderDraft.address.trim() || city.name,
        imageUrl: null,
        href: href || null,
        cityId: city.id,
        districtId: district.id,
        regionId,
        sortOrder: 1,
        published: builderDraft.published,
        payload: {
          address: builderDraft.address.trim() || city.name,
          phone: builderDraft.phone.trim() || "+38 (000) 000 00 00",
          objectId,
        },
      }]
        : []),
    ];
    if (builderDraft.sections.gallery && builderDraft.gallery.length) {
      detailCards.push({
        id: `card-detail-gallery-${now}-${uid}`,
        pageKey: detailPageKey,
        sectionKey: "gallery",
        cardType: builderType,
        title: "Галерея",
        subtitle: null,
        imageUrl: builderDraft.gallery[0],
        href: null,
        cityId: city.id,
        districtId: district.id,
        regionId,
        sortOrder: 1,
        published: builderDraft.published,
        payload: { images: builderDraft.gallery, objectId },
      });
    }

    const listCards: ContentCardEntity[] = [];
    if (builderDraft.showOnMain) {
      const mainSection =
        builderType === "event"
          ? "events"
          : builderType === "attraction"
            ? builderDraft.mainSection
            : "";
      if (mainSection) {
        const mainCards = contentCards.filter((card) => card.pageKey === "index" && card.sectionKey === mainSection);
        const maxMainSort = mainCards.length ? Math.max(...mainCards.map((c) => c.sortOrder)) : 0;
        listCards.push({
          ...newCard,
          id: `card-main-${builderType}-${now}-${uid}`,
          pageKey: "index",
          sectionKey: mainSection,
          sortOrder: maxMainSort + 1,
          payload:
            builderType === "event"
              ? { badgeTop: "до", badgeDay: "1", badgeMonth: "травень", objectId }
              : { objectId },
        });
      }
    }

    setErrorText("");
    setSavingState("Створюємо...");
    try {
      await insertTourismObject(newObject);
      await insertContentCard(newCard);
      for (const card of detailCards) {
        await insertContentCard(card);
      }
      for (const card of listCards) {
        await insertContentCard(card);
      }
      await loadAllData();
      await loadLogs();
      setSelectedType(builderType);
      setSelectedObjectId(objectId);
      setSelectedCardId(cardId);
      setBuilderDraft((prev) => ({
        ...prev,
        title: "",
        subtitle: "",
        imageUrl: "",
        href: "",
        description: "",
        address: "",
        phone: "",
        mapUrl: "",
        hours: "",
        eventDates: [{ from: "", to: "", label: "Основні дати" }],
        workSlots: [{ days: "ПН-НД", from: "10:00", to: "20:00" }],
        amenities: [],
        payments: [],
        rating: "4.8",
        gallery: [],
        sections: {
          hero: true,
          overview: true,
          info: true,
          gallery: true,
          contacts: true,
          map: true,
        },
        mainSection: "directions",
        published: true,
      }));
      setSavingState("Створено і прив'язано до сторінки");
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка створення");
    } finally {
      window.setTimeout(() => setSavingState(""), 1200);
    }
  };

  const deleteRegionAction = async (regionId: string) => {
    const region = regions.find((r) => r.id === regionId);
    if (!region) return;
    const ok = window.prompt(`Введіть назву області для видалення:\n${region.name}`);
    if (ok !== region.name) return;
    try {
      await deleteRegion(regionId);
      await loadAllData();
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося видалити область");
    }
  };

  const deleteDistrictAction = async (districtId: string) => {
    const district = districts.find((d) => d.id === districtId);
    if (!district) return;
    const ok = window.prompt(`Введіть назву району для видалення:\n${district.name}`);
    if (ok !== district.name) return;
    try {
      await deleteDistrict(districtId);
      await loadAllData();
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося видалити район");
    }
  };

  const deleteCityAction = async (cityId: string) => {
    const city = cities.find((c) => c.id === cityId);
    if (!city) return;
    const ok = window.prompt(`Введіть назву міста для видалення:\n${city.name}`);
    if (ok !== city.name) return;
    try {
      await deleteCity(cityId);
      await loadAllData();
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Не вдалося видалити місто");
    }
  };

  const uploadBuilderMedia = async (event: ChangeEvent<HTMLInputElement>, target: "cover" | "gallery") => {
    const file = event.target.files?.[0];
    if (!file || !supabase) return;
    setUploadingMedia(true);
    setErrorText("");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `cms/${builderType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const url = data.publicUrl;
      if (target === "cover") {
        setBuilderDraft((prev) => ({ ...prev, imageUrl: url }));
      } else {
        setBuilderDraft((prev) => ({ ...prev, gallery: [...prev.gallery, url] }));
      }
    } catch (error: any) {
      setErrorText(
        error?.message ??
          "Помилка завантаження. Перевір bucket `media` і policy на insert/select для authenticated.",
      );
    } finally {
      setUploadingMedia(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#fff2e8] px-4 py-8 text-[#002f5e] md:px-10">
      <div className="mx-auto max-w-[1460px]">
        <BackButton to="/" invert={false} />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-odesa-medium text-[44px] leading-none md:text-[62px]">Admin</h1>
            <p className="mt-3 font-odesa-regular text-[18px] text-[#002f5e]/80">
              Ієрархія: область → район → місто → туристичний об'єкт + секції сайту (content_cards)
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#002f5e] px-4 py-2 text-[14px] text-[#fff2e8]">
            <Settings2 className="h-4 w-4" /> {hasSupabaseConfig ? "supabase mode" : "local mode"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void loadAllData();
              void loadLogs();
            }}
            className="rounded-full bg-[#002f5e] px-4 py-2 text-[13px] text-[#fff2e8]"
          >
            Оновити
          </button>
          {savingState ? <span className="text-[13px] text-[#002f5e]/75">{savingState}</span> : null}
        </div>
        {loading ? <p className="mt-3 text-[14px] text-[#002f5e]/70">Завантаження...</p> : null}
        {errorText ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#9f1f47]/10 px-3 py-2 text-[14px] text-[#9f1f47]">
            <ShieldAlert className="h-4 w-4" />
            {errorText}
          </p>
        ) : null}
        {!hasSupabaseConfig ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#df9b3b]/20 px-3 py-2 text-[14px] text-[#002f5e]">
            <ShieldAlert className="h-4 w-4" />
            Зараз local mode: зміни не записуються в Supabase. Додайте VITE_SUPABASE_URL та
            VITE_SUPABASE_ANON_KEY у Vercel Environment Variables.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "workspace", label: "Object Workspace" },
            { id: "hierarchy", label: "Область / Район / Місто" },
            { id: "history", label: "Історія / Rollback" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`rounded-full px-4 py-2 text-[15px] transition-colors ${
                activeTab === tab.id ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {false ? (
          <section className="mt-8 rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-6 md:p-8">
            <h2 className="font-odesa-medium text-[34px]">
              {builderType === "event"
                ? "Створити Подію"
                : builderType === "hotel"
                  ? "Створити Готель"
                  : builderType === "restaurant"
                    ? "Створити Ресторан"
                    : "Створити Локацію"}
            </h2>
            <p className="mt-2 text-[16px] text-[#002f5e]/75">
              Обери тип, заповни великі блоки і одразу бачиш, як виглядатиме картка/сторінка.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {(Object.keys(builderTypeLabels) as BuilderType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBuilderType(type)}
                  className={`rounded-full px-4 py-2 text-[15px] ${
                    builderType === type ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                  }`}
                >
                  {builderTypeLabels[type]}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-[#002f5e]/15 bg-white p-3 text-[13px] text-[#002f5e]/80">
              Активний екран конструктора:{" "}
              <span className="font-semibold text-[#002f5e]">{builderTypeLabels[builderType]}</span>. Заповнюй блоки прямо
              в макеті нижче: hero, опис, інфо, галерея, контакти.
            </div>
            <div className="mt-4 rounded-xl border border-[#002f5e]/15 bg-white p-4">
              <p className="text-[14px] font-semibold text-[#002f5e]">Секції сторінки (вмикай/вимикай)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ["hero", "Hero"],
                  ["overview", "Опис"],
                  ["info", "Інфо блоки"],
                  ["gallery", "Галерея"],
                  ["contacts", "Контакти"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setBuilderDraft((prev) => ({
                        ...prev,
                        sections: { ...prev.sections, [key]: !prev.sections[key as keyof typeof prev.sections] },
                      }))
                    }
                    className={`rounded-full px-3 py-1 text-[12px] ${
                      builderDraft.sections[key as keyof typeof builderDraft.sections]
                        ? "bg-[#002f5e] text-[#fff2e8]"
                        : "bg-[#002f5e]/10 text-[#002f5e]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Назва</span>
                <input
                  value={builderDraft.title}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                  placeholder="Наприклад: Фестиваль Бессарабії"
                />
              </label>
              <label className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Підзаголовок</span>
                <input
                  value={builderDraft.subtitle}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                  placeholder="Болград, 24.04 - 03.05.2026"
                />
              </label>
              <label className="text-[14px] md:col-span-2">
                <span className="mb-1 block text-[#002f5e]/75">Обкладинка (URL або upload)</span>
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    value={builderDraft.imageUrl}
                    onChange={(e) => setBuilderDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    placeholder="https://..."
                  />
                  <label className="cursor-pointer rounded-lg bg-[#002f5e] px-4 py-2 text-center text-[13px] text-[#fff2e8]">
                    {uploadingMedia ? "Завантаження..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void uploadBuilderMedia(e, "cover")}
                    />
                  </label>
                </div>
              </label>
              <label className="text-[14px] md:col-span-2">
                <span className="mb-1 block text-[#002f5e]/75">Посилання на сторінку (опціонально)</span>
                <input
                  value={builderDraft.href}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, href: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                  placeholder="Залиш порожнім, згенеруємо автоматично"
                />
              </label>
              <label className="text-[14px] md:col-span-2">
                <span className="mb-1 block text-[#002f5e]/75">Короткий опис (для детальної сторінки)</span>
                <textarea
                  value={builderDraft.description}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, description: e.target.value }))}
                  className="h-24 w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                />
              </label>
              <div className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Статус сторінки</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBuilderDraft((prev) => ({ ...prev, published: true }))}
                    className={`rounded-full px-4 py-2 text-[13px] ${
                      builderDraft.published ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                    }`}
                  >
                    Опублікувати
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderDraft((prev) => ({ ...prev, published: false }))}
                    className={`rounded-full px-4 py-2 text-[13px] ${
                      !builderDraft.published ? "bg-[#9f1f47] text-[#fff2e8]" : "bg-[#002f5e]/10"
                    }`}
                  >
                    Чернетка
                  </button>
                </div>
              </div>
              <label className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Район</span>
                <select
                  value={builderDraft.districtId}
                  onChange={(e) => {
                    const districtId = e.target.value;
                    const firstCity = cities.find((city) => city.districtId === districtId)?.id ?? "";
                    setBuilderDraft((prev) => ({ ...prev, districtId, cityId: firstCity }));
                  }}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                >
                  <option value="">Оберіть район</option>
                  {builderDistrictOptions.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Місто</span>
                <select
                  value={builderDraft.cityId}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, cityId: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                >
                  <option value="">Оберіть місто</option>
                  {builderCityOptions.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Адреса</span>
                <input
                  value={builderDraft.address}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                />
              </label>
              <label className="text-[14px]">
                <span className="mb-1 block text-[#002f5e]/75">Телефон</span>
                <input
                  value={builderDraft.phone}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                />
              </label>
              <label className="text-[14px] md:col-span-2">
                <span className="mb-1 block text-[#002f5e]/75">Карта (URL embed/Google Maps)</span>
                <input
                  value={builderDraft.mapUrl}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, mapUrl: e.target.value }))}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                />
              </label>
              <div className="md:col-span-2 rounded-xl border border-[#002f5e]/15 bg-white p-4">
                <p className="text-[14px] font-semibold text-[#002f5e]">Години роботи / дати (структуровано)</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {builderDraft.workSlots.map((slot, idx) => (
                    <div key={`slot-${idx}`} className="rounded-lg border border-[#002f5e]/15 p-3">
                      <input
                        value={slot.days}
                        onChange={(e) =>
                          setBuilderDraft((prev) => ({
                            ...prev,
                            workSlots: prev.workSlots.map((s, i) =>
                              i === idx ? { ...s, days: e.target.value } : s,
                            ),
                          }))
                        }
                        className="w-full rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                        placeholder="ПН-ПТ"
                      />
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input
                          value={slot.from}
                          onChange={(e) =>
                            setBuilderDraft((prev) => ({
                              ...prev,
                              workSlots: prev.workSlots.map((s, i) =>
                                i === idx ? { ...s, from: e.target.value } : s,
                              ),
                            }))
                          }
                          className="rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                          placeholder="09:00"
                        />
                        <input
                          value={slot.to}
                          onChange={(e) =>
                            setBuilderDraft((prev) => ({
                              ...prev,
                              workSlots: prev.workSlots.map((s, i) =>
                                i === idx ? { ...s, to: e.target.value } : s,
                              ),
                            }))
                          }
                          className="rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                          placeholder="18:00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-[#002f5e] px-3 py-1 text-[12px] text-[#fff2e8]"
                    onClick={() =>
                      setBuilderDraft((prev) => ({
                        ...prev,
                        workSlots: [...prev.workSlots, { days: "", from: "", to: "" }],
                      }))
                    }
                  >
                    + Додати слот
                  </button>
                </div>
              </div>
              {builderType === "event" ? (
                <div className="md:col-span-2 rounded-xl border border-[#002f5e]/15 bg-white p-4">
                  <p className="text-[14px] font-semibold text-[#002f5e]">Дати події</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {builderDraft.eventDates.map((item, idx) => (
                      <div key={`date-${idx}`} className="rounded-lg border border-[#002f5e]/15 p-3">
                        <input
                          value={item.label}
                          onChange={(e) =>
                            setBuilderDraft((prev) => ({
                              ...prev,
                              eventDates: prev.eventDates.map((d, i) =>
                                i === idx ? { ...d, label: e.target.value } : d,
                              ),
                            }))
                          }
                          className="w-full rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                          placeholder="Основні дати"
                        />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <input
                            value={item.from}
                            onChange={(e) =>
                              setBuilderDraft((prev) => ({
                                ...prev,
                                eventDates: prev.eventDates.map((d, i) =>
                                  i === idx ? { ...d, from: e.target.value } : d,
                                ),
                              }))
                            }
                            className="rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                            placeholder="24.04.2026"
                          />
                          <input
                            value={item.to}
                            onChange={(e) =>
                              setBuilderDraft((prev) => ({
                                ...prev,
                                eventDates: prev.eventDates.map((d, i) =>
                                  i === idx ? { ...d, to: e.target.value } : d,
                                ),
                              }))
                            }
                            className="rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                            placeholder="03.05.2026"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-full bg-[#002f5e] px-3 py-1 text-[12px] text-[#fff2e8]"
                    onClick={() =>
                      setBuilderDraft((prev) => ({
                        ...prev,
                        eventDates: [...prev.eventDates, { from: "", to: "", label: "" }],
                      }))
                    }
                  >
                    + Додати діапазон дат
                  </button>
                </div>
              ) : null}
              {(builderType === "hotel" || builderType === "restaurant") ? (
                <>
                  <div className="md:col-span-2 rounded-xl border border-[#002f5e]/15 bg-white p-4">
                    <p className="text-[14px] font-semibold text-[#002f5e]">Зручності (кнопками)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {builderDraft.amenities.map((item, idx) => (
                        <button
                          key={`am-${idx}`}
                          type="button"
                          className="rounded-full bg-[#002f5e]/10 px-3 py-1 text-[12px]"
                          onClick={() =>
                            setBuilderDraft((prev) => ({
                              ...prev,
                              amenities: prev.amenities.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          {item} ×
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={builderTagInput}
                        onChange={(e) => setBuilderTagInput(e.target.value)}
                        className="w-full rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                        placeholder="Додати: Тераса, Wi‑Fi..."
                      />
                      <button
                        type="button"
                        className="rounded-md bg-[#002f5e] px-3 py-1 text-[12px] text-[#fff2e8]"
                        onClick={() => {
                          const value = builderTagInput.trim();
                          if (!value) return;
                          setBuilderDraft((prev) => ({ ...prev, amenities: [...prev.amenities, value] }));
                          setBuilderTagInput("");
                        }}
                      >
                        Додати
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-[#002f5e]/15 bg-white p-4">
                    <p className="text-[14px] font-semibold text-[#002f5e]">Оплата / параметри</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {builderDraft.payments.map((item, idx) => (
                        <button
                          key={`pay-${idx}`}
                          type="button"
                          className="rounded-full bg-[#002f5e]/10 px-3 py-1 text-[12px]"
                          onClick={() =>
                            setBuilderDraft((prev) => ({
                              ...prev,
                              payments: prev.payments.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          {item} ×
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={builderPaymentInput}
                        onChange={(e) => setBuilderPaymentInput(e.target.value)}
                        className="w-full rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                        placeholder="Visa, MasterCard, Apple Pay..."
                      />
                      <button
                        type="button"
                        className="rounded-md bg-[#002f5e] px-3 py-1 text-[12px] text-[#fff2e8]"
                        onClick={() => {
                          const value = builderPaymentInput.trim();
                          if (!value) return;
                          setBuilderDraft((prev) => ({ ...prev, payments: [...prev.payments, value] }));
                          setBuilderPaymentInput("");
                        }}
                      >
                        Додати
                      </button>
                    </div>
                    <div className="mt-3">
                      <span className="text-[13px] text-[#002f5e]/70">Рейтинг</span>
                      <input
                        value={builderDraft.rating}
                        onChange={(e) => setBuilderDraft((prev) => ({ ...prev, rating: e.target.value }))}
                        className="mt-1 w-[140px] rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                        placeholder="4.8"
                      />
                    </div>
                  </div>
                </>
              ) : null}
              <div className="md:col-span-2 rounded-xl border border-[#002f5e]/15 bg-white p-4">
                <p className="text-[14px] font-semibold text-[#002f5e]">Галерея</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {builderDraft.gallery.map((url, idx) => (
                    <div key={`gallery-${idx}`} className="rounded-md border border-[#002f5e]/20 p-2">
                      <img src={url} alt="" className="h-20 w-full rounded-md object-cover" />
                      <button
                        type="button"
                        className="mt-1 text-[12px] text-[#9f1f47]"
                        onClick={() =>
                          setBuilderDraft((prev) => ({
                            ...prev,
                            gallery: prev.gallery.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Видалити
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-col gap-2 md:flex-row">
                  <input
                    className="w-full rounded-md border border-[#002f5e]/25 px-2 py-1 text-[13px]"
                    placeholder="Додати URL зображення і натиснути Enter"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      const value = (e.currentTarget.value || "").trim();
                      if (!value) return;
                      setBuilderDraft((prev) => ({ ...prev, gallery: [...prev.gallery, value] }));
                      e.currentTarget.value = "";
                    }}
                  />
                  <label className="cursor-pointer rounded-lg bg-[#002f5e] px-4 py-2 text-center text-[13px] text-[#fff2e8]">
                    {uploadingMedia ? "Завантаження..." : "Upload у галерею"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void uploadBuilderMedia(e, "gallery")}
                    />
                  </label>
                </div>
              </div>
              <label className="text-[14px] md:col-span-2 inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={builderDraft.showOnMain}
                  onChange={(e) => setBuilderDraft((prev) => ({ ...prev, showOnMain: e.target.checked }))}
                />
                Показувати також на головній сторінці (коли це підтримується для типу)
              </label>
              {builderType === "attraction" && builderDraft.showOnMain ? (
                <label className="text-[14px] md:col-span-2">
                  <span className="mb-1 block text-[#002f5e]/75">Секція на головній</span>
                  <select
                    value={builderDraft.mainSection}
                    onChange={(e) => setBuilderDraft((prev) => ({ ...prev, mainSection: e.target.value }))}
                    className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                  >
                    <option value="directions">Основні напрямки</option>
                    <option value="interesting">Цікаве</option>
                  </select>
                </label>
              ) : null}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => void createFromTemplate()}
                className="rounded-full bg-[#002f5e] px-6 py-3 text-[15px] text-[#fff2e8]"
              >
                Зберегти і додати на сайт
              </button>
            </div>
            <div
              className="mt-8 overflow-hidden rounded-xl border border-[#002f5e]/20 p-5 break-words"
              style={{
                backgroundColor: builderTypeTheme[builderType].bg,
                color: builderTypeTheme[builderType].text,
              }}
            >
              <p className="text-[13px] uppercase tracking-[0.15em] opacity-70">Превʼю сторінки</p>
              <h3 className="mt-2 font-odesa-medium text-[30px]">{builderDraft.title || "Назва обʼєкта"}</h3>
              <p className="text-[17px] opacity-80">{builderDraft.subtitle || "Підзаголовок"}</p>
              {builderDraft.imageUrl ? (
                <img src={builderDraft.imageUrl} alt="" className="mt-3 h-48 w-full rounded-xl object-cover" />
              ) : null}
              <div className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: builderTypeTheme[builderType].panel }}>
                    <p className="text-[13px] opacity-75">Опис секції</p>
                    <textarea
                      value={builderDraft.description}
                      onChange={(e) => setBuilderDraft((prev) => ({ ...prev, description: e.target.value }))}
                      className="mt-1 h-24 w-full rounded-md border border-white/20 bg-black/10 px-2 py-1 text-[13px] text-inherit"
                      placeholder="Введи текст..."
                    />
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: builderTypeTheme[builderType].panel }}>
                    <p className="text-[13px] opacity-75">
                      {builderType === "event" ? "Дати" : builderType === "hotel" ? "Зручності" : "Пропозиції"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(builderType === "event"
                        ? builderDraft.eventDates.map((d) => `${d.from || "..."} - ${d.to || "..."}`)
                        : builderDraft.amenities.length
                          ? builderDraft.amenities
                          : ["Додай елементи вище"]).map((item, idx) => (
                        <span
                          key={`preview-pill-${idx}`}
                          className="rounded-full px-3 py-1 text-[12px]"
                          style={{ backgroundColor: builderTypeTheme[builderType].accent, color: builderTypeTheme[builderType].text }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: builderTypeTheme[builderType].panel }}>
                    <p className="text-[13px] opacity-75">Адреса</p>
                    <input
                      value={builderDraft.address}
                      onChange={(e) => setBuilderDraft((prev) => ({ ...prev, address: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/20 bg-black/10 px-2 py-1 text-[13px] text-inherit"
                    />
                    <p className="mt-2 text-[13px] opacity-75">Телефон</p>
                    <input
                      value={builderDraft.phone}
                      onChange={(e) => setBuilderDraft((prev) => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-white/20 bg-black/10 px-2 py-1 text-[13px] text-inherit"
                    />
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: builderTypeTheme[builderType].panel }}>
                    <p className="text-[13px] opacity-75">Автопривʼязка</p>
                    <p className="text-[13px]">
                      Район: {districts.find((d) => d.id === builderDraft.districtId)?.name || "—"}
                    </p>
                    <p className="text-[13px]">
                      Місто: {cities.find((c) => c.id === builderDraft.cityId)?.name || "—"}
                    </p>
                    <p className="mt-1 text-[12px] opacity-80">Після збереження звʼязки створяться автоматично.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {false ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-[24px] border border-[#002f5e]/20 bg-white/50 p-4">
              <div className="mb-4 rounded-xl border border-[#002f5e]/15 bg-white p-3">
                <p className="text-[12px] uppercase tracking-[0.08em] text-[#002f5e]/70">Hierarchy</p>
                <button
                  type="button"
                  className={`mt-2 w-full rounded-md px-2 py-1 text-left text-[13px] ${
                    selectedRegionId === "all" ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                  }`}
                  onClick={() => {
                    setSelectedRegionId("all");
                    setSelectedDistrictId("all");
                    setSelectedCityId("all");
                  }}
                >
                  Всі регіони
                </button>
                <div className="mt-2 max-h-[240px] space-y-1 overflow-auto pr-1">
                  {regions.map((region) => (
                    <div key={region.id}>
                      <button
                        type="button"
                        className={`w-full rounded-md px-2 py-1 text-left text-[13px] ${
                          selectedRegionId === region.id ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                        }`}
                        onClick={() => {
                          setSelectedRegionId(region.id);
                          setSelectedDistrictId("all");
                          setSelectedCityId("all");
                        }}
                      >
                        {region.name}
                      </button>
                      {selectedRegionId === region.id
                        ? districts
                            .filter((district) => district.regionId === region.id)
                            .map((district) => (
                              <div key={district.id} className="ml-2 mt-1">
                                <button
                                  type="button"
                                  className={`w-full rounded-md px-2 py-1 text-left text-[12px] ${
                                    selectedDistrictId === district.id
                                      ? "bg-[#df9b3b] text-[#002f5e]"
                                      : "bg-[#002f5e]/5"
                                  }`}
                                  onClick={() => {
                                    setSelectedDistrictId(district.id);
                                    setSelectedCityId("all");
                                  }}
                                >
                                  {district.name}
                                </button>
                                {selectedDistrictId === district.id
                                  ? cities
                                      .filter((city) => city.districtId === district.id)
                                      .map((city) => (
                                        <button
                                          key={city.id}
                                          type="button"
                                          className={`ml-2 mt-1 block w-[calc(100%-0.5rem)] rounded-md px-2 py-1 text-left text-[12px] ${
                                            selectedCityId === city.id
                                              ? "bg-[#9f1f47] text-[#fff2e8]"
                                              : "bg-[#002f5e]/5"
                                          }`}
                                          onClick={() => setSelectedCityId(city.id)}
                                        >
                                          {city.name}
                                        </button>
                                      ))
                                  : null}
                              </div>
                            ))
                        : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-3 grid gap-2">
                <select
                  value={objectDistrictFilter}
                  onChange={(e) => {
                    setObjectDistrictFilter(e.target.value);
                    setObjectCityFilter("all");
                  }}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 text-[13px]"
                >
                  <option value="all">Усі райони</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
                <select
                  value={objectCityFilter}
                  onChange={(e) => setObjectCityFilter(e.target.value)}
                  className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 text-[13px]"
                >
                  <option value="all">Усі міста</option>
                  {cities
                    .filter((city) =>
                      objectDistrictFilter === "all" ? true : city.districtId === objectDistrictFilter,
                    )
                    .map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["event", "hotel", "restaurant", "attraction"] as TourismObjectType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedType(type);
                      const first = objects.find((obj) => obj.type === type);
                      if (first) setSelectedObjectId(first.id);
                    }}
                    className={`rounded-full px-4 py-2 text-[15px] transition-colors ${
                      selectedType === type ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                    }`}
                  >
                    {typeLabels[type]}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void createObject()}
                  className="rounded-full bg-[#002f5e] px-4 py-2 text-[13px] text-[#fff2e8]"
                >
                  + Додати
                </button>
                <button
                  type="button"
                  onClick={() => void removeObject()}
                  disabled={!selectedObject}
                  className="rounded-full bg-[#9f1f47] px-4 py-2 text-[13px] text-[#fff2e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Видалити
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#002f5e]/65">
                Smart default: новий об'єкт бере місто/район з поточної папки в sidebar.
              </p>

              <div className="mt-4 space-y-2">
                {filteredObjects.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                      selectedObject?.id === obj.id ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                    }`}
                  >
                    <span className="text-[14px]">{obj.name}</span>
                    {obj.published ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </aside>

            <main className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5 md:p-6">
                <h2 className="font-odesa-medium text-[30px]">Object Workspace</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { id: "general", label: "General Info" },
                    { id: "builder", label: "Page Builder" },
                    { id: "seo", label: "SEO / Settings" },
                    { id: "history", label: "History" },
                  ].map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setObjectEditorStep(step.id as ObjectEditorStep)}
                      className={`rounded-full px-3 py-1 text-[12px] ${
                        objectEditorStep === step.id ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
                {!selectedObject ? null : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {objectEditorStep === "general" ? (
                      <>
                    <label className="text-[14px]">
                      <span className="mb-1 block text-[#002f5e]/75">Назва</span>
                      <input
                        value={selectedObject.name}
                        onChange={(e) => updateObject({ name: e.target.value })}
                        className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                      />
                    </label>
                    <label className="text-[14px]">
                      <span className="mb-1 block text-[#002f5e]/75">Slug</span>
                      <input
                        value={selectedObject.slug}
                        onChange={(e) => updateObject({ slug: e.target.value })}
                        onBlur={(e) => updateObject({ slug: slugify(e.target.value) })}
                        className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                      />
                    </label>
                    <label className="text-[14px]">
                      <span className="mb-1 block text-[#002f5e]/75">Район</span>
                      <select
                        value={selectedObject.districtId}
                        onChange={(e) => {
                          const districtId = e.target.value;
                          const firstCity = cities.find((city) => city.districtId === districtId)?.id;
                          updateObject({
                            districtId,
                            cityId: firstCity ?? selectedObject.cityId,
                          });
                        }}
                        className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                      >
                        {selectedDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[14px]">
                      <span className="mb-1 block text-[#002f5e]/75">Місто</span>
                      <select
                        value={selectedObject.cityId}
                        onChange={(e) => updateObject({ cityId: e.target.value })}
                        className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                      >
                        {cityOptions.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[14px]">
                      <span className="mb-1 block text-[#002f5e]/75">Статус</span>
                      <button
                        type="button"
                        onClick={() => updateObject({ published: !selectedObject.published })}
                        className={`w-full rounded-lg px-3 py-2 text-left ${
                          selectedObject.published
                            ? "bg-[#002f5e] text-[#fff2e8]"
                            : "bg-[#9f1f47] text-[#fff2e8]"
                        }`}
                      >
                        {selectedObject.published ? "Опубліковано" : "Чернетка"}
                      </button>
                    </label>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => void saveObject()}
                        className="rounded-full bg-[#002f5e] px-5 py-2 text-[14px] text-[#fff2e8]"
                      >
                        Зберегти об'єкт
                      </button>
                    </div>
                      </>
                    ) : null}
                    {objectEditorStep === "builder" ? (
                      <div className="md:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[14px] text-[#002f5e]/75">
                            Керування секціями сторінки обʼєкта (auto content_cards)
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={addObjectCard}
                              className="rounded-full bg-[#002f5e] px-3 py-1 text-[12px] text-[#fff2e8]"
                            >
                              + Блок
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveObjectCards()}
                              className="rounded-full bg-[#9f1f47] px-3 py-1 text-[12px] text-[#fff2e8]"
                            >
                              Зберегти секції
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdvancedMode((v) => !v)}
                              className="rounded-full bg-[#df9b3b] px-3 py-1 text-[12px] text-[#002f5e]"
                            >
                              {advancedMode ? "Advanced: ON" : "Advanced: OFF"}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {objectCardsEdits.map((card, idx) => (
                            <article key={card.id} className="rounded-xl border border-[#002f5e]/15 p-3">
                              <div className="grid gap-2 md:grid-cols-2">
                                <input
                                  value={card.title}
                                  onChange={(e) =>
                                    setObjectCardsEdits((prev) =>
                                      prev.map((c) => (c.id === card.id ? { ...c, title: e.target.value } : c)),
                                    )
                                  }
                                  className="rounded-md border border-[#002f5e]/20 px-2 py-1 text-[13px]"
                                  placeholder="Title"
                                />
                                <input
                                  value={card.subtitle ?? ""}
                                  onChange={(e) =>
                                    setObjectCardsEdits((prev) =>
                                      prev.map((c) =>
                                        c.id === card.id ? { ...c, subtitle: e.target.value || null } : c,
                                      ),
                                    )
                                  }
                                  className="rounded-md border border-[#002f5e]/20 px-2 py-1 text-[13px]"
                                  placeholder="Subtitle"
                                />
                                <input
                                  value={card.sectionKey}
                                  onChange={(e) =>
                                    setObjectCardsEdits((prev) =>
                                      prev.map((c) => (c.id === card.id ? { ...c, sectionKey: e.target.value } : c)),
                                    )
                                  }
                                  className="rounded-md border border-[#002f5e]/20 px-2 py-1 text-[13px]"
                                  placeholder="sectionKey"
                                />
                                <input
                                  value={card.imageUrl ?? ""}
                                  onChange={(e) =>
                                    setObjectCardsEdits((prev) =>
                                      prev.map((c) =>
                                        c.id === card.id ? { ...c, imageUrl: e.target.value || null } : c,
                                      ),
                                    )
                                  }
                                  className="rounded-md border border-[#002f5e]/20 px-2 py-1 text-[13px]"
                                  placeholder="imageUrl"
                                />
                              </div>
                              {advancedMode ? (
                                <textarea
                                  value={JSON.stringify(card.payload ?? {}, null, 2)}
                                  onChange={(e) => {
                                    try {
                                      const parsed = JSON.parse(e.target.value || "{}");
                                      setObjectCardsEdits((prev) =>
                                        prev.map((c) => (c.id === card.id ? { ...c, payload: parsed } : c)),
                                      );
                                    } catch {
                                      // ignore until valid
                                    }
                                  }}
                                  className="mt-2 h-24 w-full rounded-md border border-[#002f5e]/20 px-2 py-1 font-mono text-[12px]"
                                />
                              ) : null}
                              <div className="mt-2 flex justify-between">
                                <span className="text-[11px] text-[#002f5e]/70">#{idx + 1}</span>
                                <button
                                  type="button"
                                  className="text-[12px] text-[#9f1f47]"
                                  onClick={() =>
                                    setObjectCardsEdits((prev) => prev.filter((c) => c.id !== card.id))
                                  }
                                >
                                  Видалити блок
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {objectEditorStep === "seo" ? (
                      <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                        <label className="text-[14px]">
                          <span className="mb-1 block text-[#002f5e]/75">Slug</span>
                          <input
                            value={selectedObject.slug}
                            onChange={(e) => updateObject({ slug: e.target.value })}
                            className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                          />
                        </label>
                        <label className="text-[14px]">
                          <span className="mb-1 block text-[#002f5e]/75">Published</span>
                          <button
                            type="button"
                            onClick={() => updateObject({ published: !selectedObject.published })}
                            className={`w-full rounded-lg px-3 py-2 text-left ${
                              selectedObject.published ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#9f1f47] text-[#fff2e8]"
                            }`}
                          >
                            {selectedObject.published ? "Опубліковано" : "Чернетка"}
                          </button>
                        </label>
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => void saveObject()}
                            className="rounded-full bg-[#002f5e] px-5 py-2 text-[14px] text-[#fff2e8]"
                          >
                            Зберегти SEO/Settings
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {objectEditorStep === "history" ? (
                      <div className="md:col-span-2 space-y-2">
                        {changeLogs
                          .filter((log) => {
                            if (log.entityId === selectedObject.id) return true;
                            const payloadObjectId =
                              log.afterData?.payload?.objectId ?? log.beforeData?.payload?.objectId ?? null;
                            return payloadObjectId === selectedObject.id;
                          })
                          .slice(0, 20)
                          .map((log) => (
                            <article key={log.id} className="flex items-center justify-between rounded-lg border border-[#002f5e]/15 px-3 py-2">
                              <div>
                                <p className="text-[13px]">{log.entityType} / {log.action}</p>
                                <p className="text-[11px] text-[#002f5e]/70">{new Date(log.createdAt).toLocaleString("uk-UA")}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void rollback(log.id)}
                                className="rounded-full bg-[#9f1f47] px-3 py-1 text-[11px] text-[#fff2e8]"
                              >
                                Rollback
                              </button>
                            </article>
                          ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5 md:p-6">
                <h2 className="flex items-center gap-2 font-odesa-medium text-[30px]">
                  <Palette className="h-6 w-6" /> Preview
                </h2>
                {!selectedObject ? null : (
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => setPreviewTick((v) => v + 1)}
                      className="rounded-full bg-[#002f5e] px-3 py-1 text-[12px] text-[#fff2e8]"
                    >
                      Оновити preview
                    </button>
                    {selectedObjectRoute ? (
                      <iframe
                        title="object-preview"
                        src={`${selectedObjectRoute}?adminPreview=${previewTick}`}
                        className="h-[520px] w-full rounded-xl border border-[#002f5e]/20 bg-white"
                      />
                    ) : null}
                    <div className="space-y-2">
                      <p className="text-[12px] uppercase tracking-[0.08em] text-[#002f5e]/70">Color preset</p>
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setPresetByObjectId((prev) => ({ ...prev, [selectedObject.id]: preset.id }))
                          }
                          className={`w-full rounded-xl border p-3 text-left transition-colors ${
                            presetByObjectId[selectedObject.id] === preset.id
                              ? "border-[#002f5e] bg-[#002f5e]/10"
                              : "border-[#002f5e]/20 bg-white"
                          }`}
                        >
                          <p className="font-odesa-medium text-[15px]">{preset.name}</p>
                          <div className="mt-2 flex gap-2">
                            {[preset.pageBg, preset.text, preset.accent, preset.panel].map((c) => (
                              <span
                                key={`${preset.id}-${c}`}
                                className="h-5 w-5 rounded-full border border-black/10"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </main>
          </div>
        ) : null}

        {activeTab === "workspace" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="rounded-[24px] border border-[#002f5e]/20 bg-white/50 p-4">
              <div className="grid gap-2">
                <label className="text-[13px] text-[#002f5e]/80">
                  Page
                  <select
                    className="mt-1 w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 text-[14px]"
                    value={pageFilter}
                    onChange={(e) => {
                      setPageFilter(e.target.value);
                      setSectionFilter("all");
                    }}
                  >
                    <option value="all">Усі</option>
                    {cardPageOptions.map((page) => (
                      <option key={page} value={page}>
                        {page}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[13px] text-[#002f5e]/80">
                  Район
                  <select
                    className="mt-1 w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 text-[14px]"
                    value={cardDistrictFilter}
                    onChange={(e) => {
                      setCardDistrictFilter(e.target.value);
                      setCardCityFilter("all");
                    }}
                  >
                    <option value="all">Усі</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[13px] text-[#002f5e]/80">
                  Місто
                  <select
                    className="mt-1 w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 text-[14px]"
                    value={cardCityFilter}
                    onChange={(e) => setCardCityFilter(e.target.value)}
                  >
                    <option value="all">Усі</option>
                    {cities
                      .filter((city) =>
                        cardDistrictFilter === "all" ? true : city.districtId === cardDistrictFilter,
                      )
                      .map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-[13px] text-[#002f5e]/80">
                  Section
                  <select
                    className="mt-1 w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 text-[14px]"
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                  >
                    <option value="all">Усі</option>
                    {sectionOptions.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void createCard()}
                  className="rounded-full bg-[#002f5e] px-4 py-2 text-[13px] text-[#fff2e8]"
                >
                  + Додати
                </button>
                <button
                  type="button"
                  onClick={() => void removeCard()}
                  disabled={!selectedCard}
                  className="rounded-full bg-[#9f1f47] px-4 py-2 text-[13px] text-[#fff2e8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Видалити
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  void syncContentCardsFromFallback()
                    .then(async () => {
                      await loadAllData();
                    })
                    .catch((error) =>
                      setErrorText(error?.message ?? "Не вдалося заповнити базу картками"),
                    );
                }}
                className="mt-2 rounded-full bg-[#df9b3b] px-4 py-2 text-[13px] text-[#002f5e]"
              >
                Заповнити з шаблону
              </button>

              <div className="mt-4 space-y-2">
                {filteredCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                      selectedCard?.id === card.id ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/10"
                    }`}
                  >
                    <p className="text-[14px]">{card.title}</p>
                    <p className="mt-1 text-[11px] opacity-80">
                      {card.pageKey} / {card.sectionKey}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5 md:p-6">
              <h2 className="mb-4 font-odesa-medium text-[30px]">Візуальний редактор сторінки</h2>
              <p className="mb-4 text-[14px] text-[#002f5e]/75">
                Обери `Page` зліва і редагуй блоки цієї сторінки тут же, без переходів.
              </p>
              {pageFilter !== "all" ? (
                <div className="mb-6 space-y-3 overflow-hidden rounded-xl border border-[#002f5e]/15 bg-white p-4">
                  {visualPageCards.map((card) => (
                    <article key={`visual-${card.id}`} className="rounded-lg border border-[#002f5e]/15 p-3">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#002f5e]/70">
                        {card.sectionKey} · {card.cardType}
                      </p>
                      <input
                        value={card.title}
                        onChange={(e) =>
                          setContentCards((prev) =>
                            prev.map((c) => (c.id === card.id ? { ...c, title: e.target.value } : c)),
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#002f5e]/20 px-2 py-1 text-[14px]"
                      />
                      <input
                        value={card.subtitle ?? ""}
                        onChange={(e) =>
                          setContentCards((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, subtitle: e.target.value || null } : c,
                            ),
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#002f5e]/20 px-2 py-1 text-[13px]"
                        placeholder="Підзаголовок"
                      />
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt=""
                          className="mt-2 h-36 w-full rounded-md object-cover"
                        />
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-6 rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[13px] text-[#002f5e]/80">
                  Для візуального редагування вибери конкретну `Page` замість `Усі`.
                </p>
              )}
              <h2 className="flex items-center gap-2 font-odesa-medium text-[30px]">
                <Layers className="h-6 w-6" />
                Редактор content_cards
              </h2>
              {!selectedCard ? null : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">ID</span>
                    <input
                      value={selectedCard.id}
                      onChange={(e) => updateCard({ id: e.target.value })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Тип</span>
                    <select
                      value={selectedCard.cardType}
                      onChange={(e) => updateCard({ cardType: e.target.value as ContentCardEntity["cardType"] })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    >
                      {cardTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {cardTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Title</span>
                    <input
                      value={selectedCard.title}
                      onChange={(e) => updateCard({ title: e.target.value })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Subtitle</span>
                    <input
                      value={selectedCard.subtitle ?? ""}
                      onChange={(e) => updateCard({ subtitle: e.target.value || null })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">pageKey</span>
                    <input
                      value={selectedCard.pageKey}
                      onChange={(e) => updateCard({ pageKey: e.target.value })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">sectionKey</span>
                    <input
                      value={selectedCard.sectionKey}
                      onChange={(e) => updateCard({ sectionKey: e.target.value })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px] md:col-span-2">
                    <span className="mb-1 block text-[#002f5e]/75">Image URL</span>
                    <input
                      value={selectedCard.imageUrl ?? ""}
                      onChange={(e) => updateCard({ imageUrl: e.target.value || null })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px] md:col-span-2">
                    <span className="mb-1 block text-[#002f5e]/75">Href</span>
                    <input
                      value={selectedCard.href ?? ""}
                      onChange={(e) => updateCard({ href: e.target.value || null })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Область</span>
                    <select
                      value={selectedCard.regionId ?? ""}
                      onChange={(e) =>
                        updateCard({ regionId: e.target.value || null, districtId: null, cityId: null })
                      }
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    >
                      <option value="">-</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Район</span>
                    <select
                      value={selectedCard.districtId ?? ""}
                      onChange={(e) => {
                        const districtId = e.target.value || null;
                        const district = districts.find((item) => item.id === districtId);
                        const firstCity = cities.find((item) => item.districtId === districtId)?.id ?? null;
                        updateCard({
                          districtId,
                          cityId: firstCity,
                          regionId: district ? district.regionId : selectedCard.regionId,
                        });
                      }}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    >
                      <option value="">-</option>
                      {districts
                        .filter((district) =>
                          selectedCard.regionId ? district.regionId === selectedCard.regionId : true,
                        )
                        .map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Місто</span>
                    <select
                      value={selectedCard.cityId ?? ""}
                      onChange={(e) => {
                        const cityId = e.target.value || null;
                        const city = cities.find((item) => item.id === cityId);
                        const district = city
                          ? districts.find((item) => item.id === city.districtId)
                          : null;
                        updateCard({
                          cityId,
                          districtId: city ? city.districtId : selectedCard.districtId,
                          regionId: district ? district.regionId : selectedCard.regionId,
                        });
                      }}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    >
                      <option value="">-</option>
                      {cities
                        .filter((city) =>
                          selectedCard.districtId ? city.districtId === selectedCard.districtId : true,
                        )
                        .map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Порядок</span>
                    <input
                      type="number"
                      value={selectedCard.sortOrder}
                      onChange={(e) => updateCard({ sortOrder: Number(e.target.value) })}
                      className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="text-[14px] md:col-span-2">
                    <span className="mb-1 block text-[#002f5e]/75">Payload (JSON)</span>
                    <textarea
                      value={payloadDraft}
                      onChange={(e) => setPayloadDraft(e.target.value)}
                      onBlur={() => {
                        try {
                          const parsed = JSON.parse(payloadDraft || "{}");
                          updateCard({ payload: parsed });
                        } catch {
                          setErrorText("Payload має бути валідним JSON");
                        }
                      }}
                      className="h-44 w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2 font-mono text-[12px]"
                    />
                  </label>
                  <label className="text-[14px]">
                    <span className="mb-1 block text-[#002f5e]/75">Статус</span>
                    <button
                      type="button"
                      onClick={() => updateCard({ published: !selectedCard.published })}
                      className={`w-full rounded-lg px-3 py-2 text-left ${
                        selectedCard.published
                          ? "bg-[#002f5e] text-[#fff2e8]"
                          : "bg-[#9f1f47] text-[#fff2e8]"
                      }`}
                    >
                      {selectedCard.published ? "Опубліковано" : "Чернетка"}
                    </button>
                  </label>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={() => void saveCard()}
                      className="rounded-full bg-[#002f5e] px-5 py-2 text-[14px] text-[#fff2e8]"
                    >
                      Зберегти картку
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "hierarchy" ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5">
              <h2 className="font-odesa-medium text-[28px]">Області</h2>
              <div className="mt-3 space-y-2">
                {regions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[15px]">
                    <span>{r.name}</span>
                    <button type="button" className="text-[12px] text-[#9f1f47]" onClick={() => void deleteRegionAction(r.id)}>
                      Видалити
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const now = Date.now();
                  const region = {
                    id: `region-${now}`,
                    name: "Нова область",
                    slug: `region-${now}`,
                  };
                  setRegions((prev) => [...prev, region]);
                  void insertRegion(region).catch((error) =>
                    setErrorText(error.message ?? "Помилка додавання області"),
                  );
                }}
                className="mt-4 rounded-full bg-[#002f5e] px-4 py-2 text-[14px] text-[#fff2e8]"
              >
                + Додати область
              </button>
            </section>

            <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5">
              <h2 className="font-odesa-medium text-[28px]">Райони</h2>
              <div className="mt-3 space-y-2">
                {districts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[15px]">
                    <span>{d.name}</span>
                    <button type="button" className="text-[12px] text-[#9f1f47]" onClick={() => void deleteDistrictAction(d.id)}>
                      Видалити
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const now = Date.now();
                  const district = {
                    id: `district-${now}`,
                    regionId: regions[0]?.id ?? "",
                    name: "Новий район",
                    slug: `district-${now}`,
                  };
                  setDistricts((prev) => [...prev, district]);
                  void insertDistrict(district).catch((error) =>
                    setErrorText(error.message ?? "Помилка додавання району"),
                  );
                }}
                className="mt-4 rounded-full bg-[#002f5e] px-4 py-2 text-[14px] text-[#fff2e8]"
              >
                + Додати район
              </button>
            </section>

            <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5">
              <h2 className="font-odesa-medium text-[28px]">Міста</h2>
              <div className="mt-3 space-y-2">
                {cities.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[15px]">
                    <span>{c.name}</span>
                    <button type="button" className="text-[12px] text-[#9f1f47]" onClick={() => void deleteCityAction(c.id)}>
                      Видалити
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void createCityWithTemplates()}
                className="mt-4 rounded-full bg-[#002f5e] px-4 py-2 text-[14px] text-[#fff2e8]"
              >
                + Додати місто + сторінку
              </button>
            </section>
          </div>
        ) : null}

        {activeTab === "history" ? (
          <section className="mt-8 rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5 md:p-6">
            <h2 className="flex items-center gap-2 font-odesa-medium text-[30px]">
              <History className="h-6 w-6" />
              Історія змін
            </h2>
            <p className="mt-2 text-[14px] text-[#002f5e]/70">
              Rollback працює для змін туристичних об'єктів та content_cards.
            </p>
            <div className="mt-4 space-y-3">
              {changeLogs.map((log) => (
                <article
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#002f5e]/15 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-semibold">
                      {log.entityType} / {log.action}
                    </p>
                    <p className="text-[13px] text-[#002f5e]/70">
                      {log.entityId} • {new Date(log.createdAt).toLocaleString("uk-UA")}
                      {log.actorEmail ? ` • ${log.actorEmail}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void rollback(log.id)}
                    className="rounded-full bg-[#9f1f47] px-4 py-2 text-[12px] text-[#fff2e8]"
                  >
                    Rollback
                  </button>
                </article>
              ))}
              {!changeLogs.length ? (
                <p className="text-[14px] text-[#002f5e]/70">
                  Історія ще порожня або таблиця `admin_change_logs` не створена.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default Admin;
