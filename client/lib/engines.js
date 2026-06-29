/**
 * Thin accessors for the engine singletons initialised in server.js.
 *
 * API routes import these helpers. Because this file never imports
 * marketEngine.js or matchingEngine.js, Next.js compilation of API
 * routes does NOT trigger the Binance WebSocket connection.
 */

export function getMarketEngine() {
  if (!globalThis._marketEngine) throw new Error("MarketEngine not ready");
  return globalThis._marketEngine;
}

export function getMatchingEngine() {
  if (!globalThis._matchingEngine) throw new Error("MatchingEngine not ready");
  return globalThis._matchingEngine;
}
