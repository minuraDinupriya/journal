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

    const metrics = calculateAllMetrics(trades);
    const equityCurve = calculateEquityCurve(trades);
    const tiltmeter = calculateTiltmeter(trades);
    const dailyPnl = calculateDailyPnl(trades);

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
