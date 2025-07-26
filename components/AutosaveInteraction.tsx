import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useContactStore } from '@/stores/contactStore';
import { useOptimisticDeletion } from '@/hooks/useOptimisticDeletion';
import { Interaction, InteractionType } from '@/lib/schemas';
import { Edit2, Save, X, Calendar, Tag, Check, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { useAutosave } from '@/hooks/useAutosave';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

const interactionTypes: InteractionType[] = ['email', 'phone', 'text', 'dm', 'in_person'];

interface AutosaveInteractionProps {
  interaction: Interaction;
  contactName: string;
}

export function AutosaveInteraction({ interaction, contactName }: AutosaveInteractionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    type: interaction.type,
    summary: interaction.summary,
    followUpRequired: interaction.followUpRequired,
    followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
    tags: interaction.tags || [],
  });
  const [newTag, setNewTag] = useState('');
  
  const { updateInteraction, markReminderDone, snoozeReminder } = useContactStore();
  const { 
    optimisticDeleteItem, 
    isItemOptimisticallyDeleted,
    hasOptimisticDeletions,
    hasPendingOperations 
  } = useOptimisticDeletion({
    enableErrorRecovery: true,
    showSuccessToast: true,
    showErrorToast: true,
  });

  // Autosave hook
  const {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    reset
  } = useAutosave({
    data: formData,
    onSave: async (data) => {
      await updateInteraction(interaction.id!, {
        type: data.type,
        summary: data.summary,
        followUpRequired: data.followUpRequired,
        followUpDueDate: data.followUpDueDate?.toISOString(),
        tags: data.tags,
      });
    },
    debounceMs: 1000,
    enabled: isEditing,
  });

  // Reset form when interaction changes
  useEffect(() => {
    setFormData({
      type: interaction.type,
      summary: interaction.summary,
      followUpRequired: interaction.followUpRequired,
      followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
      tags: interaction.tags || [],
    });
  }, [interaction]);

  const handleSave = async () => {
    await saveNow();
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setNewTag('');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!interaction.id) return;
    
    setIsDeleting(true);
    try {
      // Use optimistic deletion - immediately hides from UI
      await optimisticDeleteItem({
        id: interaction.id,
        type: 'interaction',
        data: interaction,
        contactName,
      });
      
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      // Error handling is done in the hook with toast notifications
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDone = async () => {
    if (!interaction.id) return;
    await markReminderDone(interaction.id);
  };

  const handleSnooze = async (days: number) => {
    if (!interaction.id) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    await snoozeReminder(interaction.id, newDate);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const isOverdue = interaction.followUpDueDate ? new Date(interaction.followUpDueDate) < new Date() : false;

  // Don't render if item is optimistically deleted
  if (isItemOptimisticallyDeleted(interaction.id!)) {
    return null;
  }

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 mb-2 shadow-sm bg-background relative">
        {/* Autosave Status */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          )}
          {lastSaved && !isSaving && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              Saved {format(lastSaved, 'HH:mm')}
            </div>
          )}
          {hasUnsavedChanges && !isSaving && (
            <Badge variant="outline" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>

        <div className="space-y-4 pt-6">
          {/* Header with contact name */}
          <div className="font-semibold text-sm text-muted-foreground">
            {contactName}
          </div>

          {/* Type and Summary */}
          <div className="flex gap-2 items-start">
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as InteractionType }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interactionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Interaction notes..."
              className="flex-1 min-h-[80px]"
            />
          </div>

          {/* Follow-up Settings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  followUpRequired: e.target.checked 
                }))}
                className="rounded"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium">
                Follow-up required
              </label>
            </div>
            
            {formData.followUpRequired && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={formData.followUpDueDate ? formData.followUpDueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    followUpDueDate: e.target.value ? new Date(e.target.value) : null 
                  }))}
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tags</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm" variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg p-4 mb-2 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-semibold">{contactName}</div>
            <div className="text-sm text-muted-foreground mb-1">
              {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} — {format(new Date(interaction.createdAt!), 'MMM d, yyyy h:mm a')}
            </div>
            <div className="text-base whitespace-pre-wrap mb-2">{interaction.summary}</div>
            
            {/* Tags Display */}
            {interaction.tags && interaction.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {interaction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Follow-up Info */}
            {interaction.followUpRequired && interaction.followUpDueDate && (
              <div className={`text-sm font-medium ${
                isOverdue ? 'text-destructive' : 'text-warning'
              }`}>
                Due: {format(new Date(interaction.followUpDueDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
              className="ml-2"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {interaction.followUpRequired && (
              <>
                <Button onClick={handleDone} variant="outline" size="sm">
                  <Check className="w-3 h-3 mr-1" />
                  Done
                </Button>
                <div className="relative">
                  <Button onClick={() => handleSnooze(1)} variant="ghost" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    1d
                  </Button>
                  <Button onClick={() => handleSnooze(3)} variant="ghost" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    3d
                  </Button>
                  <Button onClick={() => handleSnooze(7)} variant="ghost" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    7d
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        itemType="interaction"
        itemName={`${interaction.type} interaction with ${contactName}`}
        isLoading={isDeleting}
      />
    </>
  );
} 