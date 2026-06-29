"use client";

import { useRouter } from "next/navigation";
import { useMarketsStream } from "../../context/MarketsStreamContext";
import { useFavorites } from "../../context/FavoritesContext";

export function FavoritesBar({ currentMarketId }: { currentMarketId: string }) {
  const { overview } = useMarketsStream();
  const router = useRouter();
  const { favs } = useFavorites();

  const markets = overview?.markets ?? [];
  const favMarkets = [...favs]
    .map((id) => markets.find((m) => m.id === id))
    .filter(Boolean) as typeof markets;

  if (favMarkets.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#080a0c] px-3 py-1">
      <span className="mr-1 shrink-0 text-amber-400 text-sm">★</span>
      {favMarkets.map((m) => {
        const active = m.id === currentMarketId;
        return (
          <button key={m.id} type="button" onClick={() => router.push(`/trade/${m.id}`)}
            className={`shrink-0 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
              active ? "bg-[rgba(0,217,192,0.12)] text-[#00d9c0]" : "text-white/55 hover:bg-white/[0.05] hover:text-white"
            }`}>
            <span className="font-semibold">{m.pair}</span>
            <span className={`ml-1.5 ${m.change_24h_pct >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
              {m.change_24h_pct >= 0 ? "+" : ""}{m.change_24h_pct.toFixed(2)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
