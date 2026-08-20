import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Users, Flame, CheckCircle, Zap } from 'lucide-react';
import { Token } from '../types/token';
import { formatCompactNumber, formatCryptoPrice } from '../solana/bondingCurve';

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
      className="group relative cursor-pointer rounded-2xl bg-[#121215] hover:bg-[#16161A] border border-[#26262B] hover:border-[#3A3A42] p-4 transition-all shadow-sm hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between overflow-hidden"
    >
      {/* Top row: Logo, Name, Symbol, 24h Change */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={token.logoUrl}
                alt={token.name}
                className="w-11 h-11 rounded-xl object-cover border border-[#2A2A30] bg-[#18181C] shadow-inner group-hover:border-emerald-500/40 transition-colors"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                }}
              />
              {isGraduated && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow">
                  <CheckCircle className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">
                  {token.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] font-mono">
                <span className="font-semibold text-neutral-200">${token.symbol}</span>
                {token.category && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1C1C21] text-[#A1A1AA] font-sans uppercase">
                    {token.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 24h Change Pill */}
          <div
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-mono font-semibold shrink-0 ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
        <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed h-8">
          {token.description}
        </p>

        {/* Market Data Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F23] text-xs">
          <div>
            <span className="text-[11px] text-[#71717A] block">Market Cap</span>
            <span className="font-mono font-bold text-white text-sm">
              ${formatCompactNumber(token.marketCapUsd)}
            </span>
            <span className="text-[10px] font-mono text-[#A1A1AA] block">
              {token.marketCapSol.toFixed(1)} SOL
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#71717A] block">24h Volume</span>
            <span className="font-mono font-semibold text-white text-sm">
              {token.volume24hSol.toFixed(1)} SOL
            </span>
            <span className="text-[10px] font-mono text-[#A1A1AA] block">
              ${formatCompactNumber(token.volume24hUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bonding Curve Progress Bar */}
      <div className="mt-4 pt-3 border-t border-[#1F1F23] space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#A1A1AA] flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3 text-emerald-400" />
            {isGraduated ? 'Raydium Migrated' : 'Bonding Curve'}
          </span>
          <span className="font-mono font-bold text-white">
            {token.bondingProgress.toFixed(1)}%
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#1C1C21] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGraduated ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, token.bondingProgress))}%` }}
          />
        </div>

        {/* Footer sub info */}
        <div className="flex items-center justify-between text-[10px] text-[#71717A] pt-0.5">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[#71717A]" />
            {token.holdersCount} holders
          </span>
          <span className="font-mono">
            {token.solCollected.toFixed(1)} / {token.solTarget} SOL
          </span>
        </div>
      </div>
    </motion.div>
  );
};
