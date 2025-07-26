import { useEffect } from 'react';
import { useOptimisticDeletionStore } from '@/stores/optimisticDeletionStore';
import { useOptimisticDeletion } from '@/hooks/useOptimisticDeletion';
import { OptimisticUndoToast } from './OptimisticUndoToast';

export function OptimisticToastManager() {
  const { optimisticDeletedItems, pendingOperations } = useOptimisticDeletionStore();
  const { undoOptimisticDeletion, revertOptimisticDeletion } = useOptimisticDeletion();

  const handleUndo = async (itemId: string) => {
    try {
      await undoOptimisticDeletion(itemId);
    } catch (error) {
      console.error('Failed to undo optimistic deletion:', error);
    }
  };

  const handleDismiss = (itemId: string) => {
    // Remove from optimistic state
    revertOptimisticDeletion(itemId);
  };

  // Clean up expired items on mount
  useEffect(() => {
    const interval = setInterval(() => {
      // This will be handled by the store's auto-clear
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (optimisticDeletedItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {optimisticDeletedItems.map((item) => {
        const isPending = pendingOperations.has(item.id);
        
        return (
          <OptimisticUndoToast
            key={item.id}
            itemId={item.id}
            itemType={item.type}
            itemName={`${item.type} with ${item.contactName}`}
            onUndo={() => handleUndo(item.id)}
            onDismiss={() => handleDismiss(item.id)}
            isCommitted={item.isCommitted}
            isPending={isPending}
          />
        );
      })}
    </div>
  );
} 