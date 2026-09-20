import { create } from 'zustand';
import { Trade } from '@/types/trade';
import { TradeFilter } from '@/types/metrics';

interface TradeStoreState {
  trades: Trade[];
  selectedTrade: Trade | null;
  filters: TradeFilter;
  isLoading: boolean;
  error: string | null;
  
  setTrades: (trades: Trade[]) => void;
  setSelectedTrade: (trade: Trade | null) => void;
  setFilters: (filters: Partial<TradeFilter>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTrade: (trade: Trade) => void;
  removeTrade: (id: string) => void;
  updateTradeInStore: (id: string, updates: Partial<Trade>) => void;
}

const defaultFilters: TradeFilter = {
  assetClass: undefined,
  strategy: undefined,
  emotionalState: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  direction: undefined,
  source: undefined,
  tradeType: undefined,
};

export const useTradeStore = create<TradeStoreState>((set) => ({
  trades: [],
  selectedTrade: null,
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setTrades: (trades) => set({ trades }),
  setSelectedTrade: (selectedTrade) => set({ selectedTrade }),
  setFilters: (filters) => 
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addTrade: (trade) => 
    set((state) => ({ trades: [trade, ...state.trades] })),
  removeTrade: (id) => 
    set((state) => ({ trades: state.trades.filter((t) => t.id !== id) })),
  updateTradeInStore: (id, updates) => 
    set((state) => ({
      trades: state.trades.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
}));
