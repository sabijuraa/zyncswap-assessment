import { ethCall } from "./ethCall.js";

const SEL_GET_AMOUNTS_OUT = Uint8Array.from([0xd0, 0x6c, 0xa6, 0x1f]);
const SEL_SWAP_EXACT_ETH_FOR_TOKENS = Uint8Array.from([
  0x7f, 0xf3, 0x6a, 0xb5,
]);
const SEL_SWAP_EXACT_TOKENS_FOR_ETH = Uint8Array.from([
  0x18, 0xcb, 0xaf, 0xe5,
]);
const SEL_SWAP_EXACT_TOKENS_FOR_TOKENS = Uint8Array.from([
  0x38, 0xed, 0x17, 0x39,
]);

function isNativeLabel(s) {
  const t = s.trim().toLowerCase();
  return t === "eth" || t === "native";
}

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

function routerConfigured(addr) {
  const t = addr.trim().toLowerCase();
  return t !== "" && t !== "0x0000000000000000000000000000000000000000";
}

/**
 * @param {string} s
 * @param {string} zyncToken
 */
function parseSwapSide(s, zyncToken) {
  const t = s.trim();
  if (isNativeLabel(t)) return { kind: "native" };
  if (t.toLowerCase() === "zync") {
    if (!routerConfigured(zyncToken)) {
      throw new Error("ZYNC alias requires ZYNC_TOKEN_ADDRESS (non-zero)");
    }
    return { kind: "token", addr: normalizeHexAddr(zyncToken.trim()) };
  }
  return { kind: "token", addr: normalizeHexAddr(t) };
}

function addrWord(addr) {
  const hex = addr.replace(/^0x/, "");
  const w = new Uint8Array(32);
  for (let i = 0; i < 20; i++) {
    w[12 + i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return w;
}

function u256Word(n) {
  const b = bigintToBytesBE(n);
  const w = new Uint8Array(32);
  w.set(b, 32 - b.length);
  return w;
}

function u64Word(v) {
  const w = new Uint8Array(32);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(v), false);
  w.set(new Uint8Array(buf).subarray(0, 8), 24);
  return w;
}

function bigintToBytesBE(n) {
  if (n === 0n) return new Uint8Array(0);
  let hex = n.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function pushWord(buf, word) {
  buf.push(...word);
}

function concatBytes(...parts) {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function encodeGetAmountsOut(amountIn, pathAddrs) {
  const body = [];
  pushWord(body, u256Word(amountIn));
  pushWord(body, u64Word(64));
  pushWord(body, u64Word(pathAddrs.length));
  for (const a of pathAddrs) {
    pushWord(body, addrWord(a));
  }
  return bytesToHex(
    concatBytes(SEL_GET_AMOUNTS_OUT, Uint8Array.from(body))
  );
}

function encodeTokenSwapHead(amountIn, amountOutMin, pathWordOffset, recipient, deadline) {
  const head = [];
  pushWord(head, u256Word(amountIn));
  pushWord(head, u256Word(amountOutMin));
  pushWord(head, u64Word(pathWordOffset));
  pushWord(head, addrWord(recipient));
  pushWord(head, u64Word(deadline));
  return head;
}

function encodePathTail(pathAddrs) {
  const tail = [];
  pushWord(tail, u64Word(pathAddrs.length));
  for (const a of pathAddrs) {
    pushWord(tail, addrWord(a));
  }
  return tail;
}

function encodeSwapExactEthForTokens(amountOutMin, pathAddrs, recipient, deadline) {
  const body = [];
  pushWord(body, u256Word(amountOutMin));
  pushWord(body, u64Word(128));
  pushWord(body, addrWord(recipient));
  pushWord(body, u64Word(deadline));
  body.push(...encodePathTail(pathAddrs));
  return bytesToHex(
    concatBytes(SEL_SWAP_EXACT_ETH_FOR_TOKENS, Uint8Array.from(body))
  );
}

function encodeSwapExactTokensForEth(
  amountIn,
  amountOutMin,
  pathAddrs,
  recipient,
  deadline
) {
  const head = encodeTokenSwapHead(amountIn, amountOutMin, 160, recipient, deadline);
  const body = [...head, ...encodePathTail(pathAddrs)];
  return bytesToHex(
    concatBytes(SEL_SWAP_EXACT_TOKENS_FOR_ETH, Uint8Array.from(body))
  );
}

function encodeSwapExactTokensForTokens(
  amountIn,
  amountOutMin,
  pathAddrs,
  recipient,
  deadline
) {
  const head = encodeTokenSwapHead(amountIn, amountOutMin, 160, recipient, deadline);
  const body = [...head, ...encodePathTail(pathAddrs)];
  return bytesToHex(
    concatBytes(SEL_SWAP_EXACT_TOKENS_FOR_TOKENS, Uint8Array.from(body))
  );
}

function bytesToHex(b) {
  let s = "0x";
  for (let i = 0; i < b.length; i++) {
    s += b[i].toString(16).padStart(2, "0");
  }
  return s;
}

function hexToBytes(s) {
  const t = s.trim().replace(/^0x/i, "");
  if (t.length % 2 !== 0) throw new Error("odd hex length");
  const v = new Uint8Array(t.length / 2);
  for (let i = 0; i < v.length; i++) {
    v[i] = Number.parseInt(t.slice(i * 2, i * 2 + 2), 16);
  }
  return v;
}

function word32BeLowU64(word) {
  const view = new DataView(word.buffer, word.byteOffset, word.byteLength);
  return view.getBigUint64(24, false);
}

function decodeUint256ArrayReturn(ret) {
  if (ret.length < 64) throw new Error("return data too short");
  const off = Number(word32BeLowU64(ret.subarray(0, 32)));
  if (off + 32 > ret.length) throw new Error("bad ABI offset");
  const lenw = ret.subarray(off, off + 32);
  const n = Number(word32BeLowU64(lenw));
  const out = [];
  for (let i = 0; i < n; i++) {
    const start = off + 32 + i * 32;
    const end = start + 32;
    if (end > ret.length) throw new Error("truncated amounts array");
    out.push(bytesBEToBigInt(ret.subarray(start, end)));
  }
  return out;
}

function bytesBEToBigInt(u8) {
  if (u8.length === 0) return 0n;
  let s = "0x";
  for (let i = 0; i < u8.length; i++) {
    s += u8[i].toString(16).padStart(2, "0");
  }
  return BigInt(s);
}

function buildAutoPath(weth, from, to) {
  if (from.kind === "native" && to.kind === "token") {
    return { path: [weth, to.addr], note: null };
  }
  if (from.kind === "token" && to.kind === "native") {
    return { path: [from.addr, weth], note: null };
  }
  if (from.kind === "token" && to.kind === "token") {
    if (from.addr === to.addr) throw new Error("from and to must differ");
    return {
      path: [from.addr, to.addr],
      note: "direct pair; if quote fails, create a pool or pass an explicit multi-hop `path`",
    };
  }
  throw new Error("cannot swap native to native");
}

function parsePathOverride(s) {
  const out = [];
  for (const part of s.split(",")) {
    const p = part.trim();
    if (!p) continue;
    out.push(normalizeHexAddr(p));
  }
  if (out.length < 2) throw new Error("path must contain at least two addresses");
  return out;
}

function applySlippageFloor(amountOut, slippageBps) {
  if (slippageBps >= 10_000) return 0n;
  const num = BigInt(10_000 - slippageBps);
  const den = 10_000n;
  return (amountOut * num) / den;
}

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

/**
 * @param {{
 *   swap_router_address: string;
 *   weth_address: string;
 *   rpc_url: string;
 *   zync_token_address: string;
 *   swap_deadline_secs: number;
 * }} state
 * @param {{
 *   amount_in: string;
 *   from: string;
 *   to: string;
 *   path?: string;
 *   recipient?: string;
 *   slippage_bps?: number;
 *   deadline?: number;
 * }} q
 */
export async function getSwapQuote(state, q) {
  if (
    !routerConfigured(state.swap_router_address) ||
    !routerConfigured(state.weth_address)
  ) {
    return {
      status: 503,
      text:
        "SWAP_ROUTER_ADDRESS and WETH_ADDRESS must be set (non-zero) for swap quotes",
    };
  }

  const router = state.swap_router_address.trim();
  const weth = state.weth_address.trim();

  let amountIn;
  try {
    amountIn = BigInt(q.amount_in.trim());
  } catch {
    return {
      status: 400,
      text: "amount_in must be a base-10 integer string",
    };
  }

  if (amountIn === 0n) {
    return { status: 400, text: "amount_in must be > 0" };
  }
  if (bigintToBytesBE(amountIn).length > 32) {
    return { status: 400, text: "amount_in does not fit uint256" };
  }

  const zt = state.zync_token_address;
  let from;
  let to;
  try {
    from = parseSwapSide(q.from, zt);
    to = parseSwapSide(q.to, zt);
  } catch (e) {
    return { status: 400, text: e.message };
  }

  const userPath = Boolean(q.path?.trim());
  const autoTokenPair =
    !userPath &&
    from.kind === "token" &&
    to.kind === "token";

  const tokenIn = from.kind === "token" ? from.addr : "";
  const tokenOut = to.kind === "token" ? to.addr : "";

  let pathAddrs;
  /** @type {string | null | undefined} */
  let pathNote;

  if (q.path?.trim()) {
    try {
      pathAddrs = parsePathOverride(q.path);
      pathNote = undefined;
    } catch (e) {
      return { status: 400, text: e.message };
    }
  } else {
    try {
      const built = buildAutoPath(weth, from, to);
      pathAddrs = built.path;
      pathNote = built.note ?? undefined;
    } catch (e) {
      return { status: 400, text: e.message };
    }
  }

  let recipient;
  try {
    recipient = q.recipient?.trim()
      ? normalizeHexAddr(q.recipient.trim())
      : "0x0000000000000000000000000000000000000000";
  } catch (e) {
    return { status: 400, text: e.message };
  }

  const deadline =
    q.deadline ?? nowUnix() + state.swap_deadline_secs;
  const slippageBps = q.slippage_bps ?? 100;

  let quoteData = encodeGetAmountsOut(amountIn, pathAddrs);
  let raw = await ethCall(state.rpc_url, router, quoteData);

  if (!raw.ok && autoTokenPair) {
    const path2 = [tokenIn, weth, tokenOut];
    const q2 = encodeGetAmountsOut(amountIn, path2);
    const r2 = await ethCall(state.rpc_url, router, q2);
    if (r2.ok) {
      pathAddrs = path2;
      pathNote = "auto two-hop via WETH (direct pool quote failed)";
      quoteData = q2;
      raw = r2;
    }
  }

  if (!raw.ok) {
    return {
      status: 200,
      json: {
        router,
        weth,
        path: pathAddrs,
        amount_in: amountIn.toString(),
        amount_out: "0",
        amount_out_min: "0",
        deadline,
        swap_kind: "none",
        quote_call: { to: router, data: quoteData },
        swap_call: { to: router, data: "0x" },
        value_wei: "0",
        rpc_error: raw.error,
        path_note: pathNote,
      },
    };
  }

  let retBytes;
  try {
    retBytes = hexToBytes(raw.result);
  } catch (e) {
    return { status: 502, text: e.message };
  }

  let amounts;
  try {
    amounts = decodeUint256ArrayReturn(retBytes);
  } catch (e) {
    return { status: 502, text: e.message };
  }

  const amountOut = amounts[amounts.length - 1];
  if (amountOut === undefined) {
    return { status: 502, text: "empty amounts" };
  }

  const amountOutMin = applySlippageFloor(amountOut, slippageBps);

  let swapKind;
  let swapData;
  let valueWei;

  if (from.kind === "native" && to.kind === "token") {
    swapKind = "swapExactETHForTokens";
    swapData = encodeSwapExactEthForTokens(
      amountOutMin,
      pathAddrs,
      recipient,
      deadline
    );
    valueWei = amountIn.toString();
  } else if (from.kind === "token" && to.kind === "native") {
    swapKind = "swapExactTokensForETH";
    swapData = encodeSwapExactTokensForEth(
      amountIn,
      amountOutMin,
      pathAddrs,
      recipient,
      deadline
    );
    valueWei = "0";
  } else if (from.kind === "token" && to.kind === "token") {
    swapKind = "swapExactTokensForTokens";
    swapData = encodeSwapExactTokensForTokens(
      amountIn,
      amountOutMin,
      pathAddrs,
      recipient,
      deadline
    );
    valueWei = "0";
  } else {
    return { status: 400, text: "invalid swap sides" };
  }

  return {
    status: 200,
    json: {
      router,
      weth,
      path: pathAddrs,
      amount_in: amountIn.toString(),
      amount_out: amountOut.toString(),
      amount_out_min: amountOutMin.toString(),
      deadline,
      swap_kind: swapKind,
      quote_call: { to: router, data: quoteData },
      swap_call: { to: router, data: swapData },
      value_wei: valueWei,
      path_note: pathNote,
    },
  };
}
