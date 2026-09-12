import { NextResponse } from "next/server";
import { getTrades } from "@/lib/db/trade-repository";
import { 
  calculateAllMetrics, 
  calculateEquityCurve, 
  calculateTiltmeter, 
  calculateDailyPnl 
} from "@/lib/calculations/trade-metrics";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const trades = await getTrades({ userId: DEFAULT_USER_ID });

    const typedTrades = trades as any;
    const metrics = calculateAllMetrics(typedTrades);
    const equityCurve = calculateEquityCurve(typedTrades);
    const tiltmeter = calculateTiltmeter(typedTrades);
    const dailyPnl = calculateDailyPnl(typedTrades);

    return NextResponse.json({
      metrics,
      equityCurve,
      tiltmeter,
      dailyPnl
    });
  } catch (error) {
    console.error("GET /api/metrics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
