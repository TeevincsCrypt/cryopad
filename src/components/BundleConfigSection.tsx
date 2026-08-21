import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Key,
  Coins,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Droplets,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BundleWalletItem } from '../types/bundle';
import {
  MAX_BUNDLE_WALLETS,
  generateBundleKeypair,
  importBundleKeypair,
  computeBundleSummary,
  refreshBundleBalances,
  calculatePumpTokensOut,
} from '../solana/bundleService';

interface BundleConfigSectionProps {
  connection: Connection;
  network: string;
  primaryPublicKey: string | null;
  primaryBalance: number;
  primaryBuySol: string;
  onPrimaryBuySolChange: (val: string) => void;
  bundleWallets: BundleWalletItem[];
  onBundleWalletsChange: (wallets: BundleWalletItem[]) => void;
  disabled?: boolean;
}

export const BundleConfigSection: React.FC<BundleConfigSectionProps> = ({
  connection,
  network,
  primaryPublicKey,
  primaryBalance,
  primaryBuySol,
  onPrimaryBuySolChange,
  bundleWallets,
  onBundleWalletsChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedAddrId, setCopiedAddrId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [airdroppingId, setAirdroppingId] = useState<string | null>(null);
  const [airdropAllLoading, setAirdropAllLoading] = useState(false);

  // Quick Distribute state
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeTotalSol, setDistributeTotalSol] = useState('1.0');
  const [distributeMode, setDistributeMode] = useState<'even' | 'random'>('even');

  // Import Key state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState('');
  const [importKeyError, setImportKeyError] = useState<string | null>(null);

  // Export Keys state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedJsonCopied, setExportedJsonCopied] = useState(false);

  // Ensure Wallet #1 is always present and synchronized with the primary connected wallet
  useEffect(() => {
    if (!primaryPublicKey) return;

    const primaryBuyNum = parseFloat(primaryBuySol) || 0;
    const existingIndex = bundleWallets.findIndex((w) => w.isPrimary);

    if (existingIndex === -1) {
      // Add primary wallet at index 0
      const primaryItem: BundleWalletItem = {
        id: 'primary-wallet',
        index: 1,
        name: 'Wallet 1 (Creator / Master)',
        publicKey: primaryPublicKey,
        isPrimary: true,
        buySol: primaryBuyNum,
        balanceSol: primaryBalance,
        status: 'ready',
      };
      onBundleWalletsChange([primaryItem, ...bundleWallets]);
    } else {
      // Update existing primary item
      const updated = [...bundleWallets];
      updated[existingIndex] = {
        ...updated[existingIndex],
        publicKey: primaryPublicKey,
        balanceSol: primaryBalance,
        buySol: primaryBuyNum,
      };
      // Only call if values actually changed to avoid infinite loop
      if (
        bundleWallets[existingIndex].publicKey !== primaryPublicKey ||
        bundleWallets[existingIndex].balanceSol !== primaryBalance ||
        bundleWallets[existingIndex].buySol !== primaryBuyNum
      ) {
        onBundleWalletsChange(updated);
      }
    }
  }, [primaryPublicKey, primaryBalance, primaryBuySol]);

  // Compute summary metrics
  const summary = computeBundleSummary(bundleWallets);

  // Add a single new wallet
  const handleAddWallet = () => {
    if (bundleWallets.length >= MAX_BUNDLE_WALLETS) return;
    const nextIndex = bundleWallets.length + 1;
    const newWallet = generateBundleKeypair(nextIndex);
    onBundleWalletsChange([...bundleWallets, newWallet]);
  };

  // Generate batch up to target count (e.g. 5 or 10)
  const handleGenerateBatch = (targetCount: number) => {
    const current = [...bundleWallets];
    while (current.length < targetCount && current.length < MAX_BUNDLE_WALLETS) {
      const nextIndex = current.length + 1;
      current.push(generateBundleKeypair(nextIndex));
    }
    onBundleWalletsChange(current);
  };

  // Remove a secondary wallet
  const handleRemoveWallet = (id: string) => {
    const filtered = bundleWallets.filter((w) => w.id !== id && !w.isPrimary);
    // Re-index remaining wallets
    const reindexed = filtered.map((w, idx) => ({
      ...w,
      index: idx + 2, // Secondary start at 2
      name: w.name.startsWith('Bundle Sniper #') ? `Bundle Sniper #${idx + 2}` : w.name,
    }));
    // Re-add primary at index 0
    const primary = bundleWallets.find((w) => w.isPrimary);
    if (primary) {
      onBundleWalletsChange([primary, ...reindexed]);
    } else {
      onBundleWalletsChange(reindexed);
    }
  };

  // Change buy amount for a specific wallet
  const handleBuyChange = (id: string, value: string) => {
    const val = parseFloat(value) || 0;
    const updated = bundleWallets.map((w) => {
      if (w.id === id) {
        if (w.isPrimary) {
          onPrimaryBuySolChange(value);
        }
        return {
          ...w,
          buySol: val,
        };
      }
      return w;
    });
    onBundleWalletsChange(updated);
  };

  // Refresh all balances
  const handleRefreshBalances = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await refreshBundleBalances(connection, bundleWallets);
      onBundleWalletsChange(refreshed);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Quick Distribute SOL Buy Amount
  const handleApplyDistribute = () => {
    const total = parseFloat(distributeTotalSol);
    if (isNaN(total) || total <= 0 || bundleWallets.length === 0) return;

    let updated: BundleWalletItem[] = [];
    if (distributeMode === 'even') {
      const perWallet = +(total / bundleWallets.length).toFixed(4);
      updated = bundleWallets.map((w) => ({
        ...w,
        buySol: perWallet,
      }));
      // Update primary state input
      onPrimaryBuySolChange(perWallet.toString());
    } else {
      // Randomized split
      const weights = bundleWallets.map(() => Math.random() + 0.5);
      const sumWeights = weights.reduce((a, b) => a + b, 0);
      updated = bundleWallets.map((w, idx) => {
        const share = +((weights[idx] / sumWeights) * total).toFixed(4);
        if (w.isPrimary) {
          onPrimaryBuySolChange(share.toString());
        }
        return {
          ...w,
          buySol: share,
        };
      });
    }

    onBundleWalletsChange(updated);
    setShowDistributeModal(false);
  };

  // Import Keypair
  const handleImportKey = () => {
    setImportKeyError(null);
    try {
      if (bundleWallets.length >= MAX_BUNDLE_WALLETS) {
        throw new Error(`Maximum limit of ${MAX_BUNDLE_WALLETS} wallets reached.`);
      }
      const nextIndex = bundleWallets.length + 1;
      const imported = importBundleKeypair(importKeyInput, nextIndex);
      onBundleWalletsChange([...bundleWallets, imported]);
      setImportKeyInput('');
      setShowImportModal(false);
    } catch (err: any) {
      setImportKeyError(err.message || 'Failed to import private key');
    }
  };

  // Request Devnet Airdrop for single wallet
  const handleAirdropSingle = async (wallet: BundleWalletItem) => {
    if (network !== 'devnet') return;
    setAirdroppingId(wallet.id);
    try {
      const pubkey = new PublicKey(wallet.publicKey);
      const sig = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
      const latest = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction(
        {
          signature: sig,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        'confirmed'
      );
      await handleRefreshBalances();
    } catch (err) {
      console.warn('Airdrop failed or rate limited:', err);
    } finally {
      setAirdroppingId(null);
    }
  };

  // Request Devnet Airdrop for all sub-wallets
  const handleAirdropAll = async () => {
    if (network !== 'devnet') return;
    setAirdropAllLoading(true);
    try {
      const subWallets = bundleWallets.filter((w) => !w.isPrimary);
      for (const w of subWallets) {
        try {
          const pubkey = new PublicKey(w.publicKey);
          const sig = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
          const latest = await connection.getLatestBlockhash('confirmed');
          await connection.confirmTransaction(
            {
              signature: sig,
              blockhash: latest.blockhash,
              lastValidBlockHeight: latest.lastValidBlockHeight,
            },
            'confirmed'
          );
        } catch (e) {
          console.warn(`Airdrop for ${w.name} failed:`, e);
        }
      }
      await handleRefreshBalances();
    } finally {
      setAirdropAllLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, type: 'addr' | 'key', id: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'addr') {
      setCopiedAddrId(id);
      setTimeout(() => setCopiedAddrId(null), 2000);
    } else {
      setCopiedKeyId(id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  // Export JSON payload
  const getExportData = () => {
    return JSON.stringify(
      bundleWallets.map((w) => ({
        index: w.index,
        name: w.name,
        publicKey: w.publicKey,
        secretKeyBase58: w.secretKeyBase58 || '(Primary connected wallet)',
        buySol: w.buySol,
        balanceSol: w.balanceSol,
      })),
      null,
      2
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Multi-Wallet Launch Bundle
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold">
                  {bundleWallets.length}/{MAX_BUNDLE_WALLETS} Wallets
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Snipe the initial bonding curve supply simultaneously across up to 10 configured wallets at block 0.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshBalances}
              disabled={isRefreshing}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Refresh balances"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/80 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-[11px] block font-sans">Total Bundle Buy</span>
            <span className="text-slate-900 font-bold text-sm">{summary.totalBuySol.toFixed(3)} SOL</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-[11px] block font-sans">Est. Tokens Sniped</span>
            <span className="text-emerald-600 font-bold text-sm">~{summary.totalEstimatedTokens.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-[11px] block font-sans">Curve Supply Sniped</span>
            <span className="text-emerald-600 font-bold text-sm">{summary.percentSupplySniped.toFixed(2)}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-[11px] block font-sans">Bundle Status</span>
            <span className={`font-bold text-sm ${summary.allFunded ? 'text-emerald-600' : 'text-amber-600'}`}>
              {summary.allFunded ? '✓ All Funded' : 'Needs SOL'}
            </span>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5 bg-white">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAddWallet}
                disabled={disabled || bundleWallets.length >= MAX_BUNDLE_WALLETS}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Wallet
              </button>

              {bundleWallets.length < 5 && (
                <button
                  type="button"
                  onClick={() => handleGenerateBatch(5)}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Generate 5 Wallets
                </button>
              )}

              {bundleWallets.length < 10 && (
                <button
                  type="button"
                  onClick={() => handleGenerateBatch(10)}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Max 10 Wallets
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDistributeModal(true)}
                disabled={disabled || bundleWallets.length === 0}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-slate-500" /> Split SOL Evenly
              </button>
            </div>

            <div className="flex items-center gap-2">
              {network === 'devnet' && (
                <button
                  type="button"
                  onClick={handleAirdropAll}
                  disabled={disabled || airdropAllLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Airdrop 1 SOL to all sub-wallets on Devnet"
                >
                  <Droplets className={`w-3.5 h-3.5 text-emerald-600 ${airdropAllLoading ? 'animate-bounce' : ''}`} />
                  {airdropAllLoading ? 'Airdropping...' : 'Fund All (Devnet)'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                disabled={disabled || bundleWallets.length >= MAX_BUNDLE_WALLETS}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Import Private Key"
              >
                <Key className="w-3.5 h-3.5 text-slate-500" /> Import Key
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Export Keys JSON"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export Keys
              </button>
            </div>
          </div>

          {/* Wallets List */}
          <div className="space-y-3">
            {bundleWallets.map((wallet) => {
              const estimatedTokens = calculatePumpTokensOut(wallet.buySol);
              const isFunded = wallet.balanceSol >= (wallet.buySol + (wallet.buySol > 0 ? 0.005 : 0));

              return (
                <div
                  key={wallet.id}
                  className={`p-4 rounded-xl border transition-all ${
                    wallet.isPrimary
                      ? 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Wallet Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono ${
                            wallet.isPrimary
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          #{wallet.index}
                        </span>

                        <span className="text-sm font-bold text-slate-900 truncate">
                          {wallet.name}
                        </span>

                        {wallet.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Creator Wallet
                          </span>
                        )}

                        {wallet.secretKeyBase58 && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(wallet.secretKeyBase58!, 'key', wallet.id)}
                            className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                            title="Copy Private Key"
                          >
                            <Key className="w-3 h-3" />
                            {copiedKeyId === wallet.id ? (
                              <span className="text-emerald-600 font-bold">Copied Key!</span>
                            ) : (
                              'Copy Key'
                            )}
                          </button>
                        )}
                      </div>

                      {/* Public Key & Copy */}
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <span>{wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(wallet.publicKey, 'addr', wallet.id)}
                          className="hover:text-slate-900 transition-colors cursor-pointer"
                          title="Copy Address"
                        >
                          {copiedAddrId === wallet.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <a
                          href={`https://explorer.solana.com/address/${wallet.publicKey}?cluster=${network}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 text-slate-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Middle: Live Balance */}
                    <div className="text-left md:text-right font-mono text-xs shrink-0">
                      <span className="text-slate-500 text-[11px] block font-sans">On-chain Balance</span>
                      <span className="text-slate-900 font-bold text-sm">
                        {wallet.balanceSol.toFixed(4)} SOL
                      </span>
                      {network === 'devnet' && !wallet.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleAirdropSingle(wallet)}
                          disabled={airdroppingId === wallet.id}
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-sans font-semibold block transition-colors cursor-pointer"
                        >
                          {airdroppingId === wallet.id ? 'Requesting...' : '+ 1 SOL Airdrop'}
                        </button>
                      )}
                    </div>

                    {/* Right: Buy Amount Input & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-36">
                        <label className="text-[10px] text-slate-500 block mb-1 font-sans font-medium">
                          Initial Buy SOL:
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={wallet.buySol || ''}
                            onChange={(e) => handleBuyChange(wallet.id, e.target.value)}
                            placeholder="0.0 SOL"
                            disabled={disabled}
                            className="w-full px-2.5 py-1.5 pr-10 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:bg-white outline-none transition-colors"
                          />
                          <span className="absolute right-2 top-1.5 text-[11px] font-mono text-slate-400">
                            SOL
                          </span>
                        </div>
                      </div>

                      {/* Remove Button for secondary wallets */}
                      {!wallet.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWallet(wallet.id)}
                          disabled={disabled}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer mt-4"
                          title="Remove wallet from bundle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Wallet Snipe Estimation Sub-bar */}
                  {wallet.buySol > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-600 gap-2">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3 h-3 text-emerald-600" />
                        <span>Estimated Allocation:</span>
                        <span className="font-bold text-emerald-700">
                          ~{estimatedTokens.toLocaleString()} tokens (
                          {((estimatedTokens / 1_000_000_000) * 100).toFixed(2)}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isFunded ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Funded & Ready
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Needs {(wallet.buySol + 0.005 - wallet.balanceSol).toFixed(4)} SOL more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Swagpad Bundle Engine coordinates multi-wallet snipes at token creation. Private keys for generated sniper wallets are stored purely in your browser session memory. Remember to export your keys to manage or sell tokens post-launch.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Split SOL */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" /> Distribute SOL Across Wallets
            </h4>
            <p className="text-xs text-slate-500">
              Set total SOL to automatically distribute across all {bundleWallets.length} configured wallets.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Total SOL to Distribute</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={distributeTotalSol}
                  onChange={(e) => setDistributeTotalSol(e.target.value)}
                  className="w-full px-3 py-2 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:border-emerald-500 outline-none"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">SOL</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Distribution Pattern</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDistributeMode('even')}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors cursor-pointer ${
                    distributeMode === 'even'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Even Split (Equal)
                </button>
                <button
                  type="button"
                  onClick={() => setDistributeMode('random')}
                  className={`py-2 px-3 rounded-xl border text-center transition-colors cursor-pointer ${
                    distributeMode === 'random'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Randomized (Organic)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDistributeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyDistribute}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Apply Distribution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Private Key */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-600" /> Import Existing Wallet Key
            </h4>
            <p className="text-xs text-slate-500">
              Paste a Solana base58 private key (64-byte or 32-byte secret key string) to add as a bundle wallet.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Base58 Private Key</label>
              <input
                type="password"
                value={importKeyInput}
                onChange={(e) => setImportKeyInput(e.target.value)}
                placeholder="e.g. 5K3... (base58 format)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:border-emerald-500 outline-none"
              />
              {importKeyError && (
                <p className="text-xs text-rose-600 font-semibold">{importKeyError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportKeyError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportKey}
                disabled={!importKeyInput.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Import Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export Private Keys */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" /> Export Bundle Wallet Private Keys
            </h4>
            <p className="text-xs text-slate-500">
              Save this JSON backup to retain control of all generated sniper wallets and recover purchased tokens.
            </p>

            <textarea
              readOnly
              value={getExportData()}
              rows={8}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([getExportData()], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `swagpad-bundle-wallets-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download .json
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getExportData());
                    setExportedJsonCopied(true);
                    setTimeout(() => setExportedJsonCopied(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {exportedJsonCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {exportedJsonCopied ? 'Copied JSON!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
