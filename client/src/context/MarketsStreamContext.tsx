"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { MarketsOverview, WsMessage } from "../types/markets";

type Ctx = {
  overview: MarketsOverview | null;
  connected: boolean;
};

const StreamCtx = createContext<Ctx>({ overview: null, connected: false });

function wsUrlFromLocation(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/markets`;
}

export function MarketsStreamProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<MarketsOverview | null>(null);
  const [connected, setConnected] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      try {
        ws = new WebSocket(wsUrlFromLocation());
      } catch {
        retry = setTimeout(connect, 2000);
        return;
      }

      ws.onopen = () => {
        if (alive.current) setConnected(true);
      };

      ws.onclose = () => {
        if (alive.current) {
          setConnected(false);
          retry = setTimeout(connect, 1500);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as WsMessage;
          if (msg.type === "snapshot" || msg.type === "tick") {
            setOverview(msg.overview);
          }
        } catch {
          /* ignore */
        }
      };
    }

    connect();
    return () => {
      alive.current = false;
      if (retry) clearTimeout(retry);
      ws?.close();
    };
  }, []);

  const value = useMemo(() => ({ overview, connected }), [overview, connected]);
  return <StreamCtx.Provider value={value}>{children}</StreamCtx.Provider>;
}

export function useMarketsStream() {
  return useContext(StreamCtx);
}
