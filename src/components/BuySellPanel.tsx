import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Settings2, AlertTriangle, CheckCircle2, Wallet, ExternalLink, ShieldCheck } from 'lucide-react';
import { Token } from '../types/token';
import { useSolana } from '../solana/solanaContext';
import { useTokenStore } from '../data/tokenStore';
import { 
  calculateTokensForSol, 
  calculateSolForTokens, 
  formatCryptoPrice, 
  SOL_PRICE_USD 
} from '../solana/bondingCurve';

interface BuySellPanelProps {
  token: Token;
  onOpenWalletModal: () => void;
}

export const BuySellPanel: React.FC<BuySellPanelProps> = ({ token, onOpenWalletModal }) => {
  const { connected, balance, network } = useSolana();
  const { executeTrade } = useTokenStore();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [solAmount, setSolAmount] = useState<string>('0.1');
  const [tokenAmount, setTokenAmount] = useState<string>('10000');
  const [slippage, setSlippage] = useState<number>(1.0);
  const [priorityFee, setPriorityFee] = useState<'normal' | 'turbo' | 'ultra'>('turbo');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Real-time calculation for Buy
  const buyQuote = useMemo(() => {
    const parsedSol = parseFloat(solAmount) || 0;
    return calculateTokensForSol(parsedSol, token.solCollected || 1);
  }, [solAmount, token.solCollected]);

  // Real-time calculation for Sell
  const sellQuote = useMemo(() => {
    const parsedTokens = parseFloat(tokenAmount) || 0;
    return calculateSolForTokens(parsedTokens, token.solCollected || 1);
  }, [tokenAmount, token.solCollected]);

  const handleQuickSol = (val: number) => {
    setSolAmount(val.toString());
    setErrorMsg(null);
  };

  const handleMaxSol = () => {
    const safeMax = Math.max(0, balance - 0.01);
    setSolAmount(safeMax.toFixed(3));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setTxSignature(null);

    if (!connected) {
      onOpenWalletModal();
      return;
    }

    setLoading(true);

    try {
      if (mode === 'buy') {
        const parsedSol = parseFloat(solAmount);
        if (!parsedSol || parsedSol <= 0) {
          throw new Error('Enter a valid SOL amount');
        }
        if (parsedSol > balance) {
          throw new Error(`Insufficient SOL balance (${balance.toFixed(3)} SOL)`);
        }

        const res = await executeTrade({
          tokenMint: token.mintAddress || token.id,
          type: 'buy',
          solAmount: parsedSol,
          tokenAmount: buyQuote.tokensOut,
        });

        setTxSignature(res.signature);
      } else {
        const parsedTokens = parseFloat(tokenAmount);
        if (!parsedTokens || parsedTokens <= 0) {
          throw new Error('Enter a valid token amount');
        }

        const res = await executeTrade({
          tokenMint: token.mintAddress || token.id,
          type: 'sell',
          solAmount: sellQuote.solOut,
          tokenAmount: parsedTokens,
        });

        setTxSignature(res.signature);
      }
    } catch (err: any) {
      console.error('Trade execution failed:', err);
      setErrorMsg(err.message || 'Transaction failed or rejected by wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#121215] border border-[#26262B] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Mode Switcher Tabs + Settings */}
      <div className="flex items-center justify-between pb-3 border-b border-[#26262B]">
        <div className="flex items-center bg-[#18181C] p-1 rounded-xl border border-[#26262B]">
          <button
            onClick={() => {
              setMode('buy');
              setErrorMsg(null);
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              mode === 'buy'
                ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => {
              setMode('sell');
              setErrorMsg(null);
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              mode === 'sell'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showSettings
              ? 'bg-[#222227] border-emerald-500/40 text-emerald-400'
              : 'bg-[#18181C] border-[#26262B] text-[#A1A1AA] hover:text-white'
          }`}
          title="Slippage & Priority Fee Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3.5 rounded-xl bg-[#18181C] border border-[#26262B] space-y-3 text-xs"
        >
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-300 font-medium">
              <span>Slippage Tolerance</span>
              <span className="font-mono text-emerald-400">{slippage}%</span>
            </div>
            <div className="flex gap-1.5">
              {[0.5, 1.0, 2.5, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                    slippage === s
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#141417] border-[#26262B] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-neutral-300 font-medium">
              <span>MEV / Priority Fee</span>
              <span className="font-mono text-[#71717A]">
                {priorityFee === 'normal' ? '0.0001 SOL' : priorityFee === 'turbo' ? '0.001 SOL' : '0.005 SOL'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(['normal', 'turbo', 'ultra'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFee(p)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-medium capitalize border transition-colors cursor-pointer ${
                    priorityFee === p
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#141417] border-[#26262B] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'buy' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">You Pay (SOL)</span>
              <span className="font-mono text-[#71717A]">
                Bal: <strong className="text-neutral-200">{balance.toFixed(3)} SOL</strong>
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={solAmount}
                onChange={(e) => {
                  setSolAmount(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="0.0"
                className="w-full px-4 py-3 rounded-xl bg-[#18181C] border border-[#26262B] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white font-mono text-lg font-bold placeholder-[#71717A] outline-none pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#222227] border border-[#3A3A42] text-xs font-mono font-bold text-white">
                <span>SOL</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              {[0.1, 0.5, 1.0, 5.0].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickSol(val)}
                  className="flex-1 py-1 rounded-lg bg-[#18181C] hover:bg-[#222227] border border-[#26262B] hover:border-[#3A3A42] text-[11px] font-mono text-[#A1A1AA] hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  {val} SOL
                </button>
              ))}
              <button
                type="button"
                onClick={handleMaxSol}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 font-bold transition-colors cursor-pointer"
              >
                MAX
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span>Estimated Receive</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ≈ {Math.floor(buyQuote.tokensOut).toLocaleString()} ${token.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                <span>Value</span>
                <span>≈ ${(parseFloat(solAmount || '0') * SOL_PRICE_USD).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">You Sell ({token.symbol})</span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={tokenAmount}
                onChange={(e) => {
                  setTokenAmount(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl bg-[#18181C] border border-[#26262B] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white font-mono text-lg font-bold placeholder-[#71717A] outline-none pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#222227] border border-[#3A3A42] text-xs font-mono font-bold text-white">
                <span>${token.symbol}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#A1A1AA]">
                <span>Estimated Return</span>
                <span className="font-bold text-rose-400 font-mono text-sm">
                  ≈ {sellQuote.solOut.toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                <span>Value</span>
                <span>≈ ${(sellQuote.solOut * SOL_PRICE_USD).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-[#1F1F23] space-y-1 text-[11px] font-mono text-[#71717A]">
          <div className="flex justify-between">
            <span>Price per Token</span>
            <span className="text-neutral-200">{formatCryptoPrice(token.priceUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span>Program Protocol</span>
            <span className="text-emerald-400 font-mono">Pump.fun On-Chain</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {txSignature && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transaction Confirmed On-Chain</span>
            </div>
            <div className="font-mono text-[11px] flex items-center justify-between text-[#A1A1AA]">
              <span>Explorer:</span>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                {txSignature.slice(0, 8)}...{txSignature.slice(-6)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {!connected ? (
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="w-full py-3.5 rounded-xl bg-[#18181C] hover:bg-[#222227] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#26262B]"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            Connect Solana Wallet to Trade
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition-all shadow-lg cursor-pointer disabled:opacity-50 ${
              mode === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 shadow-emerald-500/10'
                : 'bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-white shadow-rose-500/10'
            }`}
          >
            {loading
              ? 'Awaiting Wallet Approval & Broadcasting...'
              : mode === 'buy'
              ? `Place Buy Order (${solAmount || '0'} SOL)`
              : `Place Sell Order (${tokenAmount || '0'} Tokens)`}
          </button>
        )}
      </form>
    </div>
  );
};
