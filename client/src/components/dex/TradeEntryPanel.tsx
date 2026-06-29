import { useState } from "react";
import { usePaperTrade } from "../../context/PaperTradeContext";

type Props = {
  marketId: string; pair: string; base: string; quote: string;
  markPrice: number; connected: boolean; onRequestConnect?: () => void;
};

export function TradeEntryPanel({ marketId, pair, base, quote, markPrice, connected, onRequestConnect }: Props) {
  const { placeMarket, placeLimit } = usePaperTrade();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [size, setSize] = useState("1");
  const [limitPx, setLimitPx] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [toast, setToast] = useState<string | null>(null);

  const sz = parseFloat(size) || 0;
  const estNotional = sz > 0 && markPrice > 0 ? sz * markPrice : 0;
  const estLiq = side === "buy" ? markPrice * (1 - 0.85 / Math.max(leverage, 1)) : markPrice * (1 + 0.85 / Math.max(leverage, 1));
  const fee = estNotional * 0.0004;

  function onSubmit() {
    setToast(null);
    if (!connected) { onRequestConnect?.(); setToast("Connect a wallet to continue."); return; }
    if (!(sz > 0)) { setToast("Enter a valid size."); return; }
    if (orderType === "limit") {
      const lp = parseFloat(limitPx);
      if (!(lp > 0)) { setToast("Enter limit price."); return; }
      placeLimit({ marketId, pair, side, sizeBase: sz, limitPrice: lp });
      setToast(`Limit ${side} submitted @ ${lp}`);
      return;
    }
    const r = placeMarket({ marketId, pair, side, sizeBase: sz, markPrice });
    if ("error" in r) setToast(r.error);
    else setToast(`Filled @ ~${r.fillPrice.toFixed(8)} ${quote}`);
  }

  const inputCls = "w-full rounded-md border border-white/[0.06] bg-[#060809] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[rgba(0,217,192,0.4)]";

  return (
    <div className="flex flex-col gap-4 border-l border-white/[0.06] bg-[#121519] p-3">
      {/* Leverage */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border border-[#00d9c0] px-2 py-0.5 text-[10px] font-semibold text-[#00d9c0]">Cross</span>
        <span className="text-[10px] text-white/45">Leverage</span>
        <input type="range" min={1} max={50} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-24" />
        <span className="font-mono text-xs">{leverage}x</span>
      </div>

      {/* Buy / Sell */}
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" onClick={() => setSide("buy")}
          className={`rounded py-2 text-sm font-semibold transition-colors ${side === "buy" ? "bg-[#3dd68c] text-black" : "bg-[rgba(61,214,140,0.2)] text-[#3dd68c]"}`}>
          Buy / Long
        </button>
        <button type="button" onClick={() => setSide("sell")}
          className={`rounded py-2 text-sm font-semibold transition-colors ${side === "sell" ? "bg-[#ff5c5c] text-white" : "bg-[rgba(255,92,92,0.15)] text-[#ff5c5c]"}`}>
          Sell / Short
        </button>
      </div>

      {/* Order type */}
      <div className="flex gap-1.5">
        {(["market", "limit", "stop"] as const).map((t) => (
          <button key={t} type="button" disabled={t === "stop"}
            onClick={() => t !== "stop" && setOrderType(t as "market" | "limit")}
            className={`flex-1 rounded border py-1.5 text-xs capitalize transition-colors disabled:opacity-35 ${
              orderType === t ? "border-[#00d9c0] text-[#00d9c0]" : "border-white/[0.06] bg-[#060809] text-white/45"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Size */}
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-white/45">Size ({base})</label>
        <input value={size} onChange={(e) => setSize(e.target.value)} inputMode="decimal" className={inputCls} />
        <div className="mt-1.5 flex gap-1">
          {[25, 50, 75, 100].map((pct) => (
            <button key={pct} type="button" onClick={() => setSize(String((pct / 100) * 10))}
              className="flex-1 rounded border border-white/[0.06] bg-transparent py-1 text-[10px] text-white/45 hover:text-white">
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Limit price */}
      {orderType === "limit" && (
        <div>
          <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-white/45">Limit price ({quote})</label>
          <input value={limitPx} onChange={(e) => setLimitPx(e.target.value)} placeholder={String(markPrice)} className={inputCls} />
        </div>
      )}

      {/* Submit */}
      <button type="button" disabled={!markPrice} onClick={onSubmit}
        className={`w-full rounded py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
          side === "buy" ? "bg-[#3dd68c] text-black" : "bg-[#ff5c5c] text-white"
        }`}>
        {!connected ? "Connect wallet" : orderType === "market" ? `Market ${side}` : `Place limit ${side}`}
      </button>

      {toast && <div className="text-xs text-white/55">{toast}</div>}

      {/* Meta */}
      <div className="grid gap-1 text-[10px] text-white/45">
        <div>Est. liq. · {estLiq ? estLiq.toFixed(quote === "ETH" ? 8 : 4) : "—"}</div>
        <div>Margin · ~{(estNotional * 0.1 + fee).toFixed(4)} (10%)</div>
        <div>Slippage · {orderType === "market" ? "0.025%" : "—"}</div>
        <div>Fee · ~{fee.toFixed(6)} {quote} (0.04%)</div>
      </div>
    </div>
  );
}
