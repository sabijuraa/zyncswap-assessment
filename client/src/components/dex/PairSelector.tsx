"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketsStream } from "../../context/MarketsStreamContext";
import { useFavorites } from "../../context/FavoritesContext";
import { TOKEN_ICONS } from "./tokenIcons";

function TokenIcon({ symbol, size = 20 }: { symbol: string; size?: number }) {
  const src = TOKEN_ICONS[symbol];
  if (!src) {
    return (
      <div className="flex shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/60"
        style={{ width: size, height: size }}>
        {symbol.slice(0, 2)}
      </div>
    );
  }
  return <img src={src} alt={symbol} width={size} height={size} className="shrink-0 rounded-full object-contain" style={{ width: size, height: size }} />;
}

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n < 0.01) return n.toFixed(6);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

type Props = { currentPair: string; currentBase: string; maxLeverage: number };

export function PairSelector({ currentPair, currentBase, maxLeverage }: Props) {
  const { overview } = useMarketsStream();
  const router = useRouter();
  const { favs, toggleFav } = useFavorites();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  const markets = overview?.markets ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return markets;
    const s = search.toLowerCase();
    return markets.filter((m) => m.pair.toLowerCase().includes(s) || m.base.toLowerCase().includes(s));
  }, [markets, search]);

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-white/[0.06]">
        <TokenIcon symbol={currentBase} size={22} />
        <span className="font-mono text-xl font-bold text-white">{currentPair}</span>
        <svg className={`h-4 w-4 text-white/45 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[rgba(0,217,192,0.15)] text-[#00d9c0]">
        {maxLeverage}x
      </span>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[520px] overflow-hidden rounded-xl border border-white/[0.1] bg-[#0d1014] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input ref={inputRef} type="text" placeholder="Search markets…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" />
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-white/[0.06] px-4 py-2 text-[10px] uppercase tracking-wider text-white/35">
            <span>Symbol</span>
            <span className="text-right">Last Price</span>
            <span className="text-right">24h Change</span>
            <span className="w-16 text-right">Volume</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filtered.length === 0 && <div className="px-4 py-6 text-center text-sm text-white/35">No markets found</div>}
            {filtered.map((m) => (
              <div key={m.id} className="grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-2.5 transition-colors hover:bg-white/[0.04]">
                <button type="button" onClick={() => { setOpen(false); router.push(`/trade/${m.id}`); }}
                  className="flex items-center gap-2.5 text-left">
                  <button type="button" onClick={(e) => { e.stopPropagation(); toggleFav(m.id); }}
                    className={`shrink-0 text-base transition-colors ${favs.has(m.id) ? "text-amber-400" : "text-white/20 hover:text-white/50"}`}>
                    ★
                  </button>
                  <TokenIcon symbol={m.base} size={20} />
                  <span className="font-medium text-white">{m.pair}</span>
                  <span className="rounded px-1 py-0.5 text-[9px] font-semibold bg-[rgba(0,217,192,0.12)] text-[#00d9c0]">{m.max_leverage}x</span>
                </button>
                <span className="font-mono text-sm text-right text-white/85">{fmtPrice(m.mark_price)}</span>
                <span className={`font-mono text-sm text-right ${m.change_24h_pct >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>
                  {m.change_24h_pct >= 0 ? "+" : ""}{m.change_24h_pct.toFixed(2)}%
                </span>
                <span className="w-16 font-mono text-xs text-right text-white/45">
                  ${m.volume_24h >= 1e9 ? `${(m.volume_24h / 1e9).toFixed(1)}B` : `${(m.volume_24h / 1e6).toFixed(0)}M`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
