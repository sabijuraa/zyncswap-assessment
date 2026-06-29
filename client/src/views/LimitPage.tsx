"use client";

import { useState } from "react";
import {
  SwapShell, TabNav, Card, Label, BigInput, FlipBtn, ConnectBtn, ActionBtn, TokenDropdown, Pill,
  useWallet, TOKENS, type Token,
} from "../components/SwapPanel";

export function LimitPage() {
  const { address, openConnectModal } = useWallet();
  const [sellToken, setSellToken] = useState<Token>(TOKENS[0]);
  const [buyToken, setBuyToken]   = useState<Token | null>(null);
  const [limitPrice, setLimitPrice] = useState("");
  const [sellAmt, setSellAmt]     = useState("");
  const [offset, setOffset]       = useState<"market" | "+1%" | "+5%" | "+10%">("market");

  function flip() {
    if (!buyToken) return;
    const prev = sellToken;
    setSellToken(buyToken);
    setBuyToken(prev);
  }

  return (
    <SwapShell>
      <TabNav />

      {/* Limit price */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <Label>Limit price</Label>
          <button type="button" className="text-white/40 hover:text-white/80 transition-colors">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
          </button>
        </div>
        <BigInput value={limitPrice} onChange={setLimitPrice} />
        <div className="mt-3 flex gap-2">
          {(["market", "+1%", "+5%", "+10%"] as const).map(v => (
            <Pill key={v} label={v === "market" ? "Market" : v} active={offset === v} onClick={() => setOffset(v)} />
          ))}
        </div>
      </Card>

      {/* Sell */}
      <Card className="mt-2">
        <Label>Sell</Label>
        <div className="flex items-center justify-between gap-3">
          <BigInput value={sellAmt} onChange={setSellAmt} />
          <TokenDropdown value={sellToken} onChange={setSellToken} exclude={buyToken?.symbol} />
        </div>
      </Card>

      <FlipBtn onClick={flip} />

      {/* Buy */}
      <Card>
        <Label>Buy</Label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[2.6rem] font-light text-white/20 leading-none">0</span>
          <TokenDropdown value={buyToken} onChange={setBuyToken} exclude={sellToken.symbol} placeholder="Select token" />
        </div>
      </Card>

      {!address
        ? <ConnectBtn onClick={openConnectModal} />
        : buyToken
          ? <ActionBtn>Place limit order</ActionBtn>
          : <ActionBtn disabled>Select supported tokens</ActionBtn>
      }

      {/* Info */}
      <div className="mt-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs text-white/55"
        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
        <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
        <span>
          Only Ethereum mainnet tokens are available for limits.{" "}
          <span className="cursor-pointer hover:underline transition-colors" style={{ color: "#3dffa0" }}>Learn more</span>
        </span>
      </div>
    </SwapShell>
  );
}
