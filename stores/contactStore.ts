// stores/contactStore.ts
import { create } from 'zustand';
import { Contact, Interaction, ContactCreate, InteractionCreate } from '@/lib/schemas';

interface ContactStore {
  contacts: Contact[];
  interactions: Interaction[];
  isLoading: boolean;
  
  // Setters for state management
  setContacts: (contacts: Contact[]) => void;
  setInteractions: (interactions: Interaction[]) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Legacy methods (to be replaced by service layer)
  addContact: (contact: ContactCreate) => Promise<void>;
  addInteraction: (interaction: InteractionCreate) => Promise<void>;
  updateInteraction: (id: string, updates: Partial<Interaction>) => Promise<void>;
  deleteInteraction: (id: string) => Promise<void>;
  flagContact: (id: string, flagged: boolean) => Promise<void>;
  markReminderDone: (interactionId: string) => Promise<void>;
  snoozeReminder: (interactionId: string, newDate: Date) => Promise<void>;
  fetchContacts: () => Promise<void>;
  fetchInteractions: () => Promise<void>;
  getDueFollowUps: () => Interaction[];
  getOverdueCount: () => number;
}

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  interactions: [],
  isLoading: false,
  
  // Setters
  setContacts: (contacts) => set({ contacts }),
  setInteractions: (interactions) => set({ interactions }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  addContact: async (contact) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      const newContact = await response.json();
      set((state) => ({ contacts: [newContact, ...state.contacts] }));
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  },
  addInteraction: async (interaction) => {
    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interaction),
      });
      const newInteraction = await response.json();
      set((state) => ({ interactions: [newInteraction, ...state.interactions] }));
    } catch (error) {
      console.error('Error adding interaction:', error);
    }
  },
      updateInteraction: async (id, updates) => {
      try {
        const response = await fetch(`/api/interactions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        const updatedInteraction = await response.json();
        set((state) => ({
          interactions: state.interactions.map((i) => 
            i.id === id ? updatedInteraction : i
          ),
        }));
      } catch (error) {
        console.error('Error updating interaction:', error);
      }
    },
    deleteInteraction: async (id) => {
      try {
        await fetch(`/api/interactions/${id}`, {
          method: 'DELETE',
        });
        set((state) => ({
          interactions: state.interactions.filter((i) => i.id !== id),
        }));
      } catch (error) {
        console.error('Error deleting interaction:', error);
        throw error;
      }
    },
  flagContact: async (id, flagged) => {
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged }),
      });
      set((state) => ({
        contacts: state.contacts.map((c) => c.id === id ? { ...c, flagged } : c),
      }));
    } catch (error) {
      console.error('Error flagging contact:', error);
    }
  },
  markReminderDone: async (interactionId) => {
    try {
      await fetch(`/api/interactions/${interactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: true }),
      });
      set((state) => ({
        interactions: state.interactions.map((i) => 
          i.id === interactionId 
            ? { ...i, isDone: true }
            : i
        ),
      }));

      // Mark as checked in polling store
      const { useReminderPollingStore } = await import('./reminderPollingStore');
      useReminderPollingStore.getState().markAsChecked(interactionId);
    } catch (error) {
      console.error('Error marking reminder done:', error);
    }
  },
  snoozeReminder: async (interactionId, newDate) => {
    try {
      await fetch(`/api/interactions/${interactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDueDate: newDate.toISOString() }),
      });
      set((state) => ({
        interactions: state.interactions.map((i) => 
          i.id === interactionId 
            ? { ...i, followUpDueDate: newDate.toISOString() }
            : i
        ),
      }));
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  },
  fetchContacts: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/contacts');
      const contacts = await response.json();
      set({ contacts, isLoading: false });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      set({ isLoading: false });
    }
  },
  fetchInteractions: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/interactions');
      const interactions = await response.json();
      set({ interactions, isLoading: false });
    } catch (error) {
      console.error('Error fetching interactions:', error);
      set({ isLoading: false });
    }
  },
  getDueFollowUps: () => {
    const today = new Date();
    return get().interactions.filter((i) =>
      i.followUpRequired &&
      i.followUpDueDate &&
      !i.isDone &&
      new Date(i.followUpDueDate) <= today
    );
  },
  getOverdueCount: () => {
    const today = new Date();
    return get().interactions.filter((i) =>
      i.followUpRequired &&
      i.followUpDueDate &&
      !i.isDone &&
      new Date(i.followUpDueDate) <= today
    ).length;
  },
})); 