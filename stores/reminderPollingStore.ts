import { create } from 'zustand';
import { useContactStore } from './contactStore';
import { getReminderStatus, getRemindersByStatus, clearStatusCache } from '@/lib/reminderUtils';

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
    
    // Initial check
    get().checkReminders();
    
    // Set up interval
    const intervalId = setInterval(() => {
      get().checkReminders();
    }, get().pollingInterval);
    
    // Store interval ID for cleanup
    (window as any).__reminderPollingInterval = intervalId;
  },
  
  stopPolling: () => {
    set({ isPolling: false });
    
    // Clear interval
    if ((window as any).__reminderPollingInterval) {
      clearInterval((window as any).__reminderPollingInterval);
      (window as any).__reminderPollingInterval = null;
    }
  },
  
  setPollingInterval: (interval: number) => {
    set({ pollingInterval: interval });
    
    // Restart polling with new interval if currently polling
    if (get().isPolling) {
      get().stopPolling();
      get().startPolling();
    }
  },
  
  checkReminders: () => {
    const { interactions } = useContactStore.getState();
    const now = new Date();
    
    // Use the new categorization utility
    const categorized = getRemindersByStatus(interactions);
    
    const currentOverdue = categorized.overdue.map(i => i.id!);
    const currentDueSoon = categorized.dueSoon.map(i => i.id!);
    const currentDueToday = categorized.dueToday.map(i => i.id!);
    
    // Find newly overdue reminders
    const newlyOverdue = currentOverdue.filter(id => 
      !get().overdueReminders.includes(id)
    );
    
    set({
      overdueReminders: currentOverdue,
      dueSoonReminders: currentDueSoon,
      dueTodayReminders: currentDueToday,
      recentlyOverdue: [...get().recentlyOverdue, ...newlyOverdue],
      lastChecked: now,
    });
    
    // Log if there are newly overdue reminders
    if (newlyOverdue.length > 0) {
      console.log(`🔔 ${newlyOverdue.length} reminder(s) became overdue:`, newlyOverdue);
    }
    
    // Clear cache periodically to prevent memory leaks
    if (Math.random() < 0.1) { // 10% chance to clear cache
      clearStatusCache();
    }
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