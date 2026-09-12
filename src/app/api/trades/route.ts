import { NextResponse } from "next/server";
import { getTrades, createTrade } from "@/lib/db/trade-repository";
import { tradeFormSchema } from "@/lib/validators/trade-validator";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assetClass = searchParams.get("assetClass") || undefined;
    const strategy = searchParams.get("strategy") || undefined;
    const emotionalState = searchParams.get("emotionalState") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const direction = searchParams.get("direction") || undefined;
    const source = searchParams.get("source") || undefined;

    const trades = await getTrades({
      userId: DEFAULT_USER_ID,
      assetClass,
      strategy,
      emotionalState,
      dateFrom,
      dateTo,
      direction,
      source,
    });

    return NextResponse.json(trades);
  } catch (error) {
    console.error("GET /api/trades error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = tradeFormSchema.parse(body);
    
    const trade = await createTrade({ ...validatedData, userId: DEFAULT_USER_ID });
    
    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error("POST /api/trades error:", error);
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }
}
