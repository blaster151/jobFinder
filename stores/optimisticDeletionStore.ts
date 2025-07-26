import { create } from 'zustand';
import { Interaction } from '@/lib/schemas';

interface DeletedItem {
  id: string;
  type: 'interaction' | 'reminder';
  data: Interaction;
  deletedAt: Date;
  contactName: string;
  isOptimistic: boolean;
  isCommitted: boolean;
}

interface OptimisticDeletionStore {
  // Optimistic state - items immediately hidden from UI
  optimisticDeletedItems: DeletedItem[];
  
  // Pending operations - items being processed
  pendingOperations: Map<string, Promise<void>>;
  
  // Optimistic delete operations
  optimisticDeleteItem: (item: Omit<DeletedItem, 'deletedAt' | 'isOptimistic' | 'isCommitted'>) => Promise<void>;
  commitOptimisticDeletion: (itemId: string) => Promise<void>;
  revertOptimisticDeletion: (itemId: string) => void;
  
  // Undo operations
  undoOptimisticDeletion: (itemId: string) => Promise<void>;
  
  // Utility operations
  getOptimisticDeletedItems: () => DeletedItem[];
  clearExpiredItems: () => void;
  clearAllItems: () => void;
  
  // State queries
  hasOptimisticDeletions: () => boolean;
  hasPendingOperations: () => boolean;
  isItemOptimisticallyDeleted: (itemId: string) => boolean;
}

const UNDO_TIMEOUT_MS = 10000; // 10 seconds

export const useOptimisticDeletionStore = create<OptimisticDeletionStore>((set, get) => ({
  optimisticDeletedItems: [],
  pendingOperations: new Map(),

  // Optimistic delete - immediately hide from UI
  optimisticDeleteItem: async (item) => {
    const deletedItem: DeletedItem = {
      ...item,
      deletedAt: new Date(),
      isOptimistic: true,
      isCommitted: false,
    };

    // Immediately add to optimistic state (hides from UI)
    set((state) => ({
      optimisticDeletedItems: [...state.optimisticDeletedItems, deletedItem],
    }));

    // Start backend operation
    const deletePromise = get().commitOptimisticDeletion(item.id);
    
    // Track pending operation
    set((state) => ({
      pendingOperations: new Map(state.pendingOperations).set(item.id, deletePromise),
    }));

    try {
      await deletePromise;
      
      // Mark as committed on success
      set((state) => ({
        optimisticDeletedItems: state.optimisticDeletedItems.map(item =>
          item.id === deletedItem.id ? { ...item, isCommitted: true } : item
        ),
      }));

      // Auto-clear after undo timeout
      setTimeout(() => {
        get().clearExpiredItems();
      }, UNDO_TIMEOUT_MS);

    } catch (error) {
      // Revert on error
      get().revertOptimisticDeletion(item.id);
      throw error;
    } finally {
      // Remove from pending operations
      set((state) => {
        const newPending = new Map(state.pendingOperations);
        newPending.delete(item.id);
        return { pendingOperations: newPending };
      });
    }
  },

  // Commit optimistic deletion to backend
  commitOptimisticDeletion: async (itemId) => {
    const state = get();
    const optimisticItem = state.optimisticDeletedItems.find(item => item.id === itemId);
    
    if (!optimisticItem) {
      throw new Error('Item not found in optimistic state');
    }

    try {
      // Call backend API
      const response = await fetch(`/api/interactions/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to commit optimistic deletion:', error);
      throw error;
    }
  },

  // Revert optimistic deletion - restore item to UI
  revertOptimisticDeletion: (itemId) => {
    set((state) => ({
      optimisticDeletedItems: state.optimisticDeletedItems.filter(item => item.id !== itemId),
    }));
  },

  // Undo optimistic deletion - restore from backend
  undoOptimisticDeletion: async (itemId) => {
    const state = get();
    const deletedItem = state.optimisticDeletedItems.find(item => item.id === itemId);
    
    if (!deletedItem) {
      throw new Error('Item not found in optimistic state');
    }

    try {
      // Restore the item to the backend
      const response = await fetch('/api/interactions', {
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

      if (!response.ok) {
        throw new Error(`Failed to restore item: ${response.statusText}`);
      }

      // Remove from optimistic state
      set((state) => ({
        optimisticDeletedItems: state.optimisticDeletedItems.filter(item => item.id !== itemId),
      }));

      return await response.json();
    } catch (error) {
      console.error('Failed to undo optimistic deletion:', error);
      throw error;
    }
  },

  // Get all optimistically deleted items
  getOptimisticDeletedItems: () => {
    return get().optimisticDeletedItems;
  },

  // Clear expired items
  clearExpiredItems: () => {
    const now = new Date();
    set((state) => ({
      optimisticDeletedItems: state.optimisticDeletedItems.filter(
        (item) => now.getTime() - item.deletedAt.getTime() < UNDO_TIMEOUT_MS
      ),
    }));
  },

  // Clear all items
  clearAllItems: () => {
    set({
      optimisticDeletedItems: [],
      pendingOperations: new Map(),
    });
  },

  // Check if there are any optimistic deletions
  hasOptimisticDeletions: () => {
    return get().optimisticDeletedItems.length > 0;
  },

  // Check if there are any pending operations
  hasPendingOperations: () => {
    return get().pendingOperations.size > 0;
  },

  // Check if a specific item is optimistically deleted
  isItemOptimisticallyDeleted: (itemId: string) => {
    return get().optimisticDeletedItems.some(item => item.id === itemId);
  },
})); 