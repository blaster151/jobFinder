import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useContactStore } from '@/stores/contactStore';
import { Interaction } from '@/lib/schemas';
import { Edit2, Save, X, Calendar, Tag, Clock, Check } from 'lucide-react';

interface InlineEditableReminderProps {
  interaction: Interaction;
  contactName: string;
}

export function InlineEditableReminder({ interaction, contactName }: InlineEditableReminderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    summary: interaction.summary,
    followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
    tags: interaction.tags || [],
  });
  const [newTag, setNewTag] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  
  const { updateInteraction, markReminderDone, snoozeReminder } = useContactStore();

  const handleSave = async () => {
    try {
      await updateInteraction(interaction.id!, {
        summary: editForm.summary,
        followUpDueDate: editForm.followUpDueDate?.toISOString(),
        tags: editForm.tags,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      summary: interaction.summary,
      followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
      tags: interaction.tags || [],
    });
    setNewTag('');
    setIsEditing(false);
  };

  const handleDone = async () => {
    if (!interaction.id) return;
    setDismissed(true);
    setTimeout(async () => {
      await markReminderDone(interaction.id!);
    }, 300);
  };

  const handleSnooze = async (days: number) => {
    if (!interaction.id) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    await snoozeReminder(interaction.id!, newDate);
    setSnoozed(true);
    setTimeout(() => setSnoozed(false), 800);
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

          {/* Summary */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reminder Notes</label>
            <textarea
              value={editForm.summary}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Reminder details..."
              className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px] resize-none"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium">Due Date</label>
            </div>
            <input
              type="date"
              value={editForm.followUpDueDate ? editForm.followUpDueDate.toISOString().split('T')[0] : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(prev => ({ 
                ...prev, 
                followUpDueDate: e.target.value ? new Date(e.target.value) : null 
              }))}
              className="px-3 py-2 border rounded-md text-sm"
            />
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
            {interaction.type} — {interaction.summary}
          </div>
          
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

          <div className={`text-sm font-medium ${
            isOverdue ? 'text-destructive' : 'text-warning'
          }`}>
            Due: {interaction.followUpDueDate ? format(new Date(interaction.followUpDueDate), "MMM d, yyyy") : 'No due date'}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="sm"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
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
        </div>
      </div>
    </div>
  );
} 