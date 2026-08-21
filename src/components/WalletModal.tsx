import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ShieldCheck, Zap, Plus } from 'lucide-react';
import { useSolana } from '../solana/solanaContext';
import { shortenAddress } from '../solana/bondingCurve';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    connected,
    connecting,
    publicKey,
    walletName,
    balance,
    network,
    setNetwork,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    managedWallets,
    addManagedWallet,
    switchActiveWallet,
    solPriceUsd,
    walletUsdValue,
    minLaunchBalanceUsd,
    isLaunchEligible,
  } = useSolana();

  const [airdropLoading, setAirdropLoading] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAddWatch, setShowAddWatch] = useState(false);
  const [watchPubkey, setWatchPubkey] = useState('');
  const [watchLabel, setWatchLabel] = useState('');

  if (!isOpen) return null;

  const supportedWallets = [
    {
      id: 'phantom',
      name: 'Phantom',
      icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/icon.png',
      desc: 'Popular Solana multi-chain wallet',
    },
    {
      id: 'solflare',
      name: 'Solflare',
      icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/icon.png',
      desc: 'Secure Solana non-custodial wallet',
    },
    {
      id: 'backpack',
      name: 'Backpack',
      icon: 'https://backpack.app/favicon.ico',
      desc: 'xNFT & Solana native wallet',
    },
  ];

  const handleConnect = async (providerId: string) => {
    setErrorMsg(null);
    try {
      await connectWallet(providerId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect wallet');
    }
  };

  const handleAirdrop = async () => {
    setAirdropLoading(true);
    setAirdropMsg(null);
    try {
      const sig = await requestAirdrop();
      setAirdropMsg(`+1.0 SOL Devnet successfully credited! (Sig: ${sig.slice(0, 8)}...)`);
    } catch (err: any) {
      setAirdropMsg(err.message || 'Airdrop failed');
    } finally {
      setAirdropLoading(false);
    }
  };

  const handleAddWatchWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchPubkey.trim()) return;
    addManagedWallet(watchPubkey.trim(), watchLabel.trim() || 'Watched Wallet');
    setWatchPubkey('');
    setWatchLabel('');
    setShowAddWatch(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden text-slate-900 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {connected ? 'Solana Wallet Manager' : 'Connect Solana Wallet'}
                </h3>
                <p className="text-xs text-slate-500">
                  {connected ? `Connected via ${walletName}` : 'Select your installed Solana wallet'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Connected View */}
          {connected && publicKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Active Address</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Signer
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-slate-900 font-bold select-all">
                    {shortenAddress(publicKey, 8)}
                  </span>
                  <a
                    href={`https://explorer.solana.com/address/${publicKey}?cluster=${network}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors font-medium"
                  >
                    Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">On-Chain Balance</span>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {balance.toFixed(4)} SOL
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {solPriceUsd && walletUsdValue !== null
                        ? `≈ $${walletUsdValue.toFixed(2)} USD (@ $${solPriceUsd.toFixed(2)}/SOL)`
                        : 'Price loading...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Launch Qualification summary */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-mono">
                <span className="text-slate-600 text-[11px] font-sans">Launch Eligibility (${minLaunchBalanceUsd.toFixed(0)} Min):</span>
                {solPriceUsd === null ? (
                  <span className="text-amber-600 font-bold text-[11px]">Price loading...</span>
                ) : isLaunchEligible ? (
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Eligible to launch
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold text-[11px]">
                    Needs ${(minLaunchBalanceUsd - (walletUsdValue || 0)).toFixed(2)} more SOL
                  </span>
                )}
              </div>

              {/* Devnet Faucet */}
              {network === 'devnet' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" /> Devnet Faucet
                    </div>
                    <button
                      onClick={handleAirdrop}
                      disabled={airdropLoading}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {airdropLoading ? 'Requesting...' : '+ Request 1 SOL'}
                    </button>
                  </div>
                  {airdropMsg && (
                    <p className="text-[11px] text-emerald-800 font-medium leading-tight">
                      {airdropMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Managed Wallets list */}
              {managedWallets.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-bold block">Managed Wallets</span>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {managedWallets.map((w) => (
                      <div
                        key={w.publicKey}
                        onClick={() => switchActiveWallet(w.publicKey)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          w.publicKey === publicKey
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-mono">{w.label} ({shortenAddress(w.publicKey, 4)})</span>
                        {w.publicKey === publicKey && <span className="text-[10px] font-bold text-emerald-700">ACTIVE</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  disconnectWallet();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            /* Connect Options */
            <div className="space-y-3">
              <div className="space-y-2">
                {supportedWallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    disabled={connecting}
                    className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-emerald-300 flex items-center justify-between group transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="text-left">
                        <div className="text-sm font-bold text-slate-900">{wallet.name}</div>
                        <div className="text-xs text-slate-500">{wallet.desc}</div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* Multi-Wallet Watch Option */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAddWatch(!showAddWatch)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  Add Address to Manager
                </button>

                {showAddWatch && (
                  <form onSubmit={handleAddWatchWallet} className="mt-2 space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="text"
                      value={watchPubkey}
                      onChange={(e) => setWatchPubkey(e.target.value)}
                      placeholder="Solana Public Key (Base58)"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-mono outline-none"
                    />
                    <input
                      type="text"
                      value={watchLabel}
                      onChange={(e) => setWatchLabel(e.target.value)}
                      placeholder="Wallet Label (e.g. Treasury Wallet)"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Save to Wallet List
                    </button>
                  </form>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-900 font-semibold">Non-Custodial:</span> Seed phrases and private keys are never requested or stored. All transactions require explicit wallet confirmation.
                </div>
              </div>
            </div>
          )}

          {/* Cluster Switcher */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Solana Cluster:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setNetwork('devnet')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  network === 'devnet' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Devnet
              </button>
              <button
                onClick={() => setNetwork('mainnet-beta')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  network === 'mainnet-beta' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mainnet
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
