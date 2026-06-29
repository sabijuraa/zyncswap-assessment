import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
/** @typedef {'buy'|'sell'} SideStr */
/** @typedef {'limit'|'market'} OrderTypeStr */
/** @typedef {'open'|'partially_filled'|'filled'|'cancelled'} OrderStatusStr */

/**
 * @typedef {{
 *   id: string;
 *   market_id: string;
 *   side: SideStr;
 *   order_type: OrderTypeStr;
 *   price: number | null;
 *   size_original: number;
 *   size_remaining: number;
 *   status: OrderStatusStr;
 *   created_at: number;
 * }} OrderRec
 */

/**
 * @typedef {{
 *   id: number;
 *   market_id: string;
 *   price: number;
 *   size: number;
 *   maker_order_id: string;
 *   taker_order_id: string;
 *   taker_side: SideStr;
 *   ts: number;
 * }} StoredTrade
 */

/**
 * @typedef {{
 *   bid_ids: string[];
 *   ask_ids: string[];
 * }} MarketBook
 */

function innerEmpty() {
  return {
    /** @type {Map<string, OrderRec>} */
    orders: new Map(),
    /** @type {Map<string, MarketBook>} */
    books: new Map(),
    /** @type {StoredTrade[]} */
    trades: [],
    next_trade_id: 1,
  };
}

/**
 * @param {import('node:fs').PathLike} filePath
 */
function rebuildInner(p) {
  /** @type {Map<string, OrderRec>} */
  const orders = new Map();
  for (const o of p.orders) {
    orders.set(o.id, o);
  }

  /** @type {Map<string, MarketBook>} */
  const books = new Map();

  for (const o of orders.values()) {
    if (
      (o.status === "open" || o.status === "partially_filled") &&
      o.size_remaining > 1e-12 &&
      o.order_type === "limit"
    ) {
      insertResting(books, o.market_id, o);
    }
  }
  for (const b of books.values()) {
    sortIds(b, orders);
  }

  return {
    orders,
    books,
    trades: p.trades ?? [],
    next_trade_id: Math.max(1, p.next_trade_id ?? 1),
  };
}

/**
 * @param {Map<string, MarketBook>} books
 * @param {string} marketId
 * @param {OrderRec} o
 */
function insertResting(books, marketId, o) {
  const book = books.get(marketId) ?? { bid_ids: [], ask_ids: [] };
  if (o.side === "buy") {
    if (!book.bid_ids.includes(o.id)) book.bid_ids.push(o.id);
  } else {
    if (!book.ask_ids.includes(o.id)) book.ask_ids.push(o.id);
  }
  books.set(marketId, book);
}

/**
 * @param {MarketBook} book
 * @param {Map<string, OrderRec>} orders
 */
function sortIds(book, orders) {
  book.bid_ids.sort((a, b) => {
    const x = orders.get(a);
    const y = orders.get(b);
    if (!x || !y) return 0;
    const px = x.price ?? 0;
    const py = y.price ?? 0;
    const c = py - px;
    if (c !== 0) return c;
    return x.created_at - y.created_at;
  });
  book.ask_ids.sort((a, b) => {
    const x = orders.get(a);
    const y = orders.get(b);
    if (!x || !y) return 0;
    const px = x.price ?? 0;
    const py = y.price ?? 0;
    const c = px - py;
    if (c !== 0) return c;
    return x.created_at - y.created_at;
  });
}

export class MatchingEngine {
  /**
   * @param {string} dataPath
   */
  constructor(dataPath) {
    this.path = path.isAbsolute(dataPath)
      ? dataPath
      : path.join(process.cwd(), dataPath);
    /** @type {ReturnType<typeof innerEmpty>} */
    this.inner = innerEmpty();
    try {
      if (fsSync.existsSync(this.path)) {
        const s = fsSync.readFileSync(this.path, "utf8");
        const p = JSON.parse(s);
        this.inner = rebuildInner(p);
      }
    } catch (e) {
      console.warn(
        "matching persist corrupt, starting empty:",
        e?.message ?? e
      );
      this.inner = innerEmpty();
    }
  }

  async persist() {
    const g = this.inner;
    const file = {
      orders: [...g.orders.values()],
      trades: g.trades,
      next_trade_id: g.next_trade_id,
    };
    const json = JSON.stringify(file, null, 2);
    const dir = path.dirname(this.path);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.path, json, "utf8");
  }

  /**
   * @param {string} marketId
   * @param {SideStr} side
   * @param {'limit'|'market'} orderType
   * @param {number | null} price
   * @param {number} size
   * @param {number} now
   */
  async submit(marketId, side, orderType, price, size, now) {
    if (size <= 0 || !Number.isFinite(size)) {
      throw new MatchError("BAD_REQUEST", "size must be positive");
    }
    if (orderType === "limit") {
      const p = price;
      if (p == null || p <= 0 || !Number.isFinite(p)) {
        throw new MatchError("BAD_REQUEST", "limit order requires price");
      }
    }

    const id = crypto.randomUUID();
    /** @type {OrderRec} */
    let taker = {
      id,
      market_id: marketId,
      side,
      order_type: orderType,
      price,
      size_original: size,
      size_remaining: size,
      status: "open",
      created_at: now,
    };

    /** @type {StoredTrade[]} */
    const newTrades = [];

    if (side === "buy" && orderType === "limit") {
      matchBuyLimit(this.inner, taker, /** @type {number} */ (price), newTrades, now);
    } else if (side === "buy" && orderType === "market") {
      matchBuyMarket(this.inner, taker, newTrades, now);
    } else if (side === "sell" && orderType === "limit") {
      matchSellLimit(this.inner, taker, /** @type {number} */ (price), newTrades, now);
    } else {
      matchSellMarket(this.inner, taker, newTrades, now);
    }

    if (orderType === "market") {
      const had = newTrades.length > 0;
      taker.size_remaining = 0;
      taker.status = had ? "filled" : "cancelled";
    } else if (taker.size_remaining <= 1e-12) {
      taker.size_remaining = 0;
      taker.status = "filled";
    } else {
      taker.status = newTrades.length === 0 ? "open" : "partially_filled";
    }

    this.inner.orders.set(taker.id, { ...taker });

    if (orderType === "limit" && taker.size_remaining > 1e-12) {
      const mid = taker.market_id;
      insertResting(this.inner.books, mid, taker);
      const ordersSnapshot = new Map(this.inner.orders);
      const book = this.inner.books.get(mid);
      if (book) sortIds(book, ordersSnapshot);
    }

    this.inner.trades.push(...newTrades);

    const outOrder = { ...this.inner.orders.get(taker.id) };
    const outTrades = [...newTrades];

    try {
      await this.persist();
    } catch (e) {
      console.error("matching persist failed:", e);
    }

    return { order: /** @type {OrderRec} */ (outOrder), trades: outTrades };
  }

  /**
   * @param {string} id
   */
  async cancel(id) {
    const g = this.inner;
    const o = g.orders.get(id);
    if (!o) throw new MatchError("NOT_FOUND", "not found");
    if (o.status === "filled" || o.status === "cancelled") {
      throw new MatchError("BAD_REQUEST", "order not cancellable");
    }
    if (o.size_remaining <= 1e-12) {
      throw new MatchError("BAD_REQUEST", "order not cancellable");
    }
    o.status = "cancelled";
    o.size_remaining = 0;
    const marketId = o.market_id;
    const book = g.books.get(marketId);
    if (book) {
      book.bid_ids = book.bid_ids.filter((x) => x !== id);
      book.ask_ids = book.ask_ids.filter((x) => x !== id);
    }
    try {
      await this.persist();
    } catch (e) {
      console.error("matching persist failed:", e);
    }
  }

  /**
   * @param {string} marketId
   */
  async restingDepth(marketId) {
    const g = this.inner;
    const book = g.books.get(marketId);
    if (!book) return { bids: [], asks: [] };

    const bidsAcc = new Map();
    for (const oid of book.bid_ids) {
      const o = g.orders.get(oid);
      if (o && o.size_remaining > 1e-12 && o.price != null) {
        const k = Math.floor(o.price * 1_000_000_000_000);
        bidsAcc.set(k, (bidsAcc.get(k) ?? 0) + o.size_remaining);
      }
    }
    let bids = [...bidsAcc.entries()].map(([k, sz]) => [k / 1_000_000_000_000, sz]);
    bids.sort((a, b) => b[0] - a[0]);

    const asksAcc = new Map();
    for (const oid of book.ask_ids) {
      const o = g.orders.get(oid);
      if (o && o.size_remaining > 1e-12 && o.price != null) {
        const k = Math.floor(o.price * 1_000_000_000_000);
        asksAcc.set(k, (asksAcc.get(k) ?? 0) + o.size_remaining);
      }
    }
    let asks = [...asksAcc.entries()].map(([k, sz]) => [k / 1_000_000_000_000, sz]);
    asks.sort((a, b) => a[0] - b[0]);

    return { bids, asks };
  }

  /**
   * @param {string} marketId
   * @param {number} limit
   */
  async recentTrades(marketId, limit) {
    const g = this.inner;
    const out = [];
    for (let i = g.trades.length - 1; i >= 0 && out.length < limit; i--) {
      const t = g.trades[i];
      if (t.market_id === marketId) out.push({ ...t });
    }
    return out;
  }

  /**
   * @param {string | undefined} marketId
   * @param {boolean} openOnly
   */
  async listOrders(marketId, openOnly) {
    const g = this.inner;
    let v = [...g.orders.values()].filter((o) =>
      marketId ? o.market_id === marketId : true
    );
    if (openOnly) {
      v = v.filter(
        (o) =>
          (o.status === "open" || o.status === "partially_filled") &&
          o.size_remaining > 1e-12
      );
    }
    v.sort((a, b) => a.created_at - b.created_at);
    return v;
  }
}

export class MatchError extends Error {
  /**
   * @param {'BAD_REQUEST'|'NOT_FOUND'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * @param {ReturnType<typeof innerEmpty>} g
 * @param {StoredTrade[]} out
 * @param {string} marketId
 * @param {number} price
 * @param {number} size
 * @param {string} makerId
 * @param {string} takerId
 * @param {SideStr} takerSide
 * @param {number} now
 */
function recordTrade(g, out, marketId, price, size, makerId, takerId, takerSide, now) {
  const id = g.next_trade_id++;
  out.push({
    id,
    market_id: marketId,
    price,
    size,
    maker_order_id: makerId,
    taker_order_id: takerId,
    taker_side: takerSide,
    ts: now,
  });
}

/**
 * @param {ReturnType<typeof innerEmpty>} g
 * @param {OrderRec} taker
 * @param {number} limitPx
 * @param {StoredTrade[]} out
 * @param {number} now
 */
function matchBuyLimit(g, taker, limitPx, out, now) {
  const mid = taker.market_id;
  if (!g.books.has(mid)) g.books.set(mid, { bid_ids: [], ask_ids: [] });

  while (taker.size_remaining > 1e-12) {
    const book = g.books.get(mid);
    const oid = book?.ask_ids[0];
    if (!oid) break;

    const maker = g.orders.get(oid);
    const askPx =
      maker && maker.size_remaining > 1e-12 ? maker.price : null;
    if (askPx == null) {
      if (book && book.ask_ids[0] === oid) book.ask_ids.shift();
      continue;
    }
    if (askPx > limitPx) break;

    const tradeSz = Math.min(taker.size_remaining, maker.size_remaining);
    recordTrade(g, out, mid, askPx, tradeSz, oid, taker.id, "buy", now);

    maker.size_remaining -= tradeSz;
    taker.size_remaining -= tradeSz;
    let filled = false;
    if (maker.size_remaining <= 1e-12) {
      maker.size_remaining = 0;
      maker.status = "filled";
      filled = true;
    } else {
      maker.status = "partially_filled";
    }
    if (filled && book && book.ask_ids[0] === oid) book.ask_ids.shift();
  }
}

function matchBuyMarket(g, taker, out, now) {
  const mid = taker.market_id;
  if (!g.books.has(mid)) g.books.set(mid, { bid_ids: [], ask_ids: [] });

  while (taker.size_remaining > 1e-12) {
    const book = g.books.get(mid);
    const oid = book?.ask_ids[0];
    if (!oid) break;

    const maker = g.orders.get(oid);
    const askPx =
      maker && maker.size_remaining > 1e-12 ? maker.price : null;
    if (askPx == null) {
      if (book && book.ask_ids[0] === oid) book.ask_ids.shift();
      continue;
    }

    const tradeSz = Math.min(taker.size_remaining, maker.size_remaining);
    recordTrade(g, out, mid, askPx, tradeSz, oid, taker.id, "buy", now);

    maker.size_remaining -= tradeSz;
    taker.size_remaining -= tradeSz;
    let filled = false;
    if (maker.size_remaining <= 1e-12) {
      maker.size_remaining = 0;
      maker.status = "filled";
      filled = true;
    } else {
      maker.status = "partially_filled";
    }
    if (filled && book && book.ask_ids[0] === oid) book.ask_ids.shift();
  }
}

function matchSellLimit(g, taker, limitPx, out, now) {
  const mid = taker.market_id;
  if (!g.books.has(mid)) g.books.set(mid, { bid_ids: [], ask_ids: [] });

  while (taker.size_remaining > 1e-12) {
    const book = g.books.get(mid);
    const oid = book?.bid_ids[0];
    if (!oid) break;

    const maker = g.orders.get(oid);
    const bidPx =
      maker && maker.size_remaining > 1e-12 ? maker.price : null;
    if (bidPx == null) {
      if (book && book.bid_ids[0] === oid) book.bid_ids.shift();
      continue;
    }
    if (bidPx < limitPx) break;

    const tradeSz = Math.min(taker.size_remaining, maker.size_remaining);
    recordTrade(g, out, mid, bidPx, tradeSz, oid, taker.id, "sell", now);

    maker.size_remaining -= tradeSz;
    taker.size_remaining -= tradeSz;
    let filled = false;
    if (maker.size_remaining <= 1e-12) {
      maker.size_remaining = 0;
      maker.status = "filled";
      filled = true;
    } else {
      maker.status = "partially_filled";
    }
    if (filled && book && book.bid_ids[0] === oid) book.bid_ids.shift();
  }
}

function matchSellMarket(g, taker, out, now) {
  const mid = taker.market_id;
  if (!g.books.has(mid)) g.books.set(mid, { bid_ids: [], ask_ids: [] });

  while (taker.size_remaining > 1e-12) {
    const book = g.books.get(mid);
    const oid = book?.bid_ids[0];
    if (!oid) break;

    const maker = g.orders.get(oid);
    const bidPx =
      maker && maker.size_remaining > 1e-12 ? maker.price : null;
    if (bidPx == null) {
      if (book && book.bid_ids[0] === oid) book.bid_ids.shift();
      continue;
    }

    const tradeSz = Math.min(taker.size_remaining, maker.size_remaining);
    recordTrade(g, out, mid, bidPx, tradeSz, oid, taker.id, "sell", now);

    maker.size_remaining -= tradeSz;
    taker.size_remaining -= tradeSz;
    let filled = false;
    if (maker.size_remaining <= 1e-12) {
      maker.size_remaining = 0;
      maker.status = "filled";
      filled = true;
    } else {
      maker.status = "partially_filled";
    }
    if (filled && book && book.bid_ids[0] === oid) book.bid_ids.shift();
  }
}

/**
 * @param {string} dataPath
 */
export function createMatchingEngine(dataPath) {
  return new MatchingEngine(dataPath);
}
