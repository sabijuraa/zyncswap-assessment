"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMarketsStream } from "../context/MarketsStreamContext";
import { usePaperTrade } from "../context/PaperTradeContext";
import { useWallet } from "../wallet/WalletContext";
import type { MarketDetail } from "../types/markets";
import { TradingChart, type ChartTimeframe } from "../components/dex/TradingChart";
import { TradeEntryPanel } from "../components/dex/TradeEntryPanel";
import { PairSelector } from "../components/dex/PairSelector";
import { FavoritesBar } from "../components/dex/FavoritesBar";

function fmtPrice(n: number, quote: string) {
  if (quote === "ETH" && n < 1) return n.toFixed(8);
  if (n < 1) return n.toFixed(6);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function TradePage() {
  const params = useParams();
  const marketId = (params?.marketId as string) ?? "btc-usdt";
  const router = useRouter();
  const { overview } = useMarketsStream();
  const { address, requestConnect } = useWallet();
  const { positions, openOrders, closePosition, cancelOrder } = usePaperTrade();
  const [detail, setDetail] = useState<MarketDetail | null>(null);
  const [bottomTab, setBottomTab] = useState<"positions" | "orders" | "history">("positions");
  const [tf, setTf] = useState<ChartTimeframe>("5m");

  const pull = useCallback(async () => {
    try {
      const r = await fetch(`/api/v1/markets/${encodeURIComponent(marketId)}`);
      if (!r.ok) return;
      setDetail((await r.json()) as MarketDetail);
    } catch { /* ignore */ }
  }, [marketId]);

  useEffect(() => {
    void pull();
    const id = window.setInterval(pull, 2000);
    return () => clearInterval(id);
  }, [pull]);

  const live = overview?.markets.find((m) => m.id === marketId);
  const mark     = live?.mark_price ?? detail?.mark_price ?? 0;
  const pair     = detail?.pair ?? live?.pair ?? marketId.toUpperCase();
  const quote    = detail?.quote ?? live?.quote ?? "USDT";
  const base     = detail?.base ?? live?.base ?? "BASE";
  const change   = live?.change_24h_pct ?? detail?.change_24h_pct ?? 0;
  const vol      = live?.volume_24h ?? detail?.volume_24h ?? 0;
  const oi       = live?.open_interest ?? detail?.open_interest ?? 0;
  const funding  = live?.funding_1h_pct ?? detail?.funding_1h_pct ?? 0;
  const nextFund = live?.next_funding_in_sec ?? detail?.next_funding_in_sec ?? 0;
  const maxLev   = detail?.max_leverage ?? live?.max_leverage ?? 25;

  const myPos    = useMemo(() => positions.filter((p) => p.marketId === marketId), [positions, marketId]);
  const myOrders = useMemo(() => openOrders.filter((o) => o.marketId === marketId), [openOrders, marketId]);

  const mid = detail?.book?.asks?.[0] && detail?.book?.bids?.[0]
    ? (parseFloat(detail.book.asks[0].price) + parseFloat(detail.book.bids[0].price)) / 2
    : mark;

  const spreadPct = detail?.book?.asks?.[0] && detail?.book?.bids?.[0] && mid > 0
    ? ((parseFloat(detail.book.asks[0].price) - parseFloat(detail.book.bids[0].price)) / mid) * 100
    : 0;

  if (marketId === "zync-eth") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center text-white/60">
        <div className="text-5xl">🚀</div>
        <h2 className="m-0 text-2xl font-bold text-white">ZYNC — Coming Soon</h2>
        <p className="m-0 max-w-md leading-relaxed">
          The ZYNC token is not yet launched. Once deployed on a live network, trading will be available here.
        </p>
        <button type="button" onClick={() => router.push("/trade/btc-usdt")}
          className="mt-2 text-sm text-[#00d9c0] hover:underline">← Back to Markets</button>
      </div>
    );
  }

  return (
    <div className="box-border flex flex-col"
      style={{ height: "calc(100dvh - 5.2rem)", maxWidth: "100%", minHeight: "700px", overflowY: "auto" }}>

      {/* Favorites bar */}
      <FavoritesBar currentMarketId={marketId} />

      <div className="grid min-h-0 flex-1 border border-white/[0.06]"
        style={{
          background: "rgba(255,255,255,0.06)",
          gridTemplateColumns: "minmax(0,1fr) 260px 288px",
          gridTemplateRows: "auto minmax(500px,1fr) minmax(120px,160px)",
          gap: "1px",
        }}>

        {/* ── Asset bar ── */}
        <div className="col-span-3 row-start-1 flex flex-wrap items-center gap-x-6 gap-y-2 bg-[#0d1014] px-4 py-2">
          <PairSelector currentPair={pair} currentBase={base} maxLeverage={maxLev} />
          <div className="font-mono text-2xl font-bold">{fmtPrice(mark, quote)}</div>
          {[
            { label: "Mark",          value: fmtPrice(mark, quote) },
            { label: "24h Change",    value: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, cls: change >= 0 ? "text-[#26a69a]" : "text-[#ef5350]" },
            { label: "24h Volume",    value: `$${(vol / 1e6).toFixed(2)}M` },
            { label: "Open Interest", value: `$${(oi / 1e6).toFixed(2)}M` },
            { label: "1h Funding",    value: `${(funding * 100).toFixed(4)}%` },
            { label: "Next Funding",  value: `${Math.floor(nextFund / 60)}m ${nextFund % 60}s` },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
              <span className={`font-mono text-sm ${cls ?? "text-white/85"}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Chart ── */}
        <div className="col-start-1 row-start-2 min-h-0 relative" style={{ overflow: "visible" }}>
          <TradingChart key={marketId} pair={pair} timeframe={tf} onTimeframeChange={setTf} livePrice={mark || undefined} />
        </div>

        {/* ── Order book + trades ── */}
        <div className="col-start-2 row-start-2 flex flex-col border-l border-white/[0.06] bg-[#0d1014]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <span className="text-xs font-semibold text-white/70">Order Book</span>
            <button type="button" className="text-white/30 hover:text-white/60">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
          {/* Column headers */}
          <div className="grid grid-cols-3 border-b border-white/[0.06] px-3 py-1.5 font-mono text-[10px] text-white/40">
            <span>Price</span>
            <span className="text-right">Size ({base})</span>
            <span className="text-right">Total ({base})</span>
          </div>
          {/* Rows */}
          <div className="flex-1 overflow-y-auto font-mono text-[11px]">
            {detail?.book?.asks?.slice().reverse().map((r, i) => (
              <div key={`a-${i}`} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/[0.02]">
                <span className="text-[#ef5350]">{r.price}</span>
                <span className="text-right text-white/70">{r.size}</span>
                <span className="text-right text-white/50">{r.total}</span>
              </div>
            ))}
            <div className="border-y border-white/[0.06] py-1.5 text-center text-xs">
              <span className="font-mono text-white/85">{fmtPrice(mid, quote)}</span>
              <span className="ml-2 text-white/40">Spread</span>
              <span className="ml-1 font-mono text-white/60">{spreadPct.toFixed(3)}%</span>
            </div>
            {detail?.book?.bids?.map((r, i) => (
              <div key={`b-${i}`} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/[0.02]">
                <span className="text-[#26a69a]">{r.price}</span>
                <span className="text-right text-white/70">{r.size}</span>
                <span className="text-right text-white/50">{r.total}</span>
              </div>
            ))}
          </div>
          {/* Trades */}
          <div className="border-t border-white/[0.06] px-3 py-2 text-xs font-semibold text-white/70">Trades</div>
          <div className="grid grid-cols-3 border-b border-white/[0.06] px-3 py-1.5 font-mono text-[10px] text-white/40">
            <span>Price</span>
            <span className="text-right">Size ({base})</span>
            <span className="text-right">Time</span>
          </div>
          <div className="max-h-[200px] overflow-y-auto font-mono text-[11px]">
            {detail?.trades?.map((t, i) => {
              const d = new Date(t.ts * 1000);
              const ts = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
              return (
                <div key={`${t.ts}-${i}`} className="grid grid-cols-3 px-3 py-0.5 hover:bg-white/[0.02]">
                  <span className={t.side === "buy" ? "text-[#26a69a]" : "text-[#ef5350]"}>{t.price}</span>
                  <span className="text-right text-white/70">{t.size}</span>
                  <span className="text-right text-white/40">{ts}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Trade entry panel ── */}
        <TradeEntryPanel marketId={marketId} pair={pair} base={base} quote={quote}
          markPrice={mark} connected={Boolean(address)} onRequestConnect={requestConnect} />

        {/* ── Bottom tabs ── */}
        <div className="col-span-3 row-start-3 flex min-h-0 flex-col border-t border-white/[0.06] bg-[#0d1014]">
          <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-2 py-1.5">
            {([
              ["positions", `Positions (${myPos.length})`],
              ["orders",    `Open orders (${myOrders.length})`],
              ["history",   "Paper trade log"],
            ] as const).map(([t, label]) => (
              <button key={t} type="button" onClick={() => setBottomTab(t)}
                className={`whitespace-nowrap border-none bg-transparent px-3 py-1.5 font-sans text-xs cursor-pointer transition-colors ${bottomTab === t ? "border-b-2 border-[#00d9c0] text-[#00d9c0]" : "text-white/45"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="overflow-auto p-2 text-xs">
            {bottomTab === "positions" && (
              <table className="w-full border-collapse">
                <thead><tr>{["Market","Side","Size","Entry","Mark","Margin","PnL",""].map((h) => (
                  <th key={h} className="border-b border-white/[0.06] px-2 py-1.5 text-left text-[10px] font-medium text-white/45">{h}</th>
                ))}</tr></thead>
                <tbody>
                  {myPos.length === 0 && <tr><td colSpan={8} className="px-2 py-3 text-white/40">No open paper positions.</td></tr>}
                  {myPos.map((p) => {
                    const pnl = p.side === "long" ? (mark - p.entryPrice) * p.sizeBase : (p.entryPrice - mark) * p.sizeBase;
                    return (
                      <tr key={p.id} className="border-b border-white/[0.03]">
                        <td className="px-2 py-1">{p.pair}</td>
                        <td className={`px-2 py-1 ${p.side === "long" ? "text-[#26a69a]" : "text-[#ef5350]"}`}>{p.side}</td>
                        <td className="px-2 py-1 font-mono">{p.sizeBase.toFixed(4)}</td>
                        <td className="px-2 py-1 font-mono">{fmtPrice(p.entryPrice, quote)}</td>
                        <td className="px-2 py-1 font-mono">{fmtPrice(mark, quote)}</td>
                        <td className="px-2 py-1 font-mono">{p.marginQuote.toFixed(4)}</td>
                        <td className={`px-2 py-1 font-mono ${pnl >= 0 ? "text-[#26a69a]" : "text-[#ef5350]"}`}>{pnl.toFixed(4)}</td>
                        <td className="px-2 py-1">
                          <button type="button" onClick={() => closePosition(p.id, mark)}
                            className="rounded border border-[#00d9c0] bg-transparent px-2 py-0.5 text-[10px] text-[#00d9c0] hover:bg-[rgba(0,217,192,0.15)]">Close</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {bottomTab === "orders" && (
              <table className="w-full border-collapse">
                <thead><tr>{["Pair","Side","Type","Size","Limit",""].map((h) => (
                  <th key={h} className="border-b border-white/[0.06] px-2 py-1.5 text-left text-[10px] font-medium text-white/45">{h}</th>
                ))}</tr></thead>
                <tbody>
                  {myOrders.length === 0 && <tr><td colSpan={6} className="px-2 py-3 text-white/40">No open limit orders.</td></tr>}
                  {myOrders.map((o) => (
                    <tr key={o.id} className="border-b border-white/[0.03]">
                      <td className="px-2 py-1">{o.pair}</td>
                      <td className="px-2 py-1">{o.side}</td>
                      <td className="px-2 py-1">{o.orderType}</td>
                      <td className="px-2 py-1 font-mono">{o.sizeBase}</td>
                      <td className="px-2 py-1 font-mono">{o.limitPrice ?? "—"}</td>
                      <td className="px-2 py-1">
                        <button type="button" onClick={() => cancelOrder(o.id)}
                          className="rounded border border-[#00d9c0] bg-transparent px-2 py-0.5 text-[10px] text-[#00d9c0] hover:bg-[rgba(0,217,192,0.15)]">Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {bottomTab === "history" && <p className="m-0 text-white/45">Paper fills stored in localStorage.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
