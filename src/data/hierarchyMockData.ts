import { City, District, Region, TourismObject } from "@/types/hierarchy";

export const regions: Region[] = [
  { id: "region-odesa", name: "Одеська область", slug: "odeska-oblast" },
];

export const districts: District[] = [
  { id: "district-odeskyi", regionId: "region-odesa", name: "Одеський район", slug: "odeskyi-raion" },
  { id: "district-bilhorod", regionId: "region-odesa", name: "Білгород-Дністровський район", slug: "bilhorod-dnistrovskyi-raion" },
];

export const cities: City[] = [
  { id: "city-odesa", districtId: "district-odeskyi", name: "Одеса", slug: "odesa" },
  { id: "city-bilhorod", districtId: "district-bilhorod", name: "Білгород-Дністровський", slug: "bilhorod-dnistrovskyi" },
  { id: "city-bolhrad", districtId: "district-bilhorod", name: "Болград", slug: "bolhrad" },
];

export const tourismObjects: TourismObject[] = [
  {
    id: "obj-event-bessarabia",
    districtId: "district-bilhorod",
    cityId: "city-bolhrad",
    type: "event",
    name: "Фестиваль вина та смаку Бессарабії",
    slug: "festyval-vyna-ta-smaku-bessarabii",
    published: true,
  },
  {
    id: "obj-hotel-fortetsia",
    districtId: "district-bilhorod",
    cityId: "city-bilhorod",
    type: "hotel",
    name: "Fortetsia View Hotel",
    slug: "fortetsia-view-hotel",
    published: true,
  },
  {
    id: "obj-restaurant-rybnyi",
    districtId: "district-bilhorod",
    cityId: "city-bilhorod",
    type: "restaurant",
    name: "Рибний двір",
    slug: "rybnyy-dvir",
    published: true,
  },
];
