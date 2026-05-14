export type ContentThemeType = "event" | "hotel" | "restaurant" | "attraction";

export const CONTENT_THEMES: Record<
  ContentThemeType,
  {
    pageBg: string;
    text: string;
    stickyBg: string;
    panelBg: string;
    accent: string;
    accentSoft: string;
  }
> = {
  event: {
    pageBg: "#002f5e",
    text: "#fff2e8",
    stickyBg: "rgba(159, 31, 71, 0.9)",
    panelBg: "#9f1f47",
    accent: "#df9b3b",
    accentSoft: "#fff2e8",
  },
  hotel: {
    pageBg: "#df9b3b",
    text: "#002f5e",
    stickyBg: "rgba(0, 47, 94, 0.9)",
    panelBg: "#fff2e8",
    accent: "#9f1f47",
    accentSoft: "#002f5e",
  },
  restaurant: {
    pageBg: "#9f1f47",
    text: "#fff2e8",
    stickyBg: "rgba(0, 47, 94, 0.9)",
    panelBg: "#002f5e",
    accent: "#df9b3b",
    accentSoft: "#fff2e8",
  },
  attraction: {
    pageBg: "#002f5e",
    text: "#fff2e8",
    stickyBg: "rgba(0, 47, 94, 0.95)",
    panelBg: "#0e3f74",
    accent: "#df9b3b",
    accentSoft: "#df9b3b",
  },
};
