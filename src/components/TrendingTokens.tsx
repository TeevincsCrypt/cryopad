import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Copy,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useTokenStore, TrendingToken } from '../data/tokenStore';
import { Token } from '../types/token';

interface TrendingTokensProps {
  onCloneToken?: (token: Partial<Token>) => void;
  onSelectToken?: (token: Token) => void;
}

export const TrendingTokens: React.FC<TrendingTokensProps> = ({
  onCloneToken,
  onSelectToken,
}) => {
  const { trendingTokens, setClonedTokenDraft, solPriceUsd } = useTokenStore();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [clonedSuccessId, setClonedSuccessId] = useState<string | null>(null);

  const categories = ['all', 'AI Agent', 'Meme', 'DePIN', 'Animal', 'Community'];

  const filteredTrending = useMemo(() => {
    if (selectedFilter === 'all') return trendingTokens;
    return trendingTokens.filter(
      (t) => t.category?.toLowerCase() === selectedFilter.toLowerCase()
    );
  }, [trendingTokens, selectedFilter]);

  const handleClone = (tok: TrendingToken) => {
    const draft: Partial<Token> = {
      name: tok.name,
      symbol: tok.symbol,
      description: tok.description,
      logoUrl: tok.image,
      clonedFrom: {
        name: tok.name,
        symbol: tok.symbol,
        mint: tok.mint,
      },
      socials: {
        twitter: tok.twitter,
        telegram: tok.telegram,
        website: tok.website,
      },
    };

    setClonedTokenDraft(draft);
    setClonedSuccessId(tok.id);
    setTimeout(() => setClonedSuccessId(null), 3000);

    if (onCloneToken) {
      onCloneToken(draft);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
            Live Market Heatmap & Token Cloner
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Trending Solana Tokens
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Explore hot tokens across Solana & Pump.fun. 1-Click clone metadata and launch your own version with 10-wallet bundling on Swagpad!
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? '🔥 All Trending' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Trending Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrending.map((token) => (
          <div
            key={token.id}
            className="group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Top row */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={token.image}
                    alt={token.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {token.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        ${token.symbol}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {token.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                      token.priceChange24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {token.priceChange24h >= 0 ? '+' : ''}
                    {token.priceChange24h.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">24h Vol</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {token.description}
              </p>

              {/* Bonding Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-500">Bonding Curve:</span>
                  <span className="font-bold text-emerald-700">{token.bondingProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${Math.min(100, token.bondingProgress)}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Market Cap</span>
                  <span className="font-bold text-slate-800">
                    ${(token.marketCapUsd / 1000).toFixed(1)}K
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">24h Volume</span>
                  <span className="font-bold text-slate-800">
                    {token.volume24hSol.toFixed(1)} SOL
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {token.mint && (
                <a
                  href={`https://pump.fun/coin/${token.mint}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  On-chain Dex <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <button
                type="button"
                onClick={() => handleClone(token)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                  clonedSuccessId === token.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {clonedSuccessId === token.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cloned to Launch!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Clone & Launch
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
