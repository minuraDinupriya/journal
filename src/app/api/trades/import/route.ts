import { NextResponse } from "next/server";
import { bulkCreateTrades } from "@/lib/db/trade-repository";
import { detectBrokerFormat, parseTradesCsv } from "@/lib/parsers/csv-engine";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const formatQuery = searchParams.get("format");
    let format: 'MT5' | 'NINJATRADER' | undefined = undefined;
    
    if (formatQuery === 'MT5' || formatQuery === 'NINJATRADER') {
      format = formatQuery;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const detectedFormat = format || detectBrokerFormat(text);
    
    if (detectedFormat === 'UNKNOWN') {
      return NextResponse.json({ error: "Unknown CSV format" }, { status: 400 });
    }

    const parseResult = parseTradesCsv(text, detectedFormat);

    if (parseResult.errors && parseResult.errors.length > 0 && (!parseResult.data || parseResult.data.length === 0)) {
       return NextResponse.json({ 
         error: "Failed to parse CSV", 
         details: parseResult.errors 
       }, { status: 400 });
    }

    const tradesToCreate = parseResult.data.map((trade: any) => ({
      ...trade,
      userId: DEFAULT_USER_ID
    }));

    const result = await bulkCreateTrades(tradesToCreate);

    return NextResponse.json({
      imported: result.created,
      errors: [...parseResult.errors, ...result.errors],
      warnings: parseResult.warnings
    });
  } catch (error) {
    console.error("POST /api/trades/import error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
