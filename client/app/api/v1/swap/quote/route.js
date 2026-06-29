import { NextResponse } from "next/server";
import { getSwapQuote } from "../../../../../lib/swapQuote.js";
import { appConfig } from "../../../../../lib/config.js";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = {
    amount_in:   searchParams.get("amount_in") ?? "",
    from:        searchParams.get("from") ?? "",
    to:          searchParams.get("to") ?? "",
    path:        searchParams.get("path") ?? undefined,
    recipient:   searchParams.get("recipient") ?? undefined,
    slippage_bps: searchParams.has("slippage_bps") ? Number.parseInt(searchParams.get("slippage_bps"), 10) : undefined,
    deadline:    searchParams.has("deadline") ? Number.parseInt(searchParams.get("deadline"), 10) : undefined,
  };
  const r = await getSwapQuote(appConfig, q);
  if (r.text != null) return new NextResponse(r.text, { status: r.status });
  return NextResponse.json(r.json, { status: r.status });
}
