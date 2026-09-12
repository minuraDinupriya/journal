export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // ISO string
  content: string;
  mood: number; // 1-5 number
  createdAt: string; // ISO string
}

export type JournalFormData = Omit<JournalEntry, 'id' | 'userId' | 'createdAt'>;
