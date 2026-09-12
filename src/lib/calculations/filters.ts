import { Trade } from '@/types/trade';

export interface TradeFilter {
  assetClass?: string;
  strategy?: string;
  emotionalState?: string;
  dateFrom?: Date;
  dateTo?: Date;
  direction?: string;
  source?: string;
}

export function filterTrades(trades: Trade[], filters: TradeFilter): Trade[] {
  return trades.filter(trade => {
    if (filters.assetClass && trade.assetClass !== filters.assetClass) return false;
    if (filters.strategy && (!trade.setup || !trade.setup.toLowerCase().includes(filters.strategy.toLowerCase()))) return false;
    if (filters.emotionalState && trade.emotionalState !== filters.emotionalState) return false;
    
    if (filters.dateFrom) {
      const entryDate = new Date(trade.entryDate);
      if (entryDate < filters.dateFrom) return false;
    }
    
    if (filters.dateTo) {
      const entryDate = new Date(trade.entryDate);
      if (entryDate > filters.dateTo) return false;
    }
    
    if (filters.direction && trade.direction !== filters.direction) return false;
    if (filters.source && trade.source !== filters.source) return false;
    
    return true;
  });
}

export function getUniqueStrategies(trades: Trade[]): string[] {
  const strats = new Set<string>();
  for (const trade of trades) {
    if (trade.setup) {
      strats.add(trade.setup);
    }
  }
  return Array.from(strats).sort();
}

export function getUniqueAssets(trades: Trade[]): string[] {
  const assets = new Set<string>();
  for (const trade of trades) {
    if (trade.asset) {
      assets.add(trade.asset);
    }
  }
  return Array.from(assets).sort();
}
