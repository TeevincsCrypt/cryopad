import React, { useState, useMemo } from 'react';
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
  PlusCircle
} from 'lucide-react';
import { Token, TokenCategory } from '../types/token';
import { TokenCard } from '../components/TokenCard';
import { TokenTable } from '../components/TokenTable';

interface ExploreProps {
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  onNavigate: (page: string) => void;
}

type SortOption = 'market_cap' | 'volume' | 'change' | 'newest' | 'bonding_progress';

export const Explore: React.FC<ExploreProps> = ({ tokens, onSelectToken, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TokenCategory>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('volume');

  const categories: Array<{ id: TokenCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'all', label: 'All Tokens', icon: Filter },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'new', label: 'New Launches', icon: Sparkles },
    { id: 'graduating', label: 'Graduating', icon: Zap },
    { id: 'top_volume', label: 'Top Volume', icon: TrendingUp },
    { id: 'top_mcap', label: 'Top Market Cap', icon: ArrowUpDown },
  ];

  const tagOptions = ['all', 'ai', 'meme', 'defi', 'gaming', 'depin', 'utility'];

  // Filter and Sort Pipeline
  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

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
      result = result.filter((t) => t.volume24hSol > 50);
    } else if (selectedCategory === 'new') {
      result = result.filter((t) => Date.now() - t.createdAt < 1000 * 60 * 60 * 6); // < 6 hours
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
  }, [tokens, searchQuery, selectedCategory, tagFilter, sortBy]);

  return (
    <div className="space-y-6 py-4 sm:py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explore Solana Tokens
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Real-time automated bonding curves on Solana. Discover freshly launched SPL tokens.
          </p>
        </div>

        <button
          onClick={() => onNavigate('launch')}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          Launch Token
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token name, symbol ($CYBER), or contract address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141417] border border-[#26262B] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-[#71717A] outline-none transition-all"
            />
          </div>

          {/* Sort & View Mode Switches */}
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141417] border border-[#26262B] text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-neutral-200 outline-none font-medium cursor-pointer"
              >
                <option value="volume" className="bg-[#141417] text-white">24h Volume</option>
                <option value="market_cap" className="bg-[#141417] text-white">Market Cap</option>
                <option value="change" className="bg-[#141417] text-white">24h Gainers</option>
                <option value="newest" className="bg-[#141417] text-white">Newest First</option>
                <option value="bonding_progress" className="bg-[#141417] text-white">Bonding Progress</option>
              </select>
            </div>

            {/* Grid / List Switcher */}
            <div className="flex items-center bg-[#141417] p-1 rounded-xl border border-[#26262B]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#222227] text-emerald-400' : 'text-[#71717A] hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#222227] text-emerald-400' : 'text-[#71717A] hover:text-white'
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
                    ? 'bg-[#222227] text-white border border-[#3A3A42] shadow-sm'
                    : 'bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#26262B] hover:border-[#3A3A42]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-[#71717A]'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sub-tags (AI, Meme, DeFi, Gaming, etc.) */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[#A1A1AA] text-xs font-medium mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Sector:
          </span>
          {tagOptions.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`px-2.5 py-0.5 rounded-lg font-mono uppercase transition-colors cursor-pointer ${
                tagFilter === t
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#26262B]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Display Area */}
      {filteredAndSortedTokens.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#121215] border border-[#26262B] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#18181C] border border-[#26262B] flex items-center justify-center mx-auto text-[#71717A]">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No tokens matched your filters</h3>
          <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
            Try adjusting your search keywords or switching back to the "All Tokens" tab.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setTagFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#18181C] hover:bg-[#222227] text-white text-xs font-semibold border border-[#26262B] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
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
