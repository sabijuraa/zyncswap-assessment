"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { WalletConnectModal } from "../components/WalletConnectModal";
import {
  findByRdns,
  findInjectedForWalletId,
  WALLET_CATALOG,
  type WalletId,
} from "./walletCatalog";

export type Eip6963Announce = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: unknown;
};

type WalletCtx = {
  chain: Chain;
  rpcUrl: string;
  address: `0x${string}` | undefined;
  walletChainId: number | undefined;
  eip1193Provider: unknown | undefined;
  connectorLabel: string | null;
  connectModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  requestConnect: () => void;
  connectWalletId: (id: WalletId) => Promise<void>;
  connectEip6963Provider: (entry: Eip6963Announce) => Promise<void>;
  eip6963Announced: Eip6963Announce[];
  connectError: string | undefined;
  connectingId: string | null;
  disconnect: () => void;
  publicClient: PublicClient;
  walletClient: WalletClient | undefined;
  error: string | undefined;
};

const Ctx = createContext<WalletCtx | null>(null);

async function readChainId(eth: { request: (a: { method: string }) => Promise<unknown> }): Promise<number | undefined> {
  try {
    const hex = (await eth.request({ method: "eth_chainId" })) as string;
    return Number.parseInt(hex, 16);
  } catch {
    return undefined;
  }
}

export function WalletProvider({
  chain,
  rpcUrl,
  children,
}: {
  chain: Chain;
  rpcUrl: string;
  children: ReactNode;
}) {
  const [eip1193Provider, setEip1193Provider] = useState<unknown | undefined>();
  const [connectorLabel, setConnectorLabel] = useState<string | null>(null);
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [walletChainId, setWalletChainId] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [connectError, setConnectError] = useState<string | undefined>();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [eip6963Announced, setEip6963Announced] = useState<Eip6963Announce[]>([]);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain,
        transport: http(rpcUrl),
      }),
    [chain, rpcUrl],
  );

  const walletClient = useMemo(() => {
    if (!eip1193Provider) return undefined;
    try {
      return createWalletClient({
        chain,
        transport: custom(eip1193Provider as Parameters<typeof custom>[0]),
      });
    } catch {
      return undefined;
    }
  }, [chain, eip1193Provider]);

  const refreshAccounts = useCallback(async (provider: unknown) => {
    const eth = provider as { request?: (a: { method: string }) => Promise<unknown> } | undefined;
    if (!eth?.request) {
      setAddress(undefined);
      setWalletChainId(undefined);
      return;
    }
    try {
      const acc = (await eth.request({ method: "eth_accounts" })) as string[];
      setAddress(acc[0] as `0x${string}` | undefined);
      setWalletChainId(await readChainId(eth as { request: (a: { method: string }) => Promise<unknown> }));
    } catch {
      setAddress(undefined);
      setWalletChainId(undefined);
    }
  }, []);

  const eip6963MapRef = useRef(new Map<string, Eip6963Announce>());
  useEffect(() => {
    const onAnn = (ev: Event) => {
      const d = (ev as CustomEvent<Eip6963Announce>).detail;
      if (d?.info?.rdns) eip6963MapRef.current.set(d.info.rdns, d);
      setEip6963Announced(Array.from(eip6963MapRef.current.values()));
    };
    window.addEventListener("eip6963:announceProvider", onAnn as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", onAnn as EventListener);
  }, []);

  useEffect(() => {
    if (!eip1193Provider) return;
    const eth = eip1193Provider as {
      on?: (e: string, h: () => void) => void;
      removeListener?: (e: string, h: () => void) => void;
    };
    const onAccounts = () => void refreshAccounts(eip1193Provider);
    const onChain = () =>
      void readChainId(eth as { request: (a: { method: string }) => Promise<unknown> }).then(setWalletChainId);
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    eth.on?.("disconnect", onAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
      eth.removeListener?.("disconnect", onAccounts);
    };
  }, [eip1193Provider, refreshAccounts]);

  const connectWithInjected = useCallback(
    async (provider: unknown, label: string, busyKey: string) => {
      setConnectError(undefined);
      setError(undefined);
      setConnectingId(busyKey);
      const eth = provider as { request?: (a: { method: string }) => Promise<unknown> };
      if (!eth?.request) {
        setConnectError("Wallet provider not available.");
        setConnectingId(null);
        return;
      }
      try {
        const acc = (await eth.request({ method: "eth_requestAccounts" })) as string[];
        setEip1193Provider(provider);
        setConnectorLabel(label);
        setAddress(acc[0] as `0x${string}` | undefined);
        setWalletChainId(await readChainId(eth as { request: (a: { method: string }) => Promise<unknown> }));
        setConnectModalOpen(false);
      } catch (e) {
        setConnectError(e instanceof Error ? e.message : "Connection failed");
      } finally {
        setConnectingId(null);
      }
    },
    [],
  );

  const connectWalletId = useCallback(
    async (id: WalletId) => {
      const row = WALLET_CATALOG.find((w) => w.id === id);
      const from6963 = row?.rdns ? findByRdns(row.rdns, eip6963Announced) : undefined;
      if (from6963) {
        await connectWithInjected(from6963, row?.name ?? id, id);
        return;
      }
      const injected = findInjectedForWalletId(id);
      if (injected) {
        await connectWithInjected(injected, row?.name ?? id, id);
        return;
      }
      setConnectError(`${row?.name ?? id} not detected. Install the browser extension to connect.`);
      if (row?.installUrl) window.open(row.installUrl, "_blank", "noopener,noreferrer");
    },
    [connectWithInjected, eip6963Announced],
  );

  const connectEip6963Provider = useCallback(
    async (entry: Eip6963Announce) => {
      await connectWithInjected(entry.provider, entry.info.name, `eip6963:${entry.info.uuid}`);
    },
    [connectWithInjected],
  );

  const openConnectModal = useCallback(() => {
    setConnectError(undefined);
    setConnectModalOpen(true);
  }, []);

  const closeConnectModal = useCallback(() => {
    setConnectModalOpen(false);
    setConnectError(undefined);
  }, []);

  const disconnect = useCallback(() => {
    setEip1193Provider(undefined);
    setConnectorLabel(null);
    setAddress(undefined);
    setWalletChainId(undefined);
    setError(undefined);
  }, []);

  const value = useMemo<WalletCtx>(
    () => ({
      chain,
      rpcUrl,
      address,
      walletChainId,
      eip1193Provider,
      connectorLabel,
      connectModalOpen,
      openConnectModal,
      closeConnectModal,
      requestConnect: openConnectModal,
      connectWalletId,
      connectEip6963Provider,
      eip6963Announced,
      connectError,
      connectingId,
      disconnect,
      publicClient,
      walletClient,
      error,
    }),
    [
      chain,
      rpcUrl,
      address,
      walletChainId,
      eip1193Provider,
      connectorLabel,
      connectModalOpen,
      openConnectModal,
      closeConnectModal,
      connectWalletId,
      connectEip6963Provider,
      eip6963Announced,
      connectError,
      connectingId,
      disconnect,
      publicClient,
      walletClient,
      error,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <WalletConnectModal />
    </Ctx.Provider>
  );
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("WalletProvider missing");
  return v;
}
