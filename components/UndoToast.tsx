import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';
import { useDeletedItemsStore } from '@/stores/deletedItemsStore';
import { useContactStore } from '@/stores/contactStore';

interface UndoToastProps {
  itemId: string;
  itemType: 'interaction' | 'reminder';
  itemName: string;
  onUndo: () => void;
  onDismiss: () => void;
}

const UNDO_TIMEOUT_MS = 10000; // 10 seconds

export function UndoToast({ itemId, itemType, itemName, onUndo, onDismiss }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(UNDO_TIMEOUT_MS);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onDismiss]);

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo();
    } finally {
      setIsUndoing(false);
    }
  };

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm w-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Item Deleted</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Deleted {itemType}: "{itemName}"
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUndo}
              size="sm"
              variant="outline"
              disabled={isUndoing}
              className="text-xs"
            >
              {isUndoing ? (
                <>
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                  Undoing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Undo
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {formatTimeLeft(timeLeft)} left
            </span>
          </div>
        </div>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 