import { NextResponse } from "next/server";
import { getMarketEngine, getMatchingEngine } from "../../../../lib/engines.js";
import { quoteDp, formatPrice } from "../../../../lib/merge.js";
import { MatchError } from "../../../../lib/matchingEngine.js";

function quoteDecimalsForQuote(quote) {
  switch (quote) {
    case "ETH": return 8;
    case "BTC": return 2;
    default: return 4;
  }
}
function orderToJson(o, decimals) {
  return {
    id: o.id, market_id: o.market_id, side: o.side, order_type: o.order_type,
    price: o.price == null ? null : formatPrice(o.price, decimals),
    size: o.size_original.toFixed(8), size_remaining: o.size_remaining.toFixed(8),
    status: o.status, created_at: o.created_at,
  };
}
function tradeToJson(t, decimals) {
  return {
    id: t.id, price: formatPrice(t.price, decimals), size: t.size.toFixed(8),
    maker_order_id: t.maker_order_id, taker_order_id: t.taker_order_id,
    taker_side: t.taker_side, ts: t.ts,
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get("market_id") ?? undefined;
  const openOnly = searchParams.get("open_only") === "true" || searchParams.get("open_only") === "1";
  const list = await getMatchingEngine().listOrders(marketId, openOnly);
  let decimals = 8;
  if (marketId) {
    const d = getMarketEngine().detail(marketId.trim());
    decimals = d ? quoteDecimalsForQuote(d.quote) : 4;
  }
  return NextResponse.json({ orders: list.map((o) => orderToJson(o, decimals)) });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const sideRaw = String(body.side ?? "").toLowerCase();
  const side = sideRaw === "buy" ? "buy" : sideRaw === "sell" ? "sell" : null;
  if (!side) return new NextResponse("side must be buy or sell", { status: 400 });

  const otRaw = String(body.order_type ?? "").toLowerCase();
  const orderType = otRaw === "limit" ? "limit" : otRaw === "market" ? "market" : null;
  if (!orderType) return new NextResponse("order_type must be limit or market", { status: 400 });

  const size = Number.parseFloat(String(body.size ?? "").trim());
  if (!Number.isFinite(size)) return new NextResponse("invalid size", { status: 400 });

  let price = null;
  if (body.price != null && String(body.price).trim() !== "") {
    price = Number.parseFloat(String(body.price).trim());
    if (!Number.isFinite(price)) return new NextResponse("invalid price", { status: 400 });
  }

  const mid = String(body.market_id ?? "").trim();
  const d = getMarketEngine().detail(mid);
  if (!d) return new NextResponse("unknown market_id", { status: 404 });
  const decimals = quoteDecimalsForQuote(d.quote);
  const now = Math.floor(Date.now() / 1000);

  try {
    const { order, trades } = await getMatchingEngine().submit(mid, side, orderType, price, size, now);
    return NextResponse.json({ order: orderToJson(order, decimals), trades: trades.map((t) => tradeToJson(t, decimals)) });
  } catch (e) {
    if (e instanceof MatchError) {
      return new NextResponse(e.message, { status: e.code === "BAD_REQUEST" ? 400 : 404 });
    }
    throw e;
  }
}
