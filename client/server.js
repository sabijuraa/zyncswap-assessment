/**
 * Custom Next.js server — adds WebSocket support for /ws/markets.
 *
 * Engines are initialised HERE, before app.prepare(), and stored on globalThis.
 * API routes read from globalThis directly — they never import marketEngine.js
 * or matchingEngine.js, so no Binance connection fires during compilation.
 */
import { createServer } from "node:http";
import { parse } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import next from "next";

import { MarketEngine } from "./lib/marketEngine.js";
import { createMatchingEngine } from "./lib/matchingEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const matchingPath = path.join(__dirname, "data/matching_state.json");

// ── Initialise singletons on globalThis before Next.js boots ─────────────────
if (!globalThis._marketEngine) {
  globalThis._marketEngine = new MarketEngine();
}
if (!globalThis._matchingEngine) {
  globalThis._matchingEngine = createMatchingEngine(matchingPath);
}

const marketEngine = globalThis._marketEngine;

// ── Boot Next.js ──────────────────────────────────────────────────────────────
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
await app.prepare();

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const httpServer = createServer((req, res) => {
  handle(req, res, parse(req.url, true));
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "snapshot", overview: marketEngine.overview() }));

  const onBroadcast = (json) => {
    if (ws.readyState === ws.OPEN) ws.send(json);
  };
  marketEngine.on("broadcast", onBroadcast);
  ws.on("close", () => marketEngine.off("broadcast", onBroadcast));
  ws.on("error", () => ws.terminate());
});

httpServer.on("upgrade", (req, socket, head) => {
  if (parse(req.url).pathname === "/ws/markets") {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} in use — kill the process using it and retry.`);
    process.exit(1);
  }
  throw err;
});

httpServer.listen(port, () => {
  console.log(`> Ready on http://localhost:${port} (${dev ? "dev" : "production"})`);
  // Connect to Binance only after the server is fully up
  marketEngine.connectBinance();
});
