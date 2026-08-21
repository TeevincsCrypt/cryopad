import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Settings2, AlertTriangle, CheckCircle2, Wallet, ExternalLink } from 'lucide-react';
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
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Mode Switcher Tabs + Settings */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setMode('buy');
              setErrorMsg(null);
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              mode === 'buy'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SELL
          </button>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showSettings
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
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
          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
        >
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>Slippage Tolerance</span>
              <span className="font-mono text-emerald-700">{slippage}%</span>
            </div>
            <div className="flex gap-1.5">
              {[0.5, 1.0, 2.5, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    slippage === s
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-slate-700 font-semibold">
              <span>MEV / Priority Fee</span>
              <span className="font-mono text-slate-500">
                {priorityFee === 'normal' ? '0.0001 SOL' : priorityFee === 'turbo' ? '0.001 SOL' : '0.005 SOL'}
              </span>
            </div>
            <div className="flex gap-1.5">
              {(['normal', 'turbo', 'ultra'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFee(p)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold capitalize border transition-colors cursor-pointer ${
                    priorityFee === p
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
              <span className="text-slate-600 font-semibold">You Pay (SOL)</span>
              <span className="font-mono text-slate-500">
                Bal: <strong className="text-slate-900 font-bold">{balance.toFixed(3)} SOL</strong>
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
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-900 font-mono text-lg font-bold placeholder-slate-400 outline-none pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200 text-xs font-mono font-bold text-slate-800">
                <span>SOL</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              {[0.1, 0.5, 1.0, 5.0].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickSol(val)}
                  className="flex-1 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  {val} SOL
                </button>
              ))}
              <button
                type="button"
                onClick={handleMaxSol}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 text-[11px] font-mono text-emerald-800 font-bold transition-colors cursor-pointer"
              >
                MAX
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Estimated Receive</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  ≈ {Math.floor(buyQuote.tokensOut).toLocaleString()} ${token.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Value</span>
                <span>≈ ${(parseFloat(solAmount || '0') * SOL_PRICE_USD).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">You Sell ({token.symbol})</span>
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
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white text-slate-900 font-mono text-lg font-bold placeholder-slate-400 outline-none pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200 text-xs font-mono font-bold text-slate-800">
                <span>${token.symbol}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Estimated Return</span>
                <span className="font-bold text-rose-700 font-mono text-sm">
                  ≈ {sellQuote.solOut.toFixed(4)} SOL
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Value</span>
                <span>≈ ${(sellQuote.solOut * SOL_PRICE_USD).toFixed(2)} USD</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono text-slate-500">
          <div className="flex justify-between">
            <span>Price per Token</span>
            <span className="text-slate-800 font-bold">{formatCryptoPrice(token.priceUsd)}</span>
          </div>
          <div className="flex justify-between">
            <span>Program Protocol</span>
            <span className="text-emerald-700 font-bold">Pump.fun On-Chain</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {txSignature && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Transaction Confirmed On-Chain</span>
            </div>
            <div className="font-mono text-[11px] flex items-center justify-between text-slate-600">
              <span>Explorer:</span>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=${network}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
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
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            Connect Solana Wallet to Trade
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 ${
              mode === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-500/20'
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
