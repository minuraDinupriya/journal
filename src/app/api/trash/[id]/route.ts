import { NextResponse } from "next/server";
import { restoreTrade, hardDeleteTrade } from "@/lib/db/trade-repository";
import { restoreJournalEntry, hardDeleteJournalEntry } from "@/lib/db/journal-repository";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { type } = await request.json();
    
    if (type === 'trade') {
      await restoreTrade(params.id);
    } else if (type === 'journal') {
      await restoreJournalEntry(params.id);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/trash/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'trade') {
      await hardDeleteTrade(params.id);
    } else if (type === 'journal') {
      await hardDeleteJournalEntry(params.id);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/trash/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
