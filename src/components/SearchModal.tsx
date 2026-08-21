import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Loader2, Sparkles, Zap, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Token } from '../types/token';
import { useTokenStore } from '../data/tokenStore';
import { formatCompactNumber, formatCryptoPrice } from '../solana/bondingCurve';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  onCloneToken?: (token: Partial<Token>) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectToken,
  onCloneToken,
}) => {
  const { tokens, searchAndFetchCA, setClonedTokenDraft } = useTokenStore();
  const [query, setQuery] = useState('');
  const [isSearchingOnChain, setIsSearchingOnChain] = useState(false);
  const [onChainToken, setOnChainToken] = useState<Token | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setOnChainToken(null);
      setIsSearchingOnChain(false);
      setSearchAttempted(false);
    }
  }, [isOpen]);

  // Real-time CA detection & On-Chain Lookup
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setOnChainToken(null);
      setIsSearchingOnChain(false);
      return;
    }

    const looksLikeCA = trimmed.length >= 32;

    const timer = setTimeout(async () => {
      if (looksLikeCA) {
        setIsSearchingOnChain(true);
        setSearchAttempted(true);
        try {
          const res = await searchAndFetchCA(trimmed);
          setOnChainToken(res);
        } catch (e) {
          console.warn("CA lookup notice:", e);
        } finally {
          setIsSearchingOnChain(false);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, searchAndFetchCA]);

  if (!isOpen) return null;

  const filtered = tokens.filter((t) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.mintAddress.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  });

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    onClose();
  };

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (filtered.length > 0) {
      handleSelect(filtered[0]);
      return;
    }

    setIsSearchingOnChain(true);
    setSearchAttempted(true);
    try {
      const res = await searchAndFetchCA(trimmed);
      if (res) {
        setOnChainToken(res);
        handleSelect(res);
      }
    } catch (e) {
      console.warn("Manual CA search notice:", e);
    } finally {
      setIsSearchingOnChain(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800 divide-y divide-slate-100"
        >
          {/* Input Bar */}
          <form onSubmit={handleManualSearchSubmit} className="p-4 flex items-center gap-3 bg-slate-50">
            {isSearchingOnChain ? (
              <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
            ) : (
              <Search className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Solana tokens, tickers ($SWAG), or paste Contract Address (CA)..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-semibold"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setOnChainToken(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-500 font-bold">
              ESC
            </kbd>
          </form>

          {/* On-Chain Searching Indicator */}
          {isSearchingOnChain && (
            <div className="px-4 py-2.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
              <span className="flex items-center gap-2 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                Querying Solana on-chain DEX pairs for Contract Address...
              </span>
              <span className="font-mono text-[10px] text-emerald-600">Live RPC / DexScreener</span>
            </div>
          )}

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {/* If an on-chain token was specifically resolved and not yet in top filtered list */}
            {onChainToken && !filtered.some((t) => t.mintAddress === onChainToken.mintAddress) && (
              <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-emerald-600" /> Live On-Chain Token Found
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">
                    {onChainToken.mintAddress}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect(onChainToken)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white hover:bg-emerald-100/50 transition-colors text-left cursor-pointer border border-emerald-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={onChainToken.logoUrl}
                      alt={onChainToken.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {onChainToken.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                          ${onChainToken.symbol}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        MCap: ${formatCompactNumber(onChainToken.marketCapUsd)} • Vol: {onChainToken.volume24hSol.toFixed(1)} SOL
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700">Open Details</span>
                    <ArrowRight className="w-4 h-4 text-emerald-700" />
                  </div>
                </button>
              </div>
            )}

            {filtered.length === 0 && !onChainToken ? (
              <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-2">
                <div>No tokens found matching "{query}"</div>
                {query.length >= 30 && (
                  <div className="text-emerald-700 font-mono text-[11px]">
                    Tip: Press Enter to perform a direct live on-chain Solana query for this Contract Address.
                  </div>
                )}
              </div>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleSelect(token)}
                  className="w-full p-2.5 rounded-xl hover:bg-emerald-50/50 flex items-center justify-between group transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={token.logoUrl}
                      alt={token.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                          {token.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          ${token.symbol}
                        </span>
                        {token.isCreatedByUser && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                            You Launched
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">
                        MCap: ${formatCompactNumber(token.marketCapUsd)} • Curve: {token.bondingProgress.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {formatCryptoPrice(token.priceUsd)}
                      </div>
                      <div className={`text-[10px] font-bold ${token.priceChange24h >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-colors" />
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

