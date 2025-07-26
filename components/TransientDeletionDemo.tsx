import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTransientDeletion } from '@/hooks/useTransientDeletion';
import { useContactStore } from '@/stores/contactStore';
import { Interaction } from '@/lib/schemas';
import { Trash2, RotateCcw, Check, Clock, AlertTriangle } from 'lucide-react';

interface TransientDeletionDemoProps {
  interactions: Interaction[];
  contactName: string;
}

export function TransientDeletionDemo({ interactions, contactName }: TransientDeletionDemoProps) {
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  
  const {
    localDeletedItems,
    softDeleteItem,
    commitSoftDeletion,
    revertSoftDeletion,
    hardDeleteItem,
    undoLocalDeletion,
    undoGlobalDeletion,
    hasSoftDeletedItems,
    hasPendingDeletions,
    getSoftDeletedItems,
    getHardDeletedItems,
    clearAllItems,
  } = useTransientDeletion({
    enableSoftDelete: true,
    softDeleteTimeout: 30000, // 30 seconds
    autoCommit: true,
  });

  const { deleteInteraction, addInteraction } = useContactStore();

  const handleSoftDelete = (interaction: Interaction) => {
    softDeleteItem({
      id: interaction.id!,
      type: 'interaction',
      data: interaction,
      contactName,
    });
  };

  const handleHardDelete = async (interaction: Interaction) => {
    try {
      await hardDeleteItem(interaction.id!);
      // Also remove from contact store
      await deleteInteraction(interaction.id!);
    } catch (error) {
      console.error('Failed to hard delete:', error);
    }
  };

  const handleUndoLocal = (itemId: string) => {
    undoLocalDeletion(itemId);
  };

  const handleUndoGlobal = async (itemId: string) => {
    try {
      await undoGlobalDeletion(itemId);
      // Also restore to contact store
      const deletedItem = getHardDeletedItems().find(item => item.id === itemId);
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
    } catch (error) {
      console.error('Failed to undo global deletion:', error);
    }
  };

  const handleCommitSoft = async (itemId: string) => {
    try {
      await commitSoftDeletion(itemId);
      // Also remove from contact store
      await deleteInteraction(itemId);
    } catch (error) {
      console.error('Failed to commit soft deletion:', error);
    }
  };

  const softDeletedItems = getSoftDeletedItems();
  const hardDeletedItems = getHardDeletedItems();

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Transient Deletion Status
          </CardTitle>
          <CardDescription>
            Monitor soft and hard deleted items with undo capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={hasSoftDeletedItems ? "destructive" : "secondary"}>
                  {softDeletedItems.length}
                </Badge>
                <span className="text-sm font-medium">Soft Deleted</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Items marked for deletion but not yet committed
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={hardDeletedItems.length > 0 ? "destructive" : "secondary"}>
                  {hardDeletedItems.length}
                </Badge>
                <span className="text-sm font-medium">Hard Deleted</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Items committed to backend with undo available
              </p>
            </div>
          </div>
          
          {hasPendingDeletions && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Deletions</span>
                <Button onClick={clearAllItems} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Interactions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Interactions</CardTitle>
          <CardDescription>
            Select an interaction to demonstrate deletion methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {interactions
              .filter(interaction => !softDeletedItems.some(item => item.id === interaction.id))
              .map((interaction) => (
                <div
                  key={interaction.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedInteraction?.id === interaction.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedInteraction(interaction)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{interaction.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {interaction.summary.substring(0, 50)}...
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSoftDelete(interaction);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Soft Delete
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHardDelete(interaction);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hard Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Soft Deleted Items */}
      {softDeletedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="w-5 h-5" />
              Soft Deleted Items
            </CardTitle>
            <CardDescription>
              Items marked for deletion - can be reverted or committed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {softDeletedItems.map((item) => (
                <div key={item.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.data.summary.substring(0, 50)}...
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Soft deleted at {item.deletedAt.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUndoLocal(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Revert
                      </Button>
                      <Button
                        onClick={() => handleCommitSoft(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Commit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hard Deleted Items */}
      {hardDeletedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Hard Deleted Items
            </CardTitle>
            <CardDescription>
              Items committed to backend - can be restored with undo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hardDeletedItems.map((item) => (
                <div key={item.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.data.summary.substring(0, 50)}...
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Hard deleted at {item.deletedAt.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUndoGlobal(item.id)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Undo
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-orange-600">Soft Delete</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Item is marked as deleted but remains in UI</li>
                <li>• Can be reverted immediately</li>
                <li>• Auto-commits after 30 seconds</li>
                <li>• Uses local state for immediate feedback</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Hard Delete</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Item is immediately removed from UI</li>
                <li>• Backend deletion happens immediately</li>
                <li>• Can be undone within 10 seconds</li>
                <li>• Uses global state for persistence</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">State Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong>Local State (useRef equivalent):</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Immediate access for soft deletes</li>
                  <li>• Component-scoped state</li>
                  <li>• No persistence across re-renders</li>
                </ul>
              </div>
              <div>
                <strong>Global State (Zustand):</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Cross-component access</li>
                  <li>• Persistent across re-renders</li>
                  <li>• Handles hard deletes and undo</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 