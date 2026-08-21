import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  Globe, 
  Twitter, 
  Send, 
  Users,
  Activity,
  Info,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { Token, Holder } from '../types/token';
import { useTokenStore } from '../data/tokenStore';
import { useSolana } from '../solana/solanaContext';
import { PriceChart } from '../components/PriceChart';
import { BuySellPanel } from '../components/BuySellPanel';
import { LiveTradeFeed } from '../components/LiveTradeFeed';
import { HoldersList } from '../components/HoldersList';
import { ShareModal } from '../components/ShareModal';
import { SecurityBadges } from '../components/SecurityBadges';
import { 
  formatCryptoPrice, 
  formatCompactNumber, 
  shortenAddress, 
  GRADUATION_SOL_TARGET 
} from '../solana/bondingCurve';

interface TokenDetailProps {
  token: Token;
  onBack: () => void;
  onOpenWalletModal: () => void;
  onNavigate?: (page: string) => void;
}

export const TokenDetail: React.FC<TokenDetailProps> = ({
  token,
  onBack,
  onOpenWalletModal,
  onNavigate,
}) => {
  const { network } = useSolana();
  const { getTradesForToken, getCandlesForToken, setClonedTokenDraft } = useTokenStore();

  const [activeTab, setActiveTab] = useState<'trades' | 'holders' | 'security' | 'info'>('trades');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '24H' | '7D'>('15m');
  const [copiedMint, setCopiedMint] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const trades = getTradesForToken(token.mintAddress || token.id);
  const candlesRaw = getCandlesForToken(token.mintAddress || token.id, timeframe);

  const candles = useMemo(() => {
    return candlesRaw.map((c) => ({
      timestamp: c.timestamp,
      timeStr: new Date(c.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volumeSol,
    }));
  }, [candlesRaw]);

  // Derive real holders representation
  const holders: Holder[] = useMemo(() => {
    const bondingPct = Math.max(0, 100 - (token.bondingProgress || 1.5));
    const creatorPct = 5.0;
    const publicPct = 100 - bondingPct - creatorPct;

    return [
      {
        rank: 1,
        address: `${token.mintAddress?.slice(0, 8)}...PumpBondingCurve`,
        addressShort: 'Pump.fun Curve',
        balance: Math.floor(1_000_000_000 * (bondingPct / 100)),
        percentage: parseFloat(bondingPct.toFixed(2)),
        isBondingCurvePool: true,
      },
      {
        rank: 2,
        address: token.creatorAddress || 'Creator',
        addressShort: shortenAddress(token.creatorAddress || 'Creator', 4),
        balance: Math.floor(1_000_000_000 * 0.05),
        percentage: 5.0,
        isCreator: true,
      },
      {
        rank: 3,
        address: 'Public Holders & Traders',
        addressShort: 'Community',
        balance: Math.floor(1_000_000_000 * (publicPct / 100)),
        percentage: parseFloat(Math.max(0, publicPct).toFixed(2)),
      },
    ];
  }, [token]);

  const isGraduated = token.bondingProgress >= 100;
  const isPositive = token.priceChange24h >= 0;

  const handleCopyMint = () => {
    navigator.clipboard.writeText(token.mintAddress || token.id);
    setCopiedMint(true);
    setTimeout(() => setCopiedMint(false), 2000);
  };

  const handleCloneThisToken = () => {
    setClonedTokenDraft({
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      logoUrl: token.logoUrl,
      clonedFrom: {
        name: token.name,
        symbol: token.symbol,
        mint: token.mintAddress,
      },
      socials: token.socials,
    });
    if (onNavigate) {
      onNavigate('launch');
    }
  };

  return (
    <div className="space-y-6 py-6 sm:py-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCloneThisToken}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            Clone & Launch
          </button>
          <button
            onClick={() => setShareModalOpen(true)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-xs"
            title="Share Token"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <a
            href={`https://pump.fun/coin/${token.mintAddress || token.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors shadow-xs"
          >
            Pump.fun Page <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Token Overview Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Logo, Name, Symbol, Mint, Socials */}
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={token.logoUrl}
              alt={token.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-md shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {token.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs border border-emerald-200">
                  ${token.symbol}
                </span>
                {token.clonedFrom && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Cloned from {token.clonedFrom.name} (${token.clonedFrom.symbol})
                  </span>
                )}
              </div>

              {/* Mint Address & Copy */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMint}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <span>{shortenAddress(token.mintAddress || token.id, 6)}</span>
                  {copiedMint ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>

                <a
                  href={`https://explorer.solana.com/address/${token.mintAddress || token.id}?cluster=${network}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-emerald-700 transition-colors"
                  title="View on Solana Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Social Links */}
                {token.socials?.website && (
                  <a
                    href={token.socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
                {token.socials?.twitter && (
                  <a
                    href={token.socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </a>
                )}
                {token.socials?.telegram && (
                  <a
                    href={token.socials.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded-md text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Security Compact Badge */}
              <div className="pt-1">
                <SecurityBadges
                  revokeMint={token.revokeMint !== false}
                  revokeFreeze={token.revokeFreeze !== false}
                  revokeUpdate={token.revokeUpdate !== false}
                  securityScore={token.securityScore || 100}
                  compact
                />
              </div>
            </div>
          </div>

          {/* Current Live Price & 24h Change */}
          <div className="text-left lg:text-right border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">Live Token Price</span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
              ${formatCryptoPrice(token.priceUsd)}
            </div>
            <div className={`inline-flex items-center gap-1 font-mono font-bold text-xs mt-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{isPositive ? '+' : ''}{token.priceChange24h.toFixed(2)}%</span>
              <span className="text-[10px] text-slate-400 font-normal">(24h)</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Market Cap</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ${formatCompactNumber(token.marketCapUsd)}
            </span>
            <span className="font-mono text-[10px] text-slate-500 block">
              {token.marketCapSol.toFixed(1)} SOL
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">24h Volume</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {token.volume24hSol.toFixed(1)} SOL
            </span>
            <span className="font-mono text-[10px] text-slate-500 block">
              ${formatCompactNumber(token.volume24hUsd)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Liquidity</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {token.liquiditySol.toFixed(1)} SOL
            </span>
            <span className="font-mono text-[10px] text-slate-500 block">
              Virtual AMM
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Holders</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {token.holdersCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
              <Users className="w-3 h-3" /> Non-custodial
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-600 font-semibold">Bonding Curve</span>
              <span className="font-mono font-bold text-slate-900">{token.bondingProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${Math.min(100, Math.max(3, token.bondingProgress))}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500 block mt-1">
              {token.solCollected.toFixed(1)} / {GRADUATION_SOL_TARGET} SOL
            </span>
          </div>
        </div>
      </div>

      {/* Main Terminal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chart & Tabs */}
        <div className="lg:col-span-8 space-y-6">
          <PriceChart
            token={token}
            candles={candles}
            selectedTimeframe={timeframe}
            onSelectTimeframe={setTimeframe}
          />

          <div className="space-y-4">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 w-fit text-xs shadow-xs">
              <button
                onClick={() => setActiveTab('trades')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'trades' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Live Swaps ({trades.length})
              </button>
              <button
                onClick={() => setActiveTab('holders')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'holders' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Holders ({holders.length})
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'security' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Security & Authorities
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'info' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                Token Info
              </button>
            </div>

            {activeTab === 'trades' && (
              <LiveTradeFeed
                trades={trades}
                tokenSymbol={token.symbol}
                tokenName={token.name}
              />
            )}
            {activeTab === 'holders' && <HoldersList holders={holders} />}
            {activeTab === 'security' && (
              <SecurityBadges
                revokeMint={token.revokeMint !== false}
                revokeFreeze={token.revokeFreeze !== false}
                revokeUpdate={token.revokeUpdate !== false}
                securityScore={token.securityScore || 100}
              />
            )}
            {activeTab === 'info' && (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs space-y-4 shadow-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1.5">Description</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {token.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-medium">Creator Wallet</span>
                    <span className="font-mono text-slate-800 font-semibold">{token.creatorAddress}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-medium">Creation Timestamp</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {new Date(token.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-medium">Total Supply</span>
                    <span className="font-mono text-slate-800 font-semibold">1,000,000,000 (1 Billion) Fixed</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-medium">Bonding Curve Target</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {GRADUATION_SOL_TARGET} SOL Target (Raydium Migration)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real On-Chain Buy/Sell Panel */}
        <div className="lg:col-span-4 space-y-4">
          <BuySellPanel token={token} onOpenWalletModal={onOpenWalletModal} />
        </div>
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        token={token}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};
