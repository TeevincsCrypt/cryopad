import React from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Token } from '../types/token';
import { TokenCard } from '../components/TokenCard';
import { formatCompactNumber, SOL_PRICE_USD } from '../solana/bondingCurve';

interface HomeProps {
  tokens: Token[];
  onNavigate: (page: string, param?: string) => void;
  onSelectToken: (token: Token) => void;
}

export const Home: React.FC<HomeProps> = ({ tokens, onNavigate, onSelectToken }) => {
  // Filter subsets
  const trendingTokens = [...tokens].sort((a, b) => b.volume24hSol - a.volume24hSol).slice(0, 3);
  const recentTokens = [...tokens].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const topGainers = [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h).slice(0, 3);

  const totalVolumeSol = tokens.reduce((acc, t) => acc + t.volume24hSol, 0);

  return (
    <div className="space-y-16 py-6 sm:py-10">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141418] to-[#0E0E10] border border-[#26262B] p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="max-w-3xl space-y-6">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-emerald-400/20" />
            <span>Solana High-Performance Bonding Curve Protocol</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Launch & Trade Solana Tokens with Instant Liquidity.
          </h1>

          {/* Subheading */}
          <p className="text-[#A1A1AA] text-sm sm:text-base leading-relaxed max-w-2xl">
            Fair-launch any SPL token in seconds. No seed liquidity required. Trade on an automated constant-product bonding curve that automatically deposits and burns LP on Raydium at 85 SOL.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('launch')}
              className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              Launch Token
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3.5 rounded-xl bg-[#18181C] hover:bg-[#222227] text-neutral-200 hover:text-white text-sm font-bold border border-[#2A2A30] flex items-center gap-2 transition-all cursor-pointer"
            >
              Explore Markets
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#1F1F23] text-xs">
          <div>
            <span className="text-[#71717A] block text-[11px]">24h Protocol Volume</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-white">
              {totalVolumeSol.toFixed(1)} SOL
            </span>
            <span className="text-[10px] font-mono text-[#A1A1AA] block">
              ≈ ${formatCompactNumber(totalVolumeSol * SOL_PRICE_USD)} USD
            </span>
          </div>

          <div>
            <span className="text-[#71717A] block text-[11px]">Live Tokens</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-white">
              {tokens.length + 140}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Verified SPL
            </span>
          </div>

          <div>
            <span className="text-[#71717A] block text-[11px]">Raydium Graduations</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-white">
              34
            </span>
            <span className="text-[10px] text-[#A1A1AA] font-mono">
              Liquidity Burned (100%)
            </span>
          </div>

          <div>
            <span className="text-[#71717A] block text-[11px]">Average Finality</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
              ~390 ms
            </span>
            <span className="text-[10px] text-[#A1A1AA] font-mono">
              Solana SVM Devnet
            </span>
          </div>
        </div>
      </section>

      {/* Trending Tokens Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <h2 className="text-lg sm:text-xl font-bold text-white">Trending Tokens</h2>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            View all ({tokens.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingTokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onClick={() => onSelectToken(token)}
            />
          ))}
        </div>
      </section>

      {/* Top Gainers & New Tokens Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Gainers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Top 24h Gainers</h3>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              More
            </button>
          </div>

          <div className="space-y-2.5">
            {topGainers.map((token) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="p-3.5 rounded-2xl bg-[#121215] hover:bg-[#16161A] border border-[#26262B] hover:border-[#3A3A42] cursor-pointer flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={token.logoUrl}
                    alt={token.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#2A2A30] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                      {token.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#A1A1AA]">
                      ${token.symbol} • MCap: ${formatCompactNumber(token.marketCapUsd)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    +{token.priceChange24h.toFixed(1)}%
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Launched */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-bold text-white">Recently Launched</h3>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              More
            </button>
          </div>

          <div className="space-y-2.5">
            {recentTokens.map((token) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="p-3.5 rounded-2xl bg-[#121215] hover:bg-[#16161A] border border-[#26262B] hover:border-[#3A3A42] cursor-pointer flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={token.logoUrl}
                    alt={token.name}
                    className="w-10 h-10 rounded-xl object-cover border border-[#2A2A30] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                      {token.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#A1A1AA]">
                      ${token.symbol} • Curve: {token.bondingProgress.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-neutral-300 font-semibold">
                    {token.solCollected.toFixed(1)} / 85 SOL
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* How It Works Section */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#0E0E10] border border-[#222227] space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How Fair Launch Bonding Curves Work
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA]">
            Guaranteed liquidity with zero team allocations or presale dumping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-[#141417] border border-[#26262B] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm border border-emerald-500/20">
              01
            </div>
            <h4 className="text-sm font-bold text-white">Create & Deploy</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Pick a token name, ticker, and image. Pay a nominal 0.02 SOL deployment fee. No initial capital or liquidity deposit required.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-[#141417] border border-[#26262B] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm border border-emerald-500/20">
              02
            </div>
            <h4 className="text-sm font-bold text-white">Trade with Constant Liquidity</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Anyone can buy and sell instantly on the bonding curve. The price rises as more SOL is deposited and falls as tokens are sold.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-[#141417] border border-[#26262B] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm border border-emerald-500/20">
              03
            </div>
            <h4 className="text-sm font-bold text-white">Raydium Graduation</h4>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Upon reaching the 85 SOL market cap threshold, all accumulated SOL and remaining tokens are transferred to Raydium CPMM and LP is permanently burned.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
