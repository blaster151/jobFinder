import { useCallback, useEffect } from 'react';
import { useOptimisticDeletionStore } from '@/stores/optimisticDeletionStore';
import { useContactStore } from '@/stores/contactStore';
import { useToast } from '@/hooks/useToast';
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

interface UseOptimisticDeletionOptions {
  enableErrorRecovery?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  undoTimeout?: number;
}

interface UseOptimisticDeletionReturn {
  // Optimistic state
  optimisticDeletedItems: DeletedItem[];
  
  // Optimistic delete operations
  optimisticDeleteItem: (item: Omit<DeletedItem, 'deletedAt' | 'isOptimistic' | 'isCommitted'>) => Promise<void>;
  revertOptimisticDeletion: (itemId: string) => void;
  
  // Undo operations
  undoOptimisticDeletion: (itemId: string) => Promise<void>;
  
  // State queries
  hasOptimisticDeletions: boolean;
  hasPendingOperations: boolean;
  isItemOptimisticallyDeleted: (itemId: string) => boolean;
  
  // Utility operations
  clearAllItems: () => void;
}

export function useOptimisticDeletion(options: UseOptimisticDeletionOptions = {}): UseOptimisticDeletionReturn {
  const {
    enableErrorRecovery = true,
    showSuccessToast = true,
    showErrorToast = true,
    undoTimeout = 10000,
  } = options;

  const {
    optimisticDeletedItems,
    pendingOperations,
    optimisticDeleteItem: storeOptimisticDeleteItem,
    revertOptimisticDeletion: storeRevertOptimisticDeletion,
    undoOptimisticDeletion: storeUndoOptimisticDeletion,
    getOptimisticDeletedItems,
    clearAllItems: storeClearAllItems,
    hasOptimisticDeletions: storeHasOptimisticDeletions,
    hasPendingOperations: storeHasPendingOperations,
    isItemOptimisticallyDeleted: storeIsItemOptimisticallyDeleted,
  } = useOptimisticDeletionStore();

  const { deleteInteraction, addInteraction } = useContactStore();
  const { toast } = useToast();

  // Optimistic delete with error handling
  const optimisticDeleteItem = useCallback(async (item: Omit<DeletedItem, 'deletedAt' | 'isOptimistic' | 'isCommitted'>) => {
    try {
      // Immediately hide from UI by adding to optimistic state
      await storeOptimisticDeleteItem(item);

      // Also remove from contact store for immediate UI update
      await deleteInteraction(item.id);

      if (showSuccessToast) {
        toast({
          title: "Item deleted",
          description: `${item.type} "${item.contactName}" has been deleted.`,
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('Optimistic deletion failed:', error);

      if (enableErrorRecovery) {
        // Revert the optimistic deletion
        storeRevertOptimisticDeletion(item.id);

        // Restore to contact store
        await addInteraction({
          contactId: item.data.contactId,
          type: item.data.type,
          summary: item.data.summary,
          followUpRequired: item.data.followUpRequired,
          followUpDueDate: item.data.followUpDueDate,
          tags: item.data.tags || [],
          isDone: item.data.isDone,
        });

        if (showErrorToast) {
          toast({
            title: "Delete failed",
            description: `Failed to delete ${item.type}. The item has been restored.`,
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        if (showErrorToast) {
          toast({
            title: "Delete failed",
            description: `Failed to delete ${item.type}. Please try again.`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }

      throw error;
    }
  }, [
    storeOptimisticDeleteItem,
    storeRevertOptimisticDeletion,
    deleteInteraction,
    addInteraction,
    toast,
    enableErrorRecovery,
    showSuccessToast,
    showErrorToast,
  ]);

  // Revert optimistic deletion
  const revertOptimisticDeletion = useCallback((itemId: string) => {
    storeRevertOptimisticDeletion(itemId);
  }, [storeRevertOptimisticDeletion]);

  // Undo optimistic deletion
  const undoOptimisticDeletion = useCallback(async (itemId: string) => {
    try {
      // Restore from optimistic store
      await storeUndoOptimisticDeletion(itemId);

      // Also restore to contact store
      const deletedItem = getOptimisticDeletedItems().find(item => item.id === itemId);
      if (deletedItem) {
        await addInteraction({
          contactId: deletedItem.data.contactId,
          type: deletedItem.data.type,
          summary: deletedItem.data.summary,
          followUpRequired: deletedItem.data.followUpRequired,
          followUpDueDate: deletedItem.data.followUpDueDate,
          tags: deletedItem.data.tags || [],
          isDone: deletedItem.data.isDone,
        });
      }

      if (showSuccessToast) {
        toast({
          title: "Item restored",
          description: "The item has been restored successfully.",
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('Failed to undo optimistic deletion:', error);

      if (showErrorToast) {
        toast({
          title: "Restore failed",
          description: "Failed to restore the item. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      }

      throw error;
    }
  }, [
    storeUndoOptimisticDeletion,
    getOptimisticDeletedItems,
    addInteraction,
    toast,
    showSuccessToast,
    showErrorToast,
  ]);

  // Clear all items
  const clearAllItems = useCallback(() => {
    storeClearAllItems();
  }, [storeClearAllItems]);

  // Check if item is optimistically deleted
  const isItemOptimisticallyDeleted = useCallback((itemId: string) => {
    return storeIsItemOptimisticallyDeleted(itemId);
  }, [storeIsItemOptimisticallyDeleted]);

  return {
    optimisticDeletedItems,
    optimisticDeleteItem,
    revertOptimisticDeletion,
    undoOptimisticDeletion,
    hasOptimisticDeletions: storeHasOptimisticDeletions(),
    hasPendingOperations: storeHasPendingOperations(),
    isItemOptimisticallyDeleted,
    clearAllItems,
  };
} 