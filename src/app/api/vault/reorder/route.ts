import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    await prisma.$transaction(
      items.map(item =>
        prisma.vaultItem.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/vault/reorder error:", error);
    return NextResponse.json({ error: 'Failed to reorder vault items' }, { status: 500 });
  }
}
