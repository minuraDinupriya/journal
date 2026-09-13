import { NextResponse } from "next/server";
import { getTrades } from "@/lib/db/trade-repository";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Fetch all trades for the user
    const trades = await getTrades({ userId: DEFAULT_USER_ID }) as any[];

    // Filter trades to this month based on exitDate or entryDate
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const monthTrades = trades.filter(t => {
      const date = new Date(t.exitDate || t.entryDate);
      return date >= monthStart && date <= monthEnd;
    });

    // Group by day
    const dailyData: Record<string, { pnl: number; tradeCount: number; wins: number }> = {};

    for (const trade of monthTrades) {
      const date = new Date(trade.exitDate || trade.entryDate);
      const day = date.getDate();
      const key = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if (!dailyData[key]) {
        dailyData[key] = { pnl: 0, tradeCount: 0, wins: 0 };
      }

      dailyData[key].pnl += trade.pnl || 0;
      dailyData[key].tradeCount += 1;
      if ((trade.pnl || 0) > 0) {
        dailyData[key].wins += 1;
      }
    }

    // Build response with win rates
    const days = Object.entries(dailyData).map(([date, data]) => ({
      date,
      pnl: data.pnl,
      tradeCount: data.tradeCount,
      winRate: data.tradeCount > 0 ? (data.wins / data.tradeCount) * 100 : 0,
    }));

    // Monthly totals
    const totalPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const tradingDays = Object.keys(dailyData).length;

    return NextResponse.json({
      year,
      month,
      days,
      totalPnl,
      tradingDays,
    });
  } catch (error) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
