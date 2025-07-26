import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useContactStore } from '@/stores/contactStore';
import { Interaction, InteractionType } from '@/lib/schemas';
import { Edit2, Save, X, Calendar, Tag } from 'lucide-react';

const interactionTypes: InteractionType[] = ['email', 'phone', 'text', 'dm', 'in_person'];

interface InlineEditableInteractionProps {
  interaction: Interaction;
  contactName: string;
}

export function InlineEditableInteraction({ interaction, contactName }: InlineEditableInteractionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: interaction.type,
    summary: interaction.summary,
    followUpRequired: interaction.followUpRequired,
    followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
    tags: interaction.tags || [],
  });
  const [newTag, setNewTag] = useState('');
  
  const { updateInteraction } = useContactStore();

  const handleSave = async () => {
    try {
      await updateInteraction(interaction.id!, {
        type: editForm.type,
        summary: editForm.summary,
        followUpRequired: editForm.followUpRequired,
        followUpDueDate: editForm.followUpDueDate?.toISOString(),
        tags: editForm.tags,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating interaction:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      type: interaction.type,
      summary: interaction.summary,
      followUpRequired: interaction.followUpRequired,
      followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
      tags: interaction.tags || [],
    });
    setNewTag('');
    setIsEditing(false);
  };

  const addTag = () => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const isOverdue = interaction.followUpDueDate ? new Date(interaction.followUpDueDate) < new Date() : false;

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 mb-2 shadow-sm bg-background">
        <div className="space-y-4">
          {/* Header with contact name */}
          <div className="font-semibold text-sm text-muted-foreground">
            {contactName}
          </div>

          {/* Type and Summary */}
          <div className="flex gap-2 items-start">
            <Select
              value={editForm.type}
              onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value as InteractionType }))}
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
              value={editForm.summary}
              onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
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
                checked={editForm.followUpRequired}
                onChange={(e) => setEditForm(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium">
                Follow-up required
              </label>
            </div>
            
            {editForm.followUpRequired && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={editForm.followUpDueDate ? editForm.followUpDueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditForm(prev => ({ 
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm" variant="outline">
                Add
              </Button>
            </div>
            {editForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {editForm.tags.map((tag) => (
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
            <Button onClick={handleCancel} variant="outline" size="sm">
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm">
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        
        <Button
          onClick={() => setIsEditing(true)}
          variant="ghost"
          size="sm"
          className="ml-2"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 