/** @typedef {{ price: string; size: string; total: string }} BookLevel */
/** @typedef {{ asks: BookLevel[]; bids: BookLevel[] }} BookSide */
/** @typedef {{ price: string; size: string; side: string; ts: number }} TradePrint */

export function quoteDp(quote) {
  switch (quote) {
    case "ETH":
      return 8;
    case "BTC":
      return 2;
    default:
      return 4;
  }
}

export function formatPrice(p, decimals) {
  const d = Math.min(decimals, 8);
  return p.toFixed(d);
}

function priceKey(p) {
  return Math.floor(p * 1_000_000_000_000);
}

/** @param {BookLevel[]} levels */
function parseLevels(levels) {
  const m = new Map();
  for (const l of levels) {
    const p = Number.parseFloat(l.price);
    const s = Number.parseFloat(l.size);
    if (!Number.isFinite(p) || !Number.isFinite(s)) continue;
    const k = priceKey(p);
    m.set(k, (m.get(k) ?? 0) + s);
  }
  return m;
}

/**
 * @param {BookSide} synth
 * @param {Array<[number, number]>} restingBids
 * @param {Array<[number, number]>} restingAsks
 * @param {number} quoteDecimals
 * @param {number} maxLevels
 */
export function mergeBookWithResting(
  synth,
  restingBids,
  restingAsks,
  quoteDecimals,
  maxLevels
) {
  let askMap = parseLevels(synth.asks);
  for (const [p, sz] of restingAsks) {
    const k = priceKey(p);
    askMap.set(k, (askMap.get(k) ?? 0) + sz);
  }
  let askKeys = [...askMap.keys()].sort((a, b) => a - b);
  const asks = [];
  let cum = 0;
  for (const k of askKeys.slice(0, maxLevels)) {
    const sz = askMap.get(k);
    const px = k / 1_000_000_000_000;
    cum += sz;
    asks.push({
      price: formatPrice(px, quoteDecimals),
      size: sz.toFixed(4),
      total: cum.toFixed(4),
    });
  }

  let bidMap = parseLevels(synth.bids);
  for (const [p, sz] of restingBids) {
    const k = priceKey(p);
    bidMap.set(k, (bidMap.get(k) ?? 0) + sz);
  }
  let bidKeys = [...bidMap.keys()].sort((a, b) => b - a);
  const bids = [];
  cum = 0;
  for (const k of bidKeys.slice(0, maxLevels)) {
    const sz = bidMap.get(k);
    const px = k / 1_000_000_000_000;
    cum += sz;
    bids.push({
      price: formatPrice(px, quoteDecimals),
      size: sz.toFixed(4),
      total: cum.toFixed(4),
    });
  }

  return { asks, bids };
}

/**
 * @param {Array<{ price: number; size: number; taker_side: string; ts: number }>} engine
 * @param {TradePrint[]} synth
 * @param {number} quoteDecimals
 * @param {number} max
 */
export function mergeTrades(engine, synth, quoteDecimals, max) {
  const out = engine.map((t) => ({
    price: formatPrice(t.price, quoteDecimals),
    size: t.size.toFixed(4),
    side: t.taker_side === "buy" ? "buy" : "sell",
    ts: t.ts,
  }));
  out.push(...synth);
  out.sort((a, b) => b.ts - a.ts);
  return out.slice(0, max);
}
