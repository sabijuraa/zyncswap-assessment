"use client";

import { useState } from "react";
import {
  SwapShell, TabNav, Card, ConnectBtn, ActionBtn, TokenDropdown, TokenImg, Pill,
  useWallet, TOKENS, type Token,
} from "../components/SwapPanel";

export function BuyPage() {
  const { address, openConnectModal } = useWallet();
  const [token, setToken] = useState<Token>(TOKENS[0]);
  const [amount, setAmount] = useState("");

  return (
    <SwapShell>
      <TabNav />

      {/* Amount box */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-white/60">You're buying</p>
          <button type="button" className="flex items-center gap-1.5 rounded-full bg-white/[0.07] border border-white/[0.1] px-2.5 py-1.5 text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.1] transition-all">
            <span>🇺🇸</span>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>

        <div className="flex items-baseline justify-center gap-1 py-2 mb-5">
          <span className="text-5xl font-light text-white/40">$</span>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0" inputMode="decimal"
            className="w-36 bg-transparent text-center text-5xl font-light text-white outline-none placeholder:text-white/25" />
        </div>

        <div className="flex justify-center gap-2.5">
          {[100, 300, 1000].map(p => (
            <Pill key={p} label={`$${p}`} onClick={() => setAmount(String(p))} active={amount === String(p)} />
          ))}
        </div>
      </Card>

      {/* Token row */}
      <div className="mt-2 flex items-center justify-between rounded-2xl border px-4 py-3.5"
        style={{ background: "#111827", borderColor: "rgba(255,255,255,0.09)" }}>
        <div className="flex items-center gap-3">
          <TokenImg token={token} size={34} />
          <div>
            <div className="font-semibold text-white">{token.symbol}</div>
            <div className="text-xs text-white/45">{token.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TokenDropdown value={token} onChange={setToken} />
          <svg className="h-4 w-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      {!address
        ? <ConnectBtn onClick={openConnectModal} />
        : <ActionBtn>Buy {token.symbol}</ActionBtn>
      }
    </SwapShell>
  );
}
