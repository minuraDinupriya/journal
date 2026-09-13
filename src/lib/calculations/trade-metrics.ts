import { Trade } from '@/types/trade';
import { DashboardMetrics, EquityPoint, TiltmeterData } from '@/types/metrics';

export function calculateWinRate(trades: Trade[]): number {
  const closedWithPnl = trades.filter(t => t.pnl !== undefined && t.pnl !== null && t.exitDate);
  if (closedWithPnl.length === 0) return 0;
  
  const wins = closedWithPnl.filter(t => (t.pnl || 0) > 0).length;
  return (wins / closedWithPnl.length) * 100;
}

export function calculateProfitFactor(trades: Trade[]): number {
  const closedWithPnl = trades.filter(t => t.pnl !== undefined && t.pnl !== null);
  const grossProfit = closedWithPnl.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(closedWithPnl.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
  
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

export function calculateAverageWin(trades: Trade[]): number {
  const wins = trades.filter(t => (t.pnl || 0) > 0);
  if (wins.length === 0) return 0;
  return wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length;
}

export function calculateAverageLoss(trades: Trade[]): number {
  const losses = trades.filter(t => (t.pnl || 0) < 0);
  if (losses.length === 0) return 0;
  return losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length;
}

export function calculateMaxDrawdown(trades: Trade[]): { value: number, percentage: number } {
  const sorted = [...trades].filter(t => t.exitDate).sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());
  let peak = 0;
  let maxDrawdownValue = 0;
  let cumulativePnl = 0;
  
  for (const trade of sorted) {
    cumulativePnl += trade.pnl || 0;
    if (cumulativePnl > peak) {
      peak = cumulativePnl;
    }
    const drawdown = peak - cumulativePnl;
    if (drawdown > maxDrawdownValue) {
      maxDrawdownValue = drawdown;
    }
  }
  
  const percentage = peak > 0 ? (maxDrawdownValue / peak) * 100 : 0;
  return { value: maxDrawdownValue, percentage };
}

export function calculateEquityCurve(trades: Trade[]): EquityPoint[] {
  const sorted = [...trades].filter(t => t.exitDate).sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());
  let cumulativePnl = 0;
  
  return sorted.map(t => {
    cumulativePnl += t.pnl || 0;
    return {
      date: new Date(t.exitDate!).toISOString(),
      equity: cumulativePnl,
    };
  });
}

export function calculateTiltmeter(trades: Trade[]): TiltmeterData[] {
  const groups: Record<string, Trade[]> = {};
  for (const trade of trades) {
    const state = trade.emotionalState || 'NEUTRAL';
    if (!groups[state]) groups[state] = [];
    groups[state].push(trade);
  }
  
  return Object.entries(groups).map(([state, groupTrades]) => {
    const winRate = calculateWinRate(groupTrades);
    const totalPnl = groupTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const averagePnl = groupTrades.length > 0 ? totalPnl / groupTrades.length : 0;
    
    return {
      emotionalState: state as any,
      averagePnl,
      tradeCount: groupTrades.length,
      winRate,
    };
  });
}

export function calculateAverageHoldTime(trades: Trade[]): number {
  const closed = trades.filter(t => t.exitDate && t.entryDate);
  if (closed.length === 0) return 0;
  
  const totalMinutes = closed.reduce((sum, t) => {
    const diffMs = new Date(t.exitDate!).getTime() - new Date(t.entryDate).getTime();
    return sum + diffMs / (1000 * 60);
  }, 0);
  
  return totalMinutes / closed.length;
}

export function calculateDailyPnl(trades: Trade[]): { date: string, pnl: number }[] {
  const daily: Record<string, number> = {};
  for (const trade of trades) {
    if (!trade.exitDate) continue;
    const dateStr = new Date(trade.exitDate).toISOString().split('T')[0];
    daily[dateStr] = (daily[dateStr] || 0) + (trade.pnl || 0);
  }
  
  return Object.entries(daily).map(([date, pnl]) => ({ date, pnl })).sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateAllMetrics(trades: Trade[]): DashboardMetrics {
  const closedTrades = trades.filter(t => t.exitDate !== undefined && t.exitDate !== null);
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const pnlValues = closedTrades.map(t => t.pnl || 0);
  
  return {
    totalTrades: trades.length,
    totalPnl,
    winRate: calculateWinRate(trades),
    profitFactor: calculateProfitFactor(trades),
    averageWin: calculateAverageWin(trades),
    averageLoss: calculateAverageLoss(trades),
    maxDrawdown: calculateMaxDrawdown(trades).value,
    averageRrr: calculateAverageWin(trades) !== 0 && calculateAverageLoss(trades) !== 0
      ? Math.abs(calculateAverageWin(trades) / calculateAverageLoss(trades))
      : 0,
    bestTrade: pnlValues.length > 0 ? Math.max(...pnlValues) : 0,
    worstTrade: pnlValues.length > 0 ? Math.min(...pnlValues) : 0,
    averageHoldTime: calculateAverageHoldTime(trades),
  };
}

export interface TradeScoreData {
  winPercent: number
  profitFactor: number
  avgWinLoss: number
  recoveryFactor: number
  maxDrawdownScore: number
  consistency: number
  compositeScore: number
}

export function calculateTradeScore(trades: Trade[]): TradeScoreData {
  const closedTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined && t.exitDate);

  if (closedTrades.length < 2) {
    return {
      winPercent: 0, profitFactor: 0, avgWinLoss: 0,
      recoveryFactor: 0, maxDrawdownScore: 0, consistency: 0, compositeScore: 0
    };
  }

  // 1. Win % score (direct mapping: 0-100%)
  const rawWinRate = calculateWinRate(closedTrades);
  const winPercent = Math.min(rawWinRate, 100);

  // 2. Profit Factor score (cap at 3.0 → 100)
  const rawPF = calculateProfitFactor(closedTrades);
  const pfScore = Math.min((isFinite(rawPF) ? rawPF : 3) / 3 * 100, 100);

  // 3. Avg Win/Loss (R:R ratio, cap at 3.0 → 100)
  const avgW = calculateAverageWin(closedTrades);
  const avgL = calculateAverageLoss(closedTrades);
  const rawRR = avgL !== 0 ? Math.abs(avgW / avgL) : 0;
  const avgWinLossScore = Math.min(rawRR / 3 * 100, 100);

  // 4. Recovery Factor (total P&L / max drawdown, cap at 5.0 → 100)
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const { value: maxDD } = calculateMaxDrawdown(closedTrades);
  const rawRecovery = maxDD > 0 ? totalPnl / maxDD : (totalPnl > 0 ? 5 : 0);
  const recoveryScore = Math.min(Math.max(rawRecovery, 0) / 5 * 100, 100);

  // 5. Max Drawdown score (inverse: lower drawdown = better score)
  // If total equity peak is known, drawdown % matters. Use percentage-based.
  const { percentage: ddPct } = calculateMaxDrawdown(closedTrades);
  // 0% drawdown = 100 score, 50%+ drawdown = 0 score
  const ddScore = Math.max(100 - ddPct * 2, 0);

  // 6. Consistency (lower std dev of daily P&L = better)
  const dailyPnl = calculateDailyPnl(closedTrades);
  const pnlValues = dailyPnl.map(d => d.pnl);
  const mean = pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length;
  const variance = pnlValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / pnlValues.length;
  const stdDev = Math.sqrt(variance);
  // Normalize: if stdDev is 0 (perfectly consistent) = 100, scale down with higher stdDev
  // Use mean as reference: coefficient of variation
  const cv = mean !== 0 ? stdDev / Math.abs(mean) : stdDev;
  // CV of 0 = 100, CV of 2+ = 0
  const consistencyScore = Math.max(Math.min((1 - cv / 2) * 100, 100), 0);

  // Composite: weighted average
  const compositeScore = (
    winPercent * 0.20 +
    pfScore * 0.20 +
    avgWinLossScore * 0.15 +
    recoveryScore * 0.15 +
    ddScore * 0.15 +
    consistencyScore * 0.15
  );

  return {
    winPercent: Math.round(winPercent * 100) / 100,
    profitFactor: Math.round(pfScore * 100) / 100,
    avgWinLoss: Math.round(avgWinLossScore * 100) / 100,
    recoveryFactor: Math.round(recoveryScore * 100) / 100,
    maxDrawdownScore: Math.round(ddScore * 100) / 100,
    consistency: Math.round(consistencyScore * 100) / 100,
    compositeScore: Math.round(compositeScore * 100) / 100,
  };
}

