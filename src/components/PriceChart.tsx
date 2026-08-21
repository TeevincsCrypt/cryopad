import React, { useState, useMemo } from 'react';
import { CandleData, Token } from '../types/token';
import { formatCryptoPrice, formatCompactNumber } from '../solana/bondingCurve';
import { BarChart3, LineChart } from 'lucide-react';

interface PriceChartProps {
  token: Token;
  candles: CandleData[];
  selectedTimeframe: '1m' | '5m' | '15m' | '1H' | '24H' | '7D';
  onSelectTimeframe: (tf: '1m' | '5m' | '15m' | '1H' | '24H' | '7D') => void;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  token,
  candles,
  selectedTimeframe,
  onSelectTimeframe,
}) => {
  const [chartType, setChartType] = useState<'area' | 'candles'>('area');
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  const timeframes: Array<'1m' | '5m' | '15m' | '1H' | '24H' | '7D'> = ['1m', '5m', '15m', '1H', '24H', '7D'];

  // Min and Max prices for scaling
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (!candles.length) return { minPrice: 0, maxPrice: 1, maxVolume: 1 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const padding = (max - min) * 0.1 || max * 0.05;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVolume: maxVol || 1,
    };
  }, [candles]);

  const activeCandle = hoveredCandle || candles[candles.length - 1] || null;

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 360;
  const chartHeight = 280;
  const volumeHeight = 60;

  // Map points to SVG coordinates
  const points = useMemo(() => {
    if (!candles.length) return [];
    const count = candles.length;
    const stepX = svgWidth / Math.max(1, count - 1);

    return candles.map((c, i) => {
      const x = i * stepX;
      const priceRange = maxPrice - minPrice || 1;
      const yClose = chartHeight - ((c.close - minPrice) / priceRange) * (chartHeight - 30) - 15;
      const yOpen = chartHeight - ((c.open - minPrice) / priceRange) * (chartHeight - 30) - 15;
      const yHigh = chartHeight - ((c.high - minPrice) / priceRange) * (chartHeight - 30) - 15;
      const yLow = chartHeight - ((c.low - minPrice) / priceRange) * (chartHeight - 30) - 15;
      const volHeight = (c.volume / maxVolume) * volumeHeight;
      const yVol = svgHeight - volHeight;

      return {
        ...c,
        x,
        yClose,
        yOpen,
        yHigh,
        yLow,
        yVol,
        volHeight,
        isGreen: c.close >= c.open,
      };
    });
  }, [candles, minPrice, maxPrice, maxVolume, svgWidth, chartHeight, volumeHeight, svgHeight]);

  // Area path string
  const areaPath = useMemo(() => {
    if (!points.length) return '';
    let d = `M ${points[0].x} ${points[0].yClose}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].yClose}`;
    }
    const closeArea = `${d} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
    return { line: d, fill: closeArea };
  }, [points, chartHeight]);

  const isOverallGreen = token.priceChange24h >= 0;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Header: Price & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
              {formatCryptoPrice(activeCandle ? activeCandle.close : token.priceUsd)}
            </span>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${
                isOverallGreen
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {isOverallGreen ? '+' : ''}
              {token.priceChange24h.toFixed(2)}%
            </span>
          </div>

          {/* OHLC Bar */}
          {activeCandle && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 mt-1">
              <span>O: <strong className="text-slate-800 font-semibold">{formatCryptoPrice(activeCandle.open)}</strong></span>
              <span>H: <strong className="text-slate-800 font-semibold">{formatCryptoPrice(activeCandle.high)}</strong></span>
              <span>L: <strong className="text-slate-800 font-semibold">{formatCryptoPrice(activeCandle.low)}</strong></span>
              <span>C: <strong className="text-slate-800 font-semibold">{formatCryptoPrice(activeCandle.close)}</strong></span>
              <span className="hidden md:inline text-slate-400">| Vol: {formatCompactNumber(activeCandle.volume)}</span>
            </div>
          )}
        </div>

        {/* Timeframes and Chart Type Switchers */}
        <div className="flex items-center gap-2">
          {/* Timeframe Chips */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onSelectTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                chartType === 'area' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Area Line Chart"
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('candles')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                chartType === 'candles' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Candlestick Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-[320px] sm:h-[360px] select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredCandle(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isOverallGreen ? '#059669' : '#e11d48'} stopOpacity="0.2" />
              <stop offset="100%" stopColor={isOverallGreen ? '#059669' : '#e11d48'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={chartHeight * 0.25} x2={svgWidth} y2={chartHeight * 0.25} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight * 0.5} x2={svgWidth} y2={chartHeight * 0.5} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight * 0.75} x2={svgWidth} y2={chartHeight * 0.75} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1="0" y1={chartHeight} x2={svgWidth} y2={chartHeight} stroke="#e2e8f0" />

          {/* Price Axis Labels */}
          <text x={svgWidth - 6} y={chartHeight * 0.25 - 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            {formatCryptoPrice(minPrice + (maxPrice - minPrice) * 0.75)}
          </text>
          <text x={svgWidth - 6} y={chartHeight * 0.5 - 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            {formatCryptoPrice(minPrice + (maxPrice - minPrice) * 0.5)}
          </text>
          <text x={svgWidth - 6} y={chartHeight * 0.75 - 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            {formatCryptoPrice(minPrice + (maxPrice - minPrice) * 0.25)}
          </text>

          {/* Volume bars */}
          {points.map((p, i) => (
            <rect
              key={`vol-${i}`}
              x={p.x - 3}
              y={p.yVol}
              width={6}
              height={p.volHeight}
              fill={p.isGreen ? '#059669' : '#e11d48'}
              opacity="0.3"
            />
          ))}

          {/* Area Chart Mode */}
          {chartType === 'area' && areaPath && (
            <>
              <path d={areaPath.fill} fill="url(#areaGradient)" />
              <path
                d={areaPath.line}
                fill="none"
                stroke={isOverallGreen ? '#059669' : '#e11d48'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Candlestick Chart Mode */}
          {chartType === 'candles' &&
            points.map((p, i) => {
              const candleColor = p.isGreen ? '#059669' : '#e11d48';
              const bodyTop = Math.min(p.yOpen, p.yClose);
              const bodyHeight = Math.max(2, Math.abs(p.yOpen - p.yClose));

              return (
                <g key={`candle-${i}`}>
                  {/* Wick */}
                  <line
                    x1={p.x}
                    y1={p.yHigh}
                    x2={p.x}
                    y2={p.yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={p.x - 4}
                    y={bodyTop}
                    width={8}
                    height={bodyHeight}
                    fill={candleColor}
                    rx="1"
                  />
                </g>
              );
            })}

          {/* Interactive Hover Trigger Boxes */}
          {points.map((p, i) => (
            <rect
              key={`hit-${i}`}
              x={p.x - (svgWidth / points.length) / 2}
              y={0}
              width={svgWidth / points.length}
              height={svgHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredCandle(candles[i])}
              className="cursor-crosshair"
            />
          ))}

          {/* Hover Crosshair Cursor */}
          {hoveredCandle && (
            (() => {
              const hp = points.find((p) => p.timestamp === hoveredCandle.timestamp);
              if (!hp) return null;
              return (
                <g>
                  <line x1={hp.x} y1={0} x2={hp.x} y2={chartHeight} stroke="#94a3b8" strokeDasharray="3 3" />
                  <line x1={0} y1={hp.yClose} x2={svgWidth} y2={hp.yClose} stroke="#94a3b8" strokeDasharray="3 3" />
                  <circle cx={hp.x} cy={hp.yClose} r="4" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                </g>
              );
            })()
          )}
        </svg>
      </div>

      {/* Bottom Timeline Legend */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
        <span>{candles[0]?.timeStr || 'Past'}</span>
        <span className="text-slate-500 font-semibold">AMM Constant Product Bonding Curve</span>
        <span>{candles[candles.length - 1]?.timeStr || 'Now'}</span>
      </div>
    </div>
  );
};
