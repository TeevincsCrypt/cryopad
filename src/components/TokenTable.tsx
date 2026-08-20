import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { Token } from '../types/token';
import { formatCompactNumber, formatCryptoPrice } from '../solana/bondingCurve';

interface TokenTableProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export const TokenTable: React.FC<TokenTableProps> = ({ tokens, onSelectToken }) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#26262B] bg-[#121215] shadow-xl">
      <table className="w-full text-left text-xs text-[#EDEDED]">
        <thead className="bg-[#18181C] text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider border-b border-[#26262B]">
          <tr>
            <th className="py-3.5 px-4">#</th>
            <th className="py-3.5 px-4">Token</th>
            <th className="py-3.5 px-4 text-right">Price</th>
            <th className="py-3.5 px-4 text-right">24h Change</th>
            <th className="py-3.5 px-4 text-right">Market Cap</th>
            <th className="py-3.5 px-4 text-right">24h Volume</th>
            <th className="py-3.5 px-4 text-center">Bonding Curve</th>
            <th className="py-3.5 px-4 text-right">Holders</th>
            <th className="py-3.5 px-4 text-right">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#1F1F23]">
          {tokens.map((token, index) => {
            const isPositive = token.priceChange24h >= 0;
            const isGraduated = token.bondingProgress >= 100;

            return (
              <tr
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="hover:bg-[#18181C]/60 cursor-pointer transition-colors group"
              >
                {/* Index */}
                <td className="py-3.5 px-4 font-mono text-[#71717A] text-xs">
                  {index + 1}
                </td>

                {/* Token Info */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={token.logoUrl}
                      alt={token.name}
                      className="w-9 h-9 rounded-xl object-cover border border-[#2A2A30] bg-[#18181C] shrink-0 group-hover:border-emerald-500/40 transition-colors"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {token.name}
                        </span>
                        {isGraduated && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#A1A1AA]">
                        <span className="font-semibold text-neutral-200">${token.symbol}</span>
                        {token.category && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#1C1C21] text-[#A1A1AA] uppercase">
                            {token.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="py-3.5 px-4 text-right font-mono">
                  <div className="font-semibold text-white">
                    {formatCryptoPrice(token.priceUsd)}
                  </div>
                  <div className="text-[10px] text-[#A1A1AA]">
                    {token.priceSol.toFixed(8)} SOL
                  </div>
                </td>

                {/* 24h Change */}
                <td className="py-3.5 px-4 text-right font-mono">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold ${
                      isPositive
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? '+' : ''}
                    {token.priceChange24h.toFixed(1)}%
                  </span>
                </td>

                {/* Market Cap */}
                <td className="py-3.5 px-4 text-right font-mono">
                  <div className="font-bold text-white">
                    ${formatCompactNumber(token.marketCapUsd)}
                  </div>
                  <div className="text-[10px] text-[#A1A1AA]">
                    {token.marketCapSol.toFixed(1)} SOL
                  </div>
                </td>

                {/* Volume */}
                <td className="py-3.5 px-4 text-right font-mono">
                  <div className="font-medium text-neutral-200">
                    {token.volume24hSol.toFixed(1)} SOL
                  </div>
                  <div className="text-[10px] text-[#A1A1AA]">
                    ${formatCompactNumber(token.volume24hUsd)}
                  </div>
                </td>

                {/* Bonding Curve Progress */}
                <td className="py-3.5 px-4 min-w-[140px]">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#A1A1AA]">
                        {isGraduated ? 'Raydium Pool' : `${token.solCollected.toFixed(1)}/85 SOL`}
                      </span>
                      <span className="font-bold text-white">
                        {token.bondingProgress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1C1C21] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isGraduated ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, token.bondingProgress))}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Holders */}
                <td className="py-3.5 px-4 text-right font-mono text-neutral-300">
                  {token.holdersCount}
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectToken(token);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#18181C] hover:bg-emerald-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold transition-all inline-flex items-center gap-1 group-hover:bg-[#222227] cursor-pointer"
                  >
                    Trade <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
