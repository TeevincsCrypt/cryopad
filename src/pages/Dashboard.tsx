import React, { useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  PlusCircle, 
  DollarSign, 
  Coins,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useTokenStore } from '../data/tokenStore';
import { useSolana } from '../solana/solanaContext';
import { Token } from '../types/token';
import { formatCompactNumber, formatCryptoPrice, SOL_PRICE_USD } from '../solana/bondingCurve';

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
  const { connected, balance, publicKey } = useSolana();
  const { getUserHoldings, getUserCreatedTokens, userTradeHistory } = useTokenStore();
  const [activeTab, setActiveTab] = useState<'holdings' | 'created' | 'activity'>('holdings');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const holdings = getUserHoldings();
  const createdTokens = getUserCreatedTokens();

  // Aggregate Portfolio stats
  const totalHoldingsSol = holdings.reduce((sum, h) => sum + h.currentValSol, 0);
  const totalPortfolioSol = balance + totalHoldingsSol;
  const totalPortfolioUsd = totalPortfolioSol * SOL_PRICE_USD;

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
      setTimeout(() => setClaimSuccess(false), 3000);
    }, 1200);
  };

  if (!connected) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#121215] border border-[#26262B] flex items-center justify-center mx-auto text-emerald-400">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">Connect Your Solana Wallet</h2>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Connect Phantom, Solflare, Backpack, or the Instant Devnet Sandbox to view your portfolio, token holdings, and created token royalties.
          </p>
        </div>
        <button
          onClick={onOpenWalletModal}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-extrabold transition-all shadow-md cursor-pointer"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 sm:py-8">
      
      {/* Top Banner: Portfolio Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121215] border border-[#26262B] space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#71717A] font-medium block">Total Net Worth</span>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                ${formatCompactNumber(totalPortfolioUsd)}
              </span>
              <span className="font-mono text-base font-bold text-[#A1A1AA]">
                {totalPortfolioSol.toFixed(3)} SOL
              </span>
            </div>
          </div>

          {/* PnL Pill */}
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border text-right font-mono ${
                isPnlPositive
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-[#71717A] font-sans">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#1F1F23] text-xs">
          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">SOL Balance</span>
            <span className="font-mono font-bold text-white text-base">
              {balance.toFixed(3)} SOL
            </span>
            <span className="text-[10px] text-[#71717A] font-mono block">
              ≈ ${(balance * SOL_PRICE_USD).toFixed(2)} USD
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Token Holdings Value</span>
            <span className="font-mono font-bold text-white text-base">
              {totalHoldingsSol.toFixed(3)} SOL
            </span>
            <span className="text-[10px] text-[#71717A] font-mono block">
              {holdings.length} assets
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Tokens Launched</span>
            <span className="font-mono font-bold text-white text-base">
              {createdTokens.length}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono block">
              Creator Account
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Claimable Creator Fees</span>
            <span className="font-mono font-bold text-emerald-400 text-base">
              {totalCreatorFeesSol} SOL
            </span>
            <span className="text-[10px] text-[#71717A] font-mono block">
              1% Protocol Share
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-[#26262B] w-fit text-xs">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'holdings' ? 'bg-[#222227] text-emerald-400 shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Token Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab('created')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'created' ? 'bg-[#222227] text-emerald-400 shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Created Tokens ({createdTokens.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeTab === 'activity' ? 'bg-[#222227] text-emerald-400 shadow-sm' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            Activity Logs ({userTradeHistory.length})
          </button>
        </div>

        {/* TAB 1: TOKEN HOLDINGS */}
        {activeTab === 'holdings' && (
          <div>
            {holdings.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#121215] border border-[#26262B] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#18181C] border border-[#26262B] flex items-center justify-center mx-auto text-neutral-500">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No Token Holdings Yet</h4>
                  <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                    Buy tokens on the bonding curve or launch your own token to start building your portfolio.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all cursor-pointer"
                >
                  Explore Tokens
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#26262B] bg-[#121215]">
                <table className="w-full text-left text-xs text-[#E5E5E5]">
                  <thead className="bg-[#18181C] text-[11px] text-[#71717A] uppercase tracking-wider border-b border-[#26262B]">
                    <tr>
                      <th className="py-3.5 px-4">Asset</th>
                      <th className="py-3.5 px-4 text-right">Balance</th>
                      <th className="py-3.5 px-4 text-right">Avg Price</th>
                      <th className="py-3.5 px-4 text-right">Current Price</th>
                      <th className="py-3.5 px-4 text-right">Total Value</th>
                      <th className="py-3.5 px-4 text-right">PnL</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F23]">
                    {holdings.map((item) => {
                      const isItemPnlPos = item.pnlSol >= 0;
                      return (
                        <tr
                          key={item.tokenMint}
                          onClick={() => onSelectToken(item.token)}
                          className="hover:bg-[#18181C]/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.token.logoUrl}
                                alt={item.token.name}
                                className="w-9 h-9 rounded-xl object-cover border border-[#26262B]"
                              />
                              <div>
                                <div className="font-bold text-white">{item.token.name}</div>
                                <div className="font-mono text-[#A1A1AA] text-[11px]">
                                  ${item.token.symbol}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                            {Math.floor(item.tokenBalance).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-[#71717A]">
                            {formatCryptoPrice(item.avgBuyPriceSol * SOL_PRICE_USD)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-[#E5E5E5]">
                            {formatCryptoPrice(item.token.priceUsd)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="font-bold text-white">
                              {item.currentValSol.toFixed(3)} SOL
                            </div>
                            <div className="text-[10px] text-[#71717A]">
                              ≈ ${(item.currentValSol * SOL_PRICE_USD).toFixed(2)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                isItemPnlPos
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {isItemPnlPos ? '+' : ''}{item.pnlPercent.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectToken(item.token);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#18181C] hover:bg-emerald-500 hover:text-neutral-950 text-neutral-200 text-xs font-bold transition-all border border-[#26262B] cursor-pointer"
                            >
                              Trade
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATED TOKENS */}
        {activeTab === 'created' && (
          <div className="space-y-4">
            {/* Creator Royalties Header Box */}
            <div className="p-5 rounded-2xl bg-[#121215] border border-[#26262B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Creator Earnings & Royalties</h4>
                <p className="text-xs text-[#A1A1AA]">
                  You earn 1% on every trade performed on tokens you have deployed.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-[#71717A] block">Accumulated Fees</span>
                  <span className="text-base font-bold text-emerald-400">{totalCreatorFeesSol} SOL</span>
                </div>

                <button
                  onClick={handleClaimFees}
                  disabled={claiming || totalCreatorFeesSol <= 0}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 text-xs font-extrabold transition-all cursor-pointer"
                >
                  {claiming ? 'Claiming...' : claimSuccess ? 'Claimed!' : 'Claim Fees'}
                </button>
              </div>
            </div>

            {createdTokens.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#121215] border border-[#26262B] space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#18181C] border border-[#26262B] flex items-center justify-center mx-auto text-neutral-500">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">No Tokens Launched Yet</h4>
                  <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                    Create and deploy your first Solana token on the bonding curve in seconds.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('launch')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all cursor-pointer"
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
                    className="p-4 rounded-2xl bg-[#121215] border border-[#26262B] hover:border-[#3A3A42] cursor-pointer space-y-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={token.logoUrl}
                        alt={token.name}
                        className="w-11 h-11 rounded-xl object-cover border border-[#26262B]"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">{token.name}</div>
                        <div className="text-xs font-mono text-[#A1A1AA]">${token.symbol}</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#71717A]">Curve Progress</span>
                        <span className="font-bold text-white">{token.bondingProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#26262B] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, token.bondingProgress))}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#1F1F23] flex justify-between text-[11px] font-mono text-[#71717A]">
                      <span>Volume: {token.volume24hSol.toFixed(1)} SOL</span>
                      <span>Holders: {token.holdersCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACTIVITY LOGS */}
        {activeTab === 'activity' && (
          <div className="p-5 rounded-2xl bg-[#121215] border border-[#26262B] space-y-3">
            <h4 className="text-sm font-bold text-white mb-2">Personal Transaction History</h4>
            {userTradeHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                No transactions recorded in this session.
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {userTradeHistory.map((trade) => (
                  <div
                    key={trade.id}
                    className="p-3 rounded-xl bg-[#18181C] border border-[#26262B] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          trade.type === 'buy'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {trade.type}
                      </span>
                      <span className="text-white font-medium">
                        {trade.solAmount.toFixed(3)} SOL
                      </span>
                      <span className="text-[#A1A1AA]">
                        for {Math.floor(trade.tokenAmount).toLocaleString()} tokens
                      </span>
                    </div>
                    <span className="text-[11px] text-[#71717A]">
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
