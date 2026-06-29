import { NextResponse } from "next/server";
import { getMarketEngine } from "../../../../lib/engines.js";

export function GET() {
  return NextResponse.json(getMarketEngine().overview());
}
