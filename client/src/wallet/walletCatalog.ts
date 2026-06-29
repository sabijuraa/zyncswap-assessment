/** Browser wallet catalog + injected detection (EVM). */

export type WalletId =
  | "metamask"
  | "coinbase"
  | "trust"
  | "rainbow"
  | "phantom"
  | "exodus"
  | "binance"
  | "safepal";

export type WalletRow = {
  id: WalletId;
  name: string;
  /** EIP-6963 reverse-DNS id when known */
  rdns?: string;
  installUrl: string;
};

export const WALLET_CATALOG: WalletRow[] = [
  {
    id: "metamask",
    name: "MetaMask",
    rdns: "io.metamask",
    installUrl: "https://metamask.io/download/",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    rdns: "com.coinbase.wallet",
    installUrl: "https://www.coinbase.com/wallet",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    rdns: "com.trustwallet.app",
    installUrl: "https://trustwallet.com/browser-extension",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    rdns: "me.rainbow",
    installUrl: "https://rainbow.me/download",
  },
  {
    id: "phantom",
    name: "Phantom",
    rdns: "app.phantom",
    installUrl: "https://phantom.app/download",
  },
  {
    id: "exodus",
    name: "Exodus",
    installUrl: "https://www.exodus.com/browser-extension/",
  },
  {
    id: "binance",
    name: "Binance Wallet",
    installUrl: "https://www.binance.com/en/web3wallet",
  },
  {
    id: "safepal",
    name: "SafePal",
    installUrl: "https://www.safepal.com/download",
  },
];

type EthLike = { request?: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

function multiProviders(): EthLike[] {
  const eth = (typeof window !== "undefined" ? (window as unknown as { ethereum?: EthLike & { providers?: EthLike[] } }).ethereum : undefined);
  if (!eth) return [];
  if (Array.isArray(eth.providers) && eth.providers.length > 0) return eth.providers;
  return [eth];
}

export function findMetaMask(): EthLike | undefined {
  return multiProviders().find((p) => (p as { isMetaMask?: boolean }).isMetaMask === true);
}

export function findCoinbase(): EthLike | undefined {
  return multiProviders().find((p) => (p as { isCoinbaseWallet?: boolean }).isCoinbaseWallet === true);
}

export function findTrust(): EthLike | undefined {
  return multiProviders().find((p) => (p as { isTrust?: boolean; isTrustWallet?: boolean }).isTrust === true || (p as { isTrustWallet?: boolean }).isTrustWallet === true);
}

export function findRainbow(): EthLike | undefined {
  return multiProviders().find((p) => (p as { isRainbow?: boolean }).isRainbow === true);
}

export function findPhantomEvm(): EthLike | undefined {
  const w = window as unknown as { phantom?: { ethereum?: EthLike } };
  return w.phantom?.ethereum;
}

export function findExodus(): EthLike | undefined {
  const w = window as unknown as { exodus?: { ethereum?: EthLike } };
  return w.exodus?.ethereum;
}

export function findBinance(): EthLike | undefined {
  return multiProviders().find((p) => (p as { isBinance?: boolean }).isBinance === true);
}

export function findSafePal(): EthLike | undefined {
  return multiProviders().find((p) => (p as { isSafePal?: boolean }).isSafePal === true);
}

export function findInjectedForWalletId(id: WalletId): EthLike | undefined {
  switch (id) {
    case "metamask":
      return findMetaMask();
    case "coinbase":
      return findCoinbase();
    case "trust":
      return findTrust();
    case "rainbow":
      return findRainbow();
    case "phantom":
      return findPhantomEvm();
    case "exodus":
      return findExodus();
    case "binance":
      return findBinance();
    case "safepal":
      return findSafePal();
    default:
      return undefined;
  }
}

export function findByRdns(rdns: string, entries: { info: { rdns: string }; provider: unknown }[]): unknown | undefined {
  const hit = entries.find((e) => e.info.rdns === rdns);
  return hit?.provider;
}
