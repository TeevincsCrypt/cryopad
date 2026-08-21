import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import { BundleWalletItem, BundleLaunchSummary } from "../types/bundle";
import { createPumpBuyInstruction } from "./pumpFun";

export const MAX_BUNDLE_WALLETS = 10;

/**
 * Generates a fresh Solana Keypair for a bundle wallet
 */
export function generateBundleKeypair(index: number, customName?: string): BundleWalletItem {
  const kp = Keypair.generate();
  return {
    id: `bundle-w-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    index,
    name: customName || `Bundle Sniper #${index}`,
    publicKey: kp.publicKey.toBase58(),
    secretKeyBase58: bs58.encode(kp.secretKey),
    isPrimary: false,
    buySol: 0,
    balanceSol: 0,
    status: "idle",
  };
}

/**
 * Imports a keypair from base58 secret key
 */
export function importBundleKeypair(secretKeyBase58: string, index: number, name?: string): BundleWalletItem {
  try {
    const trimmed = secretKeyBase58.trim();
    const decoded = bs58.decode(trimmed);
    const kp = Keypair.fromSecretKey(decoded);
    return {
      id: `bundle-w-${Date.now()}-${index}`,
      index,
      name: name || `Bundle Sniper #${index}`,
      publicKey: kp.publicKey.toBase58(),
      secretKeyBase58: trimmed,
      isPrimary: false,
      buySol: 0,
      balanceSol: 0,
      status: "idle",
    };
  } catch (err: any) {
    throw new Error(`Invalid base58 private key: ${err.message || err}`);
  }
}

/**
 * Calculates Pump.fun initial bonding curve tokens out for a given SOL amount
 */
export function calculatePumpTokensOut(solAmount: number, virtualSol = 30, virtualTokens = 1073000000): number {
  if (solAmount <= 0) return 0;
  const solBig = BigInt(Math.floor(solAmount * 1e9));
  const vSolBig = BigInt(Math.floor(virtualSol * 1e9));
  const vTokBig = BigInt(virtualTokens) * 1000000n; // with 6 decimals

  // Curve formula: tokensOut = (virtualTokenReserves * solIn) / (virtualSolReserves + solIn)
  const tokensOutBig = (vTokBig * solBig) / (vSolBig + solBig);
  return Number(tokensOutBig / 1000000n);
}

/**
 * Computes the bundle summary stats
 */
export function computeBundleSummary(wallets: BundleWalletItem[]): BundleLaunchSummary {
  const activeWallets = wallets.filter((w) => w.buySol > 0);
  const totalBuySol = wallets.reduce((acc, w) => acc + (w.buySol || 0), 0);
  const totalEstimatedTokens = calculatePumpTokensOut(totalBuySol);
  const totalSupply = 1_000_000_000;
  const percentSupplySniped = Math.min(100, (totalEstimatedTokens / totalSupply) * 100);

  const allFunded = wallets.every((w) => {
    if (w.buySol <= 0) return true;
    // Wallet needs buy amount + ~0.005 SOL for ATA rent & network fee
    return w.balanceSol >= (w.buySol + 0.005);
  });

  const minSolNeededTotal = wallets.reduce((acc, w) => {
    if (w.buySol <= 0) return acc;
    return acc + (w.buySol + 0.005);
  }, 0);

  return {
    totalWallets: wallets.length,
    activeWalletsCount: activeWallets.length,
    totalBuySol,
    totalEstimatedTokens,
    percentSupplySniped,
    allFunded,
    minSolNeededTotal,
  };
}

/**
 * Refresh balances of all bundle wallets in parallel
 */
export async function refreshBundleBalances(
  connection: Connection,
  wallets: BundleWalletItem[]
): Promise<BundleWalletItem[]> {
  try {
    const updated = await Promise.all(
      wallets.map(async (w) => {
        try {
          const pubkey = new PublicKey(w.publicKey);
          const lamports = await connection.getBalance(pubkey, "confirmed");
          const balanceSol = lamports / LAMPORTS_PER_SOL;
          const minNeeded = (w.buySol || 0) + (w.buySol > 0 ? 0.005 : 0);
          const isFunded = balanceSol >= minNeeded;

          return {
            ...w,
            balanceSol,
            status: (w.buySol > 0 && !isFunded ? "needs_sol" : w.status === "error" ? "error" : "ready") as BundleWalletItem["status"],
          };
        } catch {
          return w;
        }
      })
    );
    return updated;
  } catch (err) {
    console.error("Failed to refresh bundle balances:", err);
    return wallets;
  }
}

/**
 * Execute sub-wallet buy for a single bundle keypair
 */
export async function executeSubWalletBuy(
  connection: Connection,
  wallet: BundleWalletItem,
  mintAddress: string
): Promise<{ signature: string; tokensOut: number }> {
  if (!wallet.secretKeyBase58) {
    throw new Error(`Wallet ${wallet.name} is missing private key.`);
  }
  if (wallet.buySol <= 0) {
    throw new Error(`Wallet ${wallet.name} buy amount is 0 SOL.`);
  }

  const keypair = Keypair.fromSecretKey(bs58.decode(wallet.secretKeyBase58));
  const mintPubkey = new PublicKey(mintAddress);
  const buyerPubkey = keypair.publicKey;

  const solLamports = Math.floor(wallet.buySol * LAMPORTS_PER_SOL);
  const virtualSolReserves = 30 * LAMPORTS_PER_SOL;
  const virtualTokenReserves = 1073000000000000n; // 1.073B with 6 decimals
  const solInLamportsBigInt = BigInt(solLamports);
  const tokenAmount = (virtualTokenReserves * solInLamportsBigInt) / (BigInt(virtualSolReserves) + solInLamportsBigInt);

  const tx = new Transaction();

  // Compute budget
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 150_000 }));

  // Create Associated Token Account for the sub-wallet
  const userAta = getAssociatedTokenAddressSync(mintPubkey, buyerPubkey);
  const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    buyerPubkey,
    userAta,
    buyerPubkey,
    mintPubkey
  );
  tx.add(createAtaIx);

  // Buy instruction
  const buyIx = createPumpBuyInstruction({
    mint: mintPubkey,
    buyer: buyerPubkey,
    tokenAmount,
    maxSolCostLamports: BigInt(Math.floor(solLamports * 1.05)), // 5% slippage protection
  });
  tx.add(buyIx);

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = buyerPubkey;

  tx.sign(keypair);

  const rawTx = tx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    "confirmed"
  );

  return {
    signature,
    tokensOut: Number(tokenAmount / 1000000n),
  };
}

/**
 * Execute buys for all configured sub-wallets in parallel / fast sequence
 */
export async function executeAllSubWalletBuys(
  connection: Connection,
  wallets: BundleWalletItem[],
  mintAddress: string,
  onProgress?: (walletId: string, status: BundleWalletItem["status"], sig?: string, err?: string, tokens?: number) => void
): Promise<BundleWalletItem[]> {
  const subWallets = wallets.filter((w) => !w.isPrimary && w.buySol > 0 && w.secretKeyBase58);

  const results = await Promise.all(
    subWallets.map(async (wallet) => {
      onProgress?.(wallet.id, "buying");
      try {
        const { signature, tokensOut } = await executeSubWalletBuy(connection, wallet, mintAddress);
        onProgress?.(wallet.id, "success", signature, undefined, tokensOut);
        return {
          ...wallet,
          status: "success" as const,
          txSignature: signature,
          tokensReceived: tokensOut,
        };
      } catch (err: any) {
        console.error(`Sub-wallet ${wallet.name} buy failed:`, err);
        const errMsg = err.message || "Failed to buy";
        onProgress?.(wallet.id, "error", undefined, errMsg);
        return {
          ...wallet,
          status: "error" as const,
          error: errMsg,
        };
      }
    })
  );

  // Merge back into all wallets list
  return wallets.map((w) => {
    const updated = results.find((r) => r.id === w.id);
    return updated || w;
  });
}
