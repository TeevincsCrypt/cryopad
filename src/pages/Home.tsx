import React from 'react';
import { 
  Flame, 
  ArrowRight, 
  PlusCircle, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  ArrowUpRight,
  Layers,
  ShieldCheck,
  Coins
} from 'lucide-react';
import { Token } from '../types/token';
import { TokenCard } from '../components/TokenCard';
import { TwitterLiveFeed } from '../components/TwitterLiveFeed';
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
    <div className="space-y-16 py-8 sm:py-12">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-slate-50 border border-slate-200 p-8 sm:p-12 lg:p-16 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative max-w-3xl space-y-6">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Swagpad Solana Launchpad & 10-Wallet Bundler</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Launch & Snipe Solana Tokens with 10-Wallet Bundles.
          </h1>

          {/* Subheading */}
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
            Fair-launch authentic SPL tokens on the Pump.fun bonding curve in seconds. Configure up to 10 sniper wallets prior to launch to secure initial allocations atomically.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('launch')}
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-extrabold flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              Launch & Bundle Token
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold border border-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              Explore Live Markets
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Stats Grid Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-slate-500 block text-[11px]">24h Protocol Volume</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              {totalVolumeSol.toFixed(1)} SOL
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              ≈ ${formatCompactNumber(totalVolumeSol * SOL_PRICE_USD)} USD
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Live Tokens</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
              {tokens.length + 140}
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified SPL
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Bundle Max</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700">
              10 Wallets
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Simultaneous Block 0
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Average Finality</span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700">
              ~390 ms
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Solana SVM Devnet
            </span>
          </div>
        </div>
      </section>

      {/* Live Twitter / X Meme Radar Feed */}
      <section>
        <TwitterLiveFeed onNavigate={onNavigate} />
      </section>

      {/* Trending Tokens Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Trending Tokens</h2>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
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
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Top 24h Gainers</h3>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
            >
              More
            </button>
          </div>

          <div className="space-y-2.5">
            {topGainers.map((token) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer flex items-center justify-between transition-all group shadow-xs hover:border-emerald-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={token.logoUrl}
                    alt={token.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                      {token.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      ${token.symbol} • MCap: ${formatCompactNumber(token.marketCapUsd)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    +{token.priceChange24h.toFixed(1)}%
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Launched */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Recently Launched</h3>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
            >
              More
            </button>
          </div>

          <div className="space-y-2.5">
            {recentTokens.map((token) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer flex items-center justify-between transition-all group shadow-xs hover:border-emerald-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={token.logoUrl}
                    alt={token.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                      {token.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      ${token.symbol} • Curve: {token.bondingProgress.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-xs text-slate-700 font-semibold">
                    {token.solCollected.toFixed(1)} / 85 SOL
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* How It Works Section */}
      <section className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 space-y-8 shadow-xs">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How Swagpad Multi-Wallet Bundles Work
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Fair launch on Solana with up to 10 sniper wallets configured before launch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-sm border border-emerald-200">
              01
            </div>
            <h4 className="text-sm font-bold text-slate-900">Configure 1-10 Wallets</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Auto-generate or import up to 10 sniper wallets. Set custom or distributed SOL buy amounts and fund them before launch.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-sm border border-emerald-200">
              02
            </div>
            <h4 className="text-sm font-bold text-slate-900">Simultaneous Block 0 Snipe</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you press Deploy, the token is created on the Pump.fun bonding curve and all 10 wallets execute their initial buys.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-bold flex items-center justify-center text-sm border border-emerald-200">
              03
            </div>
            <h4 className="text-sm font-bold text-slate-900">Export Keys & Trade</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export your private keys JSON backup anytime to manage tokens or sell directly across decentralized exchanges.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
