import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemType?: 'interaction' | 'reminder' | 'contact';
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  itemType = 'interaction',
  itemName,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  const defaultMessage = `This will permanently delete the ${itemType}${itemName ? ` "${itemName}"` : ''}. This action cannot be undone.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b">
          <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-full">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">Delete Confirmation</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {message || defaultMessage}
          </p>
          
          {itemName && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{itemName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button 
            onClick={onClose} 
            variant="outline" 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            variant="destructive"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 