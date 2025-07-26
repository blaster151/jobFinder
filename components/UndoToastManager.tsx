import { useEffect } from 'react';
import { useDeletedItemsStore } from '@/stores/deletedItemsStore';
import { useContactStore } from '@/stores/contactStore';
import { UndoToast } from './UndoToast';

export function UndoToastManager() {
  const { deletedItems, removeDeletedItem } = useDeletedItemsStore();
  const { addInteraction } = useContactStore();

  const handleUndo = async (itemId: string) => {
    const deletedItem = deletedItems.find(item => item.id === itemId);
    if (!deletedItem) return;

    try {
      // Restore the interaction to the store
      await addInteraction({
        contactId: deletedItem.data.contactId,
        type: deletedItem.data.type,
        summary: deletedItem.data.summary,
        followUpRequired: deletedItem.data.followUpRequired,
        followUpDueDate: deletedItem.data.followUpDueDate,
        tags: deletedItem.data.tags || [],
        isDone: deletedItem.data.isDone,
      });

      // Remove from deleted items
      removeDeletedItem(itemId);
    } catch (error) {
      console.error('Failed to restore item:', error);
      // You could show an error toast here
    }
  };

  const handleDismiss = (itemId: string) => {
    removeDeletedItem(itemId);
  };

  // Clean up expired items on mount
  useEffect(() => {
    const interval = setInterval(() => {
      // This will be handled by the store's auto-clear
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (deletedItems.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {deletedItems.map((item) => (
        <UndoToast
          key={item.id}
          itemId={item.id}
          itemType={item.type}
          itemName={`${item.type} with ${item.contactName}`}
          onUndo={() => handleUndo(item.id)}
          onDismiss={() => handleDismiss(item.id)}
        />
      ))}
    </div>
  );
} 