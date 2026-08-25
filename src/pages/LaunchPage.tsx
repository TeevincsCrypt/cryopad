import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  Rocket,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Twitter,
  Send,
  Coins,
  ShieldCheck,
  Zap,
  Upload,
  RefreshCw,
  Wallet,
  Layers,
  Check,
  Copy,
  Lock,
  Ban,
  FileCode,
  Flame,
  X,
} from 'lucide-react';
import { useSolana } from '../solana/solanaContext';
import { useTokenStore } from '../data/tokenStore';
import { Token } from '../types/token';
import { BundleWalletItem } from '../types/bundle';
import { BundleConfigSection } from '../components/BundleConfigSection';
import { SecurityBadges } from '../components/SecurityBadges';
import { executeAllSubWalletBuys, computeBundleSummary } from '../solana/bundleService';

interface LaunchPageProps {
  onLaunchSuccess?: (token: Token) => void;
  onTokenCreated?: (token: Token) => void;
  onSelectToken?: (token: Token) => void;
  onNavigate?: (page: string) => void;
  onOpenWalletModal?: () => void;
}

type LaunchStep =
  | 'idle'
  | 'preparing_metadata'
  | 'building_tx'
  | 'awaiting_wallet'
  | 'submitting'
  | 'confirming'
  | 'executing_bundle'
  | 'confirmed'
  | 'error';

export const LaunchPage: React.FC<LaunchPageProps> = ({
  onLaunchSuccess,
  onTokenCreated,
  onSelectToken,
  onNavigate,
  onOpenWalletModal,
}) => {
  const {
    connection,
    connected,
    publicKey,
    balance,
    network,
    connectWallet,
    sendAndConfirmPumpLaunch,
    refreshBalance,
    solPriceUsd,
    solPrice24hChange,
    solPriceLoading,
    solPriceSource,
    minLaunchBalanceUsd,
    minLaunchSolRequired,
    walletUsdValue,
    isLaunchEligible,
    refreshSolPrice,
  } = useSolana();

  const { recordLaunchedToken, clonedTokenDraft, setClonedTokenDraft } = useTokenStore();

  // Form State
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/png');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [initialBuySol, setInitialBuySol] = useState('');

  // Security Authority Toggles (Immutable, Revoke Mint, Revoke Freeze)
  const [revokeUpdate, setRevokeUpdate] = useState<boolean>(true);
  const [revokeMint, setRevokeMint] = useState<boolean>(true);
  const [revokeFreeze, setRevokeFreeze] = useState<boolean>(true);

  // Multi-wallet Bundle State (up to 10 wallets)
  const [bundleWallets, setBundleWallets] = useState<BundleWalletItem[]>([]);

  const [showSocials, setShowSocials] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Lifecycle
  const [launchStep, setLaunchStep] = useState<LaunchStep>('idle');
  const [stepMessage, setStepMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestTxSig, setLatestTxSig] = useState<string | null>(null);
  const [createdMint, setCreatedMint] = useState<string | null>(null);
  const [bundleResults, setBundleResults] = useState<BundleWalletItem[]>([]);

  // AgentRouter AI Token Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiStatusMessage(null);
    try {
      const res = await fetch('/api/ai/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setName(data.token.name || name);
        setSymbol(data.token.symbol || symbol);
        setDescription(data.token.description || description);
        if (data.token.imageUrl && !imagePreview) {
          setImageUrl(data.token.imageUrl);
          setImagePreview(data.token.imageUrl);
        }
        setAiStatusMessage(`Generated "${data.token.name}" ($${data.token.symbol}) using AgentRouter AI!`);
        setTimeout(() => setAiStatusMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to generate token concept via AgentRouter AI.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI request failed');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Pre-fill if cloned token draft exists
  useEffect(() => {
    if (clonedTokenDraft) {
      if (clonedTokenDraft.name) setName(clonedTokenDraft.name);
      if (clonedTokenDraft.symbol) setSymbol(clonedTokenDraft.symbol);
      if (clonedTokenDraft.description) setDescription(clonedTokenDraft.description);
      if (clonedTokenDraft.logoUrl) {
        setImageUrl(clonedTokenDraft.logoUrl);
        setImagePreview(clonedTokenDraft.logoUrl);
      }
      if (clonedTokenDraft.socials?.twitter) setTwitter(clonedTokenDraft.socials.twitter);
      if (clonedTokenDraft.socials?.telegram) setTelegram(clonedTokenDraft.socials.telegram);
      if (clonedTokenDraft.socials?.website) setWebsite(clonedTokenDraft.socials.website);
    }
  }, [clonedTokenDraft]);

  // Compute calculated trust score
  const securityScore = useMemo(() => {
    let score = 0;
    if (revokeUpdate) score += 34;
    if (revokeMint) score += 33;
    if (revokeFreeze) score += 33;
    return score;
  }, [revokeUpdate, revokeMint, revokeFreeze]);

  // File Upload Handler
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Bundle Summary
  const bundleSummary = useMemo(() => computeBundleSummary(bundleWallets), [bundleWallets]);

  // Input Validation
  const validateInputs = (): string | null => {
    if (!name.trim()) return 'Token name is required';
    if (name.trim().length > 32) return 'Token name cannot exceed 32 characters';
    if (!symbol.trim()) return 'Ticker symbol is required';
    if (symbol.trim().length > 10) return 'Ticker symbol cannot exceed 10 characters';
    if (!description.trim()) return 'Token description is required';
    if (!imagePreview && !imageUrl.trim()) return 'Token image (file upload or URL) is required';

    const buySol = parseFloat(initialBuySol || '0');
    if (isNaN(buySol) || buySol < 0) return 'Initial buy amount must be a positive number';
    if (buySol > 0 && buySol >= balance) {
      return `Creator initial buy (${buySol} SOL) exceeds available balance (${balance.toFixed(4)} SOL)`;
    }

    // Validate secondary bundle wallets funding
    const underfundedSubWallet = bundleWallets.find(
      (w) => !w.isPrimary && w.buySol > 0 && w.balanceSol < w.buySol + 0.005
    );
    if (underfundedSubWallet) {
      return `Bundle Wallet "${underfundedSubWallet.name}" has ${underfundedSubWallet.balanceSol.toFixed(4)} SOL, which is less than the required ${underfundedSubWallet.buySol} SOL + gas. Please fund or adjust before launch.`;
    }

    if (solPriceUsd === null || solPriceUsd <= 0) {
      return 'SOL price temporarily unavailable. Please wait for live market feed to connect before launching.';
    }

    if (!isLaunchEligible) {
      return `Insufficient SOL balance. You need at least $${minLaunchBalanceUsd.toFixed(2)} worth of SOL to launch.`;
    }
    return null;
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!connected || !publicKey) {
      setErrorMessage('Please connect your Solana wallet first');
      return;
    }

    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const buySolNum = parseFloat(initialBuySol || '0') || undefined;

    try {
      // Step 1: Uploading Metadata to Pinata IPFS
      setLaunchStep('preparing_metadata');
      setStepMessage('Uploading token image and metadata to Pinata IPFS...');

      const metaRes = await fetch('/api/metadata/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          description: description.trim(),
          image: imageUrl.trim() || undefined,
          imageBase64: imageBase64 || undefined,
          imageMimeType,
          twitter: twitter.trim() || undefined,
          telegram: telegram.trim() || undefined,
          website: website.trim() || undefined,
          creator: publicKey,
        }),
      });

      if (!metaRes.ok) {
        const errJson = await metaRes.json().catch(() => ({ error: 'Failed to upload metadata' }));
        throw new Error(errJson.error || 'Failed to upload metadata to IPFS storage');
      }

      const metaData = await metaRes.json();
      const metadataUri = metaData.metadataUri;

      // Step 2: Generate unique Mint Keypair
      setLaunchStep('building_tx');
      setStepMessage('Generating on-chain token keypair & deriving Pump.fun bonding curve...');
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey.toBase58();
      setCreatedMint(mintAddress);

      // Step 3-5: Build, Sign & Broadcast Real Pump.fun Launch Transaction with Security Revocations
      const { signature } = await sendAndConfirmPumpLaunch({
        mintKeypair,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        uri: metadataUri,
        initialBuySol: buySolNum,
        revokeMint,
        revokeFreeze,
        revokeUpdate,
        onStatusChange: (step, msg) => {
          if (step === 'building') {
            setLaunchStep('building_tx');
            setStepMessage(msg);
          } else if (step === 'awaiting_signature') {
            setLaunchStep('awaiting_wallet');
            setStepMessage(msg);
          } else if (step === 'submitting') {
            setLaunchStep('submitting');
            setStepMessage(msg);
          } else if (step === 'confirming') {
            setLaunchStep('confirming');
            setStepMessage(msg);
          } else if (step === 'confirmed') {
            setLaunchStep('confirmed');
            setStepMessage(msg);
          }
        },
      });

      setLatestTxSig(signature);

      // Step 6: Multi-Wallet Bundle Execution (for sub-wallets 2..10)
      const subWalletsToBuy = bundleWallets.filter((w) => !w.isPrimary && w.buySol > 0 && w.secretKeyBase58);
      let executedBundleWallets = bundleWallets;

      if (subWalletsToBuy.length > 0) {
        setLaunchStep('executing_bundle');
        setStepMessage(`Executing simultaneous bundle snipes across ${subWalletsToBuy.length} sub-wallets...`);

        executedBundleWallets = await executeAllSubWalletBuys(
          connection,
          bundleWallets,
          mintAddress,
          (walletId, status, sig, err, tokens) => {
            setStepMessage(`Executing bundle buy for wallet (${status})...`);
          }
        );
        setBundleResults(executedBundleWallets);
      }

      // Step 7: Record confirmed token in persistent registry
      const finalImage = metaData.imageUri || imagePreview || imageUrl.trim();
      const newToken: Partial<Token> = {
        id: mintAddress,
        mintAddress: mintAddress,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description: description.trim(),
        logoUrl: finalImage,
        creatorAddress: publicKey,
        createdAt: Date.now(),
        revokeMint,
        revokeFreeze,
        revokeUpdate,
        securityScore,
        clonedFrom: clonedTokenDraft?.name
          ? {
              name: clonedTokenDraft.name,
              symbol: clonedTokenDraft.symbol || '',
              mint: clonedTokenDraft.mintAddress,
            }
          : undefined,
        volume24hSol: buySolNum || 0,
        socials: {
          twitter: twitter.trim() || undefined,
          telegram: telegram.trim() || undefined,
          website: website.trim() || undefined,
        },
      };

      const bundleBuyPayload = subWalletsToBuy.map((w) => ({
        address: w.publicKey,
        solAmount: w.buySol,
        name: w.name,
      }));

      await recordLaunchedToken(newToken, bundleBuyPayload);
      await refreshBalance();

      // Clear cloned draft if used
      if (clonedTokenDraft) {
        setClonedTokenDraft(null);
      }

      setLaunchStep('confirmed');
      setStepMessage(
        subWalletsToBuy.length > 0
          ? `Token launched & ${subWalletsToBuy.length + (buySolNum ? 1 : 0)} wallet bundle successfully executed!`
          : 'Token successfully launched on Pump.fun bonding curve!'
      );

      if (onLaunchSuccess) {
        onLaunchSuccess(newToken as Token);
      }
      if (onTokenCreated) {
        onTokenCreated(newToken as Token);
      }
    } catch (err: any) {
      console.error('Launch execution failed:', err);
      setLaunchStep('error');
      setErrorMessage(err.message || 'Transaction was rejected or failed on-chain.');
    }
  };

  const isLaunching = launchStep !== 'idle' && launchStep !== 'confirmed' && launchStep !== 'error';

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-8">
      {/* Cloned Draft Banner if active */}
      {clonedTokenDraft && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                  Cloning Template Active
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {clonedTokenDraft.name} (${clonedTokenDraft.symbol})
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Details pre-populated. Feel free to tweak the name, symbol, or customize prior to launch!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setClonedTokenDraft(null)}
            className="p-1.5 rounded-lg hover:bg-emerald-200/60 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Clear Clone Template"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <Zap className="w-3.5 h-3.5 text-emerald-600" /> Swagpad Instant Launch, Security & 10-Wallet Bundle Terminal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Create Token & Multi-Wallet Bundle
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Deploy authentic SPL tokens with verified immutable metadata, fixed supply, and up to 10-wallet instant snipe bundles on Pump.fun.
        </p>
      </div>

      {/* Cluster & Account Status Banner with Live Pricing and Qualification */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Network & Live Price Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Cluster: <span className="text-emerald-700 font-mono font-bold">{network}</span>
              {solPriceSource && (
                <span className="ml-2 text-[11px] text-slate-400">
                  • Real-time Feed: {solPriceSource}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refreshSolPrice()}
              disabled={solPriceLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${solPriceLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
              Refresh Price
            </button>
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400 block text-[10px] font-sans">Platform Fee</span>
              <span className="text-emerald-600 font-bold text-sm">0 SOL (Free)</span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-mono">
          {/* 1. SOL Price */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-sans">Live SOL Price</span>
            <span className="text-slate-900 font-bold text-sm">
              {solPriceUsd !== null ? `$${solPriceUsd.toFixed(2)}` : (
                <span className="text-amber-600 text-xs font-normal">Connecting...</span>
              )}
            </span>
            {solPrice24hChange !== 0 && (
              <span className={`text-[10px] block ${solPrice24hChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {solPrice24hChange >= 0 ? '+' : ''}{solPrice24hChange.toFixed(2)}% (24h)
              </span>
            )}
          </div>

          {/* 2. Wallet Balance */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-sans">Wallet Balance</span>
            <span className="text-slate-900 font-bold text-sm">
              {connected ? `${balance.toFixed(4)} SOL` : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              {connected ? 'Primary On-chain' : 'Not connected'}
            </span>
          </div>

          {/* 3. Wallet Value */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-sans">Wallet Value</span>
            <span className="text-slate-900 font-bold text-sm">
              {connected && walletUsdValue !== null ? `$${walletUsdValue.toFixed(2)}` : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              {connected && solPriceUsd ? 'Live USD value' : '—'}
            </span>
          </div>

          {/* 4. Minimum Required */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-sans">Minimum Required</span>
            <span className="text-slate-900 font-bold text-sm">
              ${minLaunchBalanceUsd.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              Min balance in USD
            </span>
          </div>

          {/* 5. Minimum SOL Required */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block font-sans">Min SOL Required</span>
            <span className="text-emerald-700 font-bold text-sm">
              {minLaunchSolRequired !== null ? `${minLaunchSolRequired.toFixed(4)} SOL` : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              {solPriceUsd ? `$${minLaunchBalanceUsd.toFixed(0)} / $${solPriceUsd.toFixed(2)}` : 'Dynamic'}
            </span>
          </div>
        </div>

        {/* Qualification Callout Banner */}
        {connected && !isLaunchEligible && minLaunchSolRequired !== null && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Insufficient Balance for Launch</p>
              <p className="mt-0.5 leading-relaxed">
                Your wallet balance of <span className="font-mono font-bold">{balance.toFixed(4)} SOL</span> (${(walletUsdValue ?? 0).toFixed(2)}) is below the required <span className="font-mono font-bold">${minLaunchBalanceUsd.toFixed(2)}</span> minimum ({minLaunchSolRequired.toFixed(4)} SOL). Please fund your wallet to launch.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Form & Bundle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Metadata, Security & Bundle Configuration */}
        <form onSubmit={handleLaunch} className="lg:col-span-2 space-y-6">
          {/* 1. Token Metadata Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> 1. Token Identity & Metadata
              </h3>
              <button
                id="toggle-ai-generator-btn"
                type="button"
                onClick={() => setShowAiGenerator(!showAiGenerator)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{showAiGenerator ? 'Hide AI Assist' : 'Generate with AgentRouter AI'}</span>
              </button>
            </div>

            {/* AgentRouter AI Prompt Drawer */}
            {showAiGenerator && (
              <div id="agentrouter-ai-prompt-drawer" className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-600" /> AgentRouter AI Meme Engine
                    </span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-mono">
                      OpenAI-Compatible
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-700">Consumes AgentRouter Credits</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="ai-prompt-input"
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Enter meme theme, joke, or concept (e.g. 'Space dog wearing Solana glasses' or 'Trump AI crypto reserve')"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateWithAi();
                      }
                    }}
                  />
                  <button
                    id="trigger-ai-gen-btn"
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    {isAiGenerating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Preset</span>
                      </>
                    )}
                  </button>
                </div>
                {aiStatusMessage && (
                  <p className="text-xs text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-lg font-medium">
                    ✓ {aiStatusMessage}
                  </p>
                )}
              </div>
            )}

            {/* Name & Symbol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Token Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Swag Coin"
                  maxLength={32}
                  disabled={isLaunching}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Ticker Symbol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. SWAG"
                  maxLength={10}
                  disabled={isLaunching}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 font-mono placeholder-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your coin story, community roadmap, and mechanics..."
                rows={3}
                disabled={isLaunching}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Image Upload / URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Token Logo / Image <span className="text-rose-500">*</span>
              </label>

              {/* Drag & Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50'
                    : imagePreview
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-md"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">Image selected</p>
                      <p className="text-xs text-emerald-600 font-medium">Click or drop to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-800">
                      Drop token image here or <span className="text-emerald-600 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-500">PNG, JPG, GIF, WEBP up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Direct URL Input */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-500 block mb-1">Or direct IPFS / image URL:</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                    setImageBase64(null);
                  }}
                  placeholder="https://... (direct image link)"
                  disabled={isLaunching}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Social Links Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowSocials(!showSocials)}
                className="flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  Optional Social Links & Website
                </span>
                {showSocials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSocials && (
                <div className="mt-3 space-y-3 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="Twitter / X profile URL"
                      disabled={isLaunching}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="Telegram community URL"
                      disabled={isLaunching}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Official website URL"
                      disabled={isLaunching}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Security & Authority Revocation Options (Trust Pad) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> 2. Security & Trust Authorities
                </h3>
                <p className="text-xs text-slate-500">
                  Revoking authorities guarantees your token cannot be manipulated or rugpulled.
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold font-mono ${
                    securityScore === 100
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {securityScore}% Trust Score
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Toggle 1: Revoke Update */}
              <label
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  revokeUpdate
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" /> Revoke Update
                    </span>
                    <input
                      type="checkbox"
                      checked={revokeUpdate}
                      onChange={(e) => setRevokeUpdate(e.target.checked)}
                      disabled={isLaunching}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Makes metadata (name, ticker, logo) permanently immutable. Prevents honeypots.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded w-fit">
                  {revokeUpdate ? '✓ Immutable' : '⚠️ Mutable'}
                </span>
              </label>

              {/* Toggle 2: Revoke Mint */}
              <label
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  revokeMint
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-600" /> Revoke Mint
                    </span>
                    <input
                      type="checkbox"
                      checked={revokeMint}
                      onChange={(e) => setRevokeMint(e.target.checked)}
                      disabled={isLaunching}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Revokes mint authority. Locks max supply at strictly 1,000,000,000 tokens.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded w-fit">
                  {revokeMint ? '✓ Fixed Supply' : '⚠️ Mintable'}
                </span>
              </label>

              {/* Toggle 3: Revoke Freeze */}
              <label
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  revokeFreeze
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Ban className="w-4 h-4 text-emerald-600" /> Revoke Freeze
                    </span>
                    <input
                      type="checkbox"
                      checked={revokeFreeze}
                      onChange={(e) => setRevokeFreeze(e.target.checked)}
                      disabled={isLaunching}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Revokes freeze authority so holder token accounts can never be frozen or blacklisted.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded w-fit">
                  {revokeFreeze ? '✓ Unfreezable' : '⚠️ Freezable'}
                </span>
              </label>
            </div>
          </div>

          {/* 3. Multi-Wallet Bundle Section (Up to 10 Wallets) */}
          <BundleConfigSection
            connection={connection}
            network={network}
            primaryPublicKey={publicKey}
            primaryBalance={balance}
            primaryBuySol={initialBuySol}
            onPrimaryBuySolChange={setInitialBuySol}
            bundleWallets={bundleWallets}
            onBundleWalletsChange={setBundleWallets}
            disabled={isLaunching}
          />

          {/* Launch Progress & Execution Status Box */}
          {launchStep !== 'idle' && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                launchStep === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : launchStep === 'confirmed'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2.5 text-sm">
                  {launchStep === 'confirmed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : launchStep === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                  )}
                  {stepMessage}
                </span>
                <span className="uppercase text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  {launchStep.replace('_', ' ')}
                </span>
              </div>

              {latestTxSig && (
                <div className="font-mono text-xs pt-2 flex items-center justify-between text-slate-600 border-t border-slate-200">
                  <span>Creation Signature:</span>
                  <a
                    href={`https://explorer.solana.com/tx/${latestTxSig}?cluster=${network}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                  >
                    {latestTxSig.slice(0, 8)}...{latestTxSig.slice(-6)}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {createdMint && (
                <div className="font-mono text-xs flex items-center justify-between text-slate-600">
                  <span>Mint Address:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">{createdMint.slice(0, 8)}...{createdMint.slice(-6)}</span>
                    <a
                      href={`https://pump.fun/coin/${createdMint}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                    >
                      Pump.fun
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Multi-wallet Execution Results Table */}
              {bundleResults.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5 font-mono text-[11px]">
                  <span className="font-sans font-bold text-slate-900 block">Bundle Execution Status:</span>
                  {bundleResults.map((w) => (
                    <div key={w.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-700 font-semibold">{w.name}</span>
                      <div className="flex items-center gap-2">
                        {w.txSignature ? (
                          <a
                            href={`https://explorer.solana.com/tx/${w.txSignature}?cluster=${network}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            ✓ {w.tokensReceived?.toLocaleString()} tokens ({w.txSignature.slice(0, 6)}...)
                          </a>
                        ) : (
                          <span className="text-slate-400">Created with master</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMessage && launchStep === 'idle' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Launch Action Button */}
          {!connected ? (
            <button
              type="button"
              onClick={() => connectWallet()}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer"
            >
              Connect Solana Wallet to Launch
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLaunching}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer"
            >
              <Rocket className="w-5 h-5" />
              {isLaunching
                ? 'Executing Real Pump.fun Launch & Bundle...'
                : launchStep === 'confirmed'
                ? 'Launch Another Token'
                : `Deploy & Execute Bundle (${bundleSummary.activeWalletsCount || 1} Wallets, ${bundleSummary.totalBuySol.toFixed(3)} SOL)`}
            </button>
          )}
        </form>

        {/* Right Column: Live Bonding Curve Preview & Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Live Bonding Curve Preview
            </h3>

            <div className="flex items-center gap-3 pt-2">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Token preview"
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {name.trim() || 'Token Name'}
                </h4>
                <p className="text-xs font-mono text-emerald-600 font-bold">
                  ${symbol.trim().toUpperCase() || 'SYMBOL'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              {description.trim() || 'Token description will appear on Pump.fun and dex aggregators.'}
            </p>

            {/* Compact Security Badges Preview */}
            <div className="pt-2">
              <SecurityBadges
                revokeMint={revokeMint}
                revokeFreeze={revokeFreeze}
                revokeUpdate={revokeUpdate}
                securityScore={securityScore}
                compact
              />
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Protocol:</span>
                <span className="text-emerald-700 font-bold">Pump.fun Bonding Curve</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Total Supply:</span>
                <span className="text-slate-900 font-bold">1,000,000,000</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Bundled Wallets:</span>
                <span className="text-emerald-700 font-bold">{bundleWallets.length} Configured</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Total Sniped:</span>
                <span className="text-emerald-700 font-bold">{bundleSummary.percentSupplySniped.toFixed(2)}% of supply</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">Creator:</span>
                <span className="text-slate-900 font-bold">
                  {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Connect wallet'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Swagpad Launch Security
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-emerald-900 text-[11px] leading-relaxed">
              <li>Revoking authorities displays verified green badges across all DEX terminals.</li>
              <li>Configure your 10 wallets and fund them <strong>before</strong> pressing Deploy.</li>
              <li>Export your private keys JSON to retain backup access to all sniped tokens.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
