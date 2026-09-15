export type AssetClass = 'FOREX' | 'STOCKS' | 'CRYPTO' | 'FUTURES' | 'OPTIONS';
export type TradeDirection = 'LONG' | 'SHORT';
export type TradeSource = 'MANUAL' | 'MT5' | 'NINJATRADER';
export type EmotionalState = 'confident' | 'calm' | 'anxious' | 'fomo' | 'revenge' | 'tilted' | 'disciplined' | 'overconfident' | 'fearful' | 'neutral';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Trade {
  id: string;
  userId: string;
  asset: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  realizedRr: number | null;
  size: number;
  fees: number;
  entryDate: string; // ISO string
  exitDate: string | null; // ISO string
  pnl: number | null;
  strategy: string | null;
  setup: string | null;
  preTradeNotes: string | null;
  duringTradeNotes: string | null;
  postTradeNotes: string | null;
  emotionalState: EmotionalState | null;
  chartImagePath: string | null;
  tradingViewLink: string | null;
  source: TradeSource;
  createdAt: string; // ISO string
  tags: Tag[];
}

export type TradeFormData = Omit<Trade, 'id' | 'createdAt' | 'userId' | 'tags'> & {
  tagIds?: string[];
};

export interface CsvParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
}
