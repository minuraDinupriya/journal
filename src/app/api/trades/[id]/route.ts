import { NextResponse } from "next/server";
import { getTradeById, updateTrade, deleteTrade } from "@/lib/db/trade-repository";
import { tradeFormSchema } from "@/lib/validators/trade-validator";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const trade = await getTradeById(params.id);
    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }
    return NextResponse.json(trade);
  } catch (error) {
    console.error(`GET /api/trades/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = tradeFormSchema.partial().parse(body);
    
    const trade = await updateTrade(params.id, validatedData);
    return NextResponse.json(trade);
  } catch (error) {
    console.error(`PUT /api/trades/${params.id} error:`, error);
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteTrade(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/trades/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
