/**
 * Solana Bonding Curve Math Engine
 * Standard Fair-Launch Constant Product Model:
 * Total Token Supply: 1,000,000,000 (1 Billion)
 * Virtual SOL Reserve: 30 SOL
 * Virtual Token Reserve: 1,073,000,000 tokens
 * Target Real SOL: 85 SOL (Triggers graduation to Raydium with liquidity burn)
 */

export const TOTAL_SUPPLY = 1_000_000_000;
export const VIRTUAL_SOL_RESERVE = 30;
export const VIRTUAL_TOKEN_RESERVE = 1_073_000_000;
export const GRADUATION_SOL_TARGET = 85;
export const SOL_PRICE_USD = 184.50; // Current estimated SOL/USD reference
export const PLATFORM_CREATION_FEE_SOL = 0.02; // Standard Solana fee

/**
 * Calculate token output for a given SOL input (Buy)
 */
export function calculateTokensForSol(
  solIn: number,
  currentSolReserve: number = 0
): {
  tokensOut: number;
  effectivePriceSol: number;
  priceImpactPercent: number;
  newSolReserve: number;
  newBondingProgress: number;
} {
  if (solIn <= 0) {
    return {
      tokensOut: 0,
      effectivePriceSol: 0,
      priceImpactPercent: 0,
      newSolReserve: currentSolReserve,
      newBondingProgress: (currentSolReserve / GRADUATION_SOL_TARGET) * 100,
    };
  }

  const currentVirtualSol = VIRTUAL_SOL_RESERVE + currentSolReserve;
  const currentVirtualTokens = (VIRTUAL_SOL_RESERVE * VIRTUAL_TOKEN_RESERVE) / currentVirtualSol;

  const newVirtualSol = currentVirtualSol + solIn;
  const newVirtualTokens = (VIRTUAL_SOL_RESERVE * VIRTUAL_TOKEN_RESERVE) / newVirtualSol;

  const tokensOut = Math.max(0, currentVirtualTokens - newVirtualTokens);
  const effectivePriceSol = tokensOut > 0 ? solIn / tokensOut : 0;

  const spotPriceBefore = currentVirtualSol / currentVirtualTokens;
  const spotPriceAfter = newVirtualSol / newVirtualTokens;
  const priceImpactPercent = Math.min(99.9, Math.max(0, ((spotPriceAfter - spotPriceBefore) / spotPriceBefore) * 100));

  const newSolReserve = Math.min(GRADUATION_SOL_TARGET, currentSolReserve + solIn);
  const newBondingProgress = Math.min(100, (newSolReserve / GRADUATION_SOL_TARGET) * 100);

  return {
    tokensOut,
    effectivePriceSol,
    priceImpactPercent,
    newSolReserve,
    newBondingProgress,
  };
}

/**
 * Calculate SOL output for a given Token input (Sell)
 */
export function calculateSolForTokens(
  tokensIn: number,
  currentSolReserve: number = 20
): {
  solOut: number;
  effectivePriceSol: number;
  priceImpactPercent: number;
  newSolReserve: number;
  newBondingProgress: number;
} {
  if (tokensIn <= 0 || currentSolReserve <= 0) {
    return {
      solOut: 0,
      effectivePriceSol: 0,
      priceImpactPercent: 0,
      newSolReserve: currentSolReserve,
      newBondingProgress: (currentSolReserve / GRADUATION_SOL_TARGET) * 100,
    };
  }

  const currentVirtualSol = VIRTUAL_SOL_RESERVE + currentSolReserve;
  const currentVirtualTokens = (VIRTUAL_SOL_RESERVE * VIRTUAL_TOKEN_RESERVE) / currentVirtualSol;

  const newVirtualTokens = currentVirtualTokens + tokensIn;
  const newVirtualSol = (VIRTUAL_SOL_RESERVE * VIRTUAL_TOKEN_RESERVE) / newVirtualTokens;

  const rawSolOut = Math.max(0, currentVirtualSol - newVirtualSol);
  const solOut = Math.min(currentSolReserve, rawSolOut); // Can never drain more than real SOL reserve

  const effectivePriceSol = tokensIn > 0 ? solOut / tokensIn : 0;
  const spotPriceBefore = currentVirtualSol / currentVirtualTokens;
  const spotPriceAfter = newVirtualSol / newVirtualTokens;
  const priceImpactPercent = Math.min(99.9, Math.max(0, ((spotPriceBefore - spotPriceAfter) / spotPriceBefore) * 100));

  const newSolReserve = Math.max(0, currentSolReserve - solOut);
  const newBondingProgress = Math.max(0, (newSolReserve / GRADUATION_SOL_TARGET) * 100);

  return {
    solOut,
    effectivePriceSol,
    priceImpactPercent,
    newSolReserve,
    newBondingProgress,
  };
}

/**
 * Format large numbers with K, M, B abbreviations
 */
export function formatCompactNumber(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (Math.abs(val) >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(decimals) + 'B';
  }
  if (Math.abs(val) >= 1_000_000) {
    return (val / 1_000_000).toFixed(decimals) + 'M';
  }
  if (Math.abs(val) >= 1_000) {
    return (val / 1_000).toFixed(decimals) + 'K';
  }
  return val.toFixed(decimals);
}

/**
 * Format small crypto prices (e.g. $0.0000342)
 */
export function formatCryptoPrice(priceUsd: number): string {
  if (!priceUsd || priceUsd === 0) return '$0.00';
  if (priceUsd >= 1) return `$${priceUsd.toFixed(2)}`;
  if (priceUsd >= 0.01) return `$${priceUsd.toFixed(4)}`;
  if (priceUsd >= 0.0001) return `$${priceUsd.toFixed(6)}`;
  return `$${priceUsd.toFixed(8)}`;
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
