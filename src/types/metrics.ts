import { AssetClass, EmotionalState, TradeDirection, TradeSource } from './trade';

export interface DashboardMetrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  maxDrawdown: number;
  totalPnl: number;
  averageRrr: number;
  bestTrade: number;
  worstTrade: number;
  averageHoldTime: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
}

export interface TiltmeterData {
  emotionalState: string;
  averagePnl: number;
  tradeCount: number;
  winRate: number;
}

export interface TradeFilter {
  assetClass?: AssetClass;
  strategy?: string;
  emotionalState?: EmotionalState;
  dateFrom?: string;
  dateTo?: string;
  direction?: TradeDirection;
  source?: TradeSource;
}
