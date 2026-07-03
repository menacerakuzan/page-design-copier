import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

/**
 * Глобальний стор «Кошика маршруту».
 * Тримає впорядкований список id об'єктів (TourismObject.id) і зберігає його
 * у localStorage, щоб кошик переживав перезавантаження. Порядок додавання
 * зберігається — він задає початковий порядок зупинок на карті маршруту.
 */

const STORAGE_KEY = "route-basket";

function loadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    /* ignore */
  }
  return [];
}

type BasketContextValue = {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  count: number;
};

const BasketContext = createContext<BasketContextValue>({
  ids: [],
  add: () => {},
  remove: () => {},
  toggle: () => {},
  has: () => false,
  clear: () => {},
  count: 0,
});

export function BasketProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(loadIds);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }, [ids]);

  const add = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const clear = useCallback(() => setIds([]), []);

  return (
    <BasketContext.Provider value={{ ids, add, remove, toggle, has, clear, count: ids.length }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  return useContext(BasketContext);
}
