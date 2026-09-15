import { NextResponse } from "next/server";
import { getDeletedTrades } from "@/lib/db/trade-repository";
import { getDeletedJournalEntries } from "@/lib/db/journal-repository";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Run cleanup (delete anything older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fire and forget cleanup
    prisma.trade.deleteMany({
      where: { deletedAt: { lt: thirtyDaysAgo } }
    }).catch(console.error);

    prisma.journalEntry.deleteMany({
      where: { deletedAt: { lt: thirtyDaysAgo } }
    }).catch(console.error);

    // 2. Fetch active trash items
    const [deletedTrades, deletedJournals] = await Promise.all([
      getDeletedTrades(DEFAULT_USER_ID),
      getDeletedJournalEntries(DEFAULT_USER_ID)
    ]);

    const trashItems = [
      ...deletedTrades.map(t => ({
        id: t.id,
        type: 'trade',
        title: `Trade: ${t.asset} (${t.direction})`,
        deletedAt: t.deletedAt,
      })),
      ...deletedJournals.map(j => ({
        id: j.id,
        type: 'journal',
        title: `Journal: ${j.content.slice(0, 50)}${j.content.length > 50 ? '...' : ''}`,
        deletedAt: j.deletedAt,
      }))
    ].sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

    return NextResponse.json(trashItems);
  } catch (error) {
    console.error("GET /api/trash error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
