import { Bike, Castle, Church, Landmark, Leaf, Medal, Trees, UtensilsCrossed, Waves, Wine, type LucideIcon } from "lucide-react";

/** Іконка для кожного типу маршруту. */
export const TAG_ICON: Record<string, LucideIcon> = {
  sport: Bike,
  culture: Landmark,
  religion: Church,
  odesa: Waves,
  nature: Trees,
  gastro: UtensilsCrossed,
  history: Castle,
  beach: Waves,
  wine: Wine,
  eco: Leaf,
  veteran: Medal,
};
