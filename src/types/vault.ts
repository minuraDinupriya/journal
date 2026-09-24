export type VaultItemType = 'STRATEGY' | 'KNOWLEDGE';

export interface VaultItem {
  id: string;
  userId: string;
  type: VaultItemType;
  title: string;
  content: string;
  images: string | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultFormData {
  type: VaultItemType;
  title: string;
  content: string;
  images: string[];
  order?: number;
}
