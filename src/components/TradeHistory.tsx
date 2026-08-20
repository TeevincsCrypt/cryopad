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
    <div className="w-full bg-[#121215] border border-[#26262B] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header & Filter */}
      <div className="flex items-center justify-between pb-3 border-b border-[#26262B]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Recent Transactions</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#18181C] text-[#A1A1AA] border border-[#26262B]">
            {filteredTrades.length}
          </span>
        </h3>

        <div className="flex items-center bg-[#18181C] p-1 rounded-xl border border-[#26262B] text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#222227] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'my' ? 'bg-[#222227] text-white font-bold' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            My Trades
          </button>
        </div>
      </div>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#71717A]">
          No transactions found for this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-[#E5E5E5]">
            <thead className="text-[10px] text-[#71717A] uppercase tracking-wider border-b border-[#1F1F23]">
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
            <tbody className="divide-y divide-[#1F1F23]/60 text-[11px]">
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
                  <tr key={trade.id} className="hover:bg-[#18181C]/50 transition-colors">
                    {/* Type Badge */}
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          isBuy
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {trade.type}
                      </span>
                    </td>

                    {/* SOL Amount */}
                    <td className="py-2.5 text-right font-semibold text-white">
                      {trade.solAmount.toFixed(3)}
                    </td>

                    {/* Token Amount */}
                    <td className="py-2.5 text-right text-neutral-300">
                      {Math.floor(trade.tokenAmount).toLocaleString()}
                    </td>

                    {/* Price */}
                    <td className="py-2.5 text-right text-[#A1A1AA]">
                      {formatCryptoPrice(trade.priceUsd)}
                    </td>

                    {/* Maker */}
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-1 text-neutral-300">
                        <span>{trade.makerShort || shortenAddress(trade.makerAddress)}</span>
                        <button
                          onClick={() => handleCopy(trade.makerAddress, `maker-${trade.id}`)}
                          className="text-[#71717A] hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedId === `maker-${trade.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-2.5 text-right text-[#71717A]">
                      {timeLabel}
                    </td>

                    {/* Explorer Tx Link */}
                    <td className="py-2.5 text-right">
                      <a
                        href={`https://explorer.solana.com/tx/${trade.txSignature}?cluster=${network}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#71717A] hover:text-emerald-400 inline-flex items-center gap-0.5 transition-colors"
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
