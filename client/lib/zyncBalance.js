const BALANCE_OF_SELECTOR = "0x70a08231";
const ZYNC_DECIMALS = 18;

import { ethCall } from "./ethCall.js";

function normalizeHexAddr(s) {
  const t = s.trim();
  const hex = t.startsWith("0x") ? t.slice(2) : t;
  if (hex.length !== 40) {
    throw new Error("address must be 20 bytes (40 hex chars)");
  }
  if (![...hex].every((c) => /[0-9a-fA-F]/.test(c))) {
    throw new Error("address contains non-hex characters");
  }
  return `0x${hex.toLowerCase()}`;
}

function balanceOfCalldata(holderHex40) {
  const addr = holderHex40.replace(/^0x/, "");
  return `${BALANCE_OF_SELECTOR}000000000000000000000000${addr.toLowerCase()}`;
}

/**
 * @param {string} s
 */
function parseHexU256Be(s) {
  const t = s.trim();
  const hex = t.startsWith("0x") ? t.slice(2) : t;
  if (!hex || hex === "0") return 0n;
  return BigInt(`0x${hex}`);
}

/**
 * @param {bigint} amount
 * @param {number} decimals
 */
function formatZync(amount, decimals) {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  let fracS = frac.toString();
  while (fracS.length < decimals) fracS = "0" + fracS;
  fracS = fracS.replace(/0+$/, "");
  if (!fracS) return whole.toString();
  return `${whole}.${fracS}`;
}

function tokenIsConfigured(token) {
  const t = token.trim().toLowerCase();
  return t !== "0x0000000000000000000000000000000000000000" && t !== "";
}

/**
 * @param {{ rpc_url: string; zync_token_address: string; premium_min_wei?: string | null }} state
 * @param {string} rawAddress
 * @param {{ min_wei?: string }} q
 */
export async function getZyncBalance(state, rawAddress, q) {
  let address;
  try {
    address = normalizeHexAddr(rawAddress);
  } catch (e) {
    return { status: 400, text: e.message };
  }

  const token = state.zync_token_address.trim();
  const tokenOk = tokenIsConfigured(token);

  const minFromEnv = state.premium_min_wei;
  const effectiveMin = q.min_wei?.trim() || minFromEnv;

  /** @type {Record<string, unknown>} */
  const body = {
    address,
    zync_token_address: token,
    token_configured: tokenOk,
    balance_wei: "0",
    balance_zync: "0",
    decimals: ZYNC_DECIMALS,
  };

  if (effectiveMin) body.minimum_wei = effectiveMin;

  if (!tokenOk) {
    if (effectiveMin) body.meets_minimum = false;
    return { status: 200, json: body };
  }

  const data = balanceOfCalldata(address);
  const res = await ethCall(state.rpc_url, token, data);
  if (!res.ok) {
    body.rpc_error = res.error;
    if (effectiveMin) body.meets_minimum = false;
    return { status: 200, json: body };
  }

  let balance;
  try {
    balance = parseHexU256Be(res.result);
  } catch {
    return { status: 502, text: "invalid balance response from RPC" };
  }

  body.balance_wei = balance.toString();
  body.balance_zync = formatZync(balance, ZYNC_DECIMALS);

  if (effectiveMin) {
    let minB;
    try {
      minB = BigInt(effectiveMin.trim());
    } catch {
      return {
        status: 400,
        text: "min_wei must be a base-10 integer string",
      };
    }
    body.meets_minimum = balance >= minB;
  }

  return { status: 200, json: body };
}
