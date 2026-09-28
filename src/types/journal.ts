export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // ISO string
  content: string;
  mood: number; // 1-5 number
  images?: string | null; // JSON string of image URLs
  createdAt: string; // ISO string
}

export type JournalFormData = Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'images'> & {
  images?: string[];
};

