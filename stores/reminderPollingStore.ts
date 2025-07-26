import { create } from 'zustand';
import { useContactStore } from './contactStore';
import { pollingService } from '@/lib/services/pollingService';

interface ReminderPollingStore {
  // Polling state
  isPolling: boolean;
  lastChecked: Date | null;
  pollingInterval: number; // in milliseconds
  
  // Overdue tracking
  overdueReminders: string[]; // interaction IDs that are overdue
  recentlyOverdue: string[]; // reminders that became overdue since last check
  dueSoonReminders: string[]; // interaction IDs due within 24h
  dueTodayReminders: string[]; // interaction IDs due today
  
  // Actions
  startPolling: () => void;
  stopPolling: () => void;
  setPollingInterval: (interval: number) => void;
  checkReminders: () => void;
  markAsChecked: (interactionId: string) => void;
  clearRecentlyOverdue: () => void;
  
  // Debug info
  getDebugInfo: () => {
    isPolling: boolean;
    lastChecked: Date | null;
    overdueCount: number;
    recentlyOverdueCount: number;
    nextCheckIn: number;
  };
}

export const useReminderPollingStore = create<ReminderPollingStore>((set, get) => ({
  isPolling: false,
  lastChecked: null,
  pollingInterval: 5 * 60 * 1000, // 5 minutes default
  
  overdueReminders: [],
  recentlyOverdue: [],
  dueSoonReminders: [],
  dueTodayReminders: [],
  
  startPolling: () => {
    if (get().isPolling) return;
    
    set({ isPolling: true });
    
    // Use polling service
    pollingService.startPolling(get().pollingInterval, () => {
      get().checkReminders();
    });
  },
  
  stopPolling: () => {
    set({ isPolling: false });
    pollingService.stopPolling();
  },
  
  setPollingInterval: (interval: number) => {
    set({ pollingInterval: interval });
    pollingService.setInterval(interval);
  },
  
  checkReminders: () => {
    const { interactions } = useContactStore.getState();
    
    // Use polling service to check reminders
    const result = pollingService.checkReminders(interactions, get().overdueReminders);
    
    set({
      overdueReminders: result.currentOverdue,
      dueSoonReminders: result.dueSoon,
      dueTodayReminders: result.dueToday,
      recentlyOverdue: [...get().recentlyOverdue, ...result.newlyOverdue],
      lastChecked: pollingService.getLastChecked(),
    });
  },
  
  markAsChecked: (interactionId: string) => {
    set((state) => ({
      recentlyOverdue: state.recentlyOverdue.filter(id => id !== interactionId)
    }));
  },
  
  clearRecentlyOverdue: () => {
    set({ recentlyOverdue: [] });
  },
  
  getDebugInfo: () => {
    const state = get();
    const nextCheckIn = state.isPolling && state.lastChecked 
      ? state.pollingInterval - (Date.now() - state.lastChecked.getTime())
      : 0;
    
    return {
      isPolling: state.isPolling,
      lastChecked: state.lastChecked,
      overdueCount: state.overdueReminders.length,
      recentlyOverdueCount: state.recentlyOverdue.length,
      nextCheckIn: Math.max(0, nextCheckIn),
    };
  },
})); 