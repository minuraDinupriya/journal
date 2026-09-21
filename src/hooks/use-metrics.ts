"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DashboardMetrics, EquityPoint, TiltmeterData } from '@/types/metrics';
import { useRiskStore } from '@/stores/risk-store';

interface TradeScoreData {
  winPercent: number
  profitFactor: number
  avgWinLoss: number
  recoveryFactor: number
  maxDrawdownScore: number
  consistency: number
  compositeScore: number
}

export function useMetrics() {
  const { targetRisk, isNormalizedMode } = useRiskStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [tiltmeter, setTiltmeter] = useState<TiltmeterData[]>([]);
  const [dailyPnl, setDailyPnl] = useState<{ date: string; pnl: number }[]>([]);
  const [tradeScore, setTradeScore] = useState<TradeScoreData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [currentTradeType, setCurrentTradeType] = useState<'LIVE' | 'BACKTEST' | 'ALL'>('LIVE');

  const fetchMetrics = useCallback(async (
    tradeType: 'LIVE' | 'BACKTEST' | 'ALL' = currentTradeType,
    customTargetRisk?: number | null
  ) => {
    setIsLoading(true);
    setCurrentTradeType(tradeType);
    try {
      const activeRisk = customTargetRisk !== undefined 
        ? customTargetRisk 
        : (isNormalizedMode ? targetRisk : null);

      const queryParams = new URLSearchParams();
      queryParams.append('tradeType', tradeType);
      if (activeRisk && activeRisk > 0) {
        queryParams.append('targetRisk', activeRisk.toString());
      }

      const response = await fetch(`/api/metrics?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      setMetrics(data.metrics || null);
      setEquityCurve(data.equityCurve || []);
      setTiltmeter(data.tiltmeter || []);
      setDailyPnl(data.dailyPnl || []);
      setTradeScore(data.tradeScore || null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  }, [currentTradeType, isNormalizedMode, targetRisk]);

  useEffect(() => {
    fetchMetrics(currentTradeType);
  }, [isNormalizedMode, targetRisk]);

  return {
    metrics,
    equityCurve,
    tiltmeter,
    dailyPnl,
    tradeScore,
    currentTradeType,
    isLoading,
    refreshMetrics: fetchMetrics
  };
}
