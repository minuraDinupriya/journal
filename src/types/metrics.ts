import { AssetClass, EmotionalState, TradeDirection, TradeSource, TradeType } from './trade';

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
  tradeType?: TradeType;
}

export interface TradeTimePoint {
  id: string;
  asset: string;
  direction: TradeDirection;
  entryDate: string;
  timeDecimal: number; // e.g. 14.5 for 14:30
  timeLabel: string;   // "14:30"
  pnl: number;
  size: number;
  strategy?: string | null;
  realizedRr?: number | null;
  isWin: boolean;
  isLoss: boolean;
  tradeType: TradeType;
}

export interface HourlyPerformanceBucket {
  hour: number;          // 0 to 23
  hourLabel: string;     // "10:00"
  hourRange: string;     // "10:00 - 11:00"
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;       // percentage 0 - 100
  averagePnl: number;
}

export interface TimePerformanceSummary {
  bestHour: HourlyPerformanceBucket | null;
  worstHour: HourlyPerformanceBucket | null;
  highestWinRateHour: HourlyPerformanceBucket | null;
  mostActiveHour: HourlyPerformanceBucket | null;
}

