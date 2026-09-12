import { NextResponse } from "next/server";
import { getJournalEntries, createJournalEntry } from "@/lib/db/journal-repository";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const entries = await getJournalEntries(DEFAULT_USER_ID, dateFrom, dateTo);

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const entry = await createJournalEntry({ ...body, userId: DEFAULT_USER_ID });
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }
}
