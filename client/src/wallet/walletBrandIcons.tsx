/**
 * Wallet marks: MetaMask (Wikimedia fox SVG), Binance (Simple Icons), others from project team avatars on GitHub.
 */
import type { WalletId } from "./walletCatalog";

// In Next.js, public assets are always served from "/"
const base = "/";

const WALLET_SRC: Record<WalletId, string> = {
  metamask: `${base}wallets/metamask.svg`,
  coinbase: `${base}wallets/coinbase.png`,
  trust: `${base}wallets/trust.png`,
  rainbow: `${base}wallets/rainbow.png`,
  phantom: `${base}wallets/phantom.png`,
  exodus: `${base}wallets/exodus.png`,
  binance: `${base}wallets/binance.svg`,
  safepal: `${base}wallets/safepal.png`,
};

export function WalletBrandIcon({ id }: { id: WalletId }) {
  return (
    <img
      src={WALLET_SRC[id]}
      alt=""
      width={32}
      height={32}
      className="wc-brand-img"
      loading="lazy"
      decoding="async"
    />
  );
}
