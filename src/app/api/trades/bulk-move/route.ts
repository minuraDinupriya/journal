import { NextResponse } from "next/server";
import { bulkUpdateTradeType, bulkDeleteTrades } from "@/lib/db/trade-repository";
import { z } from "zod";

const bulkMoveSchema = z.object({
  ids: z.array(z.string()).min(1),
  tradeType: z.enum(["LIVE", "BACKTEST"]),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.literal("delete"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "delete") {
      const { ids } = bulkDeleteSchema.parse(body);
      const result = await bulkDeleteTrades(ids);
      return NextResponse.json({ success: true, count: result.count });
    }

    const { ids, tradeType } = bulkMoveSchema.parse(body);
    const result = await bulkUpdateTradeType(ids, tradeType);

    return NextResponse.json({ success: true, count: result.count, tradeType });
  } catch (error: any) {
    console.error("POST /api/trades/bulk-move error:", error);
    return NextResponse.json({ error: error.message || "Invalid request" }, { status: 400 });
  }
}
