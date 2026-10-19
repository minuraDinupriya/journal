"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
} from "recharts";
import {
  Info,
  Settings,
  CircleDot,
  BarChart2,
  Sparkles,
  AlertTriangle,
  Clock,
  ExternalLink,
  Zap,
  FlaskConical,
  Globe,
  DollarSign,
  Scale,
  SlidersHorizontal,
} from "lucide-react";
import { Trade } from "@/types/trade";
import { TradeTimePoint, HourlyPerformanceBucket } from "@/types/metrics";
import {
  calculateTradeTimePoints,
  calculateHourlyPerformance,
  calculateTimePerformanceSummary,
} from "@/lib/calculations/trade-time-metrics";
import { getNormalizedTrades } from "@/lib/calculations/trade-metrics";
import { useRiskStore } from "@/stores/risk-store";
import { formatCurrency, cn } from "@/lib/utils";

interface TradeTimePerformanceProps {
  trades: Trade[];
  initialEnv?: "LIVE" | "BACKTEST" | "ALL";
  isLoading?: boolean;
}

export function TradeTimePerformance({
  trades = [],
  initialEnv = "LIVE",
  isLoading = false,
}: TradeTimePerformanceProps) {
  const router = useRouter();
  const { targetRisk, isNormalizedMode, setNormalizedMode } = useRiskStore();

  // Environment mode (Live / Backtest / All)
  const [chartEnv, setChartEnv] = useState<"LIVE" | "BACKTEST" | "ALL">(initialEnv);

  // Sync if initialEnv changes from parent dashboard
  useEffect(() => {
    if (initialEnv) {
      setChartEnv(initialEnv);
    }
  }, [initialEnv]);

  // Scale mode (Actual cash vs Normalized 1R)
  const [scaleMode, setScaleMode] = useState<"ACTUAL" | "NORMALIZED">(
    isNormalizedMode ? "NORMALIZED" : "ACTUAL"
  );

  useEffect(() => {
    setScaleMode(isNormalizedMode ? "NORMALIZED" : "ACTUAL");
  }, [isNormalizedMode]);

  // View state
  const [viewMode, setViewMode] = useState<"scatter" | "hourly">("scatter");
  const [filterType, setFilterType] = useState<"ALL" | "WINNERS" | "LOSERS">("ALL");
  const [timeRangeMode, setTimeRangeMode] = useState<"auto" | "market" | "full">("auto");
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [dotSize, setDotSize] = useState<number>(65);

  // 1. Separate trades by environment (Live vs Backtest vs All)
  const liveCount = useMemo(
    () => (trades || []).filter((t) => (t.tradeType || "LIVE") === "LIVE").length,
    [trades]
  );
  const backtestCount = useMemo(
    () => (trades || []).filter((t) => t.tradeType === "BACKTEST").length,
    [trades]
  );
  const totalCount = (trades || []).length;

  const envFilteredTrades = useMemo(() => {
    if (!trades) return [];
    if (chartEnv === "ALL") return trades;
    return trades.filter((t) => (t.tradeType || "LIVE") === chartEnv);
  }, [trades, chartEnv]);

  // 2. Scale trades if Normalized mode is selected
  const scaledTrades = useMemo(() => {
    if (scaleMode === "NORMALIZED") {
      return getNormalizedTrades(envFilteredTrades, targetRisk);
    }
    return envFilteredTrades;
  }, [envFilteredTrades, scaleMode, targetRisk]);

  // 3. Compute trade points and aggregations on the filtered/scaled dataset
  const allPoints = useMemo(() => calculateTradeTimePoints(scaledTrades), [scaledTrades]);

  // Check if any trades in current view occurred before 8:00 AM
  const hasEarlyTrades = useMemo(() => allPoints.some((p) => p.timeDecimal < 8), [allPoints]);

  // Effective range: "auto" picks 0-24 if early trades exist, otherwise 8-24
  const effectiveRange = useMemo(() => {
    if (timeRangeMode === "full") return "full";
    if (timeRangeMode === "market") return "market";
    return hasEarlyTrades ? "full" : "market";
  }, [timeRangeMode, hasEarlyTrades]);

  const filteredPoints = useMemo(() => {
    let pts = allPoints;
    if (filterType === "WINNERS") pts = allPoints.filter((p) => p.isWin);
    if (filterType === "LOSERS") pts = allPoints.filter((p) => p.isLoss);

    if (effectiveRange === "market") {
      return pts.filter((p) => p.timeDecimal >= 8 && p.timeDecimal <= 24);
    }
    return pts;
  }, [allPoints, filterType, effectiveRange]);

  const hourlyBuckets = useMemo(() => {
    const buckets = calculateHourlyPerformance(scaledTrades);
    if (effectiveRange === "market") {
      return buckets.filter((b) => b.hour >= 8);
    }
    return buckets;
  }, [scaledTrades, effectiveRange]);

  const summary = useMemo(() => calculateTimePerformanceSummary(scaledTrades), [scaledTrades]);

  // Determine X-axis domain & ticks
  const xDomain = useMemo<[number, number]>(() => {
    if (effectiveRange === "market") return [8, 24];
    return [0, 24];
  }, [effectiveRange]);

  const xTicks = useMemo(() => {
    if (effectiveRange === "market") {
      return [8, 10, 12, 14, 16, 18, 20, 22, 24];
    }
    return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  }, [effectiveRange]);

  const formatHourTick = (val: number) => {
    if (val === 24 || val === 0) return "0:00";
    return `${val}:00`;
  };

  const formatYAxisTick = (val: number) => {
    if (val === 0) return "$0";
    if (scaleMode === "NORMALIZED") {
      // In normalized mode, show compact dollar tick
      return `${val < 0 ? "-" : ""}$${Math.abs(val).toLocaleString()}`;
    }
    if (Math.abs(val) >= 1000) {
      return `${val < 0 ? "-" : ""}$${Math.abs(val).toLocaleString()}`;
    }
    return `${val < 0 ? "-" : ""}$${Math.abs(val)}`;
  };

  if (isLoading) {
    return (
      <Card className="col-span-full border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[360px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full border-border/50 bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title with Info & Settings */}
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              Trade time performance
            </CardTitle>

            {/* Info Icon Tooltip */}
            <TooltipProvider>
              <UiTooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full"
                    aria-label="Info about Trade Time Performance"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs p-3">
                  <p className="font-semibold mb-1">Trade Time Performance</p>
                  <p className="text-muted-foreground">
                    Plots each trade’s P&L against the exact time of day it was entered. Green dots
                    represent winning trades, and red dots represent losing trades. Use the controls to separate
                    Live vs Backtest trades or view in Normalized Risk mode.
                  </p>
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>

            {/* Settings Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/60"
                  aria-label="Trade Time Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 text-xs space-y-3" align="start">
                <div className="font-semibold text-sm border-b pb-1.5 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  Chart Settings
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Time Range</label>
                  <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-md">
                    <button
                      type="button"
                      onClick={() => setTimeRangeMode("auto")}
                      className={cn(
                        "py-1 px-1.5 text-xs rounded transition-all text-center",
                        timeRangeMode === "auto"
                          ? "bg-background font-semibold shadow-xs text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Automatically shows 24h when you have early trades"
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRangeMode("full")}
                      className={cn(
                        "py-1 px-1.5 text-xs rounded transition-all text-center",
                        timeRangeMode === "full"
                          ? "bg-background font-semibold shadow-xs text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Full 24h
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeRangeMode("market")}
                      className={cn(
                        "py-1 px-1.5 text-xs rounded transition-all text-center",
                        timeRangeMode === "market"
                          ? "bg-background font-semibold shadow-xs text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      8:00-24:00
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Market Sessions Shading</span>
                  <button
                    type="button"
                    onClick={() => setShowSessions(!showSessions)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium border transition-colors",
                      showSessions
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {showSessions ? "On" : "Off"}
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Dot Size</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "S", size: 40 },
                      { label: "M", size: 65 },
                      { label: "L", size: 95 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setDotSize(item.size)}
                        className={cn(
                          "py-0.5 text-xs rounded border transition-all",
                          dotSize === item.size
                            ? "bg-primary/20 border-primary text-primary font-bold"
                            : "border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Controls: Environment Switcher, Risk Normalizer, Filters & Views */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Environment Switcher (Live / Backtest / All) - User requested feature! */}
            <div className="flex items-center p-0.5 bg-muted/60 border rounded-lg text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setChartEnv("LIVE")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                  chartEnv === "LIVE"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View Live Real-Money Trades Only"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                Live ({liveCount})
              </button>
              <button
                type="button"
                onClick={() => setChartEnv("BACKTEST")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                  chartEnv === "BACKTEST"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View Backtest Simulation Trades Only"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                Backtests ({backtestCount})
              </button>
              <button
                type="button"
                onClick={() => setChartEnv("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5",
                  chartEnv === "ALL"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View Combined Live and Backtest Trades"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                All ({totalCount})
              </button>
            </div>

            {/* 2. Scale Switcher: Actual Cash vs Normalized 1R */}
            <div className="flex items-center p-0.5 bg-muted/60 border rounded-lg text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setScaleMode("ACTUAL");
                  setNormalizedMode(false);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                  scaleMode === "ACTUAL"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="View actual raw cash P&L"
              >
                <DollarSign className="w-3 h-3" />
                Actual
              </button>
              <button
                type="button"
                onClick={() => {
                  setScaleMode("NORMALIZED");
                  setNormalizedMode(true);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                  scaleMode === "NORMALIZED"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={`Scale to fixed risk per trade (1R = $${targetRisk})`}
              >
                <Scale className="w-3 h-3" />
                Normalized
              </button>
            </div>

            {/* 3. Outcome Filter: All / Wins / Losses */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40 text-xs">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all font-medium",
                  filterType === "ALL"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType("WINNERS")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                  filterType === "WINNERS"
                    ? "bg-background text-emerald-500 shadow-xs"
                    : "text-muted-foreground hover:text-emerald-500"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Wins
              </button>
              <button
                type="button"
                onClick={() => setFilterType("LOSERS")}
                className={cn(
                  "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1",
                  filterType === "LOSERS"
                    ? "bg-background text-rose-500 shadow-xs"
                    : "text-muted-foreground hover:text-rose-500"
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Losses
              </button>
            </div>

            {/* 4. View Mode: Scatter vs Hourly */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-lg border border-border/40">
              <Button
                variant={viewMode === "scatter" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setViewMode("scatter")}
                title="Scatter Plot (Exact Trades)"
              >
                <CircleDot className="w-3.5 h-3.5 text-primary" />
                Scatter
              </Button>
              <Button
                variant={viewMode === "hourly" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={() => setViewMode("hourly")}
                title="Hourly Performance (Bar Chart)"
              >
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
                Hourly
              </Button>
            </div>
          </div>
        </div>

        {/* AI & Edge Insights Badges (Recalculated for the chosen environment) */}
        {allPoints.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
              {chartEnv === "LIVE" ? "Live Edge:" : chartEnv === "BACKTEST" ? "Backtest Edge:" : "Overall Edge:"}
            </span>

            {summary.bestHour && summary.bestHour.totalPnl > 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Golden Window:</span>
                <span>{summary.bestHour.hourRange}</span>
                <span className="font-mono font-bold">
                  (+{formatCurrency(summary.bestHour.totalPnl)})
                </span>
                <span className="text-[11px] opacity-80">
                  • {summary.bestHour.winRate}% WR
                </span>
              </div>
            )}

            {summary.worstHour && summary.worstHour.totalPnl < 0 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">Leak Window:</span>
                <span>{summary.worstHour.hourRange}</span>
                <span className="font-mono font-bold">
                  ({formatCurrency(summary.worstHour.totalPnl)})
                </span>
              </div>
            )}

            {summary.mostActiveHour && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 border border-border/50 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Peak Activity:</span>
                <span className="font-medium text-foreground">
                  {summary.mostActiveHour.hourLabel} ({summary.mostActiveHour.tradeCount} trades)
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {allPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[340px] text-muted-foreground text-center">
            <Clock className="w-10 h-10 mb-3 text-muted-foreground/40" />
            <p className="font-medium">
              No {chartEnv === "LIVE" ? "Live" : chartEnv === "BACKTEST" ? "Backtest" : ""} trades available for this time view
            </p>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
              {chartEnv === "LIVE"
                ? "Switch to Backtests or log live trades with entry timestamps to see your live trade time performance."
                : "Switch to Live or run backtests to populate this chart."}
            </p>
          </div>
        ) : viewMode === "scatter" ? (
          /* SCATTER CHART VIEW */
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 15, right: 25, bottom: 10, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground)/0.12)"
                />

                {/* Optional Trading Session Overlays */}
                {showSessions && (
                  <>
                    {effectiveRange === "full" && (
                      <ReferenceArea
                        x1={0}
                        x2={8}
                        fill="#8b5cf6"
                        fillOpacity={0.04}
                        label={{
                          value: "Asia",
                          position: "insideTopLeft",
                          fill: "#8b5cf6",
                          fontSize: 10,
                          opacity: 0.6,
                        }}
                      />
                    )}
                    <ReferenceArea
                      x1={8}
                      x2={16.5}
                      fill="#3b82f6"
                      fillOpacity={0.04}
                      label={{
                        value: "London",
                        position: "insideTopLeft",
                        fill: "#3b82f6",
                        fontSize: 10,
                        opacity: 0.6,
                      }}
                    />
                    <ReferenceArea
                      x1={13}
                      x2={21}
                      fill="#10b981"
                      fillOpacity={0.04}
                      label={{
                        value: "New York",
                        position: "insideTopRight",
                        fill: "#10b981",
                        fontSize: 10,
                        opacity: 0.6,
                      }}
                    />
                  </>
                )}

                {/* X-Axis: 24-hour timeline */}
                <XAxis
                  type="number"
                  dataKey="timeDecimal"
                  name="Time"
                  domain={xDomain}
                  ticks={xTicks}
                  tickFormatter={formatHourTick}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border)/0.6)" }}
                />

                {/* Y-Axis: Net PnL in Dollars */}
                <YAxis
                  type="number"
                  dataKey="pnl"
                  name="PnL"
                  tickFormatter={formatYAxisTick}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />

                <ZAxis type="number" range={[dotSize, dotSize]} />

                {/* $0 Center Reference Line */}
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--muted-foreground)/0.4)"
                  strokeDasharray="4 4"
                />

                {/* Custom Tooltip */}
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "hsl(var(--muted-foreground)/0.3)", pointerEvents: "none" }}
                  content={<ScatterCustomTooltip scaleMode={scaleMode} />}
                  wrapperStyle={{ pointerEvents: "none", zIndex: 1000 }}
                  isAnimationActive={false}
                  offset={15}
                />

                {/* Scatter Points */}
                <Scatter
                  name="Trades"
                  data={filteredPoints}
                  onClick={(point) => {
                    if (point && point.id) {
                      router.push(`/trades/${point.id}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {filteredPoints.map((entry, index) => {
                    const isBacktest = entry.tradeType === "BACKTEST";
                    const fillColor = entry.isWin
                      ? "#10b981" // Emerald Green for winners
                      : entry.isLoss
                      ? "#ef4444" // Rose Red for losers
                      : "#94a3b8"; // Slate for break-even

                    // In "ALL" view, distinguish Backtest trades with distinct purple border
                    const strokeColor = chartEnv === "ALL" && isBacktest ? "#c084fc" : fillColor;
                    const strokeWidth = chartEnv === "ALL" && isBacktest ? 2 : 1;

                    return (
                      <Cell
                        key={`cell-${entry.id || index}`}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        className="transition-all duration-150 hover:brightness-125 hover:stroke-white/80"
                      />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* HOURLY BAR CHART VIEW */
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyBuckets}
                margin={{ top: 15, right: 25, bottom: 10, left: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground)/0.12)"
                />

                <XAxis
                  dataKey="hour"
                  domain={xDomain}
                  ticks={xTicks}
                  tickFormatter={formatHourTick}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border)/0.6)" }}
                />

                <YAxis
                  tickFormatter={formatYAxisTick}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />

                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--muted-foreground)/0.4)"
                  strokeDasharray="4 4"
                />

                <RechartsTooltip
                  content={<BarCustomTooltip />}
                  wrapperStyle={{ pointerEvents: "none", zIndex: 1000 }}
                  isAnimationActive={false}
                  offset={10}
                />

                <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                  {hourlyBuckets.map((bucket) => {
                    const fillColor =
                      bucket.totalPnl > 0
                        ? "#10b981"
                        : bucket.totalPnl < 0
                        ? "#ef4444"
                        : "#94a3b8";
                    return (
                      <Cell
                        key={`bar-${bucket.hour}`}
                        fill={fillColor}
                        opacity={bucket.tradeCount > 0 ? 0.9 : 0.2}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom Tooltip for Individual Trade Scatter Points
function ScatterCustomTooltip({ active, payload, scaleMode }: any) {
  if (!active || !payload || !payload.length) return null;

  const data: TradeTimePoint = payload[0].payload;
  if (!data) return null;

  const isWin = data.pnl > 0;
  const isLoss = data.pnl < 0;
  const isBacktest = data.tradeType === "BACKTEST";

  return (
    <div className="pointer-events-none select-none rounded-lg border border-border/80 bg-slate-950/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-2 min-w-[220px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <span>{data.asset.toUpperCase()}</span>
          <Badge
            variant={data.direction === "LONG" ? "default" : "destructive"}
            className="text-[10px] py-0 px-1.5 h-4"
          >
            {data.direction}
          </Badge>
        </div>

        {/* Environment Badge */}
        {isBacktest ? (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-0.5">
            <FlaskConical className="w-2.5 h-2.5" /> Backtest
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" /> Live
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">
          {scaleMode === "NORMALIZED" ? "Normalized P&L:" : "Net P&L:"}
        </span>
        <span
          className={cn(
            "font-mono font-bold text-sm",
            isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-300"
          )}
        >
          {data.pnl > 0 ? `+${formatCurrency(data.pnl)}` : formatCurrency(data.pnl)}
        </span>
      </div>

      {data.realizedRr !== null && data.realizedRr !== undefined && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Realized R:R:</span>
          <span
            className={cn(
              "font-mono font-semibold",
              data.realizedRr > 0 ? "text-emerald-400" : data.realizedRr < 0 ? "text-rose-400" : ""
            )}
          >
            {data.realizedRr > 0 ? `+${data.realizedRr.toFixed(2)}R` : `${data.realizedRr.toFixed(2)}R`}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Time of Entry:</span>
        <span className="font-mono text-slate-200 font-medium">
          {data.timeLabel}
        </span>
      </div>

      {data.strategy && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Strategy:</span>
          <span className="text-slate-300 font-medium truncate max-w-[120px]">
            {data.strategy}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-1 border-t border-slate-900">
        <span>{new Date(data.entryDate).toLocaleDateString()}</span>
        <span className="text-indigo-400 flex items-center gap-0.5 font-medium">
          Click dot to open <ExternalLink className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}

// Custom Tooltip for Hourly Aggregated Bars
function BarCustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data: HourlyPerformanceBucket = payload[0].payload;
  if (!data) return null;

  return (
    <div className="pointer-events-none select-none rounded-lg border border-border/80 bg-slate-950/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-2 min-w-[200px]">
      <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
        <span>{data.hourRange}</span>
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
          {data.tradeCount} {data.tradeCount === 1 ? "trade" : "trades"}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Total P&L:</span>
        <span
          className={cn(
            "font-mono font-bold",
            data.totalPnl > 0 ? "text-emerald-400" : data.totalPnl < 0 ? "text-rose-400" : "text-slate-300"
          )}
        >
          {data.totalPnl > 0 ? `+${formatCurrency(data.totalPnl)}` : formatCurrency(data.totalPnl)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Win Rate:</span>
        <span className="font-mono font-semibold text-slate-200">
          {data.tradeCount > 0 ? `${data.winRate}% (${data.winCount}W / ${data.lossCount}L)` : "—"}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Avg Trade:</span>
        <span className="font-mono text-slate-300">
          {data.tradeCount > 0 ? formatCurrency(data.averagePnl) : "—"}
        </span>
      </div>
    </div>
  );
}
