import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Filter, 
  ArrowUpDown, 
  SlidersHorizontal,
  PlusCircle,
  Copy,
  Loader2,
} from 'lucide-react';
import { Token, TokenCategory } from '../types/token';
import { TokenCard } from '../components/TokenCard';
import { TokenTable } from '../components/TokenTable';
import { TrendingTokens } from '../components/TrendingTokens';
import { useTokenStore } from '../data/tokenStore';

interface ExploreProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  onNavigate: (page: string) => void;
}

type SortOption = 'market_cap' | 'volume' | 'change' | 'newest' | 'bonding_progress';

export const Explore: React.FC<ExploreProps> = ({ tokens, onSelectToken, onNavigate }) => {
  const { searchAndFetchCA } = useTokenStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [showTrendingCloner, setShowTrendingCloner] = useState<boolean>(true);
  const [isSearchingCA, setIsSearchingCA] = useState<boolean>(false);
  const [caSearchFound, setCaSearchFound] = useState<Token | null>(null);

  const categories: Array<{ id: TokenCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', label: 'All Tokens', icon: Filter },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'new', label: 'New Launches', icon: Sparkles },
    { id: 'graduating', label: 'Graduating', icon: Zap },
    { id: 'top_volume', label: 'Top Volume', icon: TrendingUp },
    { id: 'top_mcap', label: 'Top Market Cap', icon: ArrowUpDown },
  ];

  const tagOptions = ['all', 'ai', 'meme', 'defi', 'gaming', 'depin', 'utility'];

  // Real-time CA Lookup for Explore search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 32) {
      setCaSearchFound(null);
      setIsSearchingCA(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCA(true);
      try {
        const found = await searchAndFetchCA(trimmed);
        setCaSearchFound(found);
      } catch (e) {
        console.warn("Explore CA lookup notice:", e);
      } finally {
        setIsSearchingCA(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, searchAndFetchCA]);

  // Filter and Sort Pipeline
  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

    // If a CA was specifically found and isn't yet in list, ensure it's included at the top
    if (caSearchFound && !result.some((t) => t.mintAddress === caSearchFound.mintAddress)) {
      result.unshift(caSearchFound);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.mintAddress.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (selectedCategory === 'trending') {
      result = result.filter((t) => t.volume24hSol > 10 || t.bondingProgress > 15);
    } else if (selectedCategory === 'new') {
      result = result.filter((t) => Date.now() - t.createdAt < 1000 * 60 * 60 * 24);
    } else if (selectedCategory === 'graduating') {
      result = result.filter((t) => t.bondingProgress >= 50);
    }

    // Tag Filter
    if (tagFilter !== 'all') {
      result = result.filter((t) => t.category === tagFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'market_cap') return b.marketCapSol - a.marketCapSol;
      if (sortBy === 'volume') return b.volume24hSol - a.volume24hSol;
      if (sortBy === 'change') return b.priceChange24h - a.priceChange24h;
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'bonding_progress') return b.bondingProgress - a.bondingProgress;
      return 0;
    });

    return result;
  }, [tokens, searchQuery, selectedCategory, tagFilter, sortBy, caSearchFound]);

  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* Trending & Cloning Heatmap Section */}
      {showTrendingCloner && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 border border-emerald-200/80 shadow-xs space-y-6">
          <TrendingTokens
            onCloneToken={() => onNavigate('launch')}
            onSelectToken={onSelectToken}
          />
        </div>
      )}

      {/* Main Exploration Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Swagpad Bonding Curves
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time automated bonding curves on Solana. Discover freshly launched SPL tokens with verified immutable authorities.
          </p>
        </div>

        <button
          onClick={() => onNavigate('launch')}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          Launch & Bundle Token
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            {isSearchingCA ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token name, symbol ($SWAG), or paste Contract Address (CA)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
            />
            {isSearchingCA && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Searching On-Chain CA...
              </span>
            )}
          </div>

          {/* Sort & View Mode Switches */}
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-slate-800 outline-none font-semibold cursor-pointer"
              >
                <option value="volume">24h Volume</option>
                <option value="market_cap">Market Cap</option>
                <option value="change">24h Gainers</option>
                <option value="newest">Newest First</option>
                <option value="bonding_progress">Bonding Progress</option>
              </select>
            </div>

            {/* Grid / List Switcher */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-400 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sub-tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 text-xs font-semibold mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-emerald-600" /> Sector:
          </span>
          {tagOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`px-2.5 py-0.5 rounded-lg font-mono uppercase transition-colors cursor-pointer ${
                tagFilter === t
                  ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Display Area */}
      {filteredAndSortedTokens.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {isSearchingCA ? "Querying Solana Blockchain for Contract Address..." : "No tokens matched your filters"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isSearchingCA ? "Looking up on-chain mint and DEX liquidity pairs..." : "Try adjusting your search keywords or paste a 32-44 character Solana Contract Address (CA)."}
          </p>
          {!isSearchingCA && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setTagFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTokens.map((token) => (
            <TokenCard
              key={token.id}
              token={token}
              onClick={() => onSelectToken(token)}
            />
          ))}
        </div>
      ) : (
        <TokenTable
          tokens={filteredAndSortedTokens}
          onSelectToken={onSelectToken}
        />
      )}
    </div>
  );
};

