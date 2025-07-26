import { create } from 'zustand';
import Fuse from 'fuse.js';
import { useContactStore } from './contactStore';
import { Contact, Interaction } from '@/lib/schemas';

export interface SearchResult {
  id: string;
  type: 'contact' | 'interaction' | 'reminder';
  title: string;
  subtitle: string;
  description: string;
  url: string;
  contactId?: string;
  interactionId?: string;
  dueDate?: string;
  isOverdue?: boolean;
}

interface SearchStore {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isOpen: boolean;
  setQuery: (query: string) => void;
  setOpen: (open: boolean) => void;
  search: (query: string) => void;
  clearSearch: () => void;
}

// Fuse.js configuration for fuzzy search
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'subtitle', weight: 0.5 },
    { name: 'description', weight: 0.3 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  results: [],
  isSearching: false,
  isOpen: false,
  
  setQuery: (query: string) => {
    set({ query });
    if (query.trim()) {
      get().search(query);
    } else {
      set({ results: [] });
    }
  },
  
  setOpen: (open: boolean) => set({ isOpen: open }),
  
  search: (query: string) => {
    set({ isSearching: true });
    
    // Get current data from contact store
    const contacts = useContactStore.getState().contacts;
    const interactions = useContactStore.getState().interactions;
    
    // Build search index
    const searchIndex: SearchResult[] = [];
    
    // Add contacts to search index
    contacts.forEach(contact => {
      searchIndex.push({
        id: contact.id!,
        type: 'contact',
        title: contact.name,
        subtitle: contact.company || contact.role || 'No company',
        description: contact.notes || contact.email || '',
        url: `/contacts/${contact.id}`,
        contactId: contact.id,
      });
    });
    
    // Add interactions to search index
    interactions.forEach(interaction => {
      const contact = contacts.find(c => c.id === interaction.contactId);
      const contactName = contact?.name || 'Unknown Contact';
      
      searchIndex.push({
        id: interaction.id!,
        type: 'interaction',
        title: `${interaction.type} with ${contactName}`,
        subtitle: contact?.company || '',
        description: interaction.summary,
        url: `/contacts/${interaction.contactId}`,
        contactId: interaction.contactId,
        interactionId: interaction.id,
      });
    });
    
    // Add reminders (interactions with follow-ups) to search index
    interactions
      .filter(i => i.followUpRequired && i.followUpDueDate)
      .forEach(interaction => {
        const contact = contacts.find(c => c.id === interaction.contactId);
        const contactName = contact?.name || 'Unknown Contact';
        const dueDate = new Date(interaction.followUpDueDate!);
        const isOverdue = dueDate < new Date();
        
        searchIndex.push({
          id: `reminder-${interaction.id}`,
          type: 'reminder',
          title: `Follow-up: ${contactName}`,
          subtitle: interaction.type,
          description: interaction.summary,
          url: '/reminders',
          contactId: interaction.contactId,
          interactionId: interaction.id,
          dueDate: interaction.followUpDueDate!,
          isOverdue,
        });
      });
    
    // Perform fuzzy search
    const fuse = new Fuse(searchIndex, fuseOptions);
    const searchResults = fuse.search(query);
    
    // Sort results by relevance and type
    const sortedResults = searchResults
      .map(result => result.item)
      .sort((a, b) => {
        // Prioritize contacts, then reminders, then interactions
        const typeOrder = { contact: 0, reminder: 1, interaction: 2 };
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        
        if (typeDiff !== 0) return typeDiff;
        
        // For reminders, prioritize overdue ones
        if (a.type === 'reminder' && b.type === 'reminder') {
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
        }
        
        return 0;
      });
    
    set({ results: sortedResults, isSearching: false });
  },
  
  clearSearch: () => set({ query: '', results: [], isSearching: false }),
})); 