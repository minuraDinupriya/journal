import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await prisma.vaultItem.findMany({
      where: { userId: 'default-user' },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vault items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const item = await prisma.vaultItem.create({
      data: {
        userId: 'default-user',
        type: data.type,
        title: data.title,
        content: data.content,
        images: data.images ? JSON.stringify(data.images) : null
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vault item' }, { status: 500 });
  }
}
