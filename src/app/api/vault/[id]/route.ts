import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const item = await prisma.vaultItem.update({
      where: { id: params.id, userId: 'default-user' },
      data: {
        type: data.type,
        title: data.title,
        content: data.content,
        images: data.images ? JSON.stringify(data.images) : null
      }
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update vault item' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.vaultItem.delete({
      where: { id: params.id, userId: 'default-user' }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vault item' }, { status: 500 });
  }
}
