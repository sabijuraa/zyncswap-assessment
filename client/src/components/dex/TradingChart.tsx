import { useEffect, useRef } from "react";

export type ChartTimeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

const TF_TO_TV: Record<ChartTimeframe, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

/** Convert pair like "BTC-USDT" / "BTC_USDT" / "BTCUSDT" → "BINANCE:BTCUSDT" */
function toTVSymbol(pair: string): string {
  const clean = pair.toUpperCase().replace(/[-_/]/, "");
  return `BINANCE:${clean}`;
}

type Props = {
  pair: string;
  timeframe?: ChartTimeframe;
  onTimeframeChange?: (tf: ChartTimeframe) => void;
  livePrice?: number;
};

export function TradingChart({ pair, timeframe = "5m" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef    = useRef<unknown>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Remove any previous widget
    el.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // @ts-expect-error TradingView global
      widgetRef.current = new window.TradingView.widget({
        container_id: el.id,
        autosize: true,
        symbol: toTVSymbol(pair),
        interval: TF_TO_TV[timeframe],
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",                  // candlestick
        locale: "en",
        toolbar_bg: "#131722",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: true,
        studies: ["Volume@tv-basicstudies"],
        show_popup_button: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        drawings_access: { type: "all", tools: [{ name: "Regression Trend" }] },
        details: false,
        hotlist: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
        overrides: {
          "mainSeriesProperties.candleStyle.upColor":         "#26a69a",
          "mainSeriesProperties.candleStyle.downColor":       "#ef5350",
          "mainSeriesProperties.candleStyle.borderUpColor":   "#26a69a",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
          "mainSeriesProperties.candleStyle.wickUpColor":     "#26a69a",
          "mainSeriesProperties.candleStyle.wickDownColor":   "#ef5350",
          "paneProperties.background":                        "#131722",
          "paneProperties.backgroundType":                    "solid",
          "paneProperties.vertGridProperties.color":          "rgba(255,255,255,0.04)",
          "paneProperties.horzGridProperties.color":          "rgba(255,255,255,0.04)",
          "scalesProperties.textColor":                       "#787b86",
          "scalesProperties.lineColor":                       "rgba(255,255,255,0.07)",
        },
        studies_overrides: {
          "volume.volume.color.0": "rgba(239,83,80,0.5)",
          "volume.volume.color.1": "rgba(38,166,154,0.5)",
          "volume.volume ma.color": "#FF6D00",
          "volume.volume ma.linewidth": 1,
          "volume.show ma": true,
        },
      });
    };

    el.appendChild(script);

    return () => {
      el.innerHTML = "";
      widgetRef.current = null;
    };
  }, [pair, timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unique stable id per pair
  const containerId = `tv_chart_${pair.replace(/[^a-zA-Z0-9]/g, "_")}`;

  return (
    <div className="h-full w-full bg-[#131722] overflow-hidden" style={{ minHeight: "500px" }}>
      <div ref={containerRef} id={containerId} className="h-full w-full" style={{ minHeight: "500px" }} />
    </div>
  );
}
