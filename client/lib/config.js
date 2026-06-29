const HARDHAT_LOCAL_FIRST_CONTRACT = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function envStr(key, fallback) {
  const v = process.env[key];
  return v != null && v !== "" ? v : fallback;
}
function envU64(key, fallback) {
  const v = process.env[key];
  if (v == null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}
function resolveZyncTokenAddress(chainId, rawEnv) {
  if (rawEnv !== undefined && String(rawEnv).trim() !== "") return String(rawEnv).trim();
  if (chainId === 31337) return HARDHAT_LOCAL_FIRST_CONTRACT;
  return "0x0000000000000000000000000000000000000000";
}

const chainId = envU64("CHAIN_ID", 31337);

export const appConfig = {
  company:              envStr("COMPANY_NAME", "Zync"),
  app_name:             envStr("APP_NAME", "ZYNC"),
  chain_id:             chainId,
  rpc_url:              envStr("RPC_URL", "http://127.0.0.1:8545"),
  zync_token_address:   resolveZyncTokenAddress(chainId, process.env.ZYNC_TOKEN_ADDRESS),
  aurelexa_tagline:     envStr("AURELEXA_TAGLINE", "Pay for AureLexa usage and premium care with ZYNC."),
  premium_min_wei:      envStr("AURELEXA_PREMIUM_MIN_WEI", "").trim() || null,
  swap_router_address:  envStr("SWAP_ROUTER_ADDRESS", ""),
  weth_address:         envStr("WETH_ADDRESS", ""),
  swap_deadline_secs:   envU64("SWAP_DEADLINE_SECS", 600),
};
