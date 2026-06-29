"use client";

import { useState } from "react";
import {
  SwapShell, TabNav, Card, Label, BigInput, FlipBtn, ConnectBtn, ActionBtn, TokenDropdown,
  useWallet, TOKENS, type Token,
} from "../components/SwapPanel";

export function SwapPage() {
  const { address, openConnectModal } = useWallet();
  const [sellToken, setSellToken] = useState<Token>(TOKENS[0]);
  const [buyToken, setBuyToken]   = useState<Token | null>(null);
  const [sellAmt, setSellAmt]     = useState("");

  function flip() {
    if (!buyToken) return;
    const prev = sellToken;
    setSellToken(buyToken);
    setBuyToken(prev);
  }

  return (
    <SwapShell>
      <TabNav />

      {/* Sell */}
      <Card>
        <Label>Sell</Label>
        <div className="flex items-center justify-between gap-3">
          <BigInput value={sellAmt} onChange={setSellAmt} />
          <TokenDropdown value={sellToken} onChange={setSellToken} exclude={buyToken?.symbol} />
        </div>
        <p className="mt-2 text-sm text-white/35">$0</p>
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
        : <ActionBtn>Swap</ActionBtn>
      }
    </SwapShell>
  );
}
