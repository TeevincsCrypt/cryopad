import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Trade } from '../types/token';
import { shortenAddress, formatCryptoPrice } from '../solana/bondingCurve';
import { useSolana } from '../solana/solanaContext';

interface TradeHistoryProps {
  trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  const { network } = useSolana();
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTrades = trades.filter((t) => {
    if (filter === 'my') return !!t.isUserTrade;
    return true;
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Filter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>Recent Transactions</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
            {filteredTrades.length}
          </span>
        </h3>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              filter === 'my' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Trades
          </button>
        </div>
      </div>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No transactions found for this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-800">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="pb-2.5">Type</th>
                <th className="pb-2.5 text-right">SOL</th>
                <th className="pb-2.5 text-right">Tokens</th>
                <th className="pb-2.5 text-right">Price</th>
                <th className="pb-2.5 text-right">Maker</th>
                <th className="pb-2.5 text-right">Time</th>
                <th className="pb-2.5 text-right">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredTrades.slice(0, 25).map((trade) => {
                const isBuy = trade.type === 'buy';
                const timeDiff = Math.max(1, Math.floor((Date.now() - trade.timestamp) / 1000));
                const timeLabel =
                  timeDiff < 60
                    ? `${timeDiff}s ago`
                    : timeDiff < 3600
                    ? `${Math.floor(timeDiff / 60)}m ago`
                    : `${Math.floor(timeDiff / 3600)}h ago`;

                return (
                  <tr key={trade.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Type Badge */}
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          isBuy
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trade.type}
                      </span>
                    </td>

                    {/* SOL Amount */}
                    <td className="py-2.5 text-right font-bold text-slate-900">
                      {trade.solAmount.toFixed(3)}
                    </td>

                    {/* Token Amount */}
                    <td className="py-2.5 text-right text-slate-700 font-semibold">
                      {Math.floor(trade.tokenAmount).toLocaleString()}
                    </td>

                    {/* Price */}
                    <td className="py-2.5 text-right text-slate-500">
                      {formatCryptoPrice(trade.priceUsd)}
                    </td>

                    {/* Maker */}
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-1 text-slate-700 font-medium">
                        <span>{trade.makerShort || shortenAddress(trade.makerAddress)}</span>
                        <button
                          onClick={() => handleCopy(trade.makerAddress, `maker-${trade.id}`)}
                          className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedId === `maker-${trade.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-2.5 text-right text-slate-400">
                      {timeLabel}
                    </td>

                    {/* Explorer Tx Link */}
                    <td className="py-2.5 text-right">
                      <a
                        href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=${network}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-emerald-700 inline-flex items-center gap-0.5 transition-colors font-bold"
                        title="View on Solana Explorer"
                      >
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
