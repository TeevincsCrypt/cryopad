import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Target,
  Users,
  Zap,
  Activity,
  Filter,
  CheckCircle2,
  Clock,
  Coins,
} from 'lucide-react';
import { Trade, TradeCategory } from '../types/token';
import { useSolana } from '../solana/solanaContext';

interface LiveTradeFeedProps {
  trades: Trade[];
  tokenSymbol?: string;
  tokenName?: string;
  isLiveStreamActive?: boolean;
}

export const LiveTradeFeed: React.FC<LiveTradeFeedProps> = ({
  trades,
  tokenSymbol = 'TOKEN',
  tokenName = 'Launched Coin',
  isLiveStreamActive = true,
}) => {
  const { network } = useSolana();
  const [filter, setFilter] = useState<'all' | 'sniper' | 'organic' | 'buy' | 'sell'>('all');

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filter === 'sniper') return t.tradeCategory === 'sniper';
      if (filter === 'organic') return t.tradeCategory === 'organic' || t.tradeCategory === 'whale';
      if (filter === 'buy') return t.type === 'buy';
      if (filter === 'sell') return t.type === 'sell';
      return true;
    });
  }, [trades, filter]);

  const stats = useMemo(() => {
    let totalBuys = 0;
    let totalSells = 0;
    let sniperBuys = 0;
    let organicBuys = 0;
    let totalVolumeSol = 0;

    trades.forEach((t) => {
      totalVolumeSol += t.solAmount;
      if (t.type === 'buy') {
        totalBuys++;
        if (t.tradeCategory === 'sniper') sniperBuys++;
        else organicBuys++;
      } else {
        totalSells++;
      }
    });

    return { totalBuys, totalSells, sniperBuys, organicBuys, totalVolumeSol };
  }, [trades]);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getCategoryBadge = (category?: TradeCategory, label?: string, type?: 'buy' | 'sell') => {
    if (type === 'sell') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <TrendingDown className="w-2.5 h-2.5" /> Sell Order
        </span>
      );
    }

    if (category === 'sniper') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Target className="w-2.5 h-2.5 text-emerald-600" />
          {label || 'Sniper / Bundle Buy'}
        </span>
      );
    }

    if (category === 'whale') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          🐋 Whale Buy
        </span>
      );
    }

    if (category === 'bot') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Zap className="w-2.5 h-2.5 text-purple-600" /> MEV Bot
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
        <Users className="w-2.5 h-2.5 text-teal-600" /> Organic Buy
      </span>
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
      {/* Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Real-Time Trade & Sniper Feed
              </h3>
              {isLiveStreamActive && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Tracking sniper, bundle, and organic trading activity for {tokenName}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
            {stats.totalBuys} Buys ({stats.sniperBuys} Snipes)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold">
            {stats.totalSells} Sells
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Trades (${trades.length})` },
          { id: 'sniper', label: `🎯 Sniper / Bundle (${stats.sniperBuys})` },
          { id: 'organic', label: `🌿 Organic Buys (${stats.organicBuys})` },
          { id: 'buy', label: `🟢 All Buys (${stats.totalBuys})` },
          { id: 'sell', label: `🔴 Sells (${stats.totalSells})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trade Feed List / Table */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-10 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No trades matching this filter</p>
          <p className="text-xs text-slate-400">Waiting for live on-chain swaps...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 font-sans font-semibold text-[11px]">
                <th className="pb-2">Type / Source</th>
                <th className="pb-2">SOL Amount</th>
                <th className="pb-2">{tokenSymbol} Received</th>
                <th className="pb-2">Trader / Maker</th>
                <th className="pb-2">Time</th>
                <th className="pb-2 text-right">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.map((trade) => {
                const isBuy = trade.type === 'buy';
                return (
                  <tr key={trade.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Category / Type */}
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {getCategoryBadge(trade.tradeCategory, trade.walletLabel, trade.type)}
                      </div>
                    </td>

                    {/* SOL Amount */}
                    <td className="py-3 font-bold">
                      <span className={isBuy ? 'text-emerald-600' : 'text-rose-600'}>
                        {isBuy ? '+' : '-'}{trade.solAmount.toFixed(4)} SOL
                      </span>
                      {trade.priceUsd && (
                        <span className="text-[10px] text-slate-400 block font-sans">
                          ${(trade.solAmount * (trade.priceUsd > 1 ? trade.priceUsd : 184)).toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Tokens */}
                    <td className="py-3 text-slate-800 font-bold">
                      {trade.tokenAmount.toLocaleString()} {tokenSymbol}
                    </td>

                    {/* Trader */}
                    <td className="py-3">
                      <span className="text-slate-700 font-sans font-medium text-xs block">
                        {trade.walletLabel || trade.makerShort || 'Trader'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {trade.makerAddress ? `${trade.makerAddress.slice(0, 4)}...${trade.makerAddress.slice(-4)}` : 'On-chain'}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3 text-slate-500 font-sans text-xs">
                      {formatTimeAgo(trade.timestamp)}
                    </td>

                    {/* Link */}
                    <td className="py-3 text-right">
                      <a
                        href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=${network}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                      >
                        {trade.txSignature.slice(0, 6)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
