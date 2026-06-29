import { NextResponse } from "next/server";
import { appConfig } from "../../../../lib/config.js";

export function GET() {
  return NextResponse.json({
    company:             appConfig.company,
    app_name:            appConfig.app_name,
    chain_id:            appConfig.chain_id,
    rpc_url:             appConfig.rpc_url,
    zync_token_address:  appConfig.zync_token_address,
    aurelexa_tagline:    appConfig.aurelexa_tagline,
  });
}
