import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReminderFilters {
  dueDate: 'all' | 'today' | 'next3days' | 'thisWeek' | 'overdue';
  type: 'all' | 'follow-up' | 'check-in' | 'custom';
  status: 'all' | 'active' | 'done';
}

export interface ContactFilters {
  label: string;
  recentActivity: 'all' | '7days' | '30days' | '90days';
  role: string;
  company: string;
  location: string;
}

export interface InteractionFilters {
  type: 'all' | 'email' | 'phone' | 'text' | 'dm' | 'in_person';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  customDateFrom?: string;
  customDateTo?: string;
  contactId: string;
}

interface FilterStore {
  // Reminder filters
  reminderFilters: ReminderFilters;
  setReminderFilters: (filters: Partial<ReminderFilters>) => void;
  resetReminderFilters: () => void;
  
  // Contact filters
  contactFilters: ContactFilters;
  setContactFilters: (filters: Partial<ContactFilters>) => void;
  resetContactFilters: () => void;
  
  // Interaction filters
  interactionFilters: InteractionFilters;
  setInteractionFilters: (filters: Partial<InteractionFilters>) => void;
  resetInteractionFilters: () => void;
  
  // Global filter reset
  resetAllFilters: () => void;
}

const defaultReminderFilters: ReminderFilters = {
  dueDate: 'all',
  type: 'all',
  status: 'all',
};

const defaultContactFilters: ContactFilters = {
  label: '',
  recentActivity: 'all',
  role: '',
  company: '',
  location: '',
};

const defaultInteractionFilters: InteractionFilters = {
  type: 'all',
  dateRange: 'all',
  contactId: '',
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      reminderFilters: defaultReminderFilters,
      contactFilters: defaultContactFilters,
      interactionFilters: defaultInteractionFilters,
      
      setReminderFilters: (filters) => set((state) => ({
        reminderFilters: { ...state.reminderFilters, ...filters }
      })),
      
      resetReminderFilters: () => set({ reminderFilters: defaultReminderFilters }),
      
      setContactFilters: (filters) => set((state) => ({
        contactFilters: { ...state.contactFilters, ...filters }
      })),
      
      resetContactFilters: () => set({ contactFilters: defaultContactFilters }),
      
      setInteractionFilters: (filters) => set((state) => ({
        interactionFilters: { ...state.interactionFilters, ...filters }
      })),
      
      resetInteractionFilters: () => set({ interactionFilters: defaultInteractionFilters }),
      
      resetAllFilters: () => set({
        reminderFilters: defaultReminderFilters,
        contactFilters: defaultContactFilters,
        interactionFilters: defaultInteractionFilters,
      }),
    }),
    {
      name: 'jobfinder-filters',
      partialize: (state) => ({
        reminderFilters: state.reminderFilters,
        contactFilters: state.contactFilters,
        interactionFilters: state.interactionFilters,
      }),
    }
  )
); 