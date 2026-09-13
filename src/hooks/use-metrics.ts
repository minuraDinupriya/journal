"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DashboardMetrics, EquityPoint, TiltmeterData } from '@/types/metrics';

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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [tiltmeter, setTiltmeter] = useState<TiltmeterData[]>([]);
  const [dailyPnl, setDailyPnl] = useState<{ date: string; pnl: number }[]>([]);
  const [tradeScore, setTradeScore] = useState<TradeScoreData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/metrics');
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
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    equityCurve,
    tiltmeter,
    dailyPnl,
    tradeScore,
    isLoading,
    refreshMetrics: fetchMetrics
  };
}
