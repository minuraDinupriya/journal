import { NextResponse } from "next/server";
import { getTrades } from "@/lib/db/trade-repository";
import { 
  calculateAllMetrics, 
  calculateEquityCurve, 
  calculateTiltmeter, 
  calculateDailyPnl,
  calculateTradeScore,
  getNormalizedTrades
} from "@/lib/calculations/trade-metrics";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeTypeParam = searchParams.get("tradeType");
    const tradeType = tradeTypeParam === 'ALL' ? undefined : (tradeTypeParam || 'LIVE');
    const targetRiskParam = searchParams.get("targetRisk");
    const targetRisk = targetRiskParam ? parseFloat(targetRiskParam) : null;

    const trades = await getTrades({ 
      userId: DEFAULT_USER_ID,
      tradeType
    });

    let typedTrades = trades as any;
    if (targetRisk && targetRisk > 0) {
      typedTrades = getNormalizedTrades(typedTrades, targetRisk);
    }

    const metrics = calculateAllMetrics(typedTrades);
    const equityCurve = calculateEquityCurve(typedTrades);
    const tiltmeter = calculateTiltmeter(typedTrades);
    const dailyPnl = calculateDailyPnl(typedTrades);
    const tradeScore = calculateTradeScore(typedTrades);

    return NextResponse.json({
      metrics,
      equityCurve,
      tiltmeter,
      dailyPnl,
      tradeScore
    });
  } catch (error) {
    console.error("GET /api/metrics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
