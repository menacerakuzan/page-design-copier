import { ColorPreset, ContentCardConfig } from "@/types/cms";

export const colorPresets: ColorPreset[] = [
  {
    id: "event-default",
    name: "Подія: Deep Blue",
    pageBg: "#002f5e",
    text: "#fff2e8",
    accent: "#df9b3b",
    panel: "#9f1f47",
  },
  {
    id: "hotel-sand",
    name: "Готель: Sand + Berry",
    pageBg: "#df9b3b",
    text: "#002f5e",
    accent: "#9f1f47",
    panel: "#fff2e8",
  },
  {
    id: "restaurant-berry",
    name: "Ресторан: Berry + Blue",
    pageBg: "#9f1f47",
    text: "#fff2e8",
    accent: "#df9b3b",
    panel: "#002f5e",
  },
];

export const initialCards: ContentCardConfig[] = [
  {
    id: "event-bessarabia",
    type: "event",
    title: "Фестиваль вина та смаку Бессарабії",
    slug: "festyval-vyna-ta-smaku-bessarabii",
    city: "Болград",
    presetId: "event-default",
    published: true,
  },
  {
    id: "hotel-fortetsia",
    type: "hotel",
    title: "Fortetsia View Hotel",
    slug: "fortetsia-view-hotel",
    city: "Білгород-Дністровський",
    presetId: "hotel-sand",
    published: true,
  },
  {
    id: "restaurant-rybnyi-dvir",
    type: "restaurant",
    title: "Рибний двір",
    slug: "rybnyy-dvir",
    city: "Білгород-Дністровський",
    presetId: "restaurant-berry",
    published: true,
  },
];
