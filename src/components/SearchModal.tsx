import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { Token } from '../types/token';
import { useTokenStore } from '../data/tokenStore';
import { formatCompactNumber, formatCryptoPrice } from '../solana/bondingCurve';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectToken }) => {
  const { tokens } = useTokenStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="relative w-full max-w-xl bg-[#121215] border border-[#26262B] rounded-2xl shadow-2xl overflow-hidden text-[#E5E5E5] divide-y divide-[#26262B]"
        >
          {/* Input Bar */}
          <div className="p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Solana tokens, tickers ($CYBER), or mint address..."
              className="w-full bg-transparent text-sm text-white placeholder-[#71717A] outline-none font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-[#71717A] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-[#18181C] rounded border border-[#26262B] text-[#71717A]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                No tokens found matching "{query}"
              </div>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.id}
                  onClick={() => {
                    onSelectToken(token);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-[#18181C] flex items-center justify-between group transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={token.logoUrl}
                      alt={token.name}
                      className="w-9 h-9 rounded-xl object-cover border border-[#26262B] shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate group-hover:text-emerald-400 transition-colors">
                          {token.name}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#71717A]">
                          ${token.symbol}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A] truncate">
                        MCap: ${formatCompactNumber(token.marketCapUsd)} • Curve: {token.bondingProgress.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {formatCryptoPrice(token.priceUsd)}
                      </div>
                      <div className={`text-[10px] ${token.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-emerald-400 transition-colors" />
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
