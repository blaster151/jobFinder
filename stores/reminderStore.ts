import { create } from 'zustand';
import { Interaction } from './contactStore';

type ReminderStore = {
  reminders: Interaction[];
  updateReminderDate: (id: string, newDate: Date) => Promise<void>;
  markReminderDone: (id: string) => Promise<void>;
  fetchReminders: () => Promise<void>;
  getOverdueReminders: () => Interaction[];
  getUpcomingReminders: (days: number) => Interaction[];
};

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],

  fetchReminders: async () => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const res = await fetch('/api/reminders');
      // const data = await res.json();
      // set({ reminders: data });
      
      // For now, use the interactions from contactStore
      console.log('Fetching reminders...');
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  },

  updateReminderDate: async (id, newDate) => {
    try {
      // TODO: Add API call when backend is ready
      // await fetch(`/api/interactions/${id}/snooze`, {
      //   method: 'POST',
      //   body: JSON.stringify({ newDate }),
      //   headers: { 'Content-Type': 'application/json' },
      // });

      // Optimistic UI update
      set({
        reminders: get().reminders.map(r =>
          r.id === id ? { ...r, followUpDueDate: newDate.toISOString() } : r
        )
      });
    } catch (error) {
      console.error('Error updating reminder date:', error);
      throw error;
    }
  },

  markReminderDone: async (id) => {
    try {
      // TODO: Add API call when backend is ready
      // await fetch(`/api/interactions/${id}/done`, { method: 'POST' });
      
      // Optimistic UI update - remove from reminders list
      set({
        reminders: get().reminders.filter(r => r.id !== id)
      });
    } catch (error) {
      console.error('Error marking reminder done:', error);
      throw error;
    }
  },

  getOverdueReminders: () => {
    const now = new Date();
    return get().reminders.filter(r => 
      r.followUpRequired && 
      r.followUpDueDate && 
      new Date(r.followUpDueDate) < now
    );
  },

  getUpcomingReminders: (days: number = 7) => {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + days);
    
    return get().reminders.filter(r => 
      r.followUpRequired && 
      r.followUpDueDate && 
      new Date(r.followUpDueDate) >= now &&
      new Date(r.followUpDueDate) <= future
    );
  },
})); 