export interface BundleWalletItem {
  id: string;
  index: number;
  name: string;
  publicKey: string;
  secretKeyBase58?: string; // For locally generated or imported private keys
  isPrimary: boolean; // Wallet 1 is the connected primary wallet
  buySol: number;
  balanceSol: number;
  status: 'idle' | 'funding' | 'ready' | 'needs_sol' | 'buying' | 'success' | 'error';
  txSignature?: string;
  tokensReceived?: number;
  error?: string;
}

export interface BundleLaunchSummary {
  totalWallets: number;
  activeWalletsCount: number;
  totalBuySol: number;
  totalEstimatedTokens: number;
  percentSupplySniped: number;
  allFunded: boolean;
  minSolNeededTotal: number;
}
