import { prisma } from './prisma';

export type JournalFormData = {
  date: string | Date;
  content: string;
  mood?: number;
};

export async function createJournalEntry(data: JournalFormData & { userId: string }) {
  try {
    return await prisma.journalEntry.create({
      data: {
        userId: data.userId,
        date: new Date(data.date),
        content: data.content,
        mood: data.mood ?? 3,
      }
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw new Error('Failed to create journal entry.');
  }
}

export async function getJournalEntries(userId: string, dateFrom?: string | Date, dateTo?: string | Date) {
  try {
    const where: any = { userId, deletedAt: null };
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    return await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw new Error('Failed to fetch journal entries.');
  }
}

export async function getJournalEntryById(id: string) {
  try {
    return await prisma.journalEntry.findFirst({
      where: { id, deletedAt: null }
    });
  } catch (error) {
    console.error('Error fetching journal entry by ID:', error);
    throw new Error('Failed to fetch journal entry.');
  }
}

export async function updateJournalEntry(id: string, data: Partial<JournalFormData>) {
  try {
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    
    return await prisma.journalEntry.update({
      where: { id },
      data: updateData
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw new Error('Failed to update journal entry.');
  }
}

export async function deleteJournalEntry(id: string): Promise<void> {
  try {
    await prisma.journalEntry.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw new Error('Failed to delete journal entry.');
  }
}

export async function restoreJournalEntry(id: string): Promise<void> {
  try {
    await prisma.journalEntry.update({
      where: { id },
      data: { deletedAt: null }
    });
  } catch (error) {
    console.error('Error restoring journal entry:', error);
    throw new Error('Failed to restore journal entry.');
  }
}

export async function hardDeleteJournalEntry(id: string): Promise<void> {
  try {
    await prisma.journalEntry.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error hard deleting journal entry:', error);
    throw new Error('Failed to hard delete journal entry.');
  }
}

export async function getDeletedJournalEntries(userId: string) {
  try {
    return await prisma.journalEntry.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching deleted journal entries:', error);
    throw new Error('Failed to fetch deleted journal entries.');
  }
}
