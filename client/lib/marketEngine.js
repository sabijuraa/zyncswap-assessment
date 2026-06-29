import { EventEmitter } from "node:events";

function nowSecs() {
  return Math.floor(Date.now() / 1000);
}
function rnd(a, b) {
  return a + Math.random() * (b - a);
}
function rndBool(p) {
  return Math.random() < p;
}

const BROADCAST_INTERVAL_MS = 2000;
const RECONNECT_BASE_MS = 5_000;
const RECONNECT_MAX_MS = 300_000;

export function quoteDp(quote) {
  switch (quote) {
    case "ETH": return 8;
    case "BTC": return 2;
    default: return 4;
  }
}
export function formatPrice(p, decimals) {
  return p.toFixed(Math.min(decimals, 8));
}

const BINANCE_MAP = {
  "btc-usdt": "btcusdt", "eth-usdt": "ethusdt", "sol-usdt": "solusdt",
  "xrp-usdt": "xrpusdt", "doge-usdt": "dogeusdt", "arb-usdt": "arbusdt",
  "op-usdt": "opusdt", "bnb-usdt": "bnbusdt", "avax-usdt": "avaxusdt",
  "link-usdt": "linkusdt", "matic-usdt": "maticusdt", "uni-usdt": "uniusdt",
  "ltc-usdt": "ltcusdt", "ada-usdt": "adausdt", "dot-usdt": "dotusdt",
  "atom-usdt": "atomusdt", "near-usdt": "nearusdt", "apt-usdt": "aptusdt",
  "sui-usdt": "suiusdt", "inj-usdt": "injusdt", "tia-usdt": "tiausdt",
  "sei-usdt": "seiusdt", "wld-usdt": "wldusdt", "jup-usdt": "jupusdt",
  "pepe-usdt": "pepeusdt", "shib-usdt": "shibusdt", "floki-usdt": "flokiusdt",
  "fet-usdt": "fetusdt", "render-usdt": "renderusdt", "grt-usdt": "grtusdt",
  "ldo-usdt": "ldousdt", "crv-usdt": "crvusdt", "aave-usdt": "aaveusdt",
  "mkr-usdt": "mkrusdt", "snx-usdt": "snxusdt",
};

const SEEDS = [
  ["btc-usdt",   "BTC-USDT",   "BTC",    "USDT", 66420,    891_000_000, 50],
  ["eth-usdt",   "ETH-USDT",   "ETH",    "USDT", 3245,     412_000_000, 50],
  ["bnb-usdt",   "BNB-USDT",   "BNB",    "USDT", 580,      180_000_000, 40],
  ["sol-usdt",   "SOL-USDT",   "SOL",    "USDT", 142.8,     98_000_000, 40],
  ["xrp-usdt",   "XRP-USDT",   "XRP",    "USDT", 0.512,     45_000_000, 35],
  ["avax-usdt",  "AVAX-USDT",  "AVAX",   "USDT", 34.5,      38_000_000, 35],
  ["doge-usdt",  "DOGE-USDT",  "DOGE",   "USDT", 0.0812,    28_000_000, 30],
  ["ada-usdt",   "ADA-USDT",   "ADA",    "USDT", 0.445,     22_000_000, 30],
  ["link-usdt",  "LINK-USDT",  "LINK",   "USDT", 14.2,      20_000_000, 30],
  ["dot-usdt",   "DOT-USDT",   "DOT",    "USDT", 7.1,       18_000_000, 30],
  ["matic-usdt", "MATIC-USDT", "MATIC",  "USDT", 0.72,      16_000_000, 30],
  ["uni-usdt",   "UNI-USDT",   "UNI",    "USDT", 8.4,       14_000_000, 25],
  ["atom-usdt",  "ATOM-USDT",  "ATOM",   "USDT", 9.2,       13_000_000, 25],
  ["near-usdt",  "NEAR-USDT",  "NEAR",   "USDT", 5.8,       12_000_000, 25],
  ["arb-usdt",   "ARB-USDT",   "ARB",    "USDT", 0.412,     12_000_000, 25],
  ["op-usdt",    "OP-USDT",    "OP",     "USDT", 1.08,       9_500_000, 25],
  ["apt-usdt",   "APT-USDT",   "APT",    "USDT", 8.9,        9_000_000, 25],
  ["ltc-usdt",   "LTC-USDT",   "LTC",    "USDT", 82.0,       8_500_000, 30],
  ["inj-usdt",   "INJ-USDT",   "INJ",    "USDT", 24.5,       8_000_000, 25],
  ["sui-usdt",   "SUI-USDT",   "SUI",    "USDT", 1.42,       7_500_000, 25],
  ["tia-usdt",   "TIA-USDT",   "TIA",    "USDT", 8.1,        7_000_000, 20],
  ["sei-usdt",   "SEI-USDT",   "SEI",    "USDT", 0.48,       6_500_000, 20],
  ["wld-usdt",   "WLD-USDT",   "WLD",    "USDT", 2.3,        6_000_000, 20],
  ["jup-usdt",   "JUP-USDT",   "JUP",    "USDT", 0.82,       5_500_000, 20],
  ["pepe-usdt",  "PEPE-USDT",  "PEPE",   "USDT", 0.0000098,  5_000_000, 20],
  ["shib-usdt",  "SHIB-USDT",  "SHIB",   "USDT", 0.0000245,  4_500_000, 20],
  ["floki-usdt", "FLOKI-USDT", "FLOKI",  "USDT", 0.000185,   4_000_000, 20],
  ["fet-usdt",   "FET-USDT",   "FET",    "USDT", 1.65,       3_800_000, 20],
  ["render-usdt","RENDER-USDT","RENDER", "USDT", 7.2,        3_500_000, 20],
  ["grt-usdt",   "GRT-USDT",   "GRT",    "USDT", 0.185,      3_200_000, 20],
  ["ldo-usdt",   "LDO-USDT",   "LDO",    "USDT", 1.85,       3_000_000, 20],
  ["crv-usdt",   "CRV-USDT",   "CRV",    "USDT", 0.42,       2_800_000, 20],
  ["aave-usdt",  "AAVE-USDT",  "AAVE",   "USDT", 92.0,       2_500_000, 20],
  ["mkr-usdt",   "MKR-USDT",   "MKR",    "USDT", 1820,       2_200_000, 20],
  ["snx-usdt",   "SNX-USDT",   "SNX",    "USDT", 2.8,        2_000_000, 20],
];

export class MarketEngine extends EventEmitter {
  constructor() {
    super();
    this.inner = new Map();
    this._initMarkets();
    // _connectBinance() is NOT called here.
    // Call engine.connectBinance() explicitly from the HTTP server after
    // listen() so it never fires during Next.js build or API-route evaluation.
    this._broadcastTimer = setInterval(() => this._broadcast(), BROADCAST_INTERVAL_MS);
    this._broadcastTimer.unref?.();
  }

  /** Call once from server.js after the HTTP server has started. */
  connectBinance() {
    this._connectBinance();
  }

  _initMarkets() {
    const ts = nowSecs();
    for (const [id, pair, base, quote, p, oi, lev] of SEEDS) {
      const open = p * (1 + rnd(-0.02, 0.02));
      const spark = [];
      for (let i = 0; i < 25; i++) spark.push(open + (p - open) * (i / 24) + rnd(-0.001, 0.001) * p);
      const bucket = Math.floor(ts / 300);
      const candles = [];
      for (let i = 0; i < 100; i++) {
        const bi = bucket - (99 - i);
        const wobble = Math.sin(i * 0.017) * 0.008;
        const o = p * (1 + wobble);
        const c = p * (1 + wobble + 0.0004);
        candles.push({ t: bi * 300, o, h: Math.max(c, o) * 1.002, l: Math.min(c, o) * 0.998, c, v: rnd(10_000, 500_000) });
      }
      this.inner.set(id, {
        id, pair, base, quote, price: p, open_24h: open,
        volume_24h: rnd(1_000_000, 8_000_000), open_interest: oi,
        funding_1h_pct: rnd(-0.012, 0.012), sparkline: spark,
        max_leverage: lev, trades: [], candles,
        candle_open: p, last_candle_bucket: bucket,
        change_24h_pct_real: null, volume_24h_real: null,
      });
    }
  }

  _connectBinance() {
    // Only connect during actual server runtime, not during Next.js build/static analysis
    if (process.env.NEXT_PHASE === "phase-production-build") return;

    let WS;
    try {
      WS = globalThis.WebSocket ?? require("ws").WebSocket;
    } catch {
      return;
    }

    const symbols = Object.values(BINANCE_MAP);
    const streams = symbols.map((s) => `${s}@miniTicker`).join("/");
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    let attempt = 0;
    let blocked = false;

    const connect = () => {
      let ws;
      try { ws = new WS(url); } catch { return; }
      this._binanceWs = ws;

      ws.onopen = () => {
        attempt = 0;
        blocked = false;
        console.log("[marketEngine] Binance stream connected");
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
          this._applyTicker(msg.data ?? msg);
        } catch {}
      };
      ws.onclose = () => {
        attempt++;
        const next = Math.min(RECONNECT_BASE_MS * 2 ** attempt, RECONNECT_MAX_MS);
        if (!blocked) {
          console.log(`[marketEngine] Binance unavailable, retrying in ${Math.round(next / 1000)}s (simulated data active)`);
        }
        setTimeout(connect, next);
      };
      ws.onerror = (err) => {
        const msg = err.message ?? String(err);
        // 451 = geo-block, connection refused = network block — suppress after first notice
        const isBlock = msg.includes("451") || msg.includes("ECONNREFUSED") || msg.includes("before it was established");
        if (!blocked) {
          if (isBlock) {
            console.log("[marketEngine] Binance geo-blocked — running on simulated data");
            blocked = true;
          } else {
            console.log("[marketEngine] Binance error:", msg);
          }
        }
        try { ws.close(); } catch {}
      };
    };
    connect();
  }

  _applyTicker(ticker) {
    if (!ticker?.s) return;
    const sym = ticker.s.toLowerCase();
    const marketId = Object.entries(BINANCE_MAP).find(([, v]) => v === sym)?.[0];
    if (!marketId) return;
    const m = this.inner.get(marketId);
    if (!m) return;
    const price = parseFloat(ticker.c);
    const open = parseFloat(ticker.o);
    const vol = parseFloat(ticker.q);
    if (!Number.isFinite(price) || price <= 0) return;
    const prevPrice = m.price;
    m.price = price;
    if (Number.isFinite(open) && open > 0) m.open_24h = open;
    if (Number.isFinite(vol) && vol > 0) m.volume_24h = vol;
    if (m.sparkline.length >= 60) m.sparkline.shift();
    m.sparkline.push(price);
    this._updateCandle(m, price, Math.abs(price - prevPrice) * 100);
    if (price !== prevPrice) {
      const side = price > prevPrice ? "buy" : "sell";
      const qd = quoteDp(m.quote);
      m.trades.unshift({ price: formatPrice(price, qd), size: rnd(0.01, 2.8).toFixed(4), side, ts: nowSecs() });
      if (m.trades.length > 48) m.trades.pop();
    }
  }

  _updateCandle(m, price, vol) {
    const ts = nowSecs();
    const bucket = Math.floor(ts / 300);
    if (bucket !== m.last_candle_bucket) {
      m.last_candle_bucket = bucket;
      m.candle_open = price;
      m.candles.push({ t: bucket * 300, o: price, h: price, l: price, c: price, v: vol });
      if (m.candles.length > 200) m.candles.shift();
    } else {
      const last = m.candles[m.candles.length - 1];
      if (last) { last.h = Math.max(last.h, price); last.l = Math.min(last.l, price); last.c = price; last.v += vol; }
    }
  }

  _broadcast() {
    const json = JSON.stringify({ type: "tick", overview: this.overview() });
    this.emit("broadcast", json);
  }

  static toPublic(m) {
    const change = m.open_24h > 0 ? ((m.price - m.open_24h) / m.open_24h) * 100 : 0;
    return {
      id: m.id, pair: m.pair, base: m.base, quote: m.quote,
      mark_price: m.price, index_price: m.price * 1.000012,
      change_24h_pct: change, volume_24h: m.volume_24h,
      open_interest: m.open_interest, funding_1h_pct: m.funding_1h_pct,
      next_funding_in_sec: 1800 - (nowSecs() % 1800),
      sparkline: [...m.sparkline], max_leverage: m.max_leverage,
    };
  }

  overview() {
    const markets = [...this.inner.values()].map(MarketEngine.toPublic).sort((a, b) => b.volume_24h - a.volume_24h);
    const total_open_interest = markets.reduce((s, m) => s + m.open_interest, 0);
    const volume_24h_total = markets.reduce((s, m) => s + m.volume_24h, 0);
    const ts = nowSecs();
    return { total_open_interest, volume_24h_total, volume_24h_change_pct: Math.sin(ts / 733) * 16 + Math.cos(ts / 2100) * 4, markets, server_ts: ts };
  }

  detail(id) {
    const m = this.inner.get(id);
    if (!m) return null;
    const qd = quoteDp(m.quote);
    return { ...MarketEngine.toPublic(m), book: MarketEngine.buildBook(m.price, qd), trades: [...m.trades], candles: [...m.candles] };
  }

  static buildBook(mid, quoteDecimals) {
    const step = mid * 0.00015;
    const asks = [], bids = [];
    let cum = 0;
    for (let i = 1; i <= 14; i++) {
      const px = mid + step * i + rnd(0, step * 0.1), sz = rnd(0.05, 4.2);
      cum += sz;
      asks.push({ price: formatPrice(px, quoteDecimals), size: sz.toFixed(4), total: cum.toFixed(4) });
    }
    cum = 0;
    for (let i = 1; i <= 14; i++) {
      const px = mid - step * i - rnd(0, step * 0.1), sz = rnd(0.05, 4.2);
      cum += sz;
      bids.push({ price: formatPrice(px, quoteDecimals), size: sz.toFixed(4), total: cum.toFixed(4) });
    }
    return { asks, bids };
  }
}
