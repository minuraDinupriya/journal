import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function DELETE(request: Request) {
  try {
    // Delete all trades and journal entries for this user that have a deletedAt
    await prisma.$transaction([
      prisma.trade.deleteMany({
        where: { userId: DEFAULT_USER_ID, deletedAt: { not: null } }
      }),
      prisma.journalEntry.deleteMany({
        where: { userId: DEFAULT_USER_ID, deletedAt: { not: null } }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/trash/empty error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
