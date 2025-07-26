import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, Check, AlertCircle } from 'lucide-react';
import { useOptimisticDeletionStore } from '@/stores/optimisticDeletionStore';

interface OptimisticUndoToastProps {
  itemId: string;
  itemType: 'interaction' | 'reminder';
  itemName: string;
  onUndo: () => void;
  onDismiss: () => void;
  isCommitted?: boolean;
  isPending?: boolean;
}

const UNDO_TIMEOUT_MS = 10000; // 10 seconds

export function OptimisticUndoToast({ 
  itemId, 
  itemType, 
  itemName, 
  onUndo, 
  onDismiss,
  isCommitted = false,
  isPending = false,
}: OptimisticUndoToastProps) {
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

  const getStatusColor = () => {
    if (isPending) return 'text-yellow-600';
    if (isCommitted) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (isPending) return 'Deleting...';
    if (isCommitted) return 'Deleted';
    return 'Processing';
  };

  const getStatusIcon = () => {
    if (isPending) return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
    if (isCommitted) return <Check className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm w-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Item Deleted</span>
            <div className={`flex items-center gap-1 text-xs ${getStatusColor()}`}>
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Deleted {itemType}: "{itemName}"
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUndo}
              size="sm"
              variant="outline"
              disabled={isUndoing || isPending}
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
            {!isPending && (
              <span className="text-xs text-muted-foreground">
                {formatTimeLeft(timeLeft)} left
              </span>
            )}
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