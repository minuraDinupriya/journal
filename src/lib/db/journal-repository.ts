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
    const where: any = { userId };
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    return await prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    throw new Error('Failed to fetch journal entries.');
  }
}

export async function getJournalEntryById(id: string) {
  try {
    return await prisma.journalEntry.findUnique({
      where: { id }
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
    await prisma.journalEntry.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw new Error('Failed to delete journal entry.');
  }
}
