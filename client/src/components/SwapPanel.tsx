// Shared primitives used by all 4 swap pages
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "../wallet/WalletContext";

// ── Color tokens ──────────────────────────────────────────────────────────────
// Primary action:  mint green  #3dffa0 / #00e87a
// Secondary/hover: sky blue    #38bdf8 / #7dd3fc
// Panel bg:        deep navy   #0b1120
// Card bg:         #111827
// Border:          rgba(255,255,255,0.09)
// Text primary:    #ffffff
// Text secondary:  rgba(255,255,255,0.65)
// Text muted:      rgba(255,255,255,0.35)

export const TOKENS = [
  { symbol: "ETH",  name: "Ethereum",  icon: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png" },
  { symbol: "BTC",  name: "Bitcoin",   icon: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png" },
  { symbol: "SOL",  name: "Solana",    icon: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png" },
  { symbol: "USDT", name: "Tether",    icon: "https://assets.coingecko.com/coins/images/325/thumb/Tether.png" },
  { symbol: "USDC", name: "USD Coin",  icon: "https://assets.coingecko.com/coins/images/6319/thumb/usdc.png" },
  { symbol: "ARB",  name: "Arbitrum",  icon: "https://assets.coingecko.com/coins/images/16547/thumb/photo_2023-03-29_21.47.00.jpeg" },
  { symbol: "OP",   name: "Optimism",  icon: "https://assets.coingecko.com/coins/images/25244/thumb/Optimism.png" },
];

export type Token = typeof TOKENS[number];

export function TokenImg({ token, size = 22 }: { token: Token; size?: number }) {
  return (
    <img src={token.icon} alt={token.symbol} width={size} height={size}
      className="rounded-full object-contain shrink-0" style={{ width: size, height: size }} />
  );
}

export function TokenDropdown({ value, onChange, exclude, placeholder = "Select token" }:
  { value: Token | null; onChange: (t: Token) => void; exclude?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const options = TOKENS.filter(t => t.symbol !== exclude);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-all ${
          value
            ? "bg-white/[0.1] text-white hover:bg-white/[0.16] border border-white/[0.15]"
            : "text-[#0b1120] font-bold hover:opacity-90 shadow-lg"
        }`}
        style={!value ? { background: "linear-gradient(135deg, #3dffa0 0%, #38bdf8 100%)", boxShadow: "0 4px 20px rgba(61,255,160,0.35)" } : {}}>
        {value ? <><TokenImg token={value} size={20}/><span>{value.symbol}</span></> : <span>{placeholder}</span>}
        <svg className="h-3.5 w-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/[0.1] shadow-2xl"
          style={{ background: "#111827" }}>
          {options.map(t => (
            <button key={t.symbol} type="button"
              onClick={() => { onChange(t); setOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/[0.07] transition-colors">
              <TokenImg token={t} size={26}/>
              <div>
                <div className="font-semibold text-white">{t.symbol}</div>
                <div className="text-xs text-white/50">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlipBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative z-10 flex justify-center" style={{ marginTop: -14, marginBottom: -14 }}>
      <button type="button" onClick={onClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] text-white/70 hover:text-white transition-all shadow-md"
        style={{ background: "#1a2235" }}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </button>
    </div>
  );
}

export function ConnectBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="mt-3 w-full rounded-2xl py-4 text-base font-bold text-[#0b1120] transition-all hover:opacity-90 shadow-lg"
      style={{ background: "linear-gradient(135deg, #3dffa0 0%, #38bdf8 100%)", boxShadow: "0 4px 24px rgba(61,255,160,0.3)" }}>
      Connect wallet
    </button>
  );
}

export function ActionBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  if (disabled) {
    return (
      <button type="button" disabled
        className="mt-3 w-full rounded-2xl py-4 text-base font-bold text-white/40 cursor-not-allowed border border-white/[0.08]"
        style={{ background: "#1a2235" }}>
        {children}
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick}
      className="mt-3 w-full rounded-2xl py-4 text-base font-bold text-[#0b1120] transition-all hover:opacity-90 shadow-lg"
      style={{ background: "linear-gradient(135deg, #3dffa0 0%, #38bdf8 100%)", boxShadow: "0 4px 24px rgba(61,255,160,0.3)" }}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.09] p-4 ${className}`} style={{ background: "#111827" }}>
      {children}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium text-white/65">{children}</p>;
}

export function BigInput({ value, onChange, placeholder = "0" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} inputMode="decimal"
      className="w-full bg-transparent text-[2.6rem] font-light text-white outline-none placeholder:text-white/25 leading-none" />
  );
}

export function Pill({ label, onClick, active }: { label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border"
      style={active
        ? { background: "rgba(61,255,160,0.15)", borderColor: "rgba(61,255,160,0.4)", color: "#3dffa0" }
        : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
      {label}
    </button>
  );
}

const TABS = [
  { label: "Swap",  path: "/swap" },
  { label: "Limit", path: "/limit" },
  { label: "Buy",   path: "/buy" },
  { label: "Sell",  path: "/sell" },
];

export function TabNav() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex gap-1">
        {TABS.map(t => {
          const active = pathname === t.path;
          return (
            <button key={t.path} type="button" onClick={() => router.push(t.path)}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
              style={active
                ? { background: "rgba(255,255,255,0.13)", color: "#ffffff", boxShadow: "0 0 0 1px rgba(255,255,255,0.2)" }
                : { color: "rgba(255,255,255,0.45)" }}>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SwapShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.12) 0%, rgba(61,255,160,0.06) 40%, transparent 70%)" }}>
      <div className="w-full max-w-[460px] rounded-3xl p-5"
        style={{ background: "#0b1120", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(61,255,160,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

export { useWallet };
