import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useContactStore } from '@/stores/contactStore';
import { Interaction } from '@/lib/schemas';
import { Edit2, Save, X, Calendar, Tag, User, Clock, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

// Validation schema
const reminderEditSchema = z.object({
  summary: z.string().min(1, 'Summary is required').max(1000, 'Summary too long'),
  followUpDueDate: z.date().nullable(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Too many tags'),
});

type ReminderEditForm = z.infer<typeof reminderEditSchema>;

interface ReminderEditModalProps {
  interaction: Interaction;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Interaction>) => Promise<void>;
}

export function ReminderEditModal({ 
  interaction, 
  contactName, 
  isOpen, 
  onClose, 
  onSave 
}: ReminderEditModalProps) {
  const [form, setForm] = useState<ReminderEditForm>({
    summary: interaction.summary,
    followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
    tags: interaction.tags || [],
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new interaction
  useEffect(() => {
    if (isOpen) {
      setForm({
        summary: interaction.summary,
        followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
        tags: interaction.tags || [],
      });
      setNewTag('');
      setErrors({});
    }
  }, [isOpen, interaction]);

  const validateForm = (): boolean => {
    try {
      reminderEditSchema.parse(form);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        summary: form.summary,
        followUpDueDate: form.followUpDueDate?.toISOString(),
        tags: form.tags,
      });
      onClose();
    } catch (error) {
      console.error('Error saving reminder:', error);
      setErrors({ submit: 'Failed to save changes. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim()) && form.tags.length < 10) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  const isOverdue = interaction.followUpDueDate ? new Date(interaction.followUpDueDate) < new Date() : false;
  const isDueSoon = interaction.followUpDueDate ? 
    new Date(interaction.followUpDueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) : false;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Edit Reminder</h2>
            <p className="text-sm text-muted-foreground">
              {contactName} • {format(new Date(interaction.createdAt!), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <Button onClick={handleCancel} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{contactName}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {interaction.contactId}
            </div>
          </div>

          {/* Status Alert */}
          {(isOverdue || isDueSoon) && (
            <div className={`rounded-lg p-4 ${
              isOverdue 
                ? 'bg-destructive/10 border border-destructive/20' 
                : 'bg-warning/10 border border-warning/20'
            }`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${
                  isOverdue ? 'text-destructive' : 'text-warning'
                }`} />
                <span className={`font-medium ${
                  isOverdue ? 'text-destructive' : 'text-warning'
                }`}>
                  {isOverdue ? 'Overdue' : 'Due Soon'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isOverdue 
                  ? 'This reminder is past its due date'
                  : 'This reminder is due within 24 hours'
                }
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Reminder Notes</Label>
            <Textarea
              id="summary"
              value={form.summary}
              onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Describe what needs to be done..."
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{errors.summary}</span>
              <span>{form.summary.length}/1000</span>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                id="dueDate"
                type="date"
                value={form.followUpDueDate ? form.followUpDueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  followUpDueDate: e.target.value ? new Date(e.target.value) : null 
                }))}
                className="flex-1"
              />
            </div>
            {errors.followUpDueDate && <p className="text-sm text-destructive">{errors.followUpDueDate}</p>}
            
            {/* Quick Date Options */}
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  setForm(prev => ({ ...prev, followUpDueDate: today }));
                }}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setForm(prev => ({ ...prev, followUpDueDate: tomorrow }));
                }}
              >
                Tomorrow
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setForm(prev => ({ ...prev, followUpDueDate: nextWeek }));
                }}
              >
                Next Week
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Label className="font-medium">Tags</Label>
              <span className="text-xs text-muted-foreground">
                ({form.tags.length}/10)
              </span>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={addTag} 
                size="sm" 
                variant="outline"
                disabled={!newTag.trim() || form.tags.length >= 10}
              >
                Add
              </Button>
            </div>
            
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button onClick={handleCancel} variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 