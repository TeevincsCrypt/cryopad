import React, { useState } from 'react';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  Plus,
  Trash2,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { useSolana } from '../solana/solanaContext';
import { useTokenStore } from '../data/tokenStore';
import { shortenAddress } from '../solana/bondingCurve';

interface ProfileProps {
  onOpenWalletModal: () => void;
  onNavigate: (page: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onOpenWalletModal, onNavigate }) => {
  const { 
    connected, 
    publicKey, 
    walletName, 
    balance, 
    network, 
    setNetwork, 
    endpoint, 
    setCustomRpcEndpoint, 
    requestAirdrop, 
    disconnectWallet,
    managedWallets,
    addManagedWallet,
    removeManagedWallet,
    switchActiveWallet,
    updateWalletLabel,
    solPriceUsd,
    walletUsdValue,
    minLaunchBalanceUsd,
    minLaunchSolRequired,
    isLaunchEligible,
  } = useSolana();

  const { tokens } = useTokenStore();

  const [copied, setCopied] = useState(false);
  const [airdropLoading, setAirdropLoading] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);
  const [customRpc, setCustomRpc] = useState('');
  const [newWalletKey, setNewWalletKey] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');

  const userCreatedTokens = tokens.filter(
    (t) => t.creatorAddress?.toLowerCase() === publicKey?.toLowerCase()
  );

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAirdrop = async () => {
    setAirdropLoading(true);
    setAirdropMsg(null);
    try {
      const sig = await requestAirdrop();
      setAirdropMsg(`Airdrop confirmed! Signature: ${sig.slice(0, 10)}...`);
    } catch (e: any) {
      setAirdropMsg(e.message || 'Airdrop failed');
    } finally {
      setAirdropLoading(false);
    }
  };

  const handleApplyCustomRpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRpc.trim()) {
      setCustomRpcEndpoint(customRpc.trim());
      setAirdropMsg('Custom RPC connected successfully');
    }
  };

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletKey.trim()) return;
    addManagedWallet(newWalletKey.trim(), newWalletLabel.trim() || 'User Wallet');
    setNewWalletKey('');
    setNewWalletLabel('');
  };

  const handleSaveLabel = (pubkey: string) => {
    if (editLabelValue.trim()) {
      updateWalletLabel(pubkey, editLabelValue.trim());
    }
    setEditingLabelKey(null);
    setEditLabelValue('');
  };

  if (!connected || !publicKey) {
    return (
      <div className="py-20 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700 shadow-xs">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Wallet Not Connected</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connect your Solana wallet to manage multi-wallet accounts, RPC endpoints, and view on-chain Swagpad token activity.
          </p>
        </div>
        <button
          onClick={onOpenWalletModal}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          Connect Solana Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-mono font-bold text-lg">
              ◎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Solana Account</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {walletName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-0.5">
                <span>{shortenAddress(publicKey, 6)}</span>
                <button onClick={handleCopy} className="hover:text-slate-900 cursor-pointer">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`https://explorer.solana.com/address/${publicKey}?cluster=${network}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-700 flex items-center gap-0.5 font-sans font-semibold"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <span className="text-xs text-slate-500 block font-sans font-semibold">On-Chain Balance</span>
            <span className="text-2xl font-black text-slate-900">{balance.toFixed(4)} SOL</span>
            <span className="text-xs text-slate-500 block font-sans font-medium">
              {solPriceUsd && walletUsdValue !== null
                ? `≈ $${walletUsdValue.toFixed(2)} USD (@ $${solPriceUsd.toFixed(2)}/SOL)`
                : 'Price loading...'}
            </span>
          </div>
        </div>

        {/* Balance Eligibility Status */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <span className="text-slate-600 font-sans font-medium">
            Launchpad Qualification (${minLaunchBalanceUsd.toFixed(0)} USD Min
            {minLaunchSolRequired ? ` ≈ ${minLaunchSolRequired.toFixed(4)} SOL` : ''}):
          </span>
          <span className={isLaunchEligible ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
            {solPriceUsd === null
              ? 'Price feed unavailable'
              : isLaunchEligible
              ? '✓ Eligible to Launch'
              : `Needs $${(minLaunchBalanceUsd - (walletUsdValue || 0)).toFixed(2)} more SOL`}
          </span>
        </div>
      </div>

      {/* Multi-Wallet Management Panel */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Multi-Wallet Management
            </h2>
            <p className="text-xs text-slate-500">
              Connect, label, and switch active signers for your user-controlled wallets.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {managedWallets.map((w) => (
            <div
              key={w.publicKey}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                w.publicKey === publicKey
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="space-y-0.5">
                {editingLabelKey === w.publicKey ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editLabelValue}
                      onChange={(e) => setEditLabelValue(e.target.value)}
                      placeholder="Label"
                      className="px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-900 outline-none"
                    />
                    <button
                      onClick={() => handleSaveLabel(w.publicKey)}
                      className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{w.label}</span>
                    <button
                      onClick={() => {
                        setEditingLabelKey(w.publicKey);
                        setEditLabelValue(w.label);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-700"
                    >
                      (edit)
                    </button>
                  </div>
                )}
                <div className="font-mono text-[11px] text-slate-500">
                  {shortenAddress(w.publicKey, 8)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {w.publicKey === publicKey ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Active Signer
                  </span>
                ) : (
                  <button
                    onClick={() => switchActiveWallet(w.publicKey)}
                    className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Set Active
                  </button>
                )}

                {managedWallets.length > 1 && (
                  <button
                    onClick={() => removeManagedWallet(w.publicKey)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove from list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Wallet Form */}
        <form onSubmit={handleAddWallet} className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newWalletKey}
            onChange={(e) => setNewWalletKey(e.target.value)}
            placeholder="Add Solana Public Key"
            className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-mono outline-none focus:bg-white focus:border-emerald-500"
          />
          <input
            type="text"
            value={newWalletLabel}
            onChange={(e) => setNewWalletLabel(e.target.value)}
            placeholder="Label (e.g. Treasury)"
            className="sm:w-40 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-800 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>

      {/* Network & RPC Configuration */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-600" />
          Solana RPC & Network Settings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-600 font-semibold block">Cluster Network</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNetwork('devnet')}
                className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${
                  network === 'devnet'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Devnet
              </button>
              <button
                onClick={() => setNetwork('mainnet-beta')}
                className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${
                  network === 'mainnet-beta'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Mainnet-Beta
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-600 font-semibold block">Active RPC Endpoint</label>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 truncate">
              {endpoint}
            </div>
          </div>
        </div>

        {/* Custom RPC input */}
        <form onSubmit={handleApplyCustomRpc} className="flex gap-2 pt-2">
          <input
            type="url"
            value={customRpc}
            onChange={(e) => setCustomRpc(e.target.value)}
            placeholder="Custom RPC URL (e.g. Helius, QuickNode, Triton)"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-mono outline-none focus:bg-white focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            Apply RPC
          </button>
        </form>

        {/* Devnet Airdrop Faucet */}
        {network === 'devnet' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Solana Devnet Faucet
              </span>
              <span className="text-[11px] text-slate-500 block">
                Request 1 test SOL on devnet for testing Pump.fun token launches.
              </span>
            </div>
            <button
              onClick={handleAirdrop}
              disabled={airdropLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              {airdropLoading ? 'Requesting...' : '+ Request 1 SOL'}
            </button>
          </div>
        )}

        {airdropMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono font-medium">
            {airdropMsg}
          </div>
        )}
      </div>

      {/* User Created Tokens Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-600" />
          Your Launched Tokens ({userCreatedTokens.length})
        </h2>

        {userCreatedTokens.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-slate-500">You haven't launched any tokens from this wallet yet.</p>
            <button
              onClick={() => onNavigate('launch')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Launch a Token Now
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {userCreatedTokens.map((t) => (
              <div
                key={t.mintAddress || t.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={t.logoUrl}
                    alt={t.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">{t.name} (${t.symbol})</span>
                    <span className="font-mono text-[11px] text-slate-500">
                      Mint: {shortenAddress(t.mintAddress || t.id, 6)}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://pump.fun/coin/${t.mintAddress || t.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1"
                >
                  Pump.fun <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnectWallet}
        className="w-full py-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
      >
        Disconnect Active Wallet
      </button>
    </div>
  );
};
