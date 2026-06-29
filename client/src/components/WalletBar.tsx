import { useWallet } from "../wallet/WalletContext";

export function WalletBar({ expectedChainId }: { expectedChainId: number }) {
  const { address, walletChainId, openConnectModal, disconnect, error, chain, rpcUrl, eip1193Provider, connectorLabel } = useWallet();

  const wrongChain = Boolean(address) && walletChainId !== undefined && walletChainId !== expectedChainId;

  async function switchNetwork() {
    const eth = (eip1193Provider ?? (window as any).ethereum) as { request: (a: unknown) => Promise<unknown> } | undefined;
    if (!eth?.request) return;
    const hexId = `0x${expectedChainId.toString(16)}`;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e: any) {
      if (e?.code === 4902) {
        await eth.request({ method: "wallet_addEthereumChain", params: [{ chainId: hexId, chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: [rpcUrl] }] });
      }
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button type="button" onClick={openConnectModal}
          className="rounded-md bg-gradient-to-r from-[#12b886] to-[#2dd4a3] px-4 py-1.5 text-sm font-semibold text-[#050a0f] transition-[filter] hover:brightness-110">
          Connect wallet
        </button>
        {error && <span className="max-w-[220px] text-[11px] text-red-300">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {wrongChain && (
        <button type="button" onClick={() => void switchNetwork()}
          className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-400/20">
          Switch network
        </button>
      )}
      <span className="font-mono max-w-[140px] overflow-hidden text-ellipsis text-xs text-white/50 sm:max-w-none" title={connectorLabel ? `${connectorLabel} — ${address}` : address}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </span>
      <button type="button" onClick={disconnect}
        className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70 hover:bg-white/[0.08]">
        Disconnect
      </button>
    </div>
  );
}
