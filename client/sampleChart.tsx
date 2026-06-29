"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, CandlestickData, LineData } from "lightweight-charts";

interface TradingChartProps {
  pair: string;
  currentPrice: number;
}

type ChartType = "candlestick" | "line" | "area";
type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export default function TradingChart({ pair, currentPrice }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [chartType, setChartType] = useState<ChartType>("candlestick");
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, change: 0 });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "#1a1a1a", style: 1 },
        horzLines: { color: "#1a1a1a", style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1a1a1a",
      },
      rightPriceScale: {
        borderColor: "#1a1a1a",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      crosshair: {
        vertLine: {
          color: "#6b7280",
          width: 1,
          style: 3,
        },
        horzLine: {
          color: "#6b7280",
          width: 1,
          style: 3,
        },
      },
    });

    chartRef.current = chart;

    const generateCandleData = (): CandlestickData[] => {
      const data: CandlestickData[] = [];
      const now = Math.floor(Date.now() / 1000);
      const interval = TIMEFRAME_SECONDS[timeframe];
      const bars = 200;
      let price = currentPrice;

      for (let i = bars; i >= 0; i--) {
        const time = (now - i * interval) as any;
        const open = price;
        const volatility = price * 0.015;
        const change = (Math.random() - 0.48) * volatility;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.3;
        const low = Math.min(open, close) - Math.random() * volatility * 0.3;

        data.push({ time, open, high, low, close });
        price = close;
      }

      const lastCandle = data[data.length - 1];
      setOhlc({
        o: lastCandle.open,
        h: lastCandle.high,
        l: lastCandle.low,
        c: lastCandle.close,
        change: ((lastCandle.close - lastCandle.open) / lastCandle.open) * 100,
      });

      return data;
    };

    const generateLineData = (): LineData[] => {
      const candleData = generateCandleData();
      return candleData.map(d => ({ time: d.time, value: d.close }));
    };

    const generateVolumeData = (candleData: CandlestickData[]) => {
      return candleData.map(d => ({
        time: d.time,
        value: Math.random() * 1000000 + 100000,
        color: d.close >= d.open ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
      }));
    };

    let candleData: CandlestickData[] = [];

    if (chartType === "candlestick") {
      const series = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      candleData = generateCandleData();
      series.setData(candleData);
      seriesRef.current = series;
    } else if (chartType === "line") {
      const series = chart.addLineSeries({
        color: "#22c55e",
        lineWidth: 2,
      });
      series.setData(generateLineData());
      seriesRef.current = series;
    } else if (chartType === "area") {
      const series = chart.addAreaSeries({
        topColor: "rgba(34, 197, 94, 0.4)",
        bottomColor: "rgba(34, 197, 94, 0.0)",
        lineColor: "#22c55e",
        lineWidth: 2,
      });
      series.setData(generateLineData());
      seriesRef.current = series;
    }

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    if (candleData.length > 0) {
      volumeSeries.setData(generateVolumeData(candleData));
    }
    volumeSeriesRef.current = volumeSeries;

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [pair, currentPrice, chartType, timeframe]);

  const [base] = pair.split("_");

  return (
    <div className="w-full h-full flex bg-[#0a0a0a]">
      {/* Left Toolbar */}
      <div className="w-12 border-r border-[#1a1a1a] flex flex-col items-center py-3 gap-3">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Cursor">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Trend Line">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Horizontal Line">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Fibonacci">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Brush">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Text">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Shapes">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Measure">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        <div className="flex-1"></div>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Favorites">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Ruler">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Zoom">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded" title="Lock">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>

      {/* Chart Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            {/* Timeframes */}
            <div className="flex items-center gap-1">
              {(["1m", "5m", "15m", "1h", "4h", "1d"] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${timeframe === tf
                      ? "bg-[#2a2a2a] text-white"
                      : "text-gray-500 hover:text-white"
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-[#2a2a2a]"></div>

            {/* Chart type icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartType("candlestick")}
                className={`p-1.5 rounded ${chartType === "candlestick" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"}`}
                title="Candlestick">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="10" y="2" width="4" height="4" />
                  <rect x="10" y="18" width="4" height="4" />
                  <rect x="11" y="6" width="2" height="12" />
                </svg>
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded ${chartType === "line" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"}`}
                title="Line">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l6-6 4 4 8-8" />
                </svg>
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`p-1.5 rounded ${chartType === "area" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"}`}
                title="Area">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 21L9 15L13 19L21 11V21H3Z" opacity="0.5" />
                  <path d="M3 21L9 15L13 19L21 11" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="w-px h-4 bg-[#2a2a2a]"></div>

            {/* Indicators button */}
            <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white rounded hover:bg-[#1a1a1a]">
              <span>ƒₓ</span>
              <span>Indicators</span>
            </button>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-500 hover:text-white" title="Undo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button className="p-1 text-gray-500 hover:text-white" title="Redo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-1 text-gray-500 hover:text-white" title="Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="p-1 text-gray-500 hover:text-white" title="Fullscreen">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button className="p-1 text-gray-500 hover:text-white" title="Screenshot">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Price info bar */}
        <div className="flex items-center gap-4 px-3 py-1.5 text-xs border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{pair.replace("_", "/")}</span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className={ohlc.change >= 0 ? "text-green-400" : "text-red-400"}>
              {timeframe}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <span>O <span className="text-white">{ohlc.o.toFixed(8)}</span></span>
            <span>H <span className="text-white">{ohlc.h.toFixed(8)}</span></span>
            <span>L <span className="text-white">{ohlc.l.toFixed(8)}</span></span>
            <span>C <span className="text-white">{ohlc.c.toFixed(8)}</span></span>
            <span className={ohlc.change >= 0 ? "text-green-400" : "text-red-400"}>
              {ohlc.change >= 0 ? "+" : ""}{ohlc.change.toFixed(2)}%
            </span>
          </div>
          <div className="text-gray-400">
            Volume <span className="text-white">SMA 9</span> <span className="text-green-400">530.202M</span>
          </div>
        </div>

        {/* Chart */}
        <div ref={chartContainerRef} className="flex-1" />
      </div>
    </div>
  );
}