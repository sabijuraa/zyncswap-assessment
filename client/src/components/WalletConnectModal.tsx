import { useMemo, useState } from "react";
import { useWallet } from "../wallet/WalletContext";
import { WALLET_CATALOG } from "../wallet/walletCatalog";
import { WalletBrandIcon } from "../wallet/walletBrandIcons";

export function WalletConnectModal() {
  const { connectModalOpen, closeConnectModal, connectWalletId, connectEip6963Provider, eip6963Announced, connectError, connectingId } = useWallet();
  const [q, setQ] = useState("");

  const filteredCatalog = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? WALLET_CATALOG.filter((w) => w.name.toLowerCase().includes(s)) : WALLET_CATALOG;
  }, [q]);

  const filtered6963 = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? eip6963Announced.filter((e) => e.info.name.toLowerCase().includes(s)) : eip6963Announced;
  }, [eip6963Announced, q]);

  if (!connectModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" role="presentation" onClick={closeConnectModal}>
      <div className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0e12] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        style={{ maxHeight: "min(90vh,640px)" }}
        role="dialog" aria-modal="true" aria-labelledby="wc-title"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 id="wc-title" className="m-0 text-base font-semibold tracking-tight">Connect wallet</h2>
          <button type="button" onClick={closeConnectModal} aria-label="Close"
            className="rounded px-2 py-0.5 text-2xl leading-none text-white/45 hover:bg-white/[0.06] hover:text-white">
            ×
          </button>
        </div>

        {/* Search */}
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2">
          <span className="text-white/45">⌕</span>
          <input type="search" placeholder="Search wallets…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" />
        </div>

        {connectError && (
          <div className="mx-5 mt-3 rounded-md bg-red-400/10 px-3 py-2 text-xs text-red-300">{connectError}</div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered6963.length > 0 && (
            <div className="px-5 pt-3">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/45">Detected in browser</p>
              <ul className="m-0 list-none p-0">
                {filtered6963.map((e) => (
                  <li key={e.info.uuid}>
                    <button type="button" disabled={connectingId !== null}
                      onClick={() => void connectEip6963Provider(e)}
                      className="mb-1.5 flex w-full items-center gap-3 rounded-lg border border-transparent bg-white/[0.03] px-3 py-2.5 text-left text-white transition-colors hover:border-[rgba(0,217,192,0.25)] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45">
                      <img src={e.info.icon} alt="" width={32} height={32} className="rounded-lg object-contain" />
                      <span className="text-sm font-medium">{e.info.name}</span>
                      {connectingId === `eip6963:${e.info.uuid}` && <span className="ml-auto text-[#00d9c0] font-bold">…</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="px-5 pt-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-white/45">Popular wallets</p>
            <ul className="m-0 list-none p-0">
              {filteredCatalog.map((w) => {
                const busy = connectingId === w.id;
                return (
                  <li key={w.id}>
                    <button type="button" disabled={connectingId !== null && !busy}
                      onClick={() => void connectWalletId(w.id)}
                      className="mb-1.5 flex w-full items-center gap-3 rounded-lg border border-transparent bg-white/[0.03] px-3 py-2.5 text-left text-white transition-colors hover:border-[rgba(0,217,192,0.25)] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45">
                      <WalletBrandIcon id={w.id} />
                      <span className="text-sm font-medium">{w.name}</span>
                      {busy && <span className="ml-auto text-[#00d9c0] font-bold">…</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="mx-5 mb-4 mt-3 text-center text-[10px] text-white/35">
          By connecting you agree to our{" "}
          <a href="" target="_blank" rel="noreferrer" className="text-[#00d9c0] hover:underline">Terms</a>
          {" "}&amp;{" "}
          <a href="" target="_blank" rel="noreferrer" className="text-[#00d9c0] hover:underline">Privacy</a>
        </p>
      </div>
    </div>
  );
}
