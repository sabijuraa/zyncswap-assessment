/**
 * JSON-RPC `eth_call` helper (matches Rust backend timeout + payload shape).
 */
export async function ethCall(rpcUrl, to, data) {
  const body = {
    jsonrpc: "2.0",
    method: "eth_call",
    params: [{ to, data }, "latest"],
    id: 1,
  };

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });

  const v = await res.json().catch(() => ({}));

  if (v.error) {
    return { ok: false, error: JSON.stringify(v.error) };
  }

  const result = v.result;
  if (typeof result !== "string") {
    return { ok: false, error: "missing eth_call result" };
  }

  return { ok: true, result };
}
