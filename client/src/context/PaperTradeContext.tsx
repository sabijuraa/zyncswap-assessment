"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const LS_KEY = "zync_paper_v1";

export type PaperPosition = {
  id: string;
  marketId: string;
  pair: string;
  side: "long" | "short";
  sizeBase: number;
  entryPrice: number;
  marginQuote: number;
  openedAt: number;
};

export type PaperOrder = {
  id: string;
  marketId: string;
  pair: string;
  side: "buy" | "sell";
  orderType: "market" | "limit";
  sizeBase: number;
  limitPrice?: number;
  status: "open" | "filled" | "cancelled";
  createdAt: number;
};

function load(): { positions: PaperPosition[]; orders: PaperOrder[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { positions: [], orders: [] };
    const j = JSON.parse(raw) as { positions?: PaperPosition[]; orders?: PaperOrder[] };
    return { positions: j.positions ?? [], orders: j.orders ?? [] };
  } catch {
    return { positions: [], orders: [] };
  }
}

type Ctx = {
  positions: PaperPosition[];
  openOrders: PaperOrder[];
  placeMarket: (args: {
    marketId: string;
    pair: string;
    side: "buy" | "sell";
    sizeBase: number;
    markPrice: number;
  }) => { fillPrice: number; fee: number } | { error: string };
  placeLimit: (args: {
    marketId: string;
    pair: string;
    side: "buy" | "sell";
    sizeBase: number;
    limitPrice: number;
  }) => void;
  cancelOrder: (id: string) => void;
  closePosition: (id: string, markPrice: number) => void;
};

const PaperCtx = createContext<Ctx | null>(null);

export function PaperTradeProvider({ children }: { children: ReactNode }) {
  const [{ positions, orders }, setState] = useState(load);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ positions, orders }));
  }, [positions, orders]);

  const openOrders = useMemo(() => orders.filter((o) => o.status === "open"), [orders]);

  const placeMarket = useCallback(
    (
      args: {
        marketId: string;
        pair: string;
        side: "buy" | "sell";
        sizeBase: number;
        markPrice: number;
      },
    ) => {
      if (!(args.sizeBase > 0) || !Number.isFinite(args.sizeBase)) {
        return { error: "Invalid size" };
      }
      const slip = args.side === "buy" ? 1.00025 : 0.99975;
      const fillPrice = args.markPrice * slip;
      const notional = fillPrice * args.sizeBase;
      const fee = notional * 0.0004;
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `p-${Date.now()}`;
      const posSide: "long" | "short" = args.side === "buy" ? "long" : "short";
      setState((s) => ({
        ...s,
        positions: [
          ...s.positions,
          {
            id,
            marketId: args.marketId,
            pair: args.pair,
            side: posSide,
            sizeBase: args.sizeBase,
            entryPrice: fillPrice,
            marginQuote: notional * 0.1 + fee,
            openedAt: Date.now(),
          },
        ],
      }));
      return { fillPrice, fee };
    },
    [],
  );

  const placeLimit = useCallback(
    (args: {
      marketId: string;
      pair: string;
      side: "buy" | "sell";
      sizeBase: number;
      limitPrice: number;
    }) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `o-${Date.now()}`;
      setState((s) => ({
        ...s,
        orders: [
          ...s.orders,
          {
            id,
            marketId: args.marketId,
            pair: args.pair,
            side: args.side,
            orderType: "limit",
            sizeBase: args.sizeBase,
            limitPrice: args.limitPrice,
            status: "open",
            createdAt: Date.now(),
          },
        ],
      }));
    },
    [],
  );

  const cancelOrder = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, status: "cancelled" as const } : o)),
    }));
  }, []);

  const closePosition = useCallback((id: string, markPrice: number) => {
    setState((s) => ({
      ...s,
      positions: s.positions.filter((p) => p.id !== id),
    }));
    void markPrice;
  }, []);

  const value = useMemo(
    () => ({
      positions,
      openOrders,
      placeMarket,
      placeLimit,
      cancelOrder,
      closePosition,
    }),
    [positions, openOrders, placeMarket, placeLimit, cancelOrder, closePosition],
  );

  return <PaperCtx.Provider value={value}>{children}</PaperCtx.Provider>;
}

export function usePaperTrade() {
  const v = useContext(PaperCtx);
  if (!v) throw new Error("PaperTradeProvider missing");
  return v;
}
