import { create } from 'zustand';

interface UiStoreState {
  sidebarOpen: boolean;
  activeTab: string;
  theme: 'light' | 'dark' | 'system';
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  sidebarOpen: true,
  activeTab: 'dashboard',
  theme: 'dark',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTheme: (theme) => set({ theme }),
}));
