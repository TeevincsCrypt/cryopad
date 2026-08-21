import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PlusCircle, 
  Coins,
  Activity,
  Layers,
  Sparkles,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { useTokenStore } from '../data/tokenStore';
import { useSolana } from '../solana/solanaContext';
import { Token } from '../types/token';
import { formatCompactNumber, formatCryptoPrice, SOL_PRICE_USD } from '../solana/bondingCurve';
import { LiveTradeFeed } from '../components/LiveTradeFeed';

interface DashboardProps {
  onSelectToken: (token: Token) => void;
  onNavigate: (page: string) => void;
  onOpenWalletModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectToken,
  onNavigate,
  onOpenWalletModal,
}) => {
  const { connected, balance, solPriceUsd, publicKey } = useSolana();
  const {
    getUserHoldings,
    getUserCreatedTokens,
    userTradeHistory,
    getAllCreatorTrades,
  } = useTokenStore();

  const [activeTab, setActiveTab] = useState<'holdings' | 'created' | 'trades' | 'activity'>('holdings');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const holdings = getUserHoldings();
  const createdTokens = getUserCreatedTokens();
  const creatorTrades = getAllCreatorTrades(publicKey || undefined);

  const currentSolPrice = solPriceUsd || SOL_PRICE_USD || 184;

  // Aggregate Portfolio stats
  const totalHoldingsSol = holdings.reduce((sum, h) => sum + h.currentValSol, 0);
  const totalPortfolioSol = balance + totalHoldingsSol;
  const totalPortfolioUsd = totalPortfolioSol * currentSolPrice;

  const totalCostSol = holdings.reduce((sum, h) => sum + h.totalCostSol, 0);
  const totalPnlSol = totalHoldingsSol - totalCostSol;
  const totalPnlPercent = totalCostSol > 0 ? (totalPnlSol / totalCostSol) * 100 : 0;
  const isPnlPositive = totalPnlSol >= 0;

  // Creator stats
  const totalCreatorVolumeSol = createdTokens.reduce((sum, t) => sum + t.volume24hSol, 0);
  const totalCreatorFeesSol = +(totalCreatorVolumeSol * 0.01).toFixed(3); // 1% creator royalty

  const handleClaimFees = () => {
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimSuccess(true);
      setTimeout(() => setClaimSuccess(false), 1200);
    }, 1200);
  };

  if (!connected) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700 shadow-xs">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Connect Your Solana Wallet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connect Phantom, Solflare, Backpack, or the Instant Devnet Sandbox to view your portfolio, token holdings, bundle snipe records, and creator royalties.
          </p>
        </div>
        <button
          onClick={onOpenWalletModal}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* Top Banner: Portfolio Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Net Worth</span>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900">
                ${formatCompactNumber(totalPortfolioUsd)}
              </span>
              <span className="font-mono text-base font-bold text-slate-500">
                {totalPortfolioSol.toFixed(3)} SOL
              </span>
            </div>
          </div>

          {/* PnL Pill */}
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border text-right font-mono ${
                isPnlPositive
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                Unrealized PnL
              </div>
              <div className="text-sm font-bold flex items-center gap-1">
                {isPnlPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPnlPositive ? '+' : ''}{totalPnlSol.toFixed(3)} SOL ({isPnlPositive ? '+' : ''}{totalPnlPercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">SOL Balance</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {balance.toFixed(3)} SOL
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              ≈ ${(balance * currentSolPrice).toFixed(2)} USD
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Token Holdings Value</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {totalHoldingsSol.toFixed(3)} SOL
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              {holdings.length} assets
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Tokens Launched</span>
            <span className="font-mono font-bold text-slate-900 text-base">
              {createdTokens.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              {totalCreatorVolumeSol.toFixed(1)} SOL total volume
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Creator Royalties</span>
            <span className="font-mono font-bold text-emerald-700 text-base">
              {totalCreatorFeesSol} SOL
            </span>
            <span className="text-[10px] text-emerald-600 font-mono block">
              ≈ ${(totalCreatorFeesSol * currentSolPrice).toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'holdings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            My Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'created'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            Launched Tokens ({createdTokens.length})
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trades'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Trades & Snipers ({creatorTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            Transaction History ({userTradeHistory.length})
          </button>
        </div>

        {/* TAB 1: HOLDINGS */}
        {activeTab === 'holdings' && (
          <div className="space-y-4">
            {holdings.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">No Token Holdings Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Buy tokens on the bonding curve or launch your own token to start building your portfolio.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Explore Bonding Curves
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holdings.map((h) => (
                  <div
                    key={h.tokenMint}
                    onClick={() => onSelectToken(h.token)}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer space-y-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={h.token.logoUrl}
                          alt={h.token.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{h.token.name}</div>
                          <div className="text-xs font-mono text-slate-500 font-bold">${h.token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-slate-900 block">
                          ${h.currentValUsd.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {h.currentValSol.toFixed(3)} SOL
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Token Balance</span>
                        <span className="font-bold text-slate-800">
                          {Math.floor(h.tokenBalance).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-sans">PnL</span>
                        <span className={`font-bold ${h.pnlSol >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {h.pnlSol >= 0 ? '+' : ''}{h.pnlSol.toFixed(3)} SOL ({h.pnlPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATED TOKENS */}
        {activeTab === 'created' && (
          <div className="space-y-4">
            {/* Creator Royalties Header Box */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Creator Earnings & Royalties</h4>
                <p className="text-xs text-slate-500">
                  You earn 1% on every trade performed on tokens you have deployed.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block">Accumulated Fees</span>
                  <span className="text-base font-bold text-emerald-700">{totalCreatorFeesSol} SOL</span>
                </div>

                <button
                  onClick={handleClaimFees}
                  disabled={claiming || totalCreatorFeesSol <= 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {claiming ? 'Claiming...' : claimSuccess ? 'Claimed!' : 'Claim Fees'}
                </button>
              </div>
            </div>

            {createdTokens.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">No Tokens Launched Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create and deploy your first Solana token on Swagpad with multi-wallet bundles.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('launch')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Launch Token Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdTokens.map((token) => (
                  <div
                    key={token.id}
                    onClick={() => onSelectToken(token)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer space-y-3 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={token.logoUrl}
                        alt={token.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{token.name}</div>
                        <div className="text-xs font-mono text-slate-500 font-bold">${token.symbol}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Curve Progress</span>
                        <span className="font-bold text-slate-900">{token.bondingProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, token.bondingProgress))}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-mono text-slate-500">
                      <span>Volume: {token.volume24hSol.toFixed(1)} SOL</span>
                      <span>Holders: {token.holdersCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE CREATOR TRADES STREAM */}
        {activeTab === 'trades' && (
          <div className="space-y-4">
            <LiveTradeFeed
              trades={creatorTrades}
              tokenSymbol="ALL"
              tokenName="Your Launched Tokens"
            />
          </div>
        )}

        {/* TAB 4: TRANSACTION HISTORY */}
        {activeTab === 'activity' && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Personal Transaction History</h4>
            {userTradeHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No transactions recorded in this session.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {userTradeHistory.map((trade) => (
                  <div
                    key={trade.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          trade.type === 'buy'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {trade.type}
                      </span>
                      <span className="text-slate-900 font-bold">
                        {trade.solAmount.toFixed(3)} SOL
                      </span>
                      <span className="text-slate-500">
                        for {Math.floor(trade.tokenAmount).toLocaleString()} tokens
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
