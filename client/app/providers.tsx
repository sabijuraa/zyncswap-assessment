"use client";

import { useEffect, useState } from "react";
import { defineChain } from "viem";
import type { ApiConfig } from "../src/types";
import { ConfigProvider } from "../src/context/ConfigContext";
import { MarketsStreamProvider } from "../src/context/MarketsStreamContext";
import { PaperTradeProvider } from "../src/context/PaperTradeContext";
import { FavoritesProvider } from "../src/context/FavoritesContext";
import { WalletProvider } from "../src/wallet/WalletContext";

function apiBase(): string {
  if (typeof window === "undefined") return "";
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

async function loadConfig(): Promise<ApiConfig> {
  const base = apiBase();
  const url = base ? `${base}/api/v1/config` : "/api/v1/config";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`config ${res.status}`);
  return res.json() as Promise<ApiConfig>;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-white/70">
      <div className="flex flex-col items-center gap-3">
        <div className="spinner" />
        <p className="m-0 text-sm tracking-wide">Loading AureLexa…</p>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [cfg, setCfg] = useState<ApiConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig()
      .then(setCfg)
      .catch(() =>
        setLoadError(
          "Could not load API config. Make sure the server is running (`npm run server:dev`) on port 3001.",
        ),
      );
  }, []);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm rounded-xl border border-white/[0.06] bg-[rgba(12,14,24,0.7)] p-8 text-center backdrop-blur-xl">
          <h2 className="mb-2 text-base font-semibold">Configuration error</h2>
          <p className="m-0 text-sm leading-relaxed text-white/55">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!cfg) return <Loading />;

  const chain = defineChain({
    id: cfg.chain_id,
    name: "Zync network",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [cfg.rpc_url] } },
  });

  return (
    <ConfigProvider value={cfg}>
      <WalletProvider chain={chain} rpcUrl={cfg.rpc_url}>
        <FavoritesProvider>
          <MarketsStreamProvider>
            <PaperTradeProvider>
              {children}
            </PaperTradeProvider>
          </MarketsStreamProvider>
        </FavoritesProvider>
      </WalletProvider>
    </ConfigProvider>
  );
}
