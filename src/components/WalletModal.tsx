import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, CheckCircle2, AlertCircle, ExternalLink, ArrowRight, ShieldCheck, Zap, Layers, Plus } from 'lucide-react';
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
      setAirdropMsg(`Airdropped 1 SOL! (Sig: ${sig.slice(0, 8)}...)`);
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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-[#121215] border border-[#26262B] rounded-2xl p-6 shadow-2xl overflow-hidden text-[#E5E5E5] space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#26262B]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {connected ? 'Solana Wallet Manager' : 'Connect Solana Wallet'}
                </h3>
                <p className="text-xs text-[#A1A1AA]">
                  {connected ? `Connected via ${walletName}` : 'Select your installed wallet'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-[#18181C] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Connected View */}
          {connected && publicKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#18181C] border border-[#26262B] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#71717A]">
                  <span>Active Address</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Signer
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-neutral-200 font-medium select-all">
                    {shortenAddress(publicKey, 8)}
                  </span>
                  <a
                    href={`https://explorer.solana.com/address/${publicKey}?cluster=${network}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[#71717A] hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="pt-2 border-t border-[#26262B] flex items-center justify-between">
                  <span className="text-xs text-[#71717A]">On-Chain Balance</span>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-white">
                      {balance.toFixed(4)} SOL
                    </span>
                    <span className="block text-[11px] text-[#71717A]">
                      ≈ ${(balance * 184.5).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Devnet Faucet */}
              {network === 'devnet' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" /> Devnet Faucet
                    </div>
                    <button
                      onClick={handleAirdrop}
                      disabled={airdropLoading}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {airdropLoading ? 'Requesting...' : '+ Request 1 SOL'}
                    </button>
                  </div>
                  {airdropMsg && (
                    <p className="text-[11px] text-emerald-400 leading-tight">
                      {airdropMsg}
                    </p>
                  )}
                </div>
              )}

              {/* Managed Wallets list */}
              {managedWallets.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-[#71717A] font-semibold block">Managed Wallets</span>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {managedWallets.map((w) => (
                      <div
                        key={w.publicKey}
                        onClick={() => switchActiveWallet(w.publicKey)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          w.publicKey === publicKey
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-[#18181C] border-[#26262B] text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        <span className="font-mono">{w.label} ({shortenAddress(w.publicKey, 4)})</span>
                        {w.publicKey === publicKey && <span className="text-[10px] font-bold">CURRENT</span>}
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
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
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
                    className="w-full p-3.5 rounded-xl bg-[#18181C] hover:bg-[#202026] border border-[#26262B] hover:border-[#3A3A42] flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-8 h-8 rounded-lg object-contain bg-[#0E0E10] p-1 border border-[#26262B]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="text-left">
                        <div className="text-sm font-medium text-white">{wallet.name}</div>
                        <div className="text-xs text-[#A1A1AA]">{wallet.desc}</div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* Multi-Wallet Watch Option */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAddWatch(!showAddWatch)}
                  className="w-full py-2 px-3 rounded-xl bg-[#18181C] border border-[#26262B] text-xs text-[#A1A1AA] hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add User-Controlled Wallet to Manager
                </button>

                {showAddWatch && (
                  <form onSubmit={handleAddWatchWallet} className="mt-2 space-y-2 p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
                    <input
                      type="text"
                      value={watchPubkey}
                      onChange={(e) => setWatchPubkey(e.target.value)}
                      placeholder="Solana Public Key (Base58)"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#26262B] text-xs text-white placeholder-[#71717A] font-mono outline-none"
                    />
                    <input
                      type="text"
                      value={watchLabel}
                      onChange={(e) => setWatchLabel(e.target.value)}
                      placeholder="Wallet Label (e.g. Treasury Wallet)"
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#26262B] text-xs text-white placeholder-[#71717A] outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Save to Wallet List
                    </button>
                  </form>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#18181C]/60 border border-[#26262B] flex items-start gap-2.5 text-xs text-[#A1A1AA]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-neutral-300 font-medium">Non-Custodial:</span> Seed phrases and private keys are never requested or stored. All transactions require explicit wallet confirmation.
                </div>
              </div>
            </div>
          )}

          {/* Cluster Switcher */}
          <div className="pt-3 border-t border-[#26262B] flex items-center justify-between text-xs text-[#71717A]">
            <span>Solana Cluster:</span>
            <div className="flex items-center gap-1 bg-[#18181C] p-1 rounded-lg border border-[#26262B]">
              <button
                onClick={() => setNetwork('devnet')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  network === 'devnet' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-[#71717A] hover:text-[#E5E5E5]'
                }`}
              >
                Devnet
              </button>
              <button
                onClick={() => setNetwork('mainnet-beta')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  network === 'mainnet-beta' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-[#71717A] hover:text-[#E5E5E5]'
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
