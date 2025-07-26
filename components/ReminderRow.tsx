import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useContactStore } from '@/stores/contactStore';
import { useDeletedItemsStore } from '@/stores/deletedItemsStore';
import { Interaction } from '@/lib/schemas';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

type Props = {
  interaction: Interaction;
  contactName: string;
};

export function ReminderRow({ interaction, contactName }: Props) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteInteraction } = useContactStore();
  const { addDeletedItem } = useDeletedItemsStore();

  const handleDelete = async () => {
    if (!interaction.id) return;
    
    setIsDeleting(true);
    try {
      // Store the item for potential undo
      addDeletedItem({
        id: interaction.id,
        type: 'reminder',
        data: interaction,
        contactName,
      });

      // Delete from backend
      await deleteInteraction(interaction.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      // You could show a toast error here
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg mb-2">
        <div className="flex-1">
          <div className="font-medium">{contactName}</div>
          <div className="text-sm text-muted-foreground">{interaction.summary}</div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemType="reminder"
        itemName={`reminder for ${contactName}`}
        isLoading={isDeleting}
      />
    </>
  );
} 