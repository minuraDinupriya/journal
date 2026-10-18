import { Trade } from '@/types/trade';
import { TradeTimePoint, HourlyPerformanceBucket, TimePerformanceSummary } from '@/types/metrics';

/**
 * Extracts entry time information for each trade into a 24-hour decimal representation.
 * E.g., 10:15 becomes 10.25 on the X-axis.
 */
export function calculateTradeTimePoints(trades: Trade[]): TradeTimePoint[] {
  const points: TradeTimePoint[] = [];

  for (const trade of trades || []) {
    if (trade.pnl === null || trade.pnl === undefined) continue;

    const rawDate = trade.entryDate || trade.createdAt;
    const entry = new Date(rawDate);
    if (isNaN(entry.getTime())) continue;

    const hours = entry.getHours();
    const minutes = entry.getMinutes();
    const timeDecimal = Number((hours + minutes / 60).toFixed(2));
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    points.push({
      id: trade.id,
      asset: trade.asset,
      direction: trade.direction,
      entryDate: typeof rawDate === 'string' ? rawDate : (rawDate as Date).toISOString(),
      timeDecimal,
      timeLabel: formattedTime,
      pnl: Number(trade.pnl.toFixed(2)),
      size: trade.size,
      strategy: trade.strategy,
      realizedRr: trade.realizedRr,
      isWin: trade.pnl > 0,
      isLoss: trade.pnl < 0,
      tradeType: trade.tradeType,
    });
  }

  return points.sort((a, b) => a.timeDecimal - b.timeDecimal);
}

/**
 * Aggregates trades into 24 one-hour buckets (0 to 23)
 */
export function calculateHourlyPerformance(trades: Trade[]): HourlyPerformanceBucket[] {
  const points = calculateTradeTimePoints(trades);
  const buckets: HourlyPerformanceBucket[] = [];

  for (let h = 0; h < 24; h++) {
    const startStr = `${h.toString().padStart(2, '0')}:00`;
    const nextH = (h + 1) % 24;
    const endStr = `${nextH.toString().padStart(2, '0')}:00`;
    const tradesInHour = points.filter((p) => Math.floor(p.timeDecimal) === h);

    const totalPnl = tradesInHour.reduce((sum, t) => sum + t.pnl, 0);
    const winCount = tradesInHour.filter((t) => t.isWin).length;
    const lossCount = tradesInHour.filter((t) => t.isLoss).length;
    const tradeCount = tradesInHour.length;
    const winRate = tradeCount > 0 ? Number(((winCount / tradeCount) * 100).toFixed(1)) : 0;
    const averagePnl = tradeCount > 0 ? Number((totalPnl / tradeCount).toFixed(2)) : 0;

    buckets.push({
      hour: h,
      hourLabel: startStr,
      hourRange: `${startStr} - ${endStr}`,
      totalPnl: Number(totalPnl.toFixed(2)),
      tradeCount,
      winCount,
      lossCount,
      winRate,
      averagePnl,
    });
  }

  return buckets;
}

/**
 * Summarizes peak edge hour, worst leakage hour, etc.
 */
export function calculateTimePerformanceSummary(trades: Trade[]): TimePerformanceSummary {
  const buckets = calculateHourlyPerformance(trades).filter((b) => b.tradeCount > 0);

  if (buckets.length === 0) {
    return {
      bestHour: null,
      worstHour: null,
      highestWinRateHour: null,
      mostActiveHour: null,
    };
  }

  const bestHour = [...buckets].sort((a, b) => b.totalPnl - a.totalPnl)[0];
  const worstHour = [...buckets].sort((a, b) => a.totalPnl - b.totalPnl)[0];

  // Prefer buckets with at least 2 trades for win rate to avoid 1-trade 100% statistical anomalies
  const bucketsWithMultiple = buckets.filter((b) => b.tradeCount >= 2);
  const winRateCandidates = bucketsWithMultiple.length > 0 ? bucketsWithMultiple : buckets;
  const highestWinRateHour = [...winRateCandidates].sort((a, b) => b.winRate - a.winRate)[0];

  const mostActiveHour = [...buckets].sort((a, b) => b.tradeCount - a.tradeCount)[0];

  return {
    bestHour,
    worstHour,
    highestWinRateHour,
    mostActiveHour,
  };
}
