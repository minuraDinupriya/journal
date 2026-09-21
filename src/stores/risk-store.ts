import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RiskStoreState {
  targetRisk: number;
  isNormalizedMode: boolean;
  setTargetRisk: (amount: number) => void;
  setNormalizedMode: (enabled: boolean) => void;
  toggleNormalizedMode: () => void;
}

export const useRiskStore = create<RiskStoreState>()(
  persist(
    (set) => ({
      targetRisk: 1000,
      isNormalizedMode: false,
      setTargetRisk: (amount: number) => set({ targetRisk: Math.max(1, Number(amount) || 1000) }),
      setNormalizedMode: (enabled: boolean) => set({ isNormalizedMode: enabled }),
      toggleNormalizedMode: () => set((state) => ({ isNormalizedMode: !state.isNormalizedMode })),
    }),
    {
      name: 'trade-risk-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
