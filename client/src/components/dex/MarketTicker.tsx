import { useEffect, useRef, useState } from "react";
import { useMarketsStream } from "../../context/MarketsStreamContext";
import { TOKEN_ICONS } from "./tokenIcons";

function fmt(n: number, d = 2) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (n < 0.000001) return n.toFixed(10);
  if (n < 1) return n.toFixed(6);
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

export function MarketTicker() {
  const { overview, connected } = useMarketsStream();
  const [priceFlash, setPriceFlash] = useState<Record<string, "up" | "down" | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!overview) return;
    const flash: Record<string, "up" | "down" | null> = {};
    for (const m of overview.markets) {
      const prev = prevPricesRef.current[m.id];
      if (prev !== undefined && prev !== m.mark_price) {
        flash[m.id] = m.mark_price > prev ? "up" : "down";
      }
      prevPricesRef.current[m.id] = m.mark_price;
    }
    setPriceFlash(flash);
    const timer = setTimeout(() => setPriceFlash({}), 500);
    return () => clearTimeout(timer);
  }, [overview]);

  if (!overview?.markets.length) return null;
  const items = overview.markets;

  // Speed: ~60px/s — comfortable reading pace (was ~120px/s before)
  const itemCount = items.length;
  // Each item ~160px wide, two copies = itemCount * 160 * 2 px total
  // duration = total_width / speed
  const durationSec = Math.max(itemCount * 5, 60); // ~5s per item, min 60s

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-8 items-center border-t border-white/[0.06] bg-[#060c18] font-mono text-xs overflow-hidden">
      {/* Status dot */}
      <span className="flex shrink-0 items-center gap-1.5 border-r border-white/[0.06] px-4">
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: "#3dffa0" }} />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: connected ? "#3dffa0" : "#ef5350" }} />
        </span>
        <span style={{ color: connected ? "rgba(255,255,255,0.4)" : "#ef5350" }}>
          {connected ? "Live" : "Off"}
        </span>
      </span>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex w-max items-center gap-10 whitespace-nowrap"
          style={{ animation: `tickerScroll ${durationSec}s linear infinite` }}>
          {[...items, ...items].map((m, i) => {
            const flash = priceFlash[m.id];
            const icon = TOKEN_ICONS[m.base];
            return (
              <span key={`${m.id}-${i}`} className="flex shrink-0 items-center gap-1.5">
                {icon
                  ? <img src={icon} alt={m.base} width={14} height={14} className="rounded-full shrink-0" />
                  : <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                      style={{ background: "rgba(61,255,160,0.15)", color: "#3dffa0" }}>
                      {m.base.slice(0, 1)}
                    </span>
                }
                <span className="font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{m.pair}</span>
                <span className="transition-colors duration-500"
                  style={{ color: flash === "up" ? "#3dffa0" : flash === "down" ? "#ef5350" : "rgba(255,255,255,0.6)" }}>
                  {fmt(m.mark_price, m.mark_price < 10 ? 6 : 2)}
                </span>
                <span style={{ color: m.change_24h_pct >= 0 ? "#3dffa0" : "#ef5350" }}>
                  {m.change_24h_pct >= 0 ? "+" : ""}{m.change_24h_pct.toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
