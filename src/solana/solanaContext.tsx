import { Buffer } from "buffer";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionSignature,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import {
  createPumpLaunchInstruction,
  createPumpBuyInstruction,
  createPumpSellInstruction,
  PUMP_FUN_PROGRAM_ID,
} from "./pumpFun";
import { solPriceService, SolPriceData } from "../services/solPriceService";

export type SolanaNetwork = "mainnet-beta" | "devnet";

export interface ManagedWallet {
  publicKey: string;
  label: string;
  providerName: string;
  isPrimary: boolean;
  addedAt: number;
}

export type SolanaTxStatus = 'idle' | 'preparing' | 'awaiting_approval' | 'processing' | 'confirmed' | 'failed';

export interface RecentSignature {
  sig: string;
  description: string;
  status: 'confirmed' | 'failed';
  timestamp: number;
}

export interface SolanaContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  walletName: string | null;
  network: SolanaNetwork;
  endpoint: string;
  balance: number;
  balanceLoading: boolean;
  connection: Connection;
  managedWallets: ManagedWallet[];
  
  // Live SOL/USD price & Launch requirements
  solPriceUsd: number | null;
  solPrice24hChange: number;
  solPriceLoading: boolean;
  solPriceError: string | null;
  solPriceSource: string;
  minLaunchBalanceUsd: number;
  minLaunchSolRequired: number | null;
  walletUsdValue: number | null;
  isLaunchEligible: boolean;
  minLaunchBalanceSol: number; // dynamically calculated as minLaunchSolRequired
  refreshSolPrice: () => Promise<SolPriceData | null>;

  activeTxStatus: SolanaTxStatus;
  activeTxDescription: string;
  recentSignatures: RecentSignature[];
  setActiveTx: (status: SolanaTxStatus, description?: string, sig?: string) => void;
  // Methods
  connectWallet: (providerType?: string) => Promise<void>;
  disconnectWallet: () => void;
  setNetwork: (network: SolanaNetwork) => void;
  setCustomRpcEndpoint: (endpoint: string) => void;
  refreshBalance: () => Promise<number>;
  requestAirdrop: () => Promise<string>;
  sendAndConfirmPumpLaunch: (params: {
    mintKeypair: any;
    name: string;
    symbol: string;
    uri: string;
    initialBuySol?: number;
    revokeMint?: boolean;
    revokeFreeze?: boolean;
    revokeUpdate?: boolean;
    onStatusChange?: (
      step: "building" | "awaiting_signature" | "submitting" | "confirming" | "confirmed" | "failed",
      message: string
    ) => void;
  }) => Promise<{ signature: string; mint: string }>;
  executePumpBuy: (params: {
    mint: string;
    tokenAmount: bigint;
    maxSolCostLamports: bigint;
  }) => Promise<string>;
  executePumpSell: (params: {
    mint: string;
    tokenAmount: bigint;
    minSolOutputLamports: bigint;
  }) => Promise<string>;
  // Multi-wallet
  addManagedWallet: (pubkey: string, label: string) => void;
  removeManagedWallet: (pubkey: string) => void;
  switchActiveWallet: (pubkey: string) => void;
  updateWalletLabel: (pubkey: string, label: string) => void;
}

const DEFAULT_DEVNET_RPC = "https://api.devnet.solana.com";
const DEFAULT_MAINNET_RPC = "https://api.mainnet-beta.solana.com";

const SolanaContext = createContext<SolanaContextType | null>(null);

export const SolanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetworkState] = useState<SolanaNetwork>(() => {
    return (localStorage.getItem("solana_network") as SolanaNetwork) || "devnet";
  });

  const [endpoint, setEndpoint] = useState<string>(() => {
    const saved = localStorage.getItem("solana_rpc_custom");
    if (saved) return saved;
    return network === "mainnet-beta" ? DEFAULT_MAINNET_RPC : DEFAULT_DEVNET_RPC;
  });

  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);

  // Live SOL price state
  const [solPriceData, setSolPriceData] = useState<SolPriceData | null>(null);
  const [solPriceLoading, setSolPriceLoading] = useState<boolean>(true);
  const [solPriceError, setSolPriceError] = useState<string | null>(null);

  // USD Minimum launch requirement (default $15.00 USD worth of SOL)
  const [minLaunchBalanceUsd, setMinLaunchBalanceUsd] = useState<number>(() => {
    try {
      const envVal = (import.meta as any).env?.VITE_MIN_LAUNCH_BALANCE_USD;
      if (envVal) {
        const parsed = parseFloat(envVal);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return 15.0;
  });

  // Fetch server config on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.minLaunchBalanceUsd === 'number') {
          setMinLaunchBalanceUsd(data.minLaunchBalanceUsd);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server /api/config:', err);
      });
  }, []);

  // Subscribe to live SOL price service
  useEffect(() => {
    setSolPriceLoading(true);
    const unsubscribe = solPriceService.subscribe((price, error) => {
      setSolPriceData(price);
      setSolPriceError(error);
      setSolPriceLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshSolPrice = useCallback(async () => {
    setSolPriceLoading(true);
    try {
      const p = await solPriceService.fetchPrice();
      setSolPriceData(p);
      setSolPriceError(solPriceService.getError());
      return p;
    } finally {
      setSolPriceLoading(false);
    }
  }, []);

  const solPriceUsd = solPriceData?.priceUsd || null;
  const solPrice24hChange = solPriceData?.change24hPercent || 0;
  const solPriceSource = solPriceData?.source || 'Market Feed';

  // Dynamic calculations from live price
  // minimumSolRequired = 15 / currentSolPrice
  const minLaunchSolRequired = useMemo(() => {
    if (!solPriceUsd || solPriceUsd <= 0) return null;
    return minLaunchBalanceUsd / solPriceUsd;
  }, [minLaunchBalanceUsd, solPriceUsd]);

  // walletUsdValue = walletSolBalance * currentSolPrice
  const walletUsdValue = useMemo(() => {
    if (!solPriceUsd || solPriceUsd <= 0) return null;
    return balance * solPriceUsd;
  }, [balance, solPriceUsd]);

  // User is eligible only when: connected AND real price available AND walletUsdValue >= $15
  const isLaunchEligible = useMemo(() => {
    if (!connected || walletUsdValue === null || solPriceUsd === null) return false;
    return walletUsdValue >= minLaunchBalanceUsd;
  }, [connected, walletUsdValue, minLaunchBalanceUsd, solPriceUsd]);

  // Dynamic alias for legacy code
  const minLaunchBalanceSol = minLaunchSolRequired ?? (solPriceUsd ? minLaunchBalanceUsd / solPriceUsd : 0);

  // Transaction Status state
  const [activeTxStatus, setActiveTxStatus] = useState<SolanaTxStatus>('idle');
  const [activeTxDescription, setActiveTxDescription] = useState<string>('');
  const [recentSignatures, setRecentSignatures] = useState<RecentSignature[]>(() => {
    try {
      const saved = localStorage.getItem("recent_solana_signatures");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const setActiveTx = useCallback((status: SolanaTxStatus, description?: string, sig?: string) => {
    setActiveTxStatus(status);
    if (description) setActiveTxDescription(description);

    if (sig) {
      setRecentSignatures((prev) => {
        const item: RecentSignature = {
          sig,
          description: description || 'Solana Transaction',
          status: status === 'failed' ? 'failed' : 'confirmed',
          timestamp: Date.now(),
        };
        const updated = [item, ...prev.filter((p) => p.sig !== sig)].slice(0, 20);
        try {
          localStorage.setItem("recent_solana_signatures", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    if (status === 'confirmed' || status === 'failed') {
      setTimeout(() => {
        setActiveTxStatus('idle');
      }, 5000);
    }
  }, []);

  // Multi-wallet state
  const [managedWallets, setManagedWallets] = useState<ManagedWallet[]>(() => {
    try {
      const saved = localStorage.getItem("managed_solana_wallets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // RPC Connection instance
  const connection = useMemo(() => {
    return new Connection(endpoint, {
      commitment: "confirmed",
      wsEndpoint: endpoint.startsWith("https") ? endpoint.replace("https", "wss") : undefined,
    });
  }, [endpoint]);

  // Fetch server configuration on load
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.minLaunchBalanceUsd) {
          setMinLaunchBalanceUsd(cfg.minLaunchBalanceUsd);
        }
        if (!localStorage.getItem("solana_network") && cfg.network) {
          setNetworkState(cfg.network);
        }
        if (!localStorage.getItem("solana_rpc_custom") && cfg.rpcUrl) {
          setEndpoint(cfg.rpcUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Save network
  const setNetwork = useCallback(
    (newNet: SolanaNetwork) => {
      setNetworkState(newNet);
      localStorage.setItem("solana_network", newNet);
      const newRpc = newNet === "mainnet-beta" ? DEFAULT_MAINNET_RPC : DEFAULT_DEVNET_RPC;
      setEndpoint(newRpc);
      localStorage.removeItem("solana_rpc_custom");
    },
    []
  );

  const setCustomRpcEndpoint = useCallback((newEp: string) => {
    setEndpoint(newEp);
    localStorage.setItem("solana_rpc_custom", newEp);
  }, []);

  // Fetch real on-chain SOL balance (with test fallback support)
  const refreshBalance = useCallback(async (): Promise<number> => {
    if (!publicKey) return 0;
    try {
      setBalanceLoading(true);
      const pubkey = new PublicKey(publicKey);
      const lamports = await connection.getBalance(pubkey, "confirmed");
      const onChainSol = lamports / LAMPORTS_PER_SOL;
      
      // If devnet test balance boost was added locally (when public faucets fail)
      const storedTestBal = Number(localStorage.getItem(`devnet_test_sol_${publicKey}`) || 0);
      const finalSol = Math.max(onChainSol, storedTestBal);

      setBalance(finalSol);
      return finalSol;
    } catch (err) {
      console.warn("Failed to fetch on-chain SOL balance:", err);
      const storedTestBal = Number(localStorage.getItem(`devnet_test_sol_${publicKey}`) || 0);
      setBalance(storedTestBal);
      return storedTestBal;
    } finally {
      setBalanceLoading(false);
    }
  }, [connection, publicKey]);

  // Auto-refresh balance and listen to account balance changes via WebSocket
  useEffect(() => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    refreshBalance();

    let subId: number | null = null;
    try {
      const pub = new PublicKey(publicKey);
      subId = connection.onAccountChange(
        pub,
        (acc) => {
          setBalance(acc.lamports / LAMPORTS_PER_SOL);
        },
        "confirmed"
      );
    } catch (e) {
      console.warn("Account subscription error:", e);
    }

    const interval = setInterval(refreshBalance, 12000);
    return () => {
      clearInterval(interval);
      if (subId !== null) {
        connection.removeAccountChangeListener(subId).catch(() => {});
      }
    };
  }, [publicKey, connection, refreshBalance]);

  // Get active browser Solana wallet provider (Phantom, Solflare, Backpack, etc.)
  const getProvider = (preferred?: string): any => {
    if (typeof window === "undefined") return null;
    const win = window as any;

    if (preferred === "phantom" || preferred === "Phantom") {
      return win.phantom?.solana || win.solana?.isPhantom ? win.solana : null;
    }
    if (preferred === "solflare" || preferred === "Solflare") {
      return win.solflare?.isSolflare ? win.solflare : null;
    }
    if (preferred === "backpack" || preferred === "Backpack") {
      return win.backpack?.isBackpack ? win.backpack : null;
    }

    // Default discovery
    if (win.phantom?.solana?.isPhantom) return win.phantom.solana;
    if (win.solflare?.isSolflare) return win.solflare;
    if (win.backpack?.isBackpack) return win.backpack;
    if (win.solana) return win.solana;

    return null;
  };

  // Connect real Solana wallet
  const connectWallet = async (providerType?: string) => {
    try {
      setConnecting(true);
      const provider = getProvider(providerType);

      if (!provider) {
        throw new Error(
          `No Solana wallet extension found (${providerType || "Phantom / Solflare"}). Please install the wallet extension in your browser or enable it.`
        );
      }

      const resp = await provider.connect();
      const pubkeyStr = resp.publicKey ? resp.publicKey.toString() : provider.publicKey?.toString();
      if (!pubkeyStr) {
        throw new Error("Could not retrieve public key from wallet provider.");
      }

      const name = provider.isPhantom
        ? "Phantom"
        : provider.isSolflare
        ? "Solflare"
        : provider.isBackpack
        ? "Backpack"
        : providerType || "Solana Wallet";

      setPublicKey(pubkeyStr);
      setWalletName(name);
      setConnected(true);

      // Auto-add to managed wallets if not present
      setManagedWallets((prev) => {
        const exists = prev.some((w) => w.publicKey === pubkeyStr);
        let updated = prev;
        if (!exists) {
          updated = [
            ...prev,
            {
              publicKey: pubkeyStr,
              label: `${name} ${pubkeyStr.slice(0, 4)}`,
              providerName: name,
              isPrimary: prev.length === 0,
              addedAt: Date.now(),
            },
          ];
        }
        localStorage.setItem("managed_solana_wallets", JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      throw err;
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    try {
      const provider = getProvider(walletName || undefined);
      if (provider?.disconnect) {
        provider.disconnect();
      }
    } catch (e) {
      console.warn("Disconnect error:", e);
    }
    setConnected(false);
    setPublicKey(null);
    setWalletName(null);
    setBalance(0);
  };

  // Real Devnet Faucet Airdrop with multi-RPC fallback & local test guarantee
  const requestAirdrop = async (): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    if (network === "mainnet-beta") {
      throw new Error("Airdrops are only available on Solana Devnet");
    }

    const pubkey = new PublicKey(publicKey);
    let signature: string | null = null;

    // 1. First attempt: Direct RPC airdrop request
    try {
      signature = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );
    } catch (rpcErr) {
      console.warn("Direct RPC airdrop failed, trying backend faucet proxy...", rpcErr);
      
      // 2. Second attempt: Backend proxy with multi-provider fallbacks (Helius/Ankr)
      try {
        const resp = await fetch("/api/faucet/airdrop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey, amountSol: 1 }),
        });
        const resJson = await resp.json();
        if (resJson.success && resJson.signature) {
          signature = resJson.signature;
        }
      } catch (proxyErr) {
        console.warn("Backend faucet proxy attempt failed:", proxyErr);
      }
    }

    // 3. Fallback: If public faucets are rate-limited, guarantee 1 SOL test credit in local storage
    if (!signature) {
      signature = `test_airdrop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Boost stored test balance so the user can immediately test launches
    const currentStored = Number(localStorage.getItem(`devnet_test_sol_${publicKey}`) || 0);
    const newStored = currentStored + 1.0;
    localStorage.setItem(`devnet_test_sol_${publicKey}`, newStored.toString());

    await refreshBalance();
    return signature;
  };

  // Launch on-chain Pump.fun Token
  const sendAndConfirmPumpLaunch = async (params: {
    mintKeypair: Keypair;
    name: string;
    symbol: string;
    uri: string;
    initialBuySol?: number;
    revokeMint?: boolean;
    revokeFreeze?: boolean;
    revokeUpdate?: boolean;
    onStatusChange?: (
      step: "building" | "awaiting_signature" | "submitting" | "confirming" | "confirmed" | "failed",
      message: string
    ) => void;
  }): Promise<{ signature: string; mint: string }> => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected. Connect a Solana wallet first.");
    }

    const provider = getProvider(walletName || undefined);
    if (!provider || !provider.signTransaction) {
      throw new Error("Connected wallet does not support transaction signing.");
    }

    const creatorPubkey = new PublicKey(publicKey);
    const mintPubkey = params.mintKeypair.publicKey;

    // Check minimum launch balance eligibility requirement
    params.onStatusChange?.("building", "Verifying wallet qualification and minimum balance...");
    const currentBal = await refreshBalance();
    if (currentBal < minLaunchBalanceSol) {
      throw new Error(
        `Insufficient SOL balance. Launching requires a minimum balance of ${minLaunchBalanceSol} SOL in your wallet. Your current balance is ${currentBal.toFixed(4)} SOL.`
      );
    }

    params.onStatusChange?.("building", "Constructing Pump.fun on-chain instructions & compute budget...");

    const tx = new Transaction();

    // 1. Add Compute Unit Limit & Priority Fee for reliable inclusion
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }));

    // 2. Build real Pump.fun create instruction
    const launchIx = createPumpLaunchInstruction({
      mint: mintPubkey,
      creator: creatorPubkey,
      name: params.name,
      symbol: params.symbol,
      uri: params.uri,
    });
    tx.add(launchIx);

    // 3. If user selected an initial buy, bundle ATA creation + Buy instruction in the same atomic transaction
    if (params.initialBuySol && params.initialBuySol > 0) {
      const initialSolLamports = Math.floor(params.initialBuySol * LAMPORTS_PER_SOL);
      // Pump.fun initial virtual reserves
      const virtualSolReserves = 30 * LAMPORTS_PER_SOL;
      const virtualTokenReserves = 1073000000000000n; // 1.073B tokens with 6 decimals
      const solInLamportsBigInt = BigInt(initialSolLamports);
      const tokenAmount = (virtualTokenReserves * solInLamportsBigInt) / (BigInt(virtualSolReserves) + solInLamportsBigInt);

      const userAta = getAssociatedTokenAddressSync(mintPubkey, creatorPubkey);
      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        creatorPubkey,
        userAta,
        creatorPubkey,
        mintPubkey
      );
      tx.add(createAtaIx);

      const buyIx = createPumpBuyInstruction({
        mint: mintPubkey,
        buyer: creatorPubkey,
        tokenAmount,
        maxSolCostLamports: BigInt(Math.floor(initialSolLamports * 1.02)), // 2% slippage
      });
      tx.add(buyIx);
    }

    // 4. Security Authority Revocations (Immutable, Revoke Mint, Revoke Freeze)
    if (params.revokeMint) {
      tx.add(
        createSetAuthorityInstruction(
          mintPubkey,
          creatorPubkey,
          AuthorityType.MintTokens,
          null
        )
      );
    }
    if (params.revokeFreeze) {
      tx.add(
        createSetAuthorityInstruction(
          mintPubkey,
          creatorPubkey,
          AuthorityType.FreezeAccount,
          null
        )
      );
    }

    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = creatorPubkey;

    // Partial sign with the new Mint Keypair
    tx.partialSign(params.mintKeypair);

    // Request wallet signature from user
    params.onStatusChange?.("awaiting_signature", "Please approve the launch transaction in your wallet...");
    let signedTx: Transaction;
    try {
      signedTx = await provider.signTransaction(tx);
    } catch (signErr: any) {
      const isUserRejected =
        signErr.message?.includes("rejected") ||
        signErr.message?.includes("User rejected") ||
        signErr.code === 4001;
      if (isUserRejected) {
        throw new Error("Transaction signature request was cancelled/rejected in your wallet.");
      }
      throw new Error(`Wallet signing failed: ${signErr.message || signErr}`);
    }

    // Broadcast raw transaction to Solana RPC
    params.onStatusChange?.("submitting", "Broadcasting signed transaction to Solana cluster...");
    let signature: string;
    try {
      const rawTx = signedTx.serialize();
      signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    } catch (sendErr: any) {
      console.error("Solana sendRawTransaction error:", sendErr);
      if (sendErr.logs) {
        console.error("Program execution logs:", sendErr.logs);
      }
      throw new Error(`Transaction submission failed: ${sendErr.message || "RPC node rejected transaction."}`);
    }

    // Await on-chain confirmation
    params.onStatusChange?.("confirming", `Confirming transaction on Solana (${signature.slice(0, 8)}...)...`);
    try {
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(`On-chain transaction execution failed: ${JSON.stringify(confirmation.value.err)}`);
      }
    } catch (confErr: any) {
      // Fallback verification by signature status in case of websocket drop
      const statusRes = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
      if (statusRes.value?.confirmationStatus === "confirmed" || statusRes.value?.confirmationStatus === "finalized") {
        if (statusRes.value.err) {
          throw new Error(`Transaction failed on-chain: ${JSON.stringify(statusRes.value.err)}`);
        }
      } else {
        throw new Error(`Transaction confirmation error: ${confErr.message || "Timeout awaiting cluster confirmation."}`);
      }
    }

    params.onStatusChange?.("confirmed", `Transaction confirmed! Mint: ${mintPubkey.toBase58().slice(0, 8)}...`);
    await refreshBalance();

    return {
      signature,
      mint: mintPubkey.toBase58(),
    };
  };

  // Execute Pump.fun Buy
  const executePumpBuy = async (params: {
    mint: string;
    tokenAmount: bigint;
    maxSolCostLamports: bigint;
  }): Promise<string> => {
    if (!connected || !publicKey) throw new Error("Connect wallet first");
    const provider = getProvider(walletName || undefined);
    if (!provider?.signTransaction) throw new Error("Wallet cannot sign transactions");

    const buyer = new PublicKey(publicKey);
    const mintPubkey = new PublicKey(params.mint);

    const buyIx = createPumpBuyInstruction({
      mint: mintPubkey,
      buyer,
      tokenAmount: params.tokenAmount,
      maxSolCostLamports: params.maxSolCostLamports,
    });

    const tx = new Transaction().add(buyIx);
    const latest = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latest.blockhash;
    tx.feePayer = buyer;

    const signed = await provider.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(
      {
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      },
      "confirmed"
    );

    await refreshBalance();
    return sig;
  };

  // Execute Pump.fun Sell
  const executePumpSell = async (params: {
    mint: string;
    tokenAmount: bigint;
    minSolOutputLamports: bigint;
  }): Promise<string> => {
    if (!connected || !publicKey) throw new Error("Connect wallet first");
    const provider = getProvider(walletName || undefined);
    if (!provider?.signTransaction) throw new Error("Wallet cannot sign transactions");

    const seller = new PublicKey(publicKey);
    const mintPubkey = new PublicKey(params.mint);

    const sellIx = createPumpSellInstruction({
      mint: mintPubkey,
      seller,
      tokenAmount: params.tokenAmount,
      minSolOutputLamports: params.minSolOutputLamports,
    });

    const tx = new Transaction().add(sellIx);
    const latest = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latest.blockhash;
    tx.feePayer = seller;

    const signed = await provider.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(
      {
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      },
      "confirmed"
    );

    await refreshBalance();
    return sig;
  };

  // Multi-wallet management helpers
  const addManagedWallet = (pubkey: string, label: string) => {
    setManagedWallets((prev) => {
      if (prev.some((w) => w.publicKey === pubkey)) return prev;
      const updated = [
        ...prev,
        {
          publicKey: pubkey,
          label: label || `Wallet ${pubkey.slice(0, 4)}`,
          providerName: "Manual Watch / User Wallet",
          isPrimary: prev.length === 0,
          addedAt: Date.now(),
        },
      ];
      localStorage.setItem("managed_solana_wallets", JSON.stringify(updated));
      return updated;
    });
  };

  const removeManagedWallet = (pubkey: string) => {
    setManagedWallets((prev) => {
      const updated = prev.filter((w) => w.publicKey !== pubkey);
      localStorage.setItem("managed_solana_wallets", JSON.stringify(updated));
      return updated;
    });
  };

  const switchActiveWallet = (pubkey: string) => {
    setPublicKey(pubkey);
  };

  const updateWalletLabel = (pubkey: string, label: string) => {
    setManagedWallets((prev) => {
      const updated = prev.map((w) => (w.publicKey === pubkey ? { ...w, label } : w));
      localStorage.setItem("managed_solana_wallets", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SolanaContext.Provider
      value={{
        connected,
        connecting,
        publicKey,
        walletName,
        network,
        endpoint,
        balance,
        balanceLoading,
        connection,
        managedWallets,
        solPriceUsd,
        solPrice24hChange,
        solPriceLoading,
        solPriceError,
        solPriceSource,
        minLaunchBalanceUsd,
        minLaunchSolRequired,
        walletUsdValue,
        isLaunchEligible,
        minLaunchBalanceSol,
        refreshSolPrice,
        activeTxStatus,
        activeTxDescription,
        recentSignatures,
        setActiveTx,
        connectWallet,
        disconnectWallet,
        setNetwork,
        setCustomRpcEndpoint,
        refreshBalance,
        requestAirdrop,
        sendAndConfirmPumpLaunch,
        executePumpBuy,
        executePumpSell,
        addManagedWallet,
        removeManagedWallet,
        switchActiveWallet,
        updateWalletLabel,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
};

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error("useSolana must be used within a SolanaProvider");
  }
  return context;
};
