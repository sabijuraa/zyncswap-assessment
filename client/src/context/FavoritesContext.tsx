"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const FAV_KEY = "zync_trade_favs";

type FavCtx = {
  favs: Set<string>;
  toggleFav: (id: string) => void;
  isFav: (id: string) => boolean;
};

const Ctx = createContext<FavCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); }
    catch { return new Set(); }
  });

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => favs.has(id), [favs]);

  const value = useMemo(() => ({ favs, toggleFav, isFav }), [favs, toggleFav, isFav]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const v = useContext(Ctx);
  if (!v) throw new Error("FavoritesProvider missing");
  return v;
}
