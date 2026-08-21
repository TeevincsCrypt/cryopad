import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, Twitter } from 'lucide-react';
import { Token } from '../types/token';
import { formatCryptoPrice } from '../solana/bondingCurve';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, token }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#token-${token.mintAddress}` : `https://swagpad.app/#token-${token.mintAddress}`;
  const tweetText = `Check out $${token.symbol} (${token.name}) launched on Swagpad! Price: ${formatCryptoPrice(token.priceUsd)} with ${token.bondingProgress.toFixed(1)}% bonding curve filled.`;
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden text-slate-800 space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Share Token</h3>
                <p className="text-xs text-slate-500">${token.symbol} • {token.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Token Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <img
              src={token.logoUrl}
              alt={token.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';
              }}
            />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm">{token.name} (${token.symbol})</div>
              <div className="text-xs text-slate-500 font-mono">
                MCap: {token.marketCapSol.toFixed(1)} SOL • Curve: {token.bondingProgress.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Direct Link Copy */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-600 font-semibold">Direct Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 select-all outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-1 gap-2 pt-1">
            <a
              href={twitterIntentUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Twitter className="w-4 h-4 fill-current" />
              Share on X / Twitter
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
