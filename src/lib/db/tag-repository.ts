import { prisma } from './prisma';

export async function createTag(name: string, color: string = '#6366f1') {
  try {
    return await prisma.tag.create({
      data: {
        name,
        color
      }
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    throw new Error('Failed to create tag.');
  }
}

export async function getTags() {
  try {
    return await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Failed to fetch tags.');
  }
}

export async function deleteTag(id: string): Promise<void> {
  try {
    await prisma.tag.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw new Error('Failed to delete tag.');
  }
}

export async function addTagToTrade(tradeId: string, tagId: string) {
  try {
    return await prisma.tagOnTrade.create({
      data: {
        tradeId,
        tagId
      }
    });
  } catch (error) {
    console.error('Error adding tag to trade:', error);
    throw new Error('Failed to add tag to trade.');
  }
}

export async function removeTagFromTrade(tradeId: string, tagId: string): Promise<void> {
  try {
    await prisma.tagOnTrade.delete({
      where: {
        tradeId_tagId: {
          tradeId,
          tagId
        }
      }
    });
  } catch (error) {
    console.error('Error removing tag from trade:', error);
    throw new Error('Failed to remove tag from trade.');
  }
}
