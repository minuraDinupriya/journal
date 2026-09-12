"use client";

import { useEffect, useState } from "react";
import { useMetrics } from "@/hooks/use-metrics";
import { useTrades } from "@/hooks/use-trades";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { EquityCurve } from "@/components/dashboard/equity-curve";
import { Tiltmeter } from "@/components/dashboard/tiltmeter";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { TradeFilter } from "@/types/metrics";

export default function DashboardPage() {
  const [filters, setFilters] = useState<TradeFilter>({});
  
  const { metrics, equityCurve, tiltmeter, isLoading: metricsLoading, refreshMetrics } = useMetrics();
  const { trades, isLoading: tradesLoading, fetchTrades } = useTrades();

  const handleRefresh = () => {
    refreshMetrics();
    fetchTrades(filters);
  };

  const handleFilterChange = (newFilters: TradeFilter) => {
    setFilters(newFilters);
    fetchTrades(newFilters);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <MetricsCards metrics={metrics} isLoading={metricsLoading} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EquityCurve data={equityCurve || []} isLoading={metricsLoading} />
        </div>
        <div className="lg:col-span-1">
          <Tiltmeter data={tiltmeter || []} isLoading={metricsLoading} />
        </div>
      </div>
      
      <div className="space-y-4">
        <FilterBar onFilterChange={handleFilterChange} trades={trades || []} />
        <RecentTrades trades={trades || []} isLoading={tradesLoading} />
      </div>
    </div>
  );
}
