/**
 * Live Real-Time SOL/USD Price Service
 * Streams real-time ticks via Binance WebSocket ticker with fast HTTP fallback (CoinGecko, Binance, Coinbase)
 */

export interface SolPriceData {
  priceUsd: number;
  change24hPercent: number;
  source: string;
  timestamp: number;
  priceDirection?: 'up' | 'down' | 'neutral';
}

export type PriceListener = (price: SolPriceData | null, error: string | null) => void;

class SolPriceService {
  private currentPrice: SolPriceData | null = null;
  private lastError: string | null = null;
  private listeners: Set<PriceListener> = new Set();
  private intervalId: any = null;
  private ws: WebSocket | null = null;
  private isFetching = false;
  private wsConnected = false;

  constructor() {
    this.initWebSocket();
    this.fetchPrice();
    // Fast fallback polling every 5 seconds if WebSocket drops
    this.intervalId = setInterval(() => {
      if (!this.wsConnected) {
        this.fetchPrice();
      }
    }, 5_000);
  }

  private initWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.ws = new WebSocket('wss://stream.binance.com:9443/ws/solusdt@ticker');

      this.ws.onopen = () => {
        this.wsConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.c) {
            const newPrice = parseFloat(data.c);
            const changePercent = parseFloat(data.P) || 0;
            if (!isNaN(newPrice) && newPrice > 0) {
              const prevPrice = this.currentPrice?.priceUsd;
              let direction: 'up' | 'down' | 'neutral' = 'neutral';
              if (prevPrice !== undefined) {
                if (newPrice > prevPrice) direction = 'up';
                else if (newPrice < prevPrice) direction = 'down';
              }

              this.currentPrice = {
                priceUsd: newPrice,
                change24hPercent: changePercent,
                source: 'Binance Live Stream (WS)',
                timestamp: Date.now(),
                priceDirection: direction,
              };
              this.lastError = null;
              this.notifyListeners();
            }
          }
        } catch (e) {
          // ignore parsing err
        }
      };

      this.ws.onerror = () => {
        this.wsConnected = false;
      };

      this.ws.onclose = () => {
        this.wsConnected = false;
        // Try reconnecting in 8 seconds
        setTimeout(() => {
          this.initWebSocket();
        }, 8000);
      };
    } catch (e) {
      this.wsConnected = false;
    }
  }

  public async fetchPrice(): Promise<SolPriceData | null> {
    if (this.isFetching) return this.currentPrice;
    this.isFetching = true;

    try {
      // 1. Try server-side live proxy first
      const res = await fetch('/api/price/sol', { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.priceUsd === 'number' && data.priceUsd > 0) {
          const prevPrice = this.currentPrice?.priceUsd;
          let direction: 'up' | 'down' | 'neutral' = 'neutral';
          if (prevPrice !== undefined) {
            if (data.priceUsd > prevPrice) direction = 'up';
            else if (data.priceUsd < prevPrice) direction = 'down';
          }

          const priceObj: SolPriceData = {
            priceUsd: data.priceUsd,
            change24hPercent: data.change24hPercent || 0,
            source: data.source || 'Live Feed',
            timestamp: data.timestamp || Date.now(),
            priceDirection: direction,
          };
          this.currentPrice = priceObj;
          this.lastError = null;
          this.notifyListeners();
          this.isFetching = false;
          return priceObj;
        }
      }
    } catch (serverErr) {
      // fallback to direct client APIs
    }

    // 2. Client-side direct fallback: Binance public ticker
    try {
      const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT', {
        signal: AbortSignal.timeout(4000),
      });
      if (binanceRes.ok) {
        const bData = await binanceRes.json();
        const price = parseFloat(bData.lastPrice);
        const change = parseFloat(bData.priceChangePercent) || 0;
        if (!isNaN(price) && price > 0) {
          const prevPrice = this.currentPrice?.priceUsd;
          let direction: 'up' | 'down' | 'neutral' = 'neutral';
          if (prevPrice !== undefined) {
            if (price > prevPrice) direction = 'up';
            else if (price < prevPrice) direction = 'down';
          }

          const priceObj: SolPriceData = {
            priceUsd: price,
            change24hPercent: change,
            source: 'Binance Direct',
            timestamp: Date.now(),
            priceDirection: direction,
          };
          this.currentPrice = priceObj;
          this.lastError = null;
          this.notifyListeners();
          this.isFetching = false;
          return priceObj;
        }
      }
    } catch (binanceErr) {
      // ignore
    }

    // 3. Client-side fallback 2: Coinbase spot API
    try {
      const cbRes = await fetch('https://api.coinbase.com/v2/prices/SOL-USD/spot', {
        signal: AbortSignal.timeout(4000),
      });
      if (cbRes.ok) {
        const cbData = await cbRes.json();
        const price = parseFloat(cbData?.data?.amount);
        if (!isNaN(price) && price > 0) {
          const prevPrice = this.currentPrice?.priceUsd;
          let direction: 'up' | 'down' | 'neutral' = 'neutral';
          if (prevPrice !== undefined) {
            if (price > prevPrice) direction = 'up';
            else if (price < prevPrice) direction = 'down';
          }

          const priceObj: SolPriceData = {
            priceUsd: price,
            change24hPercent: this.currentPrice?.change24hPercent || 0,
            source: 'Coinbase Direct',
            timestamp: Date.now(),
            priceDirection: direction,
          };
          this.currentPrice = priceObj;
          this.lastError = null;
          this.notifyListeners();
          this.isFetching = false;
          return priceObj;
        }
      }
    } catch (cbErr) {
      // ignore
    }

    if (!this.currentPrice) {
      this.lastError = 'SOL price temporarily unavailable';
      this.notifyListeners();
    }

    this.isFetching = false;
    return this.currentPrice;
  }

  public getPrice(): SolPriceData | null {
    return this.currentPrice;
  }

  public getError(): string | null {
    return this.lastError;
  }

  public subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    listener(this.currentPrice, this.lastError);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentPrice, this.lastError);
      } catch (e) {
        console.error('Error in price listener:', e);
      }
    }
  }

  public destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.listeners.clear();
  }
}

export const solPriceService = new SolPriceService();
