import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Users, CheckCircle, Zap } from 'lucide-react';
import { Token } from '../types/token';
import { formatCompactNumber } from '../solana/bondingCurve';

interface TokenCardProps {
  token: Token;
  onClick: () => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token, onClick }) => {
  const isGraduated = token.bondingProgress >= 100;
  const isPositive = token.priceChange24h >= 0;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 p-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden"
    >
      {/* Top row: Logo, Name, Symbol, 24h Change */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={token.logoUrl}
                alt={token.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-xs group-hover:border-emerald-500 transition-colors"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                }}
              />
              {isGraduated && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                  {token.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <span className="font-bold text-slate-800">${token.symbol}</span>
                {token.category && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans uppercase">
                    {token.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 24h Change Pill */}
          <div
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-mono font-bold shrink-0 ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {token.priceChange24h.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed h-8">
          {token.description}
        </p>

        {/* Market Data Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">Market Cap</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ${formatCompactNumber(token.marketCapUsd)}
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              {token.marketCapSol.toFixed(1)} SOL
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">24h Volume</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {token.volume24hSol.toFixed(1)} SOL
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              ${formatCompactNumber(token.volume24hUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bonding Curve Progress Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3 text-emerald-600" />
            {isGraduated ? 'Raydium Migrated' : 'Bonding Curve'}
          </span>
          <span className="font-mono font-bold text-slate-900">
            {token.bondingProgress.toFixed(1)}%
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGraduated ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, token.bondingProgress))}%` }}
          />
        </div>

        {/* Footer sub info */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            {token.holdersCount} holders
          </span>
          <span className="font-mono font-medium text-slate-600">
            {token.solCollected.toFixed(1)} / {token.solTarget} SOL
          </span>
        </div>
      </div>
    </motion.div>
  );
};
