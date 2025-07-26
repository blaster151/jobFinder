import { create } from 'zustand';
import { Interaction } from '@/lib/schemas';

interface DeletedItem {
  id: string;
  type: 'interaction' | 'reminder';
  data: Interaction;
  deletedAt: Date;
  contactName: string;
}

interface DeletedItemsStore {
  deletedItems: DeletedItem[];
  addDeletedItem: (item: Omit<DeletedItem, 'deletedAt'>) => void;
  removeDeletedItem: (id: string) => void;
  getDeletedItem: (id: string) => DeletedItem | undefined;
  clearExpiredItems: () => void;
  clearAllItems: () => void;
}

const UNDO_TIMEOUT_MS = 10000; // 10 seconds

export const useDeletedItemsStore = create<DeletedItemsStore>((set, get) => ({
  deletedItems: [],

  addDeletedItem: (item) => {
    const deletedItem: DeletedItem = {
      ...item,
      deletedAt: new Date(),
    };

    set((state) => ({
      deletedItems: [...state.deletedItems, deletedItem],
    }));

    // Auto-clear after timeout
    setTimeout(() => {
      get().removeDeletedItem(item.id);
    }, UNDO_TIMEOUT_MS);
  },

  removeDeletedItem: (id) => {
    set((state) => ({
      deletedItems: state.deletedItems.filter((item) => item.id !== id),
    }));
  },

  getDeletedItem: (id) => {
    return get().deletedItems.find((item) => item.id === id);
  },

  clearExpiredItems: () => {
    const now = new Date();
    set((state) => ({
      deletedItems: state.deletedItems.filter(
        (item) => now.getTime() - item.deletedAt.getTime() < UNDO_TIMEOUT_MS
      ),
    }));
  },

  clearAllItems: () => {
    set({ deletedItems: [] });
  },
})); 