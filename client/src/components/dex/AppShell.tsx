"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletBar } from "../WalletBar";
import { useConfig } from "../../context/ConfigContext";
import { MarketTicker } from "./MarketTicker";
import { WalletConnectModal } from "../WalletConnectModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const cfg = useConfig();
  const pathname = usePathname();
  const tradeActive = pathname?.startsWith("/trade") ?? false;

  const navLinks = [
    { href: "/swap", label: "Swap", exact: true },
    { href: "/markets", label: "Markets", exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <div
      className="min-h-screen font-sans text-white/90"
      style={{
        background:
          "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(0,217,192,0.07), transparent 52%), radial-gradient(ellipse 130% 95% at 50% 42%, #0b1217 0%, #050a0f 52%, #020508 100%)",
      }}
    >
      {/* Top nav */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[rgba(11,18,23,0.88)] px-8 backdrop-blur-[10px]"
        style={{ height: "3.25rem" }}
      >
        <div className="flex items-center gap-7">
          <Link href="/" className="text-sm font-bold tracking-widest flex items-center">
            <img src="/logo.png" alt="ZyncSwap logo" className="w-8 h-8 mr-3" />
            <span className="text-[#00d9c0]">ZYNC</span> <span className="text-white/90">SWAP</span>
          </Link>
          <nav className="flex gap-1">
            {navLinks.map(({ href, label, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[rgba(0,217,192,0.15)] text-[#00d9c0]"
                      : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/trade/btc-usdt"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tradeActive
                  ? "bg-[rgba(0,217,192,0.15)] text-[#00d9c0]"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              Trade
            </Link>
            <Link
              href="/docs"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive("/docs", true)
                  ? "bg-[rgba(0,217,192,0.15)] text-[#00d9c0]"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              Docs
            </Link>
          </nav>
        </div>
        <WalletBar expectedChainId={cfg.chain_id} />
      </header>

      {children}
      <MarketTicker />
      <WalletConnectModal />
    </div>
  );
}
