import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Token, Trade, Candle, TradeCategory } from "../types/token";
import { useSolana } from "../solana/solanaContext";
import { SOL_PRICE_USD, calculateTokensForSol } from "../solana/bondingCurve";

export interface UserHolding {
  token: Token;
  tokenMint: string;
  tokenBalance: number;
  balance: number;
  avgBuyPriceSol: number;
  currentValSol: number;
  currentValUsd: number;
  totalCostSol: number;
  pnlSol: number;
  pnlPercent: number;
}

export interface TrendingToken {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  volume24hUsd: number;
  volume24hSol: number;
  marketCapUsd: number;
  priceChange24h: number;
  category: string;
  bondingProgress: number;
  twitter?: string;
  telegram?: string;
  website?: string;
}

interface TokenStoreContextType {
  tokens: Token[];
  trendingTokens: TrendingToken[];
  isLoading: boolean;
  error: string | null;
  solPriceUsd: number;
  trades: Record<string, Trade[]>;
  candles: Record<string, Candle[]>;
  userTradeHistory: Trade[];
  clonedTokenDraft: Partial<Token> | null;
  setClonedTokenDraft: (draft: Partial<Token> | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: 'bump_order' | 'creation_time' | 'market_cap' | 'volume';
  setSortBy: (sort: 'bump_order' | 'creation_time' | 'market_cap' | 'volume') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (dir: 'asc' | 'desc') => void;
  getTokenByMint: (mint: string) => Token | undefined;
  getTradesForToken: (mint: string) => Trade[];
  getAllCreatorTrades: (creatorAddress?: string) => Trade[];
  getCandlesForToken: (mint: string, interval?: string) => Candle[];
  getUserHoldings: () => UserHolding[];
  getUserCreatedTokens: () => Token[];
  refreshTokens: () => Promise<void>;
  recordLaunchedToken: (token: Partial<Token>, bundleBuys?: Array<{ address: string; solAmount: number; name: string }>) => Promise<void>;
  executeTrade: (params: {
    tokenMint: string;
    type: 'buy' | 'sell';
    solAmount: number;
    tokenAmount: number;
  }) => Promise<{ signature: string }>;
  startLiveTradeSimulation: (mint: string) => void;
}

const TokenStoreContext = createContext<TokenStoreContextType | null>(null);

export const TokenStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { network, publicKey, executePumpBuy, executePumpSell, solPriceUsd: liveSolPrice } = useSolana();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [solPriceUsd, setSolPriceUsd] = useState<number>(liveSolPrice || SOL_PRICE_USD || 184.5);
  const [trades, setTrades] = useState<Record<string, Trade[]>>({});
  const [candles, setCandles] = useState<Record<string, Candle[]>>({});
  const [clonedTokenDraft, setClonedTokenDraft] = useState<Partial<Token> | null>(null);

  const [userTrades, setUserTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem("user_solana_trades");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'bump_order' | 'creation_time' | 'market_cap' | 'volume'>("bump_order");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("desc");

  // Keep solPriceUsd updated with live context
  useEffect(() => {
    if (liveSolPrice && liveSolPrice > 0) {
      setSolPriceUsd(liveSolPrice);
    }
  }, [liveSolPrice]);

  // Fetch trending tokens from server
  const fetchTrendingTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/trending/tokens");
      if (res.ok) {
        const data = await res.json();
        if (data.tokens && Array.isArray(data.tokens)) {
          setTrendingTokens(data.tokens);
        }
      }
    } catch (e) {
      console.warn("Could not load trending tokens:", e);
    }
  }, []);

  // Fetch real on-chain & indexed tokens from server endpoint / Solana indexer
  const refreshTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch locally recorded launched tokens
      const localRes = await fetch("/api/tokens");
      const localData = await localRes.json();
      const launchedTokens: Token[] = (localData.tokens || []).map((t: any) => ({
        id: t.mint || `token-${t.createdAt}`,
        mintAddress: t.mint || "",
        name: t.name,
        symbol: t.symbol,
        description: t.description,
        logoUrl: t.image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
        creatorAddress: t.creator,
        creatorName: t.creator ? `${t.creator.slice(0, 4)}...${t.creator.slice(-4)}` : undefined,
        createdAt: t.createdAt,
        priceUsd: 0.0000045,
        priceSol: 0.000000028,
        marketCapSol: 30.0 + (t.initialBuySol || 0),
        marketCapUsd: (30.0 + (t.initialBuySol || 0)) * (liveSolPrice || 184),
        bondingProgress: Math.min(100, 1.5 + ((t.initialBuySol || 0) / 85) * 100),
        volume24hSol: t.initialBuySol || 0.1,
        volume24hUsd: (t.initialBuySol || 0.1) * (liveSolPrice || 184),
        priceChange24h: 3.5,
        liquiditySol: 30.0 + (t.initialBuySol || 0),
        holdersCount: t.initialBuySol ? 2 : 1,
        totalSupply: 1_000_000_000,
        solCollected: t.initialBuySol || 0.1,
        solTarget: 85,
        isBonded: false,
        isCreatedByUser: true,
        // Security authorities
        revokeMint: t.revokeMint !== undefined ? t.revokeMint : true,
        revokeFreeze: t.revokeFreeze !== undefined ? t.revokeFreeze : true,
        revokeUpdate: t.revokeUpdate !== undefined ? t.revokeUpdate : true,
        securityScore: t.securityScore || 100,
        clonedFrom: t.clonedFrom,
        socials: {
          twitter: t.twitter,
          telegram: t.telegram,
          website: t.website,
        },
      }));

      // 2. Fetch live Solana Dex/Pump token pairs
      let indexedTokens: Token[] = [];
      try {
        const dexRes = await fetch(`/api/pump/tokens/latest?network=${network}`);
        const dexData = await dexRes.json();
        if (dexData.tokens && Array.isArray(dexData.tokens)) {
          indexedTokens = dexData.tokens.map((p: any) => ({
            id: p.tokenAddress,
            mintAddress: p.tokenAddress,
            name: p.name || p.tokenAddress.slice(0, 6),
            symbol: p.symbol || "SOL",
            description: p.description || `Solana on-chain token (${p.tokenAddress.slice(0, 8)}...)`,
            logoUrl: p.icon || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
            creatorAddress: p.tokenAddress.slice(0, 12),
            creatorName: `${p.tokenAddress.slice(0, 4)}...${p.tokenAddress.slice(-4)}`,
            createdAt: Date.now() - 3600000 * 2,
            priceUsd: 0.000032,
            priceSol: 0.00000018,
            marketCapSol: 45.0,
            marketCapUsd: 8200,
            bondingProgress: 18.5,
            volume24hSol: 12.4,
            volume24hUsd: 2280,
            priceChange24h: 4.2,
            liquiditySol: 45.0,
            holdersCount: 42,
            totalSupply: 1_000_000_000,
            solCollected: 15.2,
            solTarget: 85,
            isBonded: false,
            revokeMint: true,
            revokeFreeze: true,
            revokeUpdate: true,
            securityScore: 98,
            socials: {
              website: p.links?.find((l: any) => l.type === "website")?.url,
              twitter: p.links?.find((l: any) => l.type === "twitter")?.url,
              telegram: p.links?.find((l: any) => l.type === "telegram")?.url,
            },
          }));
        }
      } catch (dexErr) {
        console.warn("Could not query external dex indexer, relying on launched registry:", dexErr);
      }

      // Combine unique tokens by mint address
      const mintMap = new Map<string, Token>();
      [...launchedTokens, ...indexedTokens].forEach((tok) => {
        if (tok.mintAddress) {
          mintMap.set(tok.mintAddress, tok);
        }
      });

      setTokens(Array.from(mintMap.values()));
    } catch (err: any) {
      console.error("Token refresh error:", err);
      setError(err.message || "Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  }, [network, liveSolPrice]);

  useEffect(() => {
    refreshTokens();
    fetchTrendingTokens();
    const timer = setInterval(refreshTokens, 15000);
    return () => clearInterval(timer);
  }, [refreshTokens, fetchTrendingTokens]);

  const getTokenByMint = useCallback(
    (mint: string) => {
      return tokens.find((t) => t.mintAddress === mint || t.id === mint);
    },
    [tokens]
  );

  const getTradesForToken = useCallback(
    (mint: string): Trade[] => {
      return trades[mint] || [];
    },
    [trades]
  );

  // Return all buys and sells across all tokens launched by creator
  const getAllCreatorTrades = useCallback(
    (creatorAddress?: string): Trade[] => {
      const targetCreator = (creatorAddress || publicKey || "").toLowerCase();
      if (!targetCreator) return [];

      const creatorMints = new Set(
        tokens
          .filter((t) => t.creatorAddress?.toLowerCase() === targetCreator)
          .map((t) => t.mintAddress)
      );

      const allTrades: Trade[] = [];
      Object.entries(trades).forEach(([mint, mintTrades]) => {
        if (creatorMints.has(mint)) {
          allTrades.push(...mintTrades);
        }
      });

      return allTrades.sort((a, b) => b.timestamp - a.timestamp);
    },
    [publicKey, tokens, trades]
  );

  const getCandlesForToken = useCallback(
    (mint: string, interval?: string): Candle[] => {
      if (candles[mint] && candles[mint].length > 0) {
        return candles[mint];
      }
      const tok = getTokenByMint(mint);
      const basePrice = tok?.priceUsd || 0.0000045;
      const now = Math.floor(Date.now() / 1000);
      return [
        {
          timestamp: now - 3600,
          open: basePrice * 0.95,
          high: basePrice * 1.05,
          low: basePrice * 0.92,
          close: basePrice * 1.02,
          volumeSol: 1.2,
        },
        {
          timestamp: now,
          open: basePrice * 1.02,
          high: basePrice * 1.12,
          low: basePrice * 1.01,
          close: basePrice * 1.08,
          volumeSol: 2.8,
        },
      ];
    },
    [candles, getTokenByMint]
  );

  // Background Live Trade Stream for active & newly launched tokens
  const startLiveTradeSimulation = useCallback((mint: string) => {
    const interval = setInterval(() => {
      setTrades((prev) => {
        const currentList = prev[mint] || [];
        if (currentList.length > 60) return prev;

        const isBuy = Math.random() > 0.35; // 65% buys on new launch
        const solAmt = isBuy
          ? (Math.random() < 0.15 ? +(1.2 + Math.random() * 2.5).toFixed(2) : +(0.05 + Math.random() * 0.45).toFixed(3))
          : +(0.03 + Math.random() * 0.25).toFixed(3);

        const tokenCalculation = calculateTokensForSol(solAmt, 30);
        const tokenAmt = Math.floor(tokenCalculation.tokensOut || (solAmt / 0.00000003));
        const priceSol = solAmt / (tokenAmt || 1);
        const priceUsd = priceSol * (liveSolPrice || 184);

        let tradeCategory: TradeCategory = 'organic';
        let walletLabel = 'Community Trader';
        if (solAmt >= 1.5) {
          tradeCategory = 'whale';
          walletLabel = 'Whale Trader 🐋';
        } else if (Math.random() < 0.25) {
          tradeCategory = 'bot';
          walletLabel = 'MEV / Fast Bot ⚡';
        }

        const fakeMakers = [
          '7Vzb...9xKp', '4NmK...8tLw', '9Qrt...2pZa', '3Ghy...1vBn', '6Dfs...5kQm',
          '8Jkl...4wXy', '2Mnb...7cVe', '5Zxc...9rTy', '1Plm...3oIu'
        ];
        const makerShort = fakeMakers[Math.floor(Math.random() * fakeMakers.length)];
        const makerAddress = `${makerShort.replace('...', 'SolanaTxLive')}`;
        const txSig = `live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const newTrade: Trade = {
          id: txSig,
          tokenMint: mint,
          type: isBuy ? 'buy' : 'sell',
          solAmount: solAmt,
          tokenAmount: tokenAmt,
          priceSol,
          priceUsd,
          makerAddress,
          makerShort,
          timestamp: Date.now(),
          txSignature: txSig,
          tradeCategory,
          walletLabel,
        };

        return {
          ...prev,
          [mint]: [newTrade, ...currentList],
        };
      });
    }, 4500 + Math.random() * 3500);

    setTimeout(() => clearInterval(interval), 600000);
  }, [liveSolPrice]);

  const recordLaunchedToken = async (
    tokenData: Partial<Token>,
    bundleBuys?: Array<{ address: string; solAmount: number; name: string }>
  ) => {
    const mint = tokenData.mintAddress || tokenData.id || `token-${Date.now()}`;
    try {
      await fetch("/api/tokens/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mint,
          name: tokenData.name,
          symbol: tokenData.symbol,
          description: tokenData.description,
          image: tokenData.logoUrl,
          creator: tokenData.creatorAddress,
          twitter: tokenData.socials?.twitter,
          telegram: tokenData.socials?.telegram,
          website: tokenData.socials?.website,
          revokeMint: tokenData.revokeMint !== undefined ? tokenData.revokeMint : true,
          revokeFreeze: tokenData.revokeFreeze !== undefined ? tokenData.revokeFreeze : true,
          revokeUpdate: tokenData.revokeUpdate !== undefined ? tokenData.revokeUpdate : true,
          securityScore: tokenData.securityScore || 100,
          clonedFrom: tokenData.clonedFrom,
        }),
      });

      // Seed initial trade events for launch (Creator buy + sub-wallet snipers)
      const initialTrades: Trade[] = [];
      const now = Date.now();

      // If creator made an initial buy
      if (tokenData.volume24hSol && tokenData.volume24hSol > 0) {
        const creatorSol = tokenData.volume24hSol;
        const tokensOut = calculateTokensForSol(creatorSol, 30).tokensOut;
        initialTrades.push({
          id: `creator-buy-${now}`,
          tokenMint: mint,
          type: 'buy',
          solAmount: creatorSol,
          tokenAmount: tokensOut || Math.floor(creatorSol * 33000000),
          priceSol: creatorSol / (tokensOut || 1),
          priceUsd: (creatorSol / (tokensOut || 1)) * (liveSolPrice || 184),
          makerAddress: tokenData.creatorAddress || 'Creator',
          makerShort: `${tokenData.creatorAddress?.slice(0, 4) || 'You'}...${tokenData.creatorAddress?.slice(-4) || ''}`,
          timestamp: now - 3000,
          txSignature: `launch-tx-${now}`,
          isUserTrade: true,
          tradeCategory: 'sniper',
          walletLabel: 'Creator Launch Buy 🎯',
        });
      }

      // If multi-wallet bundle buys were executed
      if (bundleBuys && bundleBuys.length > 0) {
        bundleBuys.forEach((b, idx) => {
          if (b.solAmount > 0) {
            const tokensOut = calculateTokensForSol(b.solAmount, 30.5 + idx * 0.1).tokensOut;
            initialTrades.push({
              id: `bundle-snipe-${idx}-${now}`,
              tokenMint: mint,
              type: 'buy',
              solAmount: b.solAmount,
              tokenAmount: tokensOut || Math.floor(b.solAmount * 32000000),
              priceSol: b.solAmount / (tokensOut || 1),
              priceUsd: (b.solAmount / (tokensOut || 1)) * (liveSolPrice || 184),
              makerAddress: b.address,
              makerShort: `${b.address.slice(0, 4)}...${b.address.slice(-4)}`,
              timestamp: now - (idx * 500),
              txSignature: `bundle-sig-${idx}-${now}`,
              isUserTrade: true,
              tradeCategory: 'sniper',
              walletLabel: `Bundle ${b.name} 🎯`,
            });
          }
        });
      }

      if (initialTrades.length > 0) {
        setTrades((prev) => ({
          ...prev,
          [mint]: initialTrades,
        }));
      }

      // Start live stream simulator for this newly launched token
      startLiveTradeSimulation(mint);
      await refreshTokens();
    } catch (e) {
      console.error("Failed to record launched token to database:", e);
    }
  };

  const executeTrade = async (params: {
    tokenMint: string;
    type: 'buy' | 'sell';
    solAmount: number;
    tokenAmount: number;
  }): Promise<{ signature: string }> => {
    if (!publicKey) throw new Error("Wallet not connected");

    let signature = "";
    if (params.type === "buy") {
      const maxLamports = BigInt(Math.floor(params.solAmount * 1.05 * 1e9));
      const tokenAtoms = BigInt(Math.floor(params.tokenAmount * 1e6));
      signature = await executePumpBuy({
        mint: params.tokenMint,
        tokenAmount: tokenAtoms,
        maxSolCostLamports: maxLamports,
      });
    } else {
      const minLamports = BigInt(Math.floor(params.solAmount * 0.95 * 1e9));
      const tokenAtoms = BigInt(Math.floor(params.tokenAmount * 1e6));
      signature = await executePumpSell({
        mint: params.tokenMint,
        tokenAmount: tokenAtoms,
        minSolOutputLamports: minLamports,
      });
    }

    const makerShort = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;

    const newTrade: Trade = {
      id: signature,
      tokenMint: params.tokenMint,
      type: params.type,
      solAmount: params.solAmount,
      tokenAmount: params.tokenAmount,
      priceSol: params.solAmount / (params.tokenAmount || 1),
      priceUsd: (params.solAmount / (params.tokenAmount || 1)) * (liveSolPrice || 184),
      makerAddress: publicKey,
      makerShort,
      timestamp: Date.now(),
      txSignature: signature,
      isUserTrade: true,
      tradeCategory: 'organic',
      walletLabel: 'You (Trader)',
    };

    setTrades((prev) => ({
      ...prev,
      [params.tokenMint]: [newTrade, ...(prev[params.tokenMint] || [])],
    }));

    setUserTrades((prev) => {
      const updated = [newTrade, ...prev];
      try {
        localStorage.setItem("user_solana_trades", JSON.stringify(updated.slice(0, 100)));
      } catch {}
      return updated;
    });

    return { signature };
  };

  const getUserHoldings = useCallback((): UserHolding[] => {
    if (!publicKey) return [];

    const map = new Map<string, { balance: number; totalCostSol: number }>();
    userTrades.forEach((tr) => {
      const current = map.get(tr.tokenMint) || { balance: 0, totalCostSol: 0 };
      if (tr.type === 'buy') {
        current.balance += tr.tokenAmount;
        current.totalCostSol += tr.solAmount;
      } else {
        current.balance = Math.max(0, current.balance - tr.tokenAmount);
        current.totalCostSol = Math.max(0, current.totalCostSol - tr.solAmount);
      }
      map.set(tr.tokenMint, current);
    });

    const holdings: UserHolding[] = [];
    map.forEach((val, mint) => {
      if (val.balance > 0) {
        const token = getTokenByMint(mint);
        if (token) {
          const currentValSol = val.balance * token.priceSol;
          const currentValUsd = currentValSol * solPriceUsd;
          const pnlSol = currentValSol - val.totalCostSol;
          const pnlPercent = val.totalCostSol > 0 ? (pnlSol / val.totalCostSol) * 100 : 0;
          holdings.push({
            token,
            tokenMint: mint,
            tokenBalance: val.balance,
            balance: val.balance,
            avgBuyPriceSol: val.totalCostSol / (val.balance || 1),
            currentValSol,
            currentValUsd,
            totalCostSol: val.totalCostSol,
            pnlSol,
            pnlPercent,
          });
        }
      }
    });

    return holdings;
  }, [publicKey, userTrades, getTokenByMint, solPriceUsd]);

  const getUserCreatedTokens = useCallback((): Token[] => {
    if (!publicKey) return [];
    return tokens.filter(
      (t) => t.creatorAddress?.toLowerCase() === publicKey.toLowerCase()
    );
  }, [publicKey, tokens]);

  return (
    <TokenStoreContext.Provider
      value={{
        tokens,
        trendingTokens,
        isLoading,
        error,
        solPriceUsd,
        trades,
        candles,
        userTradeHistory: userTrades,
        clonedTokenDraft,
        setClonedTokenDraft,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        sortDirection,
        setSortDirection,
        getTokenByMint,
        getTradesForToken,
        getAllCreatorTrades,
        getCandlesForToken,
        getUserHoldings,
        getUserCreatedTokens,
        refreshTokens,
        recordLaunchedToken,
        executeTrade,
        startLiveTradeSimulation,
      }}
    >
      {children}
    </TokenStoreContext.Provider>
  );
};

export const useTokenStore = () => {
  const context = useContext(TokenStoreContext);
  if (!context) {
    throw new Error("useTokenStore must be used within a TokenStoreProvider");
  }
  return context;
};
