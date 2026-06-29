export type BookLevel = { price: string; size: string; total: string };
export type BookSide = { asks: BookLevel[]; bids: BookLevel[] };
export type TradePrint = { price: string; size: string; side: string; ts: number };
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

export type MarketPublic = {
  id: string;
  pair: string;
  base: string;
  quote: string;
  mark_price: number;
  index_price: number;
  change_24h_pct: number;
  volume_24h: number;
  open_interest: number;
  funding_1h_pct: number;
  next_funding_in_sec: number;
  sparkline: number[];
  max_leverage: number;
};

export type MarketsOverview = {
  total_open_interest: number;
  volume_24h_total: number;
  volume_24h_change_pct: number;
  markets: MarketPublic[];
  server_ts: number;
};

export type MarketDetail = MarketPublic & {
  book: BookSide;
  trades: TradePrint[];
  candles: Candle[];
};

export type WsSnapshot = { type: "snapshot"; overview: MarketsOverview };
export type WsTick = { type: "tick"; overview: MarketsOverview };
export type WsMessage = WsSnapshot | WsTick;
