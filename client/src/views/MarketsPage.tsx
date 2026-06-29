"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketsStream } from "../context/MarketsStreamContext";
import { useFavorites } from "../context/FavoritesContext";
import { SparklineSvg } from "../components/dex/SparklineSvg";
import { TOKEN_ICONS } from "../components/dex/tokenIcons";

function TokenIcon({ symbol }: { symbol: string }) {
  const src = TOKEN_ICONS[symbol];
  if (!src) return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: "rgba(61,255,160,0.1)", color: "#3dffa0" }}>
      {symbol.slice(0, 2)}
    </div>
  );
  return <img src={src} alt={symbol} width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-contain" loading="lazy" />;
}

function fmtVol(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${(n / 1e3).toFixed(1)}K`;
}
function fmtPrice(n: number) {
  if (n < 0.000001) return n.toFixed(10);
  if (n < 0.01) return n.toFixed(8);
  if (n < 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

type SortKey = "pair" | "price" | "change" | "funding" | "oi" | "vol";
type SortDir = "asc" | "desc";

export function MarketsPage() {
  const { overview } = useMarketsStream();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "fav">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "vol", dir: "desc" });
  const { favs, toggleFav } = useFavorites();

  function cycleSort(key: SortKey) {
    setSort(prev => prev.key === key
      ? { key, dir: prev.dir === "desc" ? "asc" : "desc" }
      : { key, dir: "desc" });
  }

  const rows = useMemo(() => {
    if (!overview) return [];
    let m = [...overview.markets];
    if (q.trim()) {
      const s = q.toLowerCase();
      m = m.filter(x => x.pair.toLowerCase().includes(s) || x.base.toLowerCase().includes(s));
    }
    if (tab === "fav") m = m.filter(x => favs.has(x.id));
    m.sort((a, b) => {
      if (sort.key === "pair") { const v = a.base.localeCompare(b.base); return sort.dir === "asc" ? v : -v; }
      const map: Record<SortKey, (x: typeof a) => number> = {
        pair: () => 0, price: x => x.mark_price, change: x => x.change_24h_pct,
        funding: x => x.funding_1h_pct, oi: x => x.open_interest, vol: x => x.volume_24h,
      };
      const av = map[sort.key](a), bv = map[sort.key](b);
      return sort.dir === "desc" ? bv - av : av - bv;
    });
    return m;
  }, [overview, q, tab, favs, sort]);

  function toggleFavRow(id: string, e: React.MouseEvent) { e.stopPropagation(); toggleFav(id); }

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="ml-1 inline-flex flex-col leading-[1] text-[9px] align-middle">
      <span style={{ color: sort.key === k && sort.dir === "asc" ? "#3dffa0" : "rgba(255,255,255,0.2)" }}>▲</span>
      <span style={{ color: sort.key === k && sort.dir === "desc" ? "#3dffa0" : "rgba(255,255,255,0.2)" }}>▼</span>
    </span>
  );

  const ColHead = ({ label, k, right }: { label: string; k?: SortKey; right?: boolean }) => (
    <th onClick={k ? () => cycleSort(k) : undefined}
      className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap select-none border-b
        ${k ? "cursor-pointer" : ""}
        ${right ? "text-right" : "text-left"}`}
      style={{ borderColor: "rgba(255,255,255,0.07)", color: sort.key === k ? "#3dffa0" : "rgba(255,255,255,0.45)" }}>
      {label}{k && <SortIcon k={k} />}
    </th>
  );

  return (
    <div className="min-h-screen text-white" style={{ background: "#060c18" }}>
      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Markets</h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Perpetual futures · Real-time data
            </p>
          </div>
          {overview && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#3dffa0" }} />
              Live · {overview.markets.length} markets
            </div>
          )}
        </div>

        {/* Stats strip */}
        {overview && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Open Interest", value: `$${(overview.total_open_interest / 1e9).toFixed(2)}B`, accent: false },
              { label: "24h Volume",           value: `$${(overview.volume_24h_total / 1e9).toFixed(2)}B`,   accent: false },
              { label: "Markets",              value: String(overview.markets.length),                        accent: false },
              {
                label: "Vol. Change 24h",
                value: `${overview.volume_24h_change_pct >= 0 ? "+" : ""}${overview.volume_24h_change_pct.toFixed(2)}%`,
                accent: true, pos: overview.volume_24h_change_pct >= 0,
              },
            ].map(({ label, value, accent, pos }) => (
              <div key={label} className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                <p className="font-mono text-xl font-bold"
                  style={{ color: accent ? (pos ? "#3dffa0" : "#ef5350") : "#ffffff" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["all", "fav"] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                style={tab === t
                  ? { background: "linear-gradient(135deg,#3dffa0,#38bdf8)", color: "#060c18", fontWeight: 700 }
                  : { color: "rgba(255,255,255,0.45)" }}>
                {t === "all" ? "All Markets" : "Watchlist"}
              </button>
            ))}
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 16 16"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              <circle cx="6.5" cy="6.5" r="4"/><path strokeLinecap="round" d="M10.5 10.5l3 3"/>
            </svg>
            <input
              className="w-56 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Search markets…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider w-10 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>#</th>
                <ColHead label="Market" k="pair" />
                <ColHead label="Price" k="price" right />
                <ColHead label="24h %" k="change" right />
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider w-32 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}>
                  Live Price
                </th>
                <ColHead label="Funding / 1h" k="funding" right />
                <ColHead label="Open Interest" k="oi" right />
                <ColHead label="24h Volume" k="vol" right />
                <th className="px-4 py-3.5 w-10 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }} />
              </tr>
            </thead>
            <tbody>
              {!overview && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#3dffa0" }} />
                      Loading markets…
                    </span>
                  </td>
                </tr>
              )}
              {rows.length === 0 && overview && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                    No markets found.
                  </td>
                </tr>
              )}
              {rows.map((m, idx) => {
                const pos = m.change_24h_pct >= 0;
                const isFav = favs.has(m.id);
                return (
                  <tr key={m.id} onClick={() => router.push(`/trade/${m.id}`)}
                    className="group cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,255,160,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>

                    <td className="px-4 py-3.5 text-sm tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>{idx + 1}</td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <TokenIcon symbol={m.base} />
                        <div className="leading-tight">
                          <span className="text-sm font-semibold text-white">{m.base}</span>
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>/{m.quote}</span>
                        </div>
                        <span className="rounded-md px-1.5 py-0.5 text-xs font-semibold"
                          style={{ background: "rgba(61,255,160,0.1)", color: "#3dffa0", border: "1px solid rgba(61,255,160,0.2)" }}>
                          {m.max_leverage}×
                        </span>
                        {m.id === "zync-eth" && (
                          <span className="rounded-md px-1.5 py-0.5 text-xs font-semibold"
                            style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                            SOON
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums text-white">
                      {fmtPrice(m.mark_price)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums font-semibold"
                      style={{ color: pos ? "#3dffa0" : "#ef5350" }}>
                      {pos ? "+" : ""}{m.change_24h_pct.toFixed(2)}%
                    </td>

                    <td className="px-4 py-3.5">
                      <SparklineSvg values={m.sparkline} positive={pos} />
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums"
                      style={{ color: m.funding_1h_pct >= 0 ? "rgba(255,255,255,0.65)" : "#ef5350" }}>
                      {m.funding_1h_pct >= 0 ? "+" : ""}{(m.funding_1h_pct * 100).toFixed(4)}%
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {fmtVol(m.open_interest)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-sm tabular-nums" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {fmtVol(m.volume_24h)}
                    </td>

                    <td className="px-4 py-3.5 text-center text-lg">
                      {m.id !== "zync-eth" && (
                        <button type="button" onClick={e => toggleFavRow(m.id, e)}
                          className="transition-colors leading-none"
                          style={{ color: isFav ? "#fbbf24" : "rgba(255,255,255,0.15)" }}>
                          {isFav ? "★" : "☆"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
          Prices update in real-time · All values in USD
        </p>
      </div>
    </div>
  );
}
