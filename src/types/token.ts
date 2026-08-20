export type TokenCategory = 'all' | 'trending' | 'new' | 'graduating' | 'top_volume' | 'top_mcap';

export interface SocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface Token {
  id: string;
  mintAddress: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  creatorAddress: string;
  creatorName?: string;
  createdAt: number; // timestamp
  marketCapSol: number;
  marketCapUsd: number;
  priceSol: number;
  priceUsd: number;
  priceChange24h: number; // percentage
  volume24hSol: number;
  volume24hUsd: number;
  liquiditySol: number;
  holdersCount: number;
  bondingProgress: number; // 0 - 100%
  raydiumPoolAddress?: string;
  totalSupply: number; // 1_000_000_000
  solCollected: number;
  solTarget: number;
  socials: SocialLinks;
  category?: 'ai' | 'meme' | 'defi' | 'gaming' | 'depin' | 'utility';
  isCreatedByUser?: boolean;
  isBonded?: boolean;
  txCount24h?: number;
}

export interface Trade {
  id: string;
  tokenMint: string;
  type: 'buy' | 'sell';
  solAmount: number;
  tokenAmount: number;
  priceSol: number;
  priceUsd: number;
  makerAddress: string;
  makerShort: string;
  timestamp: number;
  txSignature: string;
  isUserTrade?: boolean;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeSol: number;
}

export interface Holder {
  rank: number;
  address: string;
  addressShort: string;
  balance: number;
  percentage: number;
  isBondingCurvePool?: boolean;
  isCreator?: boolean;
}

export interface CandleData {
  timestamp: number;
  timeStr: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UserPortfolioItem {
  tokenMint: string;
  token: Token;
  tokenBalance: number;
  avgBuyPriceSol: number;
  totalCostSol: number;
  currentValSol: number;
  pnlSol: number;
  pnlPercent: number;
}

export type TransactionStatus = 
  | 'idle' 
  | 'preparing' 
  | 'awaiting_approval' 
  | 'processing' 
  | 'confirmed' 
  | 'failed';

export interface LaunchFormData {
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  website: string;
  twitter: string;
  telegram: string;
  initialBuySol?: number;
}
