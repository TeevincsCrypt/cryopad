import React, { useState, useRef, useMemo } from 'react';
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
  Info,
  Layers,
} from 'lucide-react';
import { useSolana } from '../solana/solanaContext';
import { useTokenStore } from '../data/tokenStore';
import { Token } from '../types/token';

interface LaunchPageProps {
  onLaunchSuccess?: (token: Token) => void;
  onSelectToken?: (token: Token) => void;
}

type LaunchStep =
  | 'idle'
  | 'preparing_metadata'
  | 'building_tx'
  | 'awaiting_wallet'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'error';

export const LaunchPage: React.FC<LaunchPageProps> = ({
  onLaunchSuccess,
  onSelectToken,
}) => {
  const {
    connected,
    publicKey,
    balance,
    network,
    endpoint,
    connectWallet,
    sendAndConfirmPumpLaunch,
    minLaunchBalanceSol,
    refreshBalance,
  } = useSolana();

  const { recordLaunchedToken } = useTokenStore();

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

  const [showSocials, setShowSocials] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Lifecycle
  const [launchStep, setLaunchStep] = useState<LaunchStep>('idle');
  const [stepMessage, setStepMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestTxSig, setLatestTxSig] = useState<string | null>(null);
  const [createdMint, setCreatedMint] = useState<string | null>(null);
  const [pinnedMetadataUri, setPinnedMetadataUri] = useState<string | null>(null);

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
      // Strip data url prefix for base64 data
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageUrl(''); // Clear url input if file is used
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

  // Estimated tokens for initial buy
  const estimatedInitialTokens = useMemo(() => {
    const sol = parseFloat(initialBuySol);
    if (isNaN(sol) || sol <= 0) return 0;
    const virtualSol = 30;
    const virtualTokens = 1073000000;
    const tokensOut = (virtualTokens * sol) / (virtualSol + sol);
    return Math.floor(tokensOut);
  }, [initialBuySol]);

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
      return `Initial buy (${buySol} SOL) exceeds your available wallet balance (${balance.toFixed(3)} SOL)`;
    }

    if (balance < minLaunchBalanceSol) {
      return `Wallet balance of at least ${minLaunchBalanceSol} SOL is required to qualify for Pump.fun deployment. Your current balance is ${balance.toFixed(3)} SOL.`;
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
      setPinnedMetadataUri(metadataUri);

      // Step 2: Generate unique Mint Keypair
      setLaunchStep('building_tx');
      setStepMessage('Generating on-chain token keypair & deriving Pump.fun bonding curve...');
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey.toBase58();
      setCreatedMint(mintAddress);

      // Step 3-5: Build, Sign & Broadcast Real Pump.fun Launch Transaction
      const { signature } = await sendAndConfirmPumpLaunch({
        mintKeypair,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        uri: metadataUri,
        initialBuySol: buySolNum,
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

      // Step 6: Record confirmed token in persistent registry
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
        socials: {
          twitter: twitter.trim() || undefined,
          telegram: telegram.trim() || undefined,
          website: website.trim() || undefined,
        },
      };

      await recordLaunchedToken(newToken);
      await refreshBalance();

      setLaunchStep('confirmed');
      setStepMessage('Token successfully launched on Pump.fun bonding curve!');

      if (onLaunchSuccess) {
        onLaunchSuccess(newToken as Token);
      }
    } catch (err: any) {
      console.error('Launch execution failed:', err);
      setLaunchStep('error');
      setErrorMessage(err.message || 'Transaction was rejected or failed on-chain.');
    }
  };

  const isEligible = balance >= minLaunchBalanceSol;
  const isLaunching = launchStep !== 'idle' && launchStep !== 'confirmed' && launchStep !== 'error';

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" /> Pump.fun On-Chain Protocol Launch
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create & Launch Solana Token
        </h1>
        <p className="text-sm text-[#A1A1AA] max-w-2xl">
          Deploy an authentic SPL token directly to the official Pump.fun bonding curve. 0 SOL platform creation fee.
        </p>
      </div>

      {/* Cluster & Account Status Banner */}
      <div className="p-5 rounded-2xl bg-[#121215] border border-[#26262B] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#1F1F23]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Network & Launch Qualification
            </h3>
            <p className="text-xs text-[#71717A]">
              Active Cluster: <span className="text-emerald-400 font-mono font-semibold">{network}</span>
            </p>
          </div>
          <div className="text-right font-mono text-xs">
            <span className="text-[#71717A] block">Platform Fee</span>
            <span className="text-emerald-400 font-bold text-sm">0 SOL (Free)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Your Balance</span>
            <span className="text-white font-bold text-sm">{balance.toFixed(3)} SOL</span>
          </div>
          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Required Minimum</span>
            <span className="text-white font-bold text-sm">{minLaunchBalanceSol} SOL</span>
          </div>
          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Network & Rent</span>
            <span className="text-white font-bold text-sm">~0.024 SOL</span>
          </div>
          <div className="p-3 rounded-xl bg-[#18181C] border border-[#26262B]">
            <span className="text-[#71717A] text-[11px] block">Status</span>
            <span className={`font-bold text-sm ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isEligible ? 'Qualified' : 'Needs SOL'}
            </span>
          </div>
        </div>

        {!isEligible && connected && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Minimum balance required:</span> A balance of at least {minLaunchBalanceSol} SOL is required to qualify for deployment on this cluster ({network}). The platform fee is 0 SOL.
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Launch Form (2 Columns) */}
        <form onSubmit={handleLaunch} className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#121215] border border-[#26262B] space-y-6 shadow-2xl">
            {/* Name & Symbol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#E5E5E5] block">
                  Token Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cyber Pup"
                  maxLength={32}
                  disabled={isLaunching}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#18181C] border border-[#26262B] text-sm text-white placeholder-[#71717A] focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#E5E5E5] block">
                  Ticker Symbol <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. CPUP"
                  maxLength={10}
                  disabled={isLaunching}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#18181C] border border-[#26262B] text-sm text-white font-mono placeholder-[#71717A] focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5] block">
                Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your coin story, mechanics, and mission..."
                rows={3}
                disabled={isLaunching}
                required
                className="w-full px-4 py-3 rounded-xl bg-[#18181C] border border-[#26262B] text-sm text-white placeholder-[#71717A] focus:border-emerald-500 outline-none transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Image Upload / URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#E5E5E5] block">
                Token Logo / Image <span className="text-rose-400">*</span>
              </label>

              {/* Drag & Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : imagePreview
                    ? 'border-emerald-500/40 bg-[#18181C]'
                    : 'border-[#26262B] bg-[#18181C] hover:border-[#3F3F46]'
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
                      className="w-16 h-16 rounded-xl object-cover border border-[#26262B] shadow-md"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">Image selected</p>
                      <p className="text-xs text-emerald-400">Click or drop to change image</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#26262B] flex items-center justify-center mx-auto text-[#A1A1AA]">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-white">
                      Drop token image here or <span className="text-emerald-400 underline">browse</span>
                    </p>
                    <p className="text-[11px] text-[#71717A]">PNG, JPG, GIF, WEBP up to 5MB</p>
                  </div>
                )}
              </div>

              {/* Or Direct URL Input */}
              <div className="pt-2">
                <span className="text-[11px] text-[#71717A] block mb-1">Or provide direct image URL:</span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                    setImageBase64(null);
                  }}
                  placeholder="https://... (IPFS or direct HTTPS image)"
                  disabled={isLaunching}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#18181C] border border-[#26262B] text-xs text-white placeholder-[#71717A] focus:border-emerald-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            {/* Optional Initial Buy */}
            <div className="p-4 rounded-2xl bg-[#18181C] border border-[#26262B] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Initial Developer Buy (Optional)
                </label>
                <span className="text-[11px] text-[#71717A]">Bundled atomically</span>
              </div>
              <p className="text-xs text-[#A1A1AA]">
                Snipe the initial bonding curve supply during creation to secure the first tokens.
              </p>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={balance}
                  value={initialBuySol}
                  onChange={(e) => setInitialBuySol(e.target.value)}
                  placeholder="0.0 SOL (optional)"
                  disabled={isLaunching}
                  className="w-full px-4 py-2.5 pr-16 rounded-xl bg-[#121215] border border-[#26262B] text-xs text-white font-mono placeholder-[#71717A] focus:border-emerald-500 outline-none disabled:opacity-50"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-[#71717A]">SOL</span>
              </div>
              {estimatedInitialTokens > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-mono bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <span>Estimated Tokens:</span>
                  <span className="font-bold">~{estimatedInitialTokens.toLocaleString()} {symbol || 'TOKEN'}</span>
                </div>
              )}
            </div>

            {/* Social Links Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowSocials(!showSocials)}
                className="flex items-center justify-between w-full py-2.5 px-4 rounded-xl bg-[#18181C] border border-[#26262B] text-xs font-semibold text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Optional Social Links & Website
                </span>
                {showSocials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSocials && (
                <div className="mt-3 space-y-3 p-4 rounded-xl bg-[#18181C]/50 border border-[#26262B]">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-[#71717A] shrink-0" />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="Twitter / X profile URL"
                      disabled={isLaunching}
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#26262B] text-xs text-white placeholder-[#71717A] outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#71717A] shrink-0" />
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="Telegram community URL"
                      disabled={isLaunching}
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#26262B] text-xs text-white placeholder-[#71717A] outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#71717A] shrink-0" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Official website URL"
                      disabled={isLaunching}
                      className="w-full px-3 py-2 rounded-lg bg-[#121215] border border-[#26262B] text-xs text-white placeholder-[#71717A] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Launch Progress Box */}
            {launchStep !== 'idle' && (
              <div
                className={`p-5 rounded-2xl border text-xs space-y-3 transition-all ${
                  launchStep === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : launchStep === 'confirmed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-2.5 text-sm">
                    {launchStep === 'confirmed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : launchStep === 'error' ? (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                    )}
                    {stepMessage}
                  </span>
                  <span className="uppercase text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-black/40 border border-white/10">
                    {launchStep.replace('_', ' ')}
                  </span>
                </div>

                {latestTxSig && (
                  <div className="font-mono text-xs pt-2 flex items-center justify-between text-[#A1A1AA] border-t border-white/10">
                    <span>Transaction Signature:</span>
                    <a
                      href={`https://explorer.solana.com/tx/${latestTxSig}?cluster=${network}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      {latestTxSig.slice(0, 8)}...{latestTxSig.slice(-6)}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {createdMint && (
                  <div className="font-mono text-xs flex items-center justify-between text-[#A1A1AA]">
                    <span>Mint Address:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{createdMint.slice(0, 8)}...{createdMint.slice(-6)}</span>
                      <a
                        href={`https://pump.fun/coin/${createdMint}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        Pump.fun
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorMessage && launchStep === 'idle' && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Launch Action Button */}
            {!connected ? (
              <button
                type="button"
                onClick={() => connectWallet()}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-sm transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
              >
                Connect Solana Wallet to Launch
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLaunching}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                {isLaunching
                  ? 'Executing Real Pump.fun Launch...'
                  : launchStep === 'confirmed'
                  ? 'Launch Another Token'
                  : 'Deploy Token on Pump.fun (0 SOL Fee)'}
              </button>
            )}
          </div>
        </form>

        {/* Live Token Preview Card (1 Column) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Live Bonding Curve Preview
          </h3>

          <div className="p-5 rounded-3xl bg-[#121215] border border-[#26262B] space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Token preview"
                  className="w-14 h-14 rounded-2xl object-cover border border-[#26262B]"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#18181C] border border-[#26262B] flex items-center justify-center text-[#71717A]">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-white">
                  {name.trim() || 'Token Name'}
                </h4>
                <p className="text-xs font-mono text-emerald-400 font-semibold">
                  ${symbol.trim().toUpperCase() || 'SYMBOL'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
              {description.trim() || 'Token description will appear here on Pump.fun and dex aggregators.'}
            </p>

            <div className="pt-3 border-t border-[#1F1F23] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[#71717A]">
                <span>Bonding Curve:</span>
                <span className="text-emerald-400">Pump.fun Virtual Pool</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Total Supply:</span>
                <span className="text-white">1,000,000,000</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Creator:</span>
                <span className="text-white">
                  {publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Connect wallet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
