"use client";

import { useState } from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { useTrades } from "@/hooks/use-trades";
import { useRiskStore } from "@/stores/risk-store";
import { getNormalizedTrades } from "@/lib/calculations/trade-metrics";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { Tiltmeter } from "@/components/dashboard/tiltmeter";
import { TradeScore } from "@/components/dashboard/trade-score";
import { CumulativePnl } from "@/components/dashboard/cumulative-pnl";
import { TradeTimePerformance } from "@/components/dashboard/trade-time-performance";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { RiskNormalizerControl } from "@/components/ui/risk-normalizer-control";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Zap, FlaskConical, Globe } from "lucide-react";
import { TradeFilter } from "@/types/metrics";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [dashboardEnv, setDashboardEnv] = useState<'LIVE' | 'BACKTEST' | 'ALL'>('LIVE');
  const [filters, setFilters] = useState<TradeFilter>({ tradeType: 'LIVE' });
  const { targetRisk, isNormalizedMode } = useRiskStore();
  
  const { metrics, equityCurve, tiltmeter, tradeScore, isLoading: metricsLoading, refreshMetrics } = useMetrics();
  const { trades, isLoading: tradesLoading, fetchTrades } = useTrades();

  const handleRefresh = () => {
    refreshMetrics(dashboardEnv);
    fetchTrades({
      ...filters,
      tradeType: dashboardEnv === 'ALL' ? undefined : dashboardEnv
    });
  };

  const handleEnvChange = (env: 'LIVE' | 'BACKTEST' | 'ALL') => {
    setDashboardEnv(env);
    refreshMetrics(env);
    const updatedFilters: TradeFilter = {
      ...filters,
      tradeType: env === 'ALL' ? undefined : env
    };
    setFilters(updatedFilters);
    fetchTrades(updatedFilters);
  };

  const handleFilterChange = (newFilters: TradeFilter) => {
    const merged = {
      ...newFilters,
      tradeType: dashboardEnv === 'ALL' ? undefined : dashboardEnv
    };
    setFilters(merged);
    fetchTrades(merged);
  };

  const displayTrades = isNormalizedMode ? getNormalizedTrades(trades || [], targetRisk) : (trades || []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboardEnv === 'LIVE' && "Showing performance metrics for Live Trades"}
            {dashboardEnv === 'BACKTEST' && "Showing simulation performance for Backtesting"}
            {dashboardEnv === 'ALL' && "Showing combined portfolio and backtest metrics"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Risk Normalizer */}
          <RiskNormalizerControl />

          {/* Environment Switcher */}
          <div className="flex items-center p-1 bg-muted/60 border rounded-lg">
            <button
              type="button"
              onClick={() => handleEnvChange('LIVE')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                dashboardEnv === 'LIVE' 
                  ? "bg-background text-foreground shadow-xs font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              Live
            </button>
            <button
              type="button"
              onClick={() => handleEnvChange('BACKTEST')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                dashboardEnv === 'BACKTEST' 
                  ? "bg-background text-foreground shadow-xs font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
              Backtests
            </button>
            <button
              type="button"
              onClick={() => handleEnvChange('ALL')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                dashboardEnv === 'ALL' 
                  ? "bg-background text-foreground shadow-xs font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              All
            </button>
          </div>

          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <MetricsCards metrics={metrics} isLoading={metricsLoading} />
      
      {/* Row 1: Equity Curve + Tiltmeter */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EquityCurve data={equityCurve || []} isLoading={metricsLoading} />
        </div>
        <div className="lg:col-span-1">
          <Tiltmeter data={tiltmeter || []} isLoading={metricsLoading} />
        </div>
      </div>

      {/* Row 2: Trade Score + Cumulative P&L */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TradeScore data={tradeScore || null} isLoading={metricsLoading} />
        </div>
        <div className="lg:col-span-2">
          <CumulativePnl data={equityCurve || []} isLoading={metricsLoading} />
        </div>
      </div>
      
      {/* Row 3: Trade Time Performance (Time of Day Scatter Plot & Hourly Edge Analytics) */}
      <TradeTimePerformance trades={displayTrades} isLoading={tradesLoading} />

      <div className="space-y-4">
        <FilterBar onFilterChange={handleFilterChange} trades={displayTrades} />
        <RecentTrades trades={displayTrades} isLoading={tradesLoading} />
      </div>
    </div>
  );
}
