import { useRef, useCallback, useEffect } from 'react';
import { useTransientDeletionStore } from '@/stores/transientDeletionStore';
import { Interaction } from '@/lib/schemas';

interface DeletedItem {
  id: string;
  type: 'interaction' | 'reminder';
  data: Interaction;
  deletedAt: Date;
  contactName: string;
  isSoftDeleted: boolean;
  originalIndex?: number;
}

interface UseTransientDeletionOptions {
  enableSoftDelete?: boolean;
  softDeleteTimeout?: number;
  undoTimeout?: number;
  autoCommit?: boolean;
}

interface UseTransientDeletionReturn {
  // Local state (useRef equivalent)
  localDeletedItems: DeletedItem[];
  
  // Soft delete operations
  softDeleteItem: (item: Omit<DeletedItem, 'deletedAt' | 'isSoftDeleted'>) => void;
  commitSoftDeletion: (itemId: string) => Promise<void>;
  revertSoftDeletion: (itemId: string) => void;
  
  // Hard delete operations
  hardDeleteItem: (itemId: string) => Promise<void>;
  
  // Undo operations
  undoLocalDeletion: (itemId: string) => void;
  undoGlobalDeletion: (itemId: string) => Promise<void>;
  
  // State queries
  hasSoftDeletedItems: boolean;
  hasPendingDeletions: boolean;
  getSoftDeletedItems: () => DeletedItem[];
  getHardDeletedItems: () => DeletedItem[];
  
  // Utility operations
  clearAllItems: () => void;
}

export function useTransientDeletion(options: UseTransientDeletionOptions = {}): UseTransientDeletionReturn {
  const {
    enableSoftDelete = true,
    softDeleteTimeout = 30000,
    undoTimeout = 10000,
    autoCommit = true,
  } = options;

  // Local ref for immediate state access (useRef equivalent)
  const localDeletedItemsRef = useRef<DeletedItem[]>([]);
  
  // Global store for persistence and cross-component access
  const {
    localDeletedItems,
    globalDeletedItems,
    softDeleteItem: storeSoftDeleteItem,
    commitSoftDeletion: storeCommitSoftDeletion,
    revertSoftDeletion: storeRevertSoftDeletion,
    hardDeleteItem: storeHardDeleteItem,
    undoLocalDeletion: storeUndoLocalDeletion,
    undoGlobalDeletion: storeUndoGlobalDeletion,
    getSoftDeletedItems: storeGetSoftDeletedItems,
    getHardDeletedItems: storeGetHardDeletedItems,
    clearAllItems: storeClearAllItems,
    hasSoftDeletedItems: storeHasSoftDeletedItems,
    hasPendingDeletions: storeHasPendingDeletions,
  } = useTransientDeletionStore();

  // Sync local ref with store state
  useEffect(() => {
    localDeletedItemsRef.current = localDeletedItems;
  }, [localDeletedItems]);

  // Soft delete with local ref for immediate access
  const softDeleteItem = useCallback((item: Omit<DeletedItem, 'deletedAt' | 'isSoftDeleted'>) => {
    const deletedItem: DeletedItem = {
      ...item,
      deletedAt: new Date(),
      isSoftDeleted: true,
    };

    // Update local ref immediately
    localDeletedItemsRef.current = [...localDeletedItemsRef.current, deletedItem];

    // Update store
    storeSoftDeleteItem(item);

    // Auto-commit if enabled
    if (autoCommit) {
      setTimeout(() => {
        commitSoftDeletion(item.id);
      }, softDeleteTimeout);
    }
  }, [storeSoftDeleteItem, autoCommit, softDeleteTimeout]);

  // Commit soft deletion
  const commitSoftDeletion = useCallback(async (itemId: string) => {
    try {
      await storeCommitSoftDeletion(itemId);
      
      // Update local ref
      localDeletedItemsRef.current = localDeletedItemsRef.current.filter(
        item => item.id !== itemId
      );
    } catch (error) {
      console.error('Failed to commit soft deletion:', error);
      // Revert on error
      revertSoftDeletion(itemId);
    }
  }, [storeCommitSoftDeletion]);

  // Revert soft deletion
  const revertSoftDeletion = useCallback((itemId: string) => {
    // Update local ref
    localDeletedItemsRef.current = localDeletedItemsRef.current.filter(
      item => item.id !== itemId
    );
    
    // Update store
    storeRevertSoftDeletion(itemId);
  }, [storeRevertSoftDeletion]);

  // Hard delete
  const hardDeleteItem = useCallback(async (itemId: string) => {
    try {
      await storeHardDeleteItem(itemId);
      
      // Update local ref
      localDeletedItemsRef.current = localDeletedItemsRef.current.filter(
        item => item.id !== itemId
      );
    } catch (error) {
      console.error('Failed to hard delete item:', error);
      throw error;
    }
  }, [storeHardDeleteItem]);

  // Undo local deletion
  const undoLocalDeletion = useCallback((itemId: string) => {
    revertSoftDeletion(itemId);
  }, [revertSoftDeletion]);

  // Undo global deletion
  const undoGlobalDeletion = useCallback(async (itemId: string) => {
    try {
      await storeUndoGlobalDeletion(itemId);
    } catch (error) {
      console.error('Failed to undo global deletion:', error);
      throw error;
    }
  }, [storeUndoGlobalDeletion]);

  // Get soft deleted items
  const getSoftDeletedItems = useCallback(() => {
    return storeGetSoftDeletedItems();
  }, [storeGetSoftDeletedItems]);

  // Get hard deleted items
  const getHardDeletedItems = useCallback(() => {
    return storeGetHardDeletedItems();
  }, [storeGetHardDeletedItems]);

  // Clear all items
  const clearAllItems = useCallback(() => {
    localDeletedItemsRef.current = [];
    storeClearAllItems();
  }, [storeClearAllItems]);

  return {
    localDeletedItems,
    softDeleteItem,
    commitSoftDeletion,
    revertSoftDeletion,
    hardDeleteItem,
    undoLocalDeletion,
    undoGlobalDeletion,
    hasSoftDeletedItems: storeHasSoftDeletedItems(),
    hasPendingDeletions: storeHasPendingDeletions(),
    getSoftDeletedItems,
    getHardDeletedItems,
    clearAllItems,
  };
} 