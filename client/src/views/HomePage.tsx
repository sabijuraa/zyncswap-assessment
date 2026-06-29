"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMarketsStream } from "../context/MarketsStreamContext";
import { TOKEN_ICONS } from "../components/dex/tokenIcons";

// All 35 tradeable tokens with their market IDs and display names
const HERO_TOKENS = [
  { symbol: "BTC",    name: "Bitcoin",       id: "btc-usdt",    change: +2.4  },
  { symbol: "ETH",    name: "Ethereum",      id: "eth-usdt",    change: +1.8  },
  { symbol: "BNB",    name: "BNB",           id: "bnb-usdt",    change: +0.9  },
  { symbol: "SOL",    name: "Solana",        id: "sol-usdt",    change: +5.2  },
  { symbol: "XRP",    name: "XRP",           id: "xrp-usdt",    change: -1.1  },
  { symbol: "AVAX",   name: "Avalanche",     id: "avax-usdt",   change: +3.4  },
  { symbol: "DOGE",   name: "Dogecoin",      id: "doge-usdt",   change: +7.1  },
  { symbol: "ADA",    name: "Cardano",       id: "ada-usdt",    change: -0.6  },
  { symbol: "LINK",   name: "Chainlink",     id: "link-usdt",   change: +4.2  },
  { symbol: "DOT",    name: "Polkadot",      id: "dot-usdt",    change: -2.3  },
  { symbol: "MATIC",  name: "Polygon",       id: "matic-usdt",  change: +1.5  },
  { symbol: "UNI",    name: "Uniswap",       id: "uni-usdt",    change: +2.9  },
  { symbol: "ATOM",   name: "Cosmos",        id: "atom-usdt",   change: -0.8  },
  { symbol: "NEAR",   name: "NEAR Protocol", id: "near-usdt",   change: +6.3  },
  { symbol: "ARB",    name: "Arbitrum",      id: "arb-usdt",    change: +3.1  },
  { symbol: "OP",     name: "Optimism",      id: "op-usdt",     change: +2.7  },
  { symbol: "APT",    name: "Aptos",         id: "apt-usdt",    change: -1.4  },
  { symbol: "LTC",    name: "Litecoin",      id: "ltc-usdt",    change: +0.5  },
  { symbol: "INJ",    name: "Injective",     id: "inj-usdt",    change: +8.4  },
  { symbol: "SUI",    name: "Sui",           id: "sui-usdt",    change: +4.6  },
  { symbol: "TIA",    name: "Celestia",      id: "tia-usdt",    change: -3.2  },
  { symbol: "SEI",    name: "Sei",           id: "sei-usdt",    change: +5.8  },
  { symbol: "WLD",    name: "Worldcoin",     id: "wld-usdt",    change: +1.2  },
  { symbol: "JUP",    name: "Jupiter",       id: "jup-usdt",    change: +9.1  },
  { symbol: "PEPE",   name: "Pepe",          id: "pepe-usdt",   change: +12.3 },
  { symbol: "SHIB",   name: "Shiba Inu",     id: "shib-usdt",   change: -0.4  },
  { symbol: "FET",    name: "Fetch.ai",      id: "fet-usdt",    change: +6.7  },
  { symbol: "RENDER", name: "Render",        id: "render-usdt", change: +4.1  },
  { symbol: "GRT",    name: "The Graph",     id: "grt-usdt",    change: -1.9  },
  { symbol: "LDO",    name: "Lido DAO",      id: "ldo-usdt",    change: +2.2  },
  { symbol: "AAVE",   name: "Aave",          id: "aave-usdt",   change: +3.8  },
  { symbol: "CRV",    name: "Curve",         id: "crv-usdt",    change: -0.7  },
];

// Positions: left%, top%, size(px), float delay(s), float duration(s)
const TOKEN_POSITIONS = [
  { l: 2,  t: 8,  s: 56, d: 0,   dur: 7   },
  { l: 7,  t: 38, s: 48, d: 1.5, dur: 8   },
  { l: 4,  t: 68, s: 44, d: 0.8, dur: 6.5 },
  { l: 11, t: 85, s: 48, d: 2.2, dur: 7.5 },
  { l: 38, t: 55, s: 34, d: 1.0, dur: 9   },
  { l: 15, t: 20, s: 42, d: 3.1, dur: 7   },
  { l: 22, t: 92, s: 30, d: 0.4, dur: 8.5 },
  { l: 86, t: 6,  s: 54, d: 0.7, dur: 7   },
  { l: 91, t: 32, s: 46, d: 2.0, dur: 8   },
  { l: 88, t: 68, s: 40, d: 1.3, dur: 6.5 },
  { l: 94, t: 82, s: 36, d: 0.2, dur: 9   },
  { l: 35, t: 6, s: 44, d: 2.8, dur: 7.5 },
  { l: 76, t: 13, s: 38, d: 1.6, dur: 8   },
  { l: 83, t: 90, s: 32, d: 3.4, dur: 7   },
  { l: 72, t: 72, s: 36, d: 0.6, dur: 8.5 },
  { l: 3,  t: 52, s: 32, d: 2.5, dur: 6   },
  { l: 9,  t: 15, s: 36, d: 1.9, dur: 7.5 },
  { l: 20, t: 35, s: 28, d: 0.3, dur: 9   },
  { l: 48, t: 35, s: 70, d: 1.1, dur: 7   },
  { l: 68, t: 88, s: 48, d: 2.7, dur: 8   },
  { l: 25, t: 75, s: 36, d: 3.8, dur: 6.5 },
  { l: 50, t: 55, s: 32, d: 0.9, dur: 7.5 },
  { l: 55, t: 25, s: 48, d: 2.3, dur: 8   },
  { l: 60, t: 78, s: 46, d: 1.7, dur: 9   },
  { l: 55, t: 10, s: 30, d: 3.2, dur: 7   },
  { l: 50, t: 88, s: 44, d: 0.5, dur: 8.5 },
  { l: 45, t: 65, s: 48, d: 2.1, dur: 6   },
  { l: 40, t: 20, s: 46, d: 1.4, dur: 7.5 },
  { l: 35, t: 45, s: 44, d: 3.6, dur: 8   },
  { l: 30, t: 82, s: 42, d: 0.7, dur: 9   },
  { l: 96, t: 50, s: 46, d: 2.9, dur: 7   },
  { l: 13, t: 5,  s: 30, d: 1.8, dur: 8   },
];

// ── Floating token component ──────────────────────────────────────────────────
type HeroToken = typeof HERO_TOKENS[number];
type TokenPos  = typeof TOKEN_POSITIONS[number];

function FloatingToken({ tk, pos, liveChange, onClick }: {
  tk: HeroToken; pos: TokenPos; liveChange?: number; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const change = liveChange ?? tk.change;
  const pos24 = change >= 0;

  // Tooltip placement: flip to left side if token is on the right half
  const tooltipLeft = pos.l > 55;

  return (
    <div
      className="absolute hidden lg:block"
      style={{
        left: `${pos.l}%`,
        top: `${pos.t}%`,
        animation: `floatY ${pos.dur}s ease-in-out ${pos.d}s infinite`,
        zIndex: hovered ? 20 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Token icon button */}
      <button
        type="button"
        onClick={onClick}
        className="relative block rounded-full transition-all duration-300"
        style={{
          width: pos.s, height: pos.s,
          opacity: hovered ? 1 : 0.22,
          transform: hovered ? "scale(1.25)" : "scale(1)",
          filter: hovered
            ? `drop-shadow(0 0 16px ${pos24 ? "rgba(61,255,160,0.7)" : "rgba(239,83,80,0.7)"})`
            : "drop-shadow(0 0 8px rgba(61,255,160,0.3))",
        }}>
        <img
          src={TOKEN_ICONS[tk.symbol]}
          alt={tk.symbol}
          width={pos.s} height={pos.s}
          className="rounded-full object-contain w-full h-full"
        />
        {/* Glow ring on hover */}
        {hovered && (
          <span className="absolute inset-0 rounded-full animate-ping"
            style={{ border: `2px solid ${pos24 ? "#3dffa0" : "#ef5350"}`, opacity: 0.5 }} />
        )}
      </button>

      {/* Tooltip card */}
      {hovered && (
        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            [tooltipLeft ? "right" : "left"]: pos.s + 10,
            animation: "fadeSlideIn 0.18s ease forwards",
            minWidth: 140,
          }}>
          <div className="rounded-xl px-3 py-2.5 text-left shadow-2xl"
            style={{
              background: "rgba(10,16,30,0.96)",
              border: `1px solid ${pos24 ? "rgba(61,255,160,0.3)" : "rgba(239,83,80,0.3)"}`,
              backdropFilter: "blur(12px)",
            }}>
            <div className="flex items-center gap-2 mb-1">
              <img src={TOKEN_ICONS[tk.symbol]} alt={tk.symbol} className="h-5 w-5 rounded-full" />
              <span className="font-bold text-white text-sm">{tk.symbol}</span>
            </div>
            <div className="text-xs text-white/50 mb-1.5">{tk.name}</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold"
                style={{ color: pos24 ? "#3dffa0" : "#ef5350" }}>
                {pos24 ? "+" : ""}{change.toFixed(2)}%
              </span>
              <span className="text-[10px] text-white/35">24h</span>
            </div>
            <div className="mt-1.5 text-[10px] font-medium"
              style={{ color: pos24 ? "rgba(61,255,160,0.7)" : "rgba(239,83,80,0.7)" }}>
              Click to trade →
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-1/2 -translate-y-1/2"
            style={{
              [tooltipLeft ? "right" : "left"]: -5,
              width: 0, height: 0,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              [tooltipLeft ? "borderLeft" : "borderRight"]: `5px solid ${pos24 ? "rgba(61,255,160,0.3)" : "rgba(239,83,80,0.3)"}`,
            }} />
        </div>
      )}
    </div>
  );
}

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n < 0.01) return n.toFixed(6);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target || started.current) return;
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { val, ref };
}

function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    el.style.transition = `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`;
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return ref;
}

// ── Sub-components (each calls hooks at top level) ────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.07] last:border-0">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="text-base font-medium text-white/90">{q}</span>
        <span className="shrink-0 text-white/40 transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0)" }}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </span>
      </button>
      <div style={{ maxHeight: open ? "300px" : "0", overflow: "hidden", transition: "max-height 0.4s ease" }}>
        <p className="pb-5 text-sm leading-relaxed text-white/55">{a}</p>
      </div>
    </div>
  );
}


type MarketRow = { id: string; base: string; quote: string; mark_price: number; change_24h_pct: number; max_leverage: number };
const BASE_IMG: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png",
  DOGE:"https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/thumb/photo_2023-03-29_21.47.00.jpeg",
  OP:  "https://assets.coingecko.com/coins/images/25244/thumb/Optimism.png",
};

function MarketCard({ m, delay, onClick }: { m: MarketRow; delay: number; onClick: () => void }) {
  const ref = useFadeIn(delay);
  const pos = m.change_24h_pct >= 0;
  return (
    <div ref={ref}>
      <button type="button" onClick={onClick}
        className="group flex w-full items-center justify-between rounded-2xl p-4 text-left transition-all hover:border-white/[0.15]"
        style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-3">
          <img src={BASE_IMG[m.base] ?? BASE_IMG.ETH} alt={m.base} className="h-9 w-9 rounded-full" />
          <div>
            <div className="font-semibold text-white">{m.base}<span className="text-white/40">/{m.quote}</span></div>
            <div className="text-xs text-white/40">Max {m.max_leverage}× leverage</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono font-semibold text-white">{fmtPrice(m.mark_price)}</div>
          <div className={`text-xs font-medium ${pos ? "text-[#3dffa0]" : "text-red-400"}`}>
            {pos ? "+" : ""}{m.change_24h_pct.toFixed(2)}%
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Mini swap widget ──────────────────────────────────────────────────────────
const SWAP_TOKENS = [
  { symbol: "ETH",  img: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png" },
  { symbol: "BTC",  img: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png" },
  { symbol: "SOL",  img: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png" },
  { symbol: "USDT", img: "https://assets.coingecko.com/coins/images/325/thumb/Tether.png" },
];

function MiniSwapWidget() {
  const router = useRouter();
  const [from, setFrom] = useState(SWAP_TOKENS[0]);
  const [to, setTo]     = useState(SWAP_TOKENS[3]);
  const [amt, setAmt]   = useState("");

  function flip() { const t = from; setFrom(to); setTo(t); }

  return (
    <div className="w-full rounded-3xl p-5"
      style={{ background: "rgba(11,17,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Quick Swap</span>
        <svg className="h-4 w-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
        </svg>
      </div>
      <div className="rounded-2xl p-4 mb-1" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}>
        <p className="mb-2 text-xs text-white/50">You pay</p>
        <div className="flex items-center gap-3">
          <input value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.0" inputMode="decimal"
            className="w-full bg-transparent text-3xl font-light text-white outline-none placeholder:text-white/20" />
          <button type="button" onClick={flip}
            className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <img src={from.img} alt={from.symbol} className="h-5 w-5 rounded-full" />
            {from.symbol}
            <svg className="h-3 w-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <div className="relative z-10 flex justify-center" style={{ marginTop: -10, marginBottom: -10 }}>
        <button type="button" onClick={flip}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:text-white transition-all"
          style={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)" }}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </button>
      </div>
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="mb-2 text-xs text-white/50">You receive</p>
        <div className="flex items-center gap-3">
          <span className="w-full text-3xl font-light text-white/25">0.0</span>
          <button type="button"
            className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-[#0b1120]"
            style={{ background: "linear-gradient(135deg,#3dffa0,#38bdf8)", boxShadow: "0 4px 16px rgba(61,255,160,0.3)" }}>
            <img src={to.img} alt={to.symbol} className="h-5 w-5 rounded-full" />
            {to.symbol}
            <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      </div>
      <button type="button" onClick={() => router.push("/swap")}
        className="w-full rounded-2xl py-3.5 text-base font-bold text-[#060c18] transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#3dffa0,#38bdf8)", boxShadow: "0 4px 24px rgba(61,255,160,0.3)" }}>
        Get Started
      </button>
    </div>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────
// Next Level Tools bento illustrations
function IllustrationFastExecution() {
  return (
    <svg className="mt-4 w-full rounded-xl" viewBox="0 0 340 130" style={{ background: "#0a0f1a" }}>
      <defs>
        {/* two separate paths: left connector and right connector */}
        <path id="fe-path-l" d="M88,52 L118,52" />
        <path id="fe-path-r" d="M222,52 L252,52" />
      </defs>

      {/* ── dashed connecting lines ── */}
      <line x1="88" y1="52" x2="118" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4,3" />
      <line x1="222" y1="52" x2="252" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4,3" />

      {/* ── Block N-1 (dimmed, dashed border) ── */}
      <rect x="18" y="22" width="70" height="60" rx="8"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
      <text x="53" y="46" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">Block</text>
      <text x="53" y="64" textAnchor="middle" fontSize="16" fontWeight="800" fill="rgba(255,255,255,0.3)">N-1</text>

      {/* ── Block N (active, green border with pulse) ── */}
      <rect x="118" y="10" width="104" height="84" rx="10"
        fill="rgba(61,255,160,0.06)" stroke="#3dffa0" strokeWidth="2">
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
      </rect>
      {/* glow ring pulse */}
      <rect x="114" y="6" width="112" height="92" rx="13"
        fill="none" stroke="rgba(61,255,160,0.25)" strokeWidth="3">
        <animate attributeName="stroke-width" values="3;8;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
      </rect>
      <text x="170" y="32" textAnchor="middle" fontSize="10" fontWeight="600" fill="rgba(255,255,255,0.7)">Block N</text>
      {/* ZYNC TX inner box */}
      <rect x="130" y="38" width="80" height="30" rx="6" fill="rgba(61,255,160,0.15)" stroke="rgba(61,255,160,0.5)" strokeWidth="1" />
      <text x="170" y="58" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3dffa0">ZYNC TX</text>
      {/* <50ms label */}
      <text x="170" y="108" textAnchor="middle" fontSize="10" fontWeight="600" fill="#3dffa0">&lt;50ms</text>

      {/* ── Block N+1 (dimmed, dashed border) ── */}
      <rect x="252" y="22" width="70" height="60" rx="8"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="4,3" />
      <text x="287" y="46" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">Block</text>
      <text x="287" y="64" textAnchor="middle" fontSize="16" fontWeight="800" fill="rgba(255,255,255,0.3)">N+1</text>
      {/* Others red box below N+1 */}
      <rect x="258" y="88" width="58" height="20" rx="5" fill="rgba(239,83,80,0.15)" stroke="rgba(239,83,80,0.4)" strokeWidth="1" />
      <text x="287" y="102" textAnchor="middle" fontSize="9" fill="#ef5350">Others</text>
      <text x="287" y="120" textAnchor="middle" fontSize="8" fill="rgba(239,83,80,0.6)">~400ms wait</text>

      {/* ── animated dot on left connector (N-1 → Block N) ── */}
      <circle r="4" fill="#3dffa0" opacity="0.9">
        <animateMotion dur="2.4s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#fe-path-l" />
        </animateMotion>
      </circle>
      <circle r="7" fill="none" stroke="rgba(61,255,160,0.3)" strokeWidth="2">
        <animateMotion dur="2.4s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#fe-path-l" />
        </animateMotion>
      </circle>
      {/* ── animated dot on right connector (Block N → N+1) ── */}
      <circle r="4" fill="#3dffa0" opacity="0.9">
        <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#fe-path-r" />
        </animateMotion>
      </circle>
      <circle r="7" fill="none" stroke="rgba(61,255,160,0.3)" strokeWidth="2">
        <animateMotion dur="2.4s" begin="1.2s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#fe-path-r" />
        </animateMotion>
      </circle>
    </svg>
  );
}

function IllustrationSmartRouting() {
  // Routes: top=Raydium(best/green), mid=PumpFun, bot=Orca
  // SVG coords: token circle at (52,110), exchange boxes ~(160,y), BUY circle at (285,70)
  // Paths from token → box → BUY (only best route continues to BUY)
  const routes = [
    { id: "r0", label: "Raydium", price: "$0.0138", cy: 70,  best: true  },
    { id: "r1", label: "PumpFun", price: "$0.0141", cy: 110, best: false },
    { id: "r2", label: "Orca",    price: "$0.0142", cy: 150, best: false },
  ];
  return (
    <svg className="mt-4 w-full rounded-xl" viewBox="0 0 340 200" style={{ background: "#0a0f1a" }}>
      {/* ── define paths for animateMotion ── */}
      <defs>
        {/* token → each exchange box */}
        <path id="sr-p0" d="M72,110 C110,110 130,70 158,70" />
        <path id="sr-p1" d="M72,110 C110,110 130,110 158,110" />
        <path id="sr-p2" d="M72,110 C110,110 130,150 158,150" />
        {/* best box → BUY */}
        <path id="sr-buy" d="M222,70 C248,70 262,70 268,70" />
      </defs>

      {/* ── route lines ── */}
      {routes.map((r) => (
        <path
          key={r.id + "-line"}
          d={r.id === "r0" ? "M72,110 C110,110 130,70 158,70"
           : r.id === "r1" ? "M72,110 C110,110 130,110 158,110"
           : "M72,110 C110,110 130,150 158,150"}
          fill="none"
          stroke={r.best ? "#3dffa0" : "rgba(255,255,255,0.18)"}
          strokeWidth={r.best ? 2 : 1.5}
        />
      ))}

      {/* best route → BUY arrow line */}
      <path d="M222,70 L268,70" fill="none" stroke="#3dffa0" strokeWidth="2" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3dffa0" />
        </marker>
      </defs>

      {/* ── token circle (left) with frog icon ── */}
      <circle cx="52" cy="110" r="32" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" />
      <text x="52" y="118" textAnchor="middle" fontSize="28">🐸</text>

      {/* ── exchange boxes ── */}
      {routes.map((r) => (
        <g key={r.id + "-box"}>
          <rect x="158" y={r.cy - 18} width="64" height="36" rx="7"
            fill={r.best ? "rgba(61,255,160,0.08)" : "rgba(255,255,255,0.04)"}
            stroke={r.best ? "rgba(61,255,160,0.6)" : "rgba(255,255,255,0.12)"}
            strokeWidth={r.best ? 1.5 : 1}
          />
          <text x="190" y={r.cy - 4} textAnchor="middle" fontSize="9"
            fill={r.best ? "#3dffa0" : "rgba(255,255,255,0.4)"} fontWeight="600">{r.label}</text>
          <text x="190" y={r.cy + 9} textAnchor="middle" fontSize="10"
            fill={r.best ? "#fff" : "rgba(255,255,255,0.3)"} fontWeight="700">{r.price}</text>
        </g>
      ))}

      {/* ── BUY circle (right) ── */}
      <circle cx="285" cy="70" r="22" fill="rgba(61,255,160,0.15)" stroke="#3dffa0" strokeWidth="2" />
      <text x="285" y="75" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3dffa0">BUY</text>

      {/* ── animated dots: one per route, staggered ── */}
      {routes.map((r, i) => (
        <circle key={r.id + "-dot"} r="4"
          fill={r.best ? "#3dffa0" : "rgba(255,255,255,0.5)"}
          opacity="0.9">
          <animateMotion dur="2s" begin={`${i * 0.55}s`} repeatCount="indefinite">
            <mpath href={`#sr-p${i}`} />
          </animateMotion>
        </circle>
      ))}
      {/* animated dot on best route → BUY */}
      <circle r="4" fill="#3dffa0" opacity="0.9">
        <animateMotion dur="1.2s" begin="0.9s" repeatCount="indefinite">
          <mpath href="#sr-buy" />
        </animateMotion>
      </circle>
    </svg>
  );
}

function IllustrationVolatilityBot() {
  const pts = "0,130 50,55 90,120 140,35 175,115 215,50 255,125 295,45 340,100";
  const polyPts = pts + " 340,160 0,160";

  const peaks   = [ { x: 50,  y: 55  }, { x: 140, y: 35  }, { x: 215, y: 50  }, { x: 295, y: 45  } ];
  const troughs = [ { x: 0,   y: 130 }, { x: 90,  y: 120 }, { x: 175, y: 115 }, { x: 255, y: 125 } ];
  const sellLabels = [peaks[1], peaks[3]];
  const buyLabels  = [troughs[1], troughs[2]];

  return (
    <svg className="mt-4 w-full rounded-xl" viewBox="0 0 340 160" style={{ background: "#0a0f1a" }}>
      <defs>
        <linearGradient id="vbot-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.45)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0.02)" />
        </linearGradient>
        <path id="vbot-path" d={`M${pts.split(' ').join(' L')}`} />
      </defs>

      {/* filled area */}
      <polygon points={polyPts} fill="url(#vbot-fill)" />
      {/* zigzag line */}
      <polyline points={pts} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />

      {/* peak dots (red/SELL) */}
      {peaks.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="#ef5350" />
      ))}
      {/* trough dots (green/BUY) */}
      {troughs.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="#3dffa0" />
      ))}

      {/* SELL labels */}
      {sellLabels.map((p, i) => (
        <text key={i} x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#ef5350">SELL</text>
      ))}
      {/* BUY labels */}
      {buyLabels.map((p, i) => (
        <text key={i} x={p.x} y={p.y + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill="#3dffa0">BUY</text>
      ))}

      {/* ── animated dot traveling the zigzag ── */}
      <circle r="5" fill="#fff" opacity="0.95">
        <animateMotion dur="4s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#vbot-path" />
        </animateMotion>
      </circle>
      {/* glow ring */}
      <circle r="9" fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth="2">
        <animateMotion dur="4s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#vbot-path" />
        </animateMotion>
      </circle>
    </svg>
  );
}

function IllustrationCopyTrading() {
  // Box centers: left box center x=64, y=70; right box center x=276, y=70
  // COPY badge center x=170, y=70
  // Connector lines: left box right edge x=118 → COPY left edge x=138; COPY right edge x=202 → right box left edge x=222
  return (
    <svg className="mt-4 w-full rounded-xl" viewBox="0 0 340 140" style={{ background: "#0a0f1a" }}>
      <defs>
        <marker id="ct-arr-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3dffa0" />
        </marker>
        <marker id="ct-arr-l" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
          <path d="M6,0 L0,3 L6,6 Z" fill="#3dffa0" />
        </marker>
      </defs>

      {/* ── Left box: Wallet 1 (blue border) ── */}
      <rect x="10" y="15" width="108" height="110" rx="12"
        fill="rgba(56,189,248,0.06)" stroke="#38bdf8" strokeWidth="1.5" />
      <text x="64" y="40" textAnchor="middle" fontSize="11" fontWeight="600" fill="#38bdf8">Wallet 1</text>
      <text x="64" y="58" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3dffa0">BUY</text>
      <circle cx="46" cy="97" r="16" fill="rgba(61,255,160,0.15)" stroke="rgba(61,255,160,0.4)" strokeWidth="1" />
      <text x="46" y="102" textAnchor="middle" fontSize="14">🐸</text>
      <text x="82" y="102" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">1 ETH</text>

      {/* ── connector line left box → COPY (both at y=70) ── */}
      <line x1="118" y1="70" x2="136" y2="70" stroke="#3dffa0" strokeWidth="1.5" markerEnd="url(#ct-arr-r)" />

      {/* ── COPY badge (blinking) ── */}
      <rect x="138" y="56" width="64" height="28" rx="14"
        fill="rgba(61,255,160,0.12)" stroke="#3dffa0" strokeWidth="1.5">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
      </rect>
      <text x="170" y="75" textAnchor="middle" fontSize="11" fontWeight="800" fill="#3dffa0">
        COPY
        <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
      </text>

      {/* ── connector line COPY → right box (both at y=70) ── */}
      <line x1="204" y1="70" x2="220" y2="70" stroke="#3dffa0" strokeWidth="1.5" markerEnd="url(#ct-arr-r)" />

      {/* ── Right box: Your Wallet (green border) ── */}
      <rect x="222" y="15" width="108" height="110" rx="12"
        fill="rgba(61,255,160,0.06)" stroke="#3dffa0" strokeWidth="1.5" />
      <text x="276" y="40" textAnchor="middle" fontSize="11" fontWeight="600" fill="#3dffa0">Your Wallet</text>
      <text x="276" y="58" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3dffa0">BUY</text>
      <circle cx="258" cy="97" r="16" fill="rgba(61,255,160,0.15)" stroke="rgba(61,255,160,0.4)" strokeWidth="1" />
      <text x="258" y="102" textAnchor="middle" fontSize="14">🐸</text>
      <text x="294" y="102" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">0.1 ETH</text>
    </svg>
  );
}

function IllustrationAIResearch() {
  const tokens = [
    { sym: "BONK",  price: "$0.000018", mc: "MC: $1.2B", vol: "24h vol: $89M",  emoji: "🟡" },
    { sym: "FLOKI", price: "$0.00012",  mc: "MC: $1.1B", vol: "24h vol: $210M", emoji: "🐕" },
    { sym: "WOJAK", price: "$0.014",    mc: "MC: $14M",  vol: "24h vol: $2.1M", emoji: "⚪" },
  ];
  // SVG layout: AI circle at (52, 100), rows at y=40,100,160, boxes start x=110
  const rowY = [42, 100, 158];
  return (
    <svg className="mt-4 w-full rounded-xl" viewBox="0 0 340 200" style={{ background: "#0a0f1a" }}>
      <defs>
        <path id="ai-p0" d="M80,100 C95,100 95,42 110,42" />
        <path id="ai-p1" d="M80,100 L110,100" />
        <path id="ai-p2" d="M80,100 C95,100 95,158 110,158" />
        {/* glow filter for AI circle */}
        <filter id="ai-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── connecting lines ── */}
      {["M80,100 C95,100 95,42 110,42", "M80,100 L110,100", "M80,100 C95,100 95,158 110,158"].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" />
      ))}

      {/* ── AI radar circle ── */}
      <circle cx="52" cy="100" r="28" fill="rgba(56,189,248,0.1)" stroke="#38bdf8" strokeWidth="2" filter="url(#ai-glow)" />
      {/* radar cross */}
      <line x1="52" y1="76" x2="52" y2="124" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
      <line x1="28" y1="100" x2="76" y2="100" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
      <circle cx="52" cy="100" r="14" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.5" />
      <circle cx="52" cy="100" r="6" fill="rgba(56,189,248,0.4)" stroke="#38bdf8" strokeWidth="1" />
      {/* radar sweep dot */}
      <circle cx="62" cy="90" r="3" fill="#38bdf8" opacity="0.8" />

      {/* ── token rows ── */}
      {tokens.map((t, i) => (
        <g key={t.sym}>
          <rect x="110" y={rowY[i] - 22} width="220" height="44" rx="8"
            fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.35)" strokeWidth="1.2" />
          {/* token icon circle */}
          <circle cx="128" cy={rowY[i]} r="14" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.3)" strokeWidth="1" />
          <text x="128" y={rowY[i] + 5} textAnchor="middle" fontSize="13">{t.emoji}</text>
          {/* name + price */}
          <text x="148" y={rowY[i] - 4} fontSize="11" fontWeight="800" fill="white">{t.sym}</text>
          <text x="148" y={rowY[i] + 10} fontSize="9" fill="rgba(255,255,255,0.4)">{t.price}</text>
          {/* MC + vol */}
          <text x="322" y={rowY[i] - 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.5)">{t.mc}</text>
          <text x="322" y={rowY[i] + 10} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)">{t.vol}</text>
        </g>
      ))}

      {/* ── animated dots along each route ── */}
      {(["#ai-p0","#ai-p1","#ai-p2"] as const).map((href, i) => (
        <circle key={i} r="3.5" fill="#38bdf8" opacity="0.9">
          <animateMotion dur="1.6s" begin={`${i * 0.45}s`} repeatCount="indefinite">
            <mpath href={href} />
          </animateMotion>
        </circle>
      ))}
    </svg>
  );
}


const FAQS = [
  { q: "What is ZynC?", a: "ZynC is a decentralised trading platform built on EVM-compatible chains. It lets you swap tokens, place limit orders, and trade perpetual futures — all without giving up custody of your assets." },
  { q: "Which wallets are supported?", a: "Any EIP-6963 or EIP-1193 compatible wallet works: MetaMask, Coinbase Wallet, Rainbow, Trust Wallet, and more. Hardware wallets via MetaMask are also supported." },
  { q: "Are there any trading fees?", a: "ZynC charges a small protocol fee on swaps (typically 0.3%). Limit orders and perpetuals have their own fee schedules visible before you confirm any trade." },
  { q: "What is the ZynC token?", a: "ZynC is the native utility token of the AureLexa ecosystem. It will be used for governance, fee discounts, staking rewards, and unlocking premium platform features. The public mint opens on mainnet launch." },
  { q: "Is ZynC safe to use?", a: "ZynC is non-custodial — your funds never leave your wallet until you sign a transaction. Smart contracts are audited and open-source. Always verify contract addresses before interacting." },
  { q: "Which chains are supported?", a: "ZynC currently supports Ethereum mainnet and local Hardhat for development. Multi-chain support (Arbitrum, Optimism, Base) is on the roadmap." },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export function HomePage() {
  const { overview } = useMarketsStream();
  const router = useRouter();
  const topMarkets = (overview?.markets.slice(0, 6) ?? []) as MarketRow[];

  const vol  = useCountUp(overview ? Math.round(overview.volume_24h_total / 1e9) : 4, 2000);
  const oi   = useCountUp(overview ? Math.round(overview.total_open_interest / 1e9) : 2, 2000);
  const mkts = useCountUp(overview?.markets.length ?? 7, 1500);
  const featHeadRef = useFadeIn(0);
  const statsRef    = useFadeIn(0);
  const howHeadRef  = useFadeIn(0);
  const faqRef      = useFadeIn(0);

  return (
    <div className="overflow-x-hidden" style={{ background: "#060c18" }}>

      {/* ── HERO ── */}
      <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 90% 70% at 60% 20%, rgba(56,189,248,0.1) 0%, rgba(61,255,160,0.06) 40%, transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        {HERO_TOKENS.map((tk, i) => {
          const pos = TOKEN_POSITIONS[i];
          if (!pos) return null;
          const live = overview?.markets.find(m => m.id === tk.id);
          return (
            <FloatingToken
              key={tk.symbol}
              tk={tk}
              pos={pos}
              liveChange={live?.change_24h_pct}
              onClick={() => router.push(`/trade/${tk.id}`)}
            />
          );
        })}

        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-16 px-6 pb-20 pt-20 lg:flex-row lg:pt-28">
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ background: "rgba(61,255,160,0.1)", border: "1px solid rgba(61,255,160,0.25)", color: "#3dffa0" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#3dffa0] animate-pulse" />
              Live on mainnet · ZYNC launching soon
            </div>
            <h1 className="mb-5 text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Trade crypto<br />
              <span style={{ background: "linear-gradient(135deg,#3dffa0,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                without limits
              </span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/55 mx-auto lg:mx-0">
              Swap, limit order, and trade perpetuals on a non-custodial platform powered by real-time Binance data and the ZYNC utility token.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <button type="button" onClick={() => router.push("/swap")}
                className="rounded-2xl px-7 py-3.5 text-base font-bold text-[#060c18] transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg,#3dffa0,#38bdf8)", boxShadow: "0 6px 30px rgba(61,255,160,0.35)" }}>
                Get Started
              </button>
              <button type="button" onClick={() => router.push("/markets")}
                className="rounded-2xl border px-7 py-3.5 text-base font-semibold text-white/80 transition-all hover:text-white hover:border-white/30"
                style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)" }}>
                View Markets
              </button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 lg:justify-start">
              {["Non-custodial", "Audited contracts", "No KYC"].map(b => (
                <div key={b} className="flex items-center gap-2 text-sm text-white/45">
                  <svg className="h-4 w-4 text-[#3dffa0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  {b}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full max-w-[420px] shrink-0">
            <MiniSwapWidget />
          </div>
        </div>
      </section>

      {/* ── PARTNER BADGES ── */}
      <section className="border-y border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="relative py-6">
          {/* Scrolling track */}
          <div className="flex gap-4" style={{ animation: "badgeScroll 30s linear infinite", width: "max-content" }}>
            {[
              { name: "Binance", img: "/wallets/binance.svg" },
              { name: "Coinbase", img: "https://assets.coingecko.com/markets/images/23/large/Coinbase_Coin_Primary.png" },
              { name: "MetaMask", img: "/wallets/metamask.svg" },
              { name: "Phantom", img: "/wallets/phantom.png" },
              { name: "Trust Wallet", img: "/wallets/trust.png" },
              { name: "Rainbow", img: "/wallets/rainbow.png" },
              { name: "Exodus", img: "/wallets/exodus.png" },
              { name: "SafePal", img: "/wallets/safepal.png" },
              { name: "Raydium", img: "https://raydium.io/favicon.ico" },
              { name: "Uniswap", img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png" },
              { name: "Jupiter", img: "https://station.jup.ag/favicon.ico" },
              { name: "PancakeSwap", img: "https://pancakeswap.finance/favicon.ico" },
              { name: "1inch", img: "https://1inch.io/img/favicon/favicon-32x32.png" },
              { name: "dYdX", img: "https://dydx.exchange/favicon.ico" },
              { name: "Curve", img: "https://curve.fi/favicon.ico" },
              { name: "Aave", img: "https://aave.com/favicon.ico" },
              /* duplicate for seamless loop */
              { name: "Binance2", img: "/wallets/binance.svg" },
              { name: "Coinbase2", img: "https://assets.coingecko.com/markets/images/23/large/Coinbase_Coin_Primary.png" },
              { name: "MetaMask2", img: "/wallets/metamask.svg" },
              { name: "Phantom2", img: "/wallets/phantom.png" },
              { name: "Trust Wallet2", img: "/wallets/trust.png" },
              { name: "Rainbow2", img: "/wallets/rainbow.png" },
              { name: "Exodus2", img: "/wallets/exodus.png" },
              { name: "SafePal2", img: "/wallets/safepal.png" },
              { name: "Raydium2", img: "https://raydium.io/favicon.ico" },
              { name: "Uniswap2", img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png" },
              { name: "Jupiter2", img: "https://station.jup.ag/favicon.ico" },
              { name: "PancakeSwap2", img: "https://pancakeswap.finance/favicon.ico" },
              { name: "1inch2", img: "https://1inch.io/img/favicon/favicon-32x32.png" },
              { name: "dYdX2", img: "https://dydx.exchange/favicon.ico" },
              { name: "Curve2", img: "https://curve.fi/favicon.ico" },
              { name: "Aave2", img: "https://aave.com/favicon.ico" },
            ].map(({ name, img }) => (
              <div key={name} className="flex items-center gap-2.5 px-4 py-2 shrink-0">
                <img src={img} alt={name.replace(/\d+$/, "")} className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {name.replace(/\d+$/, "")}
                </span>
              </div>
            ))}
          </div>
          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24" style={{ background: "linear-gradient(90deg, rgba(6,12,24,1), transparent)" }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24" style={{ background: "linear-gradient(-90deg, rgba(6,12,24,1), transparent)" }} />
        </div>
      </section>

      {/* ── NEXT LEVEL TOOLS ── */}
      <section className="mx-auto max-w-[1200px] px-6 py-24">
        <div ref={featHeadRef} className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#38bdf8" }}>Trade with</p>
          <h2 className="text-4xl font-bold text-white">Next Level Tools</h2>
        </div>
        {/* Bento grid matching origin: 3 cols, left/right have 2 rows each, center has Advanced Orders + Copy Trading stacked */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-2xl p-6" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-base font-bold text-white">Fastest Execution</h3>
              <p className="mt-1 text-sm text-white/50">Intra-block speed. Execute your limit orders with no block delay.</p>
              <IllustrationFastExecution />
            </div>
            <div className="flex-1 rounded-2xl p-6" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-base font-bold text-white">Volatility Bot</h3>
              <p className="mt-1 text-sm text-white/50">Farm volatility by buying the dips and selling the rebounds, automatically.</p>
              <IllustrationVolatilityBot />
            </div>
          </div>

          {/* Center column — Advanced Orders (tall) + Copy Trading */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-6 flex-1" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-base font-bold text-white">Advanced Orders</h3>
              <p className="mt-1 text-sm text-white/50">Precise limit orders to automate your Take Profit, Stop Loss, DCA, and trailing.</p>
              {/* Chart: all in one SVG for pixel-perfect layout */}
              <svg className="mt-4 w-full rounded-xl" viewBox="0 0 340 200" style={{ background: "#0a0f1a" }}>
                {/* ── horizontal zone lines ── */}
                {/* green dashed — TP level at y=62 */}
                <line x1="0" y1="62" x2="290" y2="62" stroke="rgba(61,255,160,0.55)" strokeWidth="1.2" strokeDasharray="5,4" />
                {/* grey dashed — avg entry at y=108 */}
                <line x1="0" y1="108" x2="290" y2="108" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeDasharray="5,4" />
                {/* red dashed — SL level at y=142 */}
                <line x1="0" y1="142" x2="290" y2="142" stroke="rgba(239,83,80,0.55)" strokeWidth="1.2" strokeDasharray="5,4" />

                {/* ── price curve (S-shape, bottom-left → top-right) ── */}
                <path
                  id="adv-curve"
                  d="M10,185 C30,184 50,180 70,172 C90,163 100,150 115,135 C124,125 128,122 138,119 C148,116 152,124 160,119 C172,112 195,82 230,50 C252,30 272,18 310,10"
                  fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />

                {/* ── static DCA dots — frozen on path via animateMotion at fixed keyPoints ── */}
                {[0.22, 0.38, 0.54].map((pos, i) => (
                  <circle key={i} r="4.5" fill="#38bdf8">
                    <animateMotion
                      dur="1s"
                      keyPoints={`${pos};${pos}`}
                      keyTimes="0;1"
                      calcMode="linear"
                      repeatCount="indefinite"
                    >
                      <mpath href="#adv-curve" />
                    </animateMotion>
                  </circle>
                ))}

                {/* ── animated dot travelling the curve ── */}
                <circle r="5" fill="#fff" opacity="0.9">
                  <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#adv-curve" />
                  </animateMotion>
                </circle>
                {/* glow ring around travelling dot */}
                <circle r="9" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="2">
                  <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#adv-curve" />
                  </animateMotion>
                </circle>

                {/* ── TP label — top right, near curve end ── */}
                <rect x="272" y="6" width="42" height="24" rx="7" fill="#22c55e" />
                <text x="293" y="23" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">TP</text>

                {/* ── avg entry text + DCA label ── */}
                <text x="230" y="105" textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.35)" fontStyle="italic">avg entry</text>
                <rect x="272" y="96" width="42" height="22" rx="6" fill="#38bdf8" />
                <text x="293" y="111" textAnchor="middle" fontSize="10" fontWeight="700" fill="#060c18">DCA</text>

                {/* ── SL label — bottom right ── */}
                <rect x="272" y="155" width="42" height="24" rx="7" fill="#ef5350" />
                <text x="293" y="172" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">SL</text>
              </svg>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-base font-bold text-white">Copy Trading</h3>
              <p className="mt-1 text-sm text-white/50">Mirror the best traders. Anti-rug protection built in.</p>
              <IllustrationCopyTrading />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-2xl p-6" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-base font-bold text-white">Smart Routing</h3>
              <p className="mt-1 text-sm text-white/50">Always buy and sell at the best price with ZYNC smart routing.</p>
              <IllustrationSmartRouting />
            </div>
            <div className="flex-1 rounded-2xl p-6" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-base font-bold text-white">AI Research</h3>
              <p className="mt-1 text-sm text-white/50">Use AI Research tools to find best tokens and wallets.</p>
              <IllustrationAIResearch />
            </div>
          </div>
        </div>
      </section>

      {/* ── NON-CUSTODIAL ARCHITECTURE ── */}
      <section style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div ref={howHeadRef} className="mb-4 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#38bdf8" }}>Secure</p>
            <h2 className="text-4xl font-bold text-white">Non-Custodial Architecture</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/50">
              ZYNC brings all the trading tools you need across multiple chains and DEXs for a smooth, integrated experience.
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/40">
              The platform is fully non-custodial. Your keys are encrypted and protected, ensuring complete security and control over your assets.
            </p>
          </div>

          {/* Circular ring layout - 4 concentric circles with rotation - EXPANDED */}
          <div className="relative mx-auto mt-16 flex items-center justify-center" style={{ height: 800 }}>
            {/* Outermost circle - clockwise rotation - 24 icons */}
            <div className="absolute" style={{ 
              width: 800, 
              height: 800, 
              animation: "rotateClockwise 60s linear infinite",
              transformOrigin: "center"
            }}>
              {[
                { img: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", angle: 0 },
                { img: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", angle: 15 },
                { img: "https://assets.coingecko.com/coins/images/4128/large/solana.png", angle: 30 },
                { img: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", angle: 45 },
                { img: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", angle: 60 },
                { img: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", angle: 75 },
                { img: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", angle: 90 },
                { img: "https://assets.coingecko.com/coins/images/325/large/Tether.png", angle: 105 },
                { img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", angle: 120 },
                { img: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", angle: 135 },
                { img: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg", angle: 150 },
                { img: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png", angle: 165 },
                { img: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", angle: 180 },
                { img: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png", angle: 195 },
                { img: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png", angle: 210 },
                { img: "https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png", angle: 225 },
                { img: "https://assets.coingecko.com/coins/images/10775/large/COMP.png", angle: 240 },
                { img: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", angle: 255 },
                { img: "https://assets.coingecko.com/coins/images/2518/large/weth.png", angle: 270 },
                { img: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png", angle: 285 },
                { img: "https://assets.coingecko.com/coins/images/3406/large/SNX.png", angle: 300 },
                { img: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", angle: 315 },
                { img: "https://assets.coingecko.com/coins/images/2/large/litecoin.png", angle: 330 },
                { img: "https://assets.coingecko.com/coins/images/975/large/cardano.png", angle: 345 },
              ].map(({ img, angle }, idx) => {
                const radius = 400;
                const size = 60;
                const radian = ((angle - 90) * Math.PI) / 180;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;
                
                return (
                  <div
                    key={`outer-${idx}`}
                    className="absolute rounded-full overflow-hidden shadow-2xl"
                    style={{
                      width: size,
                      height: size,
                      left: `calc(50% + ${x}px - ${size / 2}px)`,
                      top: `calc(50% + ${y}px - ${size / 2}px)`,
                      background: "rgba(10,20,40,0.95)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>

            {/* Second circle - counter-clockwise rotation - 24 icons */}
            <div className="absolute" style={{ 
              width: 600, 
              height: 600, 
              animation: "rotateCounterClockwise 50s linear infinite",
              transformOrigin: "center"
            }}>
              {[
                { img: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png", angle: 0 },
                { img: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png", angle: 15 },
                { img: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", angle: 30 },
                { img: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", angle: 45 },
                { img: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", angle: 60 },
                { img: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png", angle: 75 },
                { img: "https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png", angle: 90 },
                { img: "https://assets.coingecko.com/coins/images/2518/large/weth.png", angle: 105 },
                { img: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png", angle: 120 },
                { img: "https://assets.coingecko.com/coins/images/3406/large/SNX.png", angle: 135 },
                { img: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", angle: 150 },
                { img: "https://assets.coingecko.com/coins/images/4128/large/solana.png", angle: 165 },
                { img: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", angle: 180 },
                { img: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", angle: 195 },
                { img: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png", angle: 210 },
                { img: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", angle: 225 },
                { img: "https://assets.coingecko.com/coins/images/325/large/Tether.png", angle: 240 },
                { img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", angle: 255 },
                { img: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", angle: 270 },
                { img: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg", angle: 285 },
                { img: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png", angle: 300 },
                { img: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", angle: 315 },
                { img: "https://assets.coingecko.com/coins/images/2/large/litecoin.png", angle: 330 },
                { img: "https://assets.coingecko.com/coins/images/975/large/cardano.png", angle: 345 },
              ].map(({ img, angle }, idx) => {
                const radius = 300;
                const size = 50;
                const radian = ((angle - 90) * Math.PI) / 180;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;
                
                return (
                  <div
                    key={`mid-${idx}`}
                    className="absolute rounded-full overflow-hidden shadow-2xl"
                    style={{
                      width: size,
                      height: size,
                      left: `calc(50% + ${x}px - ${size / 2}px)`,
                      top: `calc(50% + ${y}px - ${size / 2}px)`,
                      background: "rgba(10,20,40,0.95)",
                      boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>

            {/* Third circle - clockwise rotation - 24 icons */}
            <div className="absolute" style={{ 
              width: 400, 
              height: 400, 
              animation: "rotateClockwise 40s linear infinite",
              transformOrigin: "center"
            }}>
              {[
                { img: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", angle: 0 },
                { img: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", angle: 15 },
                { img: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", angle: 30 },
                { img: "https://assets.coingecko.com/coins/images/4128/large/solana.png", angle: 45 },
                { img: "https://assets.coingecko.com/coins/images/325/large/Tether.png", angle: 60 },
                { img: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", angle: 75 },
                { img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", angle: 90 },
                { img: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", angle: 105 },
                { img: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", angle: 120 },
                { img: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", angle: 135 },
                { img: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", angle: 150 },
                { img: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg", angle: 165 },
                { img: "https://assets.coingecko.com/coins/images/2518/large/weth.png", angle: 180 },
                { img: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png", angle: 195 },
                { img: "https://assets.coingecko.com/coins/images/3406/large/SNX.png", angle: 210 },
                { img: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", angle: 225 },
                { img: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png", angle: 240 },
                { img: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png", angle: 255 },
                { img: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", angle: 270 },
                { img: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png", angle: 285 },
                { img: "https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png", angle: 300 },
                { img: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png", angle: 315 },
                { img: "https://assets.coingecko.com/coins/images/2/large/litecoin.png", angle: 330 },
                { img: "https://assets.coingecko.com/coins/images/975/large/cardano.png", angle: 345 },
              ].map(({ img, angle }, idx) => {
                const radius = 200;
                const size = 40;
                const radian = ((angle - 90) * Math.PI) / 180;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;
                
                return (
                  <div
                    key={`inner-${idx}`}
                    className="absolute rounded-full overflow-hidden shadow-xl"
                    style={{
                      width: size,
                      height: size,
                      left: `calc(50% + ${x}px - ${size / 2}px)`,
                      top: `calc(50% + ${y}px - ${size / 2}px)`,
                      background: "rgba(10,20,40,0.95)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>

            {/* Innermost circle - counter-clockwise rotation - 24 icons */}
            <div className="absolute" style={{ 
              width: 200, 
              height: 200, 
              animation: "rotateCounterClockwise 30s linear infinite",
              transformOrigin: "center"
            }}>
              {[
                { img: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png", angle: 0 },
                { img: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png", angle: 15 },
                { img: "https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg", angle: 30 },
                { img: "https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg", angle: 45 },
                { img: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", angle: 60 },
                { img: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", angle: 75 },
                { img: "https://assets.coingecko.com/coins/images/4128/large/solana.png", angle: 90 },
                { img: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png", angle: 105 },
                { img: "https://assets.coingecko.com/coins/images/325/large/Tether.png", angle: 120 },
                { img: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png", angle: 135 },
                { img: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png", angle: 150 },
                { img: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", angle: 165 },
                { img: "https://assets.coingecko.com/coins/images/2518/large/weth.png", angle: 180 },
                { img: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png", angle: 195 },
                { img: "https://assets.coingecko.com/coins/images/3406/large/SNX.png", angle: 210 },
                { img: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png", angle: 225 },
                { img: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png", angle: 240 },
                { img: "https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png", angle: 255 },
                { img: "https://assets.coingecko.com/coins/images/11939/large/shiba.png", angle: 270 },
                { img: "https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png", angle: 285 },
                { img: "https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png", angle: 300 },
                { img: "https://assets.coingecko.com/coins/images/25244/large/Optimism.png", angle: 315 },
                { img: "https://assets.coingecko.com/coins/images/2/large/litecoin.png", angle: 330 },
                { img: "https://assets.coingecko.com/coins/images/975/large/cardano.png", angle: 345 },
              ].map(({ img, angle }, idx) => {
                const radius = 100;
                const size = 32;
                const radian = ((angle - 90) * Math.PI) / 180;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;
                
                return (
                  <div
                    key={`center-${idx}`}
                    className="absolute rounded-full overflow-hidden shadow-lg"
                    style={{
                      width: size,
                      height: size,
                      left: `calc(50% + ${x}px - ${size / 2}px)`,
                      top: `calc(50% + ${y}px - ${size / 2}px)`,
                      background: "rgba(10,20,40,0.95)",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>

            {/* Center Logo */}
            <div className="absolute" style={{
              width: 120,
              height: 120,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}>
              <div className="flex h-full w-full items-center justify-center rounded-full"
                style={{
                  background: "rgba(11,18,23,0.95)",
                  border: "3px solid rgba(0,217,192,0.3)",
                  boxShadow: "0 0 40px rgba(0,217,192,0.2), 0 8px 32px rgba(0,0,0,0.6)",
                }}>
                <img src="/logo.png" alt="ZyncSwap" className="w-20 h-20" />
              </div>
            </div>
          </div>

          {/* Feature pills below */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["Your keys, your crypto", "No KYC required", "Audited contracts", "Multi-chain support", "2FA protected"].map(f => (
              <span key={f} className="rounded-full px-4 py-1.5 text-xs font-medium text-white/60"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ── LIVE MARKETS ── */}
      {topMarkets.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-24">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#3dffa0" }}>Live markets</p>
              <h2 className="text-3xl font-bold text-white">Top trading pairs</h2>
            </div>
            <button type="button" onClick={() => router.push("/markets")}
              className="hidden text-sm font-medium transition-colors hover:text-white sm:block" style={{ color: "#38bdf8" }}>
              View all markets →
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topMarkets.map((m, i) => (
              <MarketCard key={m.id} m={m} delay={i * 0.06} onClick={() => router.push(`/trade/${m.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── STATISTICS ── */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-4">
        <div ref={statsRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "24h Volume", value: `$${vol.val}B`, color: "#3dffa0",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              ),
            },
            {
              label: "Total Users", value: "150K+", color: "#38bdf8",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
            },
            {
              label: "Transactions", value: "2.5M+", color: "#a78bfa",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="M15 6l6 6-6 6"/>
                  <path d="M19 6H9a4 4 0 0 0 0 8"/>
                </svg>
              ),
            },
            {
              label: "Open Interest", value: `$${oi.val}B`, color: "#fbbf24",
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/>
                  <line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
              ),
            },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="rounded-2xl p-6 text-center transition-all hover:scale-[1.02]"
              style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="mb-3 flex justify-center" style={{ color }}>{icon}</div>
              <div className="mb-1 text-3xl font-bold" style={{ color }}>{value}</div>
              <div className="text-sm text-white/50">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE ZYNCSWAP ── */}
      <section style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#3dffa0" }}>Why choose us</p>
            <h2 className="text-4xl font-bold text-white">Built for serious traders</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              Experience the perfect blend of speed, security, and simplicity in one powerful platform.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Lightning Fast", desc: "Sub-50ms execution with intra-block speed. No waiting, no delays.", color: "#fbbf24", bg: "rgba(251,191,36,0.1)",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
              },
              {
                title: "Bank-Grade Security", desc: "Audited smart contracts, non-custodial architecture, and 2FA protection.", color: "#3dffa0", bg: "rgba(61,255,160,0.1)",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              },
              {
                title: "Lowest Fees", desc: "0.3% swap fee with no hidden costs. What you see is what you pay.", color: "#38bdf8", bg: "rgba(56,189,248,0.1)",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
              },
              {
                title: "Multi-Chain Support", desc: "Trade across Ethereum, Arbitrum, Optimism, and more from one interface.", color: "#a78bfa", bg: "rgba(167,139,250,0.1)",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
              },
              {
                title: "Advanced Tools", desc: "Limit orders, DCA, trailing stops, copy trading, and volatility bots.", color: "#f472b6", bg: "rgba(244,114,182,0.1)",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
              },
              {
                title: "24/7 Liquidity", desc: "Access deep liquidity pools and smart routing for best execution.", color: "#34d399", bg: "rgba(52,211,153,0.1)",
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
              },
            ].map(({ title, desc, icon, color, bg }) => (
              <div key={title} className="group rounded-2xl p-6 transition-all hover:scale-[1.02]"
                style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: bg, color }}>
                  {icon}
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#38bdf8" }}>Testimonials</p>
          <h2 className="text-4xl font-bold text-white">Trusted by traders worldwide</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Alex Chen", role: "DeFi Trader", img: "/feedback/h-decor-1.png", quote: "ZyncSwap's execution speed is unmatched. I've tried every DEX and this is the fastest by far.", rating: 5 },
            { name: "Sarah Martinez", role: "Crypto Investor", img: "/feedback/h-decor-2.png", quote: "The copy trading feature helped me learn from the best. My portfolio is up 40% this quarter.", rating: 5 },
            { name: "Sophia Johnson", role: "Day Trader", img: "/feedback/h-decor-3.png", quote: "Advanced order types like trailing stops are game-changers. Finally a DEX that gets it.", rating: 5 },
            { name: "David Lopez", role: "Yield Farmer", img: "/feedback/h-decor-4.png", quote: "Smart routing always finds me the best prices. Saved thousands in slippage already.", rating: 5 },
            { name: "Emma Wilson", role: "Whale Trader", img: "/feedback/h-decor-5.png", quote: "Non-custodial with this level of features? ZyncSwap is the future of DeFi trading.", rating: 5 },
            { name: "Lisa Brown", role: "NFT Collector", img: "/feedback/h-decor-6.png", quote: "Clean UI, fast swaps, low fees. Everything I need in one place. Highly recommend!", rating: 5 },
          ].map(({ name, role, img, quote, rating }) => (
            <div key={name} className="rounded-2xl p-6"
              style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="mb-4 flex items-center gap-3">
                <img src={img} alt={name}
                  className="h-12 w-12 rounded-full object-cover"
                  style={{ border: "1px solid rgba(56,189,248,0.2)" }} />
                <div>
                  <div className="font-semibold text-white">{name}</div>
                  <div className="text-xs text-white/40">{role}</div>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/60">"{quote}"</p>
              <div className="flex gap-1">
                {Array.from({ length: rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#3dffa0" }}>Roadmap</p>
            <h2 className="text-4xl font-bold text-white">What's coming next</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/50">
              We're constantly innovating to bring you the best trading experience.
            </p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 via-blue-500 to-purple-500 opacity-30 hidden lg:block" />
            
            <div className="space-y-8">
              {[
                { quarter: "Q3 2026", status: "In Progress", color: "#38bdf8", items: ["Platform Launch", "Swap & Limit Orders", "MetaMask Integration", "Audit Completion"] },
                { quarter: "Q4 2026", status: "In Progress", color: "#38bdf8", items: ["ZYNC Token Launch", "Staking & Governance", "Mobile App Beta", "Multi-Chain Expansion"] },
                { quarter: "Q1 2027", status: "Planned", color: "#a78bfa", items: ["Perpetual Futures", "Options Trading", "Lending Protocol", "DAO Treasury"] },
                { quarter: "Q2 2027", status: "Planned", color: "#fbbf24", items: ["Cross-Chain Bridge", "NFT Marketplace", "Social Trading", "Institutional API"] },
              ].map(({ quarter, status, color, items }) => (
                <div key={quarter} className="relative flex gap-6">
                  {/* Timeline dot */}
                  <div className="hidden lg:flex shrink-0 h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "#0d1424", border: `2px solid ${color}` }}>
                    <div className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
                  </div>
                  
                  {/* Content card */}
                  <div className="flex-1 rounded-2xl p-6"
                    style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">{quarter}</h3>
                      <span className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                        {status}
                      </span>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {items.map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm text-white/60">
                          <svg className="h-4 w-4 shrink-0" style={{ color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-24">
        <div className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{ background: "linear-gradient(135deg,rgba(61,255,160,0.12),rgba(56,189,248,0.12))", border: "1px solid rgba(61,255,160,0.2)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%,rgba(61,255,160,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 50%,rgba(56,189,248,0.15) 0%,transparent 50%)" }} />
          <h2 className="relative mb-3 text-4xl font-bold text-white">Ready to start trading?</h2>
          <p className="relative mx-auto mb-8 max-w-md text-white/55">Connect your wallet and make your first swap in under 30 seconds. No account needed.</p>
          <button type="button" onClick={() => router.push("/swap")}
            className="relative rounded-2xl px-10 py-4 text-base font-bold text-[#060c18] transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg,#3dffa0,#38bdf8)", boxShadow: "0 8px 32px rgba(61,255,160,0.4)" }}>
            Get Started — it's free
          </button>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-[800px] px-6 py-24">
          <div ref={faqRef} className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#38bdf8" }}>FAQ</p>
            <h2 className="text-4xl font-bold text-white">Frequently asked questions</h2>
          </div>
          <div className="rounded-2xl px-6" style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.07)" }}>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#060c18", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Top footer */}
        <div className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-5">

            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(56,189,248,0.3)" }}>
                  <img src="/logo.png" alt="ZYNC" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-bold text-white">ZYNC</span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 280 }}>
                The next-generation decentralized trading platform. Trade smarter across multiple chains with zero custody risk.
              </p>
              {/* Social links */}
              <div className="flex items-center gap-3">
                {[
                  { label: "X", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                  { label: "Discord", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> },
                  { label: "Telegram", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
                  { label: "GitHub", href: "#", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> },
                ].map(({ label, href, icon }) => (
                  <a key={label} href={href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:scale-110"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    aria-label={label}>
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Links columns */}
            {[
              {
                title: "Product",
                links: [
                  { label: "Swap", href: "/swap" },
                  { label: "Trade", href: "/trade" },
                  { label: "Markets", href: "/markets" },
                  { label: "Limit Orders", href: "/limit" },
                  { label: "Buy Crypto", href: "/buy" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Documentation", href: "docs" },
                  { label: "Whitepaper", href: "docs" },
                  { label: "API Reference", href: "docs" },
                  { label: "Bug Bounty", href: "docs" },
                  { label: "Audit Reports", href: "docs" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "/" },
                  { label: "Blog", href: "/" },
                  { label: "Careers", href: "/" },
                  { label: "Press Kit", href: "/" },
                  { label: "Contact", href: "/" },
                ],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <a href={href}
                        className="text-sm transition-colors hover:text-white"
                        style={{ color: "rgba(255,255,255,0.4)" }}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              © 2025 ZYNC Protocol. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
                <a key={l} href="#" className="text-xs transition-colors hover:text-white/60"
                  style={{ color: "rgba(255,255,255,0.25)" }}>{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ background: "#3dffa0", boxShadow: "0 0 6px #3dffa0" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes floatY {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33%      { transform: translateY(-14px) rotate(3deg); }
          66%      { transform: translateY(-7px) rotate(-2deg); }
        }
        @keyframes badgeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-6px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes rotateClockwise {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rotateCounterClockwise {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbitSpinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes atomOrbit1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes atomOrbit2 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes atomOrbit3 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fishBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes waterShift {
          0%   { opacity: 0.6; transform: translateX(0px) scaleX(1); }
          100% { opacity: 1;   transform: translateX(40px) scaleX(1.1); }
        }
        @keyframes waterShift2 {
          0%   { opacity: 0.5; transform: translateX(0px); }
          100% { opacity: 0.9; transform: translateX(-30px); }
        }
        @keyframes waveLine {
          0%   { d: path("M0,80 Q200,60 400,80 T800,80 T1200,80"); }
          100% { d: path("M0,80 Q200,100 400,80 T800,80 T1200,80"); }
        }
        @keyframes lightRay {
          0%   { opacity: 0.3; transform: skewX(-8deg) scaleX(0.8); }
          100% { opacity: 0.8; transform: skewX(-8deg) scaleX(1.2); }
        }
        @keyframes fishSwimBTC  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(300px) translateY(-35px); } 50% { transform: translateX(700px) translateY(0px); } 75% { transform: translateX(1000px) translateY(35px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimETH  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(250px) translateY(28px);  } 50% { transform: translateX(650px) translateY(0px); } 75% { transform: translateX(950px)  translateY(-28px);} to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimSOL  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(350px) translateY(-32px);} 50% { transform: translateX(750px) translateY(0px); } 75% { transform: translateX(1050px) translateY(32px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimBNB  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(280px) translateY(40px);  } 50% { transform: translateX(680px) translateY(0px); } 75% { transform: translateX(980px)  translateY(-40px);} to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimPEPE { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(320px) translateY(-25px);} 50% { transform: translateX(720px) translateY(0px); } 75% { transform: translateX(1020px) translateY(25px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimAVAX { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(260px) translateY(30px);  } 50% { transform: translateX(660px) translateY(0px); } 75% { transform: translateX(960px)  translateY(-30px);} to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimLINK { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(340px) translateY(-22px);} 50% { transform: translateX(740px) translateY(0px); } 75% { transform: translateX(1040px) translateY(22px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimUNI  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(290px) translateY(38px);  } 50% { transform: translateX(690px) translateY(0px); } 75% { transform: translateX(990px)  translateY(-38px);} to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimUSDC { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(310px) translateY(-30px);} 50% { transform: translateX(710px) translateY(0px); } 75% { transform: translateX(1010px) translateY(30px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimUSDT { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(270px) translateY(20px);  } 50% { transform: translateX(670px) translateY(0px); } 75% { transform: translateX(970px)  translateY(-20px);} to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimARB  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(330px) translateY(-38px);} 50% { transform: translateX(730px) translateY(0px); } 75% { transform: translateX(1030px) translateY(38px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimTON  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(360px) translateY(-34px);} 50% { transform: translateX(760px) translateY(0px); } 75% { transform: translateX(1060px) translateY(34px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimCOMP { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(240px) translateY(42px);  } 50% { transform: translateX(640px) translateY(0px); } 75% { transform: translateX(940px)  translateY(-42px);} to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimGRT  { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(305px) translateY(-18px);} 50% { transform: translateX(705px) translateY(0px); } 75% { transform: translateX(1005px) translateY(18px); } to { transform: translateX(1300px) translateY(0px); } }
        @keyframes fishSwimWBTC { from { transform: translateX(-80px)  translateY(0px);  } 25% { transform: translateX(275px) translateY(36px);  } 50% { transform: translateX(675px) translateY(0px); } 75% { transform: translateX(975px)  translateY(-36px);} to { transform: translateX(1300px) translateY(0px); } }
      `}</style>
    </div>
  );
}
