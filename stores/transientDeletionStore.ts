import { create } from 'zustand';
import { Interaction } from '@/lib/schemas';

interface DeletedItem {
  id: string;
  type: 'interaction' | 'reminder';
  data: Interaction;
  deletedAt: Date;
  contactName: string;
  isSoftDeleted: boolean;
  originalIndex?: number; // For maintaining order in lists
}

interface TransientDeletionStore {
  // Local state (useRef equivalent)
  localDeletedItems: DeletedItem[];
  
  // Global state (Zustand slice)
  globalDeletedItems: DeletedItem[];
  
  // Soft delete operations
  softDeleteItem: (item: Omit<DeletedItem, 'deletedAt' | 'isSoftDeleted'>) => void;
  commitSoftDeletion: (itemId: string) => Promise<void>;
  revertSoftDeletion: (itemId: string) => void;
  
  // Hard delete operations
  hardDeleteItem: (itemId: string) => Promise<void>;
  
  // Undo operations
  undoLocalDeletion: (itemId: string) => void;
  undoGlobalDeletion: (itemId: string) => Promise<void>;
  
  // Utility operations
  getSoftDeletedItems: () => DeletedItem[];
  getHardDeletedItems: () => DeletedItem[];
  clearExpiredItems: () => void;
  clearAllItems: () => void;
  
  // State queries
  hasSoftDeletedItems: () => boolean;
  hasPendingDeletions: () => boolean;
}

const UNDO_TIMEOUT_MS = 10000; // 10 seconds
const SOFT_DELETE_TIMEOUT_MS = 30000; // 30 seconds for soft deletes

export const useTransientDeletionStore = create<TransientDeletionStore>((set, get) => ({
  localDeletedItems: [],
  globalDeletedItems: [],

  // Soft delete - item is marked as deleted but not removed from UI yet
  softDeleteItem: (item) => {
    const deletedItem: DeletedItem = {
      ...item,
      deletedAt: new Date(),
      isSoftDeleted: true,
    };

    set((state) => ({
      localDeletedItems: [...state.localDeletedItems, deletedItem],
    }));

    // Auto-commit soft deletion after timeout
    setTimeout(() => {
      get().commitSoftDeletion(item.id);
    }, SOFT_DELETE_TIMEOUT_MS);
  },

  // Commit soft deletion to backend and move to global state
  commitSoftDeletion: async (itemId) => {
    const state = get();
    const softDeletedItem = state.localDeletedItems.find(item => item.id === itemId && item.isSoftDeleted);
    
    if (!softDeletedItem) return;

    try {
      // Here you would call the backend API to actually delete the item
      // For now, we'll simulate the API call
      await fetch(`/api/interactions/${itemId}`, {
        method: 'DELETE',
      });

      // Move from local to global state
      set((state) => ({
        localDeletedItems: state.localDeletedItems.filter(item => item.id !== itemId),
        globalDeletedItems: [...state.globalDeletedItems, { ...softDeletedItem, isSoftDeleted: false }],
      }));

      // Auto-clear from global state after undo timeout
      setTimeout(() => {
        get().clearExpiredItems();
      }, UNDO_TIMEOUT_MS);

    } catch (error) {
      console.error('Failed to commit soft deletion:', error);
      // Revert the soft deletion on error
      get().revertSoftDeletion(itemId);
    }
  },

  // Revert soft deletion - restore item to original state
  revertSoftDeletion: (itemId) => {
    set((state) => ({
      localDeletedItems: state.localDeletedItems.filter(item => item.id !== itemId),
    }));
  },

  // Hard delete - immediate deletion without soft delete phase
  hardDeleteItem: async (itemId) => {
    const state = get();
    const item = state.localDeletedItems.find(item => item.id === itemId) ||
                 state.globalDeletedItems.find(item => item.id === itemId);
    
    if (!item) return;

    try {
      // Call backend API
      await fetch(`/api/interactions/${itemId}`, {
        method: 'DELETE',
      });

      // Remove from both local and global state
      set((state) => ({
        localDeletedItems: state.localDeletedItems.filter(item => item.id !== itemId),
        globalDeletedItems: state.globalDeletedItems.filter(item => item.id !== itemId),
      }));

    } catch (error) {
      console.error('Failed to hard delete item:', error);
      throw error;
    }
  },

  // Undo local deletion (soft delete)
  undoLocalDeletion: (itemId) => {
    get().revertSoftDeletion(itemId);
  },

  // Undo global deletion (hard delete)
  undoGlobalDeletion: async (itemId) => {
    const state = get();
    const deletedItem = state.globalDeletedItems.find(item => item.id === itemId);
    
    if (!deletedItem) return;

    try {
      // Restore the item to the backend
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: deletedItem.data.contactId,
          type: deletedItem.data.type,
          summary: deletedItem.data.summary,
          followUpRequired: deletedItem.data.followUpRequired,
          followUpDueDate: deletedItem.data.followUpDueDate,
          tags: deletedItem.data.tags || [],
          isDone: deletedItem.data.isDone,
        }),
      });

      // Remove from global state
      set((state) => ({
        globalDeletedItems: state.globalDeletedItems.filter(item => item.id !== itemId),
      }));

    } catch (error) {
      console.error('Failed to undo global deletion:', error);
      throw error;
    }
  },

  // Get items that are soft deleted (still in local state)
  getSoftDeletedItems: () => {
    return get().localDeletedItems.filter(item => item.isSoftDeleted);
  },

  // Get items that are hard deleted (in global state)
  getHardDeletedItems: () => {
    return get().globalDeletedItems.filter(item => !item.isSoftDeleted);
  },

  // Clear expired items from global state
  clearExpiredItems: () => {
    const now = new Date();
    set((state) => ({
      globalDeletedItems: state.globalDeletedItems.filter(
        (item) => now.getTime() - item.deletedAt.getTime() < UNDO_TIMEOUT_MS
      ),
    }));
  },

  // Clear all items from both local and global state
  clearAllItems: () => {
    set({
      localDeletedItems: [],
      globalDeletedItems: [],
    });
  },

  // Check if there are any soft deleted items
  hasSoftDeletedItems: () => {
    return get().localDeletedItems.some(item => item.isSoftDeleted);
  },

  // Check if there are any pending deletions (soft or hard)
  hasPendingDeletions: () => {
    const state = get();
    return state.localDeletedItems.length > 0 || state.globalDeletedItems.length > 0;
  },
})); 