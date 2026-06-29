import { NextResponse } from "next/server";
import { getZyncBalance } from "../../../../../../lib/zyncBalance.js";
import { appConfig } from "../../../../../../lib/config.js";

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const r = await getZyncBalance(appConfig, params.address, {
    min_wei: searchParams.get("min_wei") ?? undefined,
  });
  if (r.text != null) return new NextResponse(r.text, { status: r.status });
  return NextResponse.json(r.json, { status: r.status });
}
