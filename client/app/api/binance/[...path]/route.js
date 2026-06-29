import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const qs = url.searchParams.toString();
    const binanceUrl = `https://api.binance.com/api/v3/klines${qs ? `?${qs}` : ""}`;
    const r = await fetch(binanceUrl, { signal: AbortSignal.timeout(10_000) });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ error: "Binance proxy failed" }, { status: 502 });
  }
}
