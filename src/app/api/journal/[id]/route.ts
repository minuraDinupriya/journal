import { NextResponse } from "next/server";
import { getJournalEntryById, updateJournalEntry, deleteJournalEntry } from "@/lib/db/journal-repository";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await getJournalEntryById(params.id);
    if (!entry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (error) {
    console.error(`GET /api/journal/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const entry = await updateJournalEntry(params.id, body);
    return NextResponse.json(entry);
  } catch (error) {
    console.error(`PUT /api/journal/${params.id} error:`, error);
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteJournalEntry(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/journal/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
