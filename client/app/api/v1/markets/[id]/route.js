import { NextResponse } from "next/server";
import { getMarketEngine, getMatchingEngine } from "../../../../../lib/engines.js";
import { mergeBookWithResting, mergeTrades, quoteDp } from "../../../../../lib/merge.js";

export async function GET(_req, { params }) {
  const id = params.id;
  const d = getMarketEngine().detail(id);
  if (!d) return new NextResponse("not found", { status: 404 });

  const qd = quoteDp(d.quote);
  const { bids: rb, asks: ra } = await getMatchingEngine().restingDepth(id);
  d.book = mergeBookWithResting(d.book, rb, ra, qd, 14);
  const mt = await getMatchingEngine().recentTrades(id, 24);
  d.trades = mergeTrades(mt, d.trades, qd, 48);
  return NextResponse.json(d);
}
