import { useEffect, useMemo, useState } from "react";
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

type AdminTab = "objects" | "cards" | "hierarchy" | "history";

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .replace(/[^\x00-\x7F]/g, "");

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("objects");
  const [selectedType, setSelectedType] = useState<TourismObjectType>("event");

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

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [savingState, setSavingState] = useState("");

  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [presetByObjectId, setPresetByObjectId] = useState<Record<string, string>>({
    "obj-event-bessarabia": "event-default",
    "obj-hotel-fortetsia": "hotel-sand",
    "obj-restaurant-rybnyi": "restaurant-berry",
  });

  const filteredObjects = useMemo(
    () => objects.filter((obj) => obj.type === selectedType),
    [objects, selectedType],
  );

  const selectedObject =
    objects.find((obj) => obj.id === selectedObjectId) ?? filteredObjects[0] ?? objects[0];

  const cardPageOptions = useMemo(
    () => Array.from(new Set(contentCards.map((card) => card.pageKey))).sort((a, b) => a.localeCompare(b)),
    [contentCards],
  );

  const filteredCards = useMemo(() => {
    return contentCards
      .filter((card) => (pageFilter === "all" ? true : card.pageKey === pageFilter))
      .filter((card) => (sectionFilter === "all" ? true : card.sectionKey === sectionFilter))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }, [contentCards, pageFilter, sectionFilter]);

  const sectionOptions = useMemo(() => {
    const source =
      pageFilter === "all" ? contentCards : contentCards.filter((card) => card.pageKey === pageFilter);
    return Array.from(new Set(source.map((card) => card.sectionKey))).sort((a, b) => a.localeCompare(b));
  }, [contentCards, pageFilter]);

  const selectedCard =
    contentCards.find((card) => card.id === selectedCardId) ?? filteredCards[0] ?? contentCards[0];

  useEffect(() => {
    if (!selectedCard) return;
    setPayloadDraft(JSON.stringify(selectedCard.payload ?? {}, null, 2));
  }, [selectedCard?.id]);

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
    let mounted = true;
    const initAuth = async () => {
      if (!hasSupabaseConfig || !supabase) {
        if (mounted) {
          setIsAuthed(true);
          setAuthLoading(false);
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsAuthed(Boolean(data.session));
      setAuthLoading(false);
    };
    void initAuth();

    const sub = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });

    return () => {
      mounted = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void loadAllData();
    void loadLogs();
  }, []);

  const sendMagicLink = async () => {
    if (!supabase || !email.trim()) return;
    setErrorText("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    if (error) {
      setErrorText(error.message);
      return;
    }
    setEmailSent(true);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const updateObject = (patch: Partial<TourismObject>) => {
    if (!selectedObject) return;
    const next = { ...selectedObject, ...patch };
    const nextObjects = objects.map((obj) => (obj.id === selectedObject.id ? next : obj));
    setObjects(nextObjects);

    const validationError = validateObjectDraft(next, nextObjects, districts, cities);
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setErrorText("");
    setSavingState("Зберігаємо об'єкт...");
    void upsertTourismObject(next)
      .then(() => {
        setSavingState("Об'єкт збережено");
        void loadLogs();
      })
      .catch((error) => setErrorText(error.message ?? "Помилка збереження об'єкта"))
      .finally(() => {
        window.setTimeout(() => setSavingState(""), 1000);
      });
  };

  const createObject = async () => {
    const districtId = districts[0]?.id;
    const cityId = cities.find((city) => city.districtId === districtId)?.id ?? cities[0]?.id;
    if (!districtId || !cityId) {
      setErrorText("Спочатку додайте район і місто");
      return;
    }
    const now = Date.now();
    const newObject: TourismObject = {
      id: `obj-${selectedType}-${now}`,
      districtId,
      cityId,
      type: selectedType,
      name: `Новий ${typeLabels[selectedType].toLowerCase()}`,
      slug: `${selectedType}-${now}`,
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
      await loadLogs();
    } catch (error: any) {
      setErrorText(error?.message ?? "Помилка створення об'єкта");
    }
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

    const validationError = validateContentCardDraft(next, nextCards, regions, districts, cities);
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setErrorText("");
    setSavingState("Зберігаємо картку...");
    void upsertContentCard(next)
      .then(() => {
        setSavingState("Картку збережено");
        void loadLogs();
      })
      .catch((error) => setErrorText(error.message ?? "Помилка збереження картки"))
      .finally(() => {
        window.setTimeout(() => setSavingState(""), 1000);
      });
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

  if (authLoading) {
    return <div className="min-h-screen bg-[#fff2e8] p-8 text-[#002f5e]">Перевірка доступу...</div>;
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#fff2e8] px-4 py-10 text-[#002f5e] md:px-10">
        <div className="mx-auto max-w-[560px] rounded-[24px] border border-[#002f5e]/20 bg-white/70 p-6">
          <h1 className="font-odesa-medium text-[42px] leading-none">Admin Login</h1>
          <p className="mt-3 text-[16px] text-[#002f5e]/80">
            Вхід лише через magic link на email.
          </p>
          <label className="mt-6 block text-[14px]">
            <span className="mb-1 block text-[#002f5e]/75">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#002f5e]/25 bg-white px-3 py-2"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="button"
            onClick={sendMagicLink}
            className="mt-4 rounded-full bg-[#002f5e] px-5 py-2 text-[#fff2e8]"
          >
            Надіслати посилання
          </button>
          {emailSent ? <p className="mt-3 text-[14px] text-[#002f5e]/80">Лист відправлено.</p> : null}
          {errorText ? <p className="mt-3 text-[14px] text-[#9f1f47]">{errorText}</p> : null}
        </div>
      </div>
    );
  }

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
            onClick={signOut}
            className="rounded-full bg-[#9f1f47] px-4 py-2 text-[13px] text-[#fff2e8]"
          >
            Вийти
          </button>
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

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "objects", label: "Карточки об'єктів" },
            { id: "cards", label: "Секції сайту (content_cards)" },
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

        {activeTab === "objects" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-[24px] border border-[#002f5e]/20 bg-white/50 p-4">
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
                <h2 className="font-odesa-medium text-[30px]">Налаштування об'єкта</h2>
                {!selectedObject ? null : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-[#002f5e]/20 bg-white/60 p-5 md:p-6">
                <h2 className="flex items-center gap-2 font-odesa-medium text-[30px]">
                  <Palette className="h-6 w-6" /> Пресет кольорів
                </h2>
                {!selectedObject ? null : (
                  <div className="mt-4 space-y-3">
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
                )}
              </section>
            </main>
          </div>
        ) : null}

        {activeTab === "cards" ? (
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
                  <div key={r.id} className="rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[15px]">
                    {r.name}
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
                  <div key={d.id} className="rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[15px]">
                    {d.name}
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
                  <div key={c.id} className="rounded-lg bg-[#002f5e]/10 px-3 py-2 text-[15px]">
                    {c.name}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const now = Date.now();
                  const city = {
                    id: `city-${now}`,
                    districtId: districts[0]?.id ?? "",
                    name: "Нове місто",
                    slug: `city-${now}`,
                  };
                  setCities((prev) => [...prev, city]);
                  void insertCity(city).catch((error) =>
                    setErrorText(error.message ?? "Помилка додавання міста"),
                  );
                }}
                className="mt-4 rounded-full bg-[#002f5e] px-4 py-2 text-[14px] text-[#fff2e8]"
              >
                + Додати місто
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
