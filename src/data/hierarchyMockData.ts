import { City, District, Region, TourismObject } from "@/types/hierarchy";

export const regions: Region[] = [
  { id: "region-odesa", name: "Одеська область", slug: "odeska-oblast" },
];

export const districts: District[] = [
  {
    id: "district-odeskyi",
    regionId: "region-odesa",
    name: "Одеський район",
    slug: "odeskyi-raion",
    subtitle: "Серце Одещини",
    description:
      "Одеський район — культурне та туристичне серце Одещини. Тут зосереджені пам'ятки архітектури, пляжі Чорного моря, оперний театр та багатовікова портова культура.",
    imageUrl:
      "https://images.unsplash.com/photo-1470214203634-e436a8848e23?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "district-bilhorod",
    regionId: "region-odesa",
    name: "Білгород-Дністровський район",
    slug: "bilhorod-dnistrovskyi-raion",
    subtitle: "Фортеці та лимани Півдня",
    description:
      "Район із середньовічними фортецями, Дністровським лиманом та унікальними бессарабськими традиціями. Аккерманська фортеця, виноробні та тиха природа — все це Білгород-Дністровський район.",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=80",
  },
];

export const cities: City[] = [
  {
    id: "city-odesa",
    districtId: "district-odeskyi",
    name: "Одеса",
    slug: "odesa",
    weatherCityName: "Odessa",
    subtitle: "Перлина Чорного моря",
    description:
      "Одеса — одне з найяскравіших міст України з неповторним культурним кодом, знаменитими одеситами, Потьомкінськими сходами, оперним театром і пляжами.",
    imageUrl:
      "https://images.unsplash.com/photo-1470214203634-e436a8848e23?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "city-bilhorod",
    districtId: "district-bilhorod",
    name: "Білгород-Дністровський",
    slug: "bilhorod-dnistrovskyi",
    weatherCityName: "Bilhorod-Dnistrovskyi",
    subtitle: "Місто Аккерманської фортеці",
    description:
      "Місто з тисячолітньою історією на березі Дністровського лиману. Головна пам'ятка — Аккерманська фортеця, один із найбільших середньовічних замків Причорномор'я.",
    imageUrl:
      "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?auto=format&fit=crop&w=2400&q=80",
  },
  {
    id: "city-bolhrad",
    districtId: "district-bilhorod",
    name: "Болград",
    slug: "bolhrad",
    weatherCityName: "Bolhrad",
    subtitle: "Серце Бессарабії",
    description:
      "Болград — культурна столиця бессарабських болгар. Унікальна архітектура, виноробні традиції та фестивалі роблять його особливим напрямком для гастро- і культурного туризму.",
    imageUrl:
      "https://images.unsplash.com/photo-1532635042-a6f6ad4745f9?auto=format&fit=crop&w=2400&q=80",
  },
];

export const tourismObjects: TourismObject[] = [
  // ── Attractions / Місця ────────────────────────────────────────────
  {
    id: "obj-attraction-akkerman",
    districtId: "district-bilhorod",
    cityId: "city-bilhorod",
    type: "attraction",
    name: "Аккерманська фортеця",
    slug: "akkermanska-fortetsia",
    published: true,
    subtitle: "Середньовічний комплекс XIV–XV ст.",
    description:
      "Один із найбільших та найкраще збережених середньовічних замків Причорномор'я. Масивні стіни, цитадель, мінарет та башти з видом на Дністровський лиман — унікальний досвід занурення в історію.",
    imageUrl:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=80",
    address: "вул. Фортечна, 1, Білгород-Дністровський",
    phone: "+38 (04849) 3-14-78",
    hours: "09:00 – 18:00 (вт–нд), пн — вихідний",
    tourismTypes: ["Культурний", "Історичний", "Фотографічний"],
    mapUrl: "https://maps.google.com/?q=Аккерманська+фортеця",
  },
  {
    id: "obj-attraction-opera",
    districtId: "district-odeskyi",
    cityId: "city-odesa",
    type: "attraction",
    name: "Одеський оперний театр",
    slug: "odeskyi-opernyi-teatr",
    published: true,
    subtitle: "Перлина архітектури Одеси",
    description:
      "Один із найкрасивіших оперних театрів світу у стилі неорококо. Побудований у 1887 році, театр є символом Одеси і місцем сезонних оперних та балетних вистав.",
    imageUrl:
      "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?auto=format&fit=crop&w=2400&q=80",
    address: "пер. Чайковського, 1, Одеса",
    phone: "+38 (048) 728-06-01",
    hours: "Каса: 10:00 – 19:00. Вистави — за розкладом",
    tourismTypes: ["Культурний", "Мистецтво", "Архітектура"],
    mapUrl: "https://maps.google.com/?q=Одеський+оперний+театр",
  },
  {
    id: "obj-attraction-tuzly",
    districtId: "district-bilhorod",
    cityId: "city-bilhorod",
    type: "attraction",
    name: "Тузлівські лимани",
    slug: "tuzlivski-lymany",
    published: true,
    subtitle: "Екотуристична перлина Одещини",
    description:
      "Ланцюг реліктових солоних лиманів із унікальними пелікановими колоніями, дикими пляжами та заходами сонця над Чорним морем. Ідеальне місце для екотуризму і спостереження за птахами.",
    imageUrl:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=2400&q=80",
    address: "Тузлівські лимани, Одеська область",
    hours: "Відкрито цілодобово",
    tourismTypes: ["Екологічний", "Рекреація", "Птахоспостереження"],
    mapUrl: "https://maps.google.com/?q=Тузлівські+лимани",
  },
  // ── Events ────────────────────────────────────────────────────────
  {
    id: "obj-event-bessarabia",
    districtId: "district-bilhorod",
    cityId: "city-bolhrad",
    type: "event",
    name: "Фестиваль вина та смаку Бессарабії",
    slug: "festyval-vyna-ta-smaku-bessarabii",
    published: true,
    subtitle: "24.04 – 03.05.2026",
    description:
      "Найбільший гастрономічний фестиваль регіону. Дегустації місцевих вин, народна музика, виступи кухарів та ярмарок ремісників у серці Бессарабії.",
    imageUrl:
      "https://images.unsplash.com/photo-1532635042-a6f6ad4745f9?auto=format&fit=crop&w=2400&q=80",
    hours: "24 квітня – 3 травня 2026",
    tourismTypes: ["Гастрономічний", "Культурний", "Фестиваль"],
  },
  // ── Hotels ────────────────────────────────────────────────────────
  {
    id: "obj-hotel-fortetsia",
    districtId: "district-bilhorod",
    cityId: "city-bilhorod",
    type: "hotel",
    name: "Fortetsia View Hotel",
    slug: "fortetsia-view-hotel",
    published: true,
    subtitle: "Готель з видом на лиман",
    description:
      "Затишний готель у центрі Білгорода-Дністровського з панорамним видом на Дністровський лиман та фортецю. Сучасні номери, власний ресторан, безкоштовна парковка.",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=80",
    address: "вул. Шевченка, 47, Білгород-Дністровський",
    phone: "+38 (04849) 3-22-11",
    website: "https://fortetsia-hotel.example.com",
    amenities: "WiFi, Паркінг, Ресторан, Тераса",
  },
  // ── Restaurants ───────────────────────────────────────────────────
  {
    id: "obj-restaurant-rybnyi",
    districtId: "district-bilhorod",
    cityId: "city-bilhorod",
    type: "restaurant",
    name: "Рибний двір",
    slug: "rybnyy-dvir",
    published: true,
    subtitle: "Свіжа риба та морепродукти",
    description:
      "Ресторан у серці Білгорода-Дністровського, що спеціалізується на свіжій рибі та морепродуктах прямо з лиману. Особлива атмосфера південного колориту, домашня кухня.",
    imageUrl:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2400&q=80",
    address: "пр. Леніна, 22, Білгород-Дністровський",
    phone: "+38 (04849) 4-11-55",
    hours: "11:00 – 22:00",
    tourismTypes: ["Гастрономічний", "Морепродукти"],
  },
];
