import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useContactStore } from '@/stores/contactStore';
import { Interaction, InteractionType } from '@/lib/schemas';
import { Edit2, Save, X, Calendar, Tag, User, Building, Mail, Phone, Check, AlertCircle } from 'lucide-react';
import { useAutosave } from '@/hooks/useAutosave';
import { Badge } from '@/components/ui/badge';

const interactionTypes: InteractionType[] = ['email', 'phone', 'text', 'dm', 'in_person'];

interface AutosaveInteractionModalProps {
  interaction: Interaction;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AutosaveInteractionModal({ 
  interaction, 
  contactName, 
  isOpen, 
  onClose 
}: AutosaveInteractionModalProps) {
  const [form, setForm] = useState({
    type: interaction.type,
    summary: interaction.summary,
    followUpRequired: interaction.followUpRequired,
    followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
    tags: interaction.tags || [],
  });
  const [newTag, setNewTag] = useState('');
  
  const { updateInteraction } = useContactStore();

  // Autosave hook
  const {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    reset
  } = useAutosave({
    data: form,
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
    enabled: isOpen,
  });

  // Reset form when modal opens with new interaction
  useEffect(() => {
    if (isOpen) {
      setForm({
        type: interaction.type,
        summary: interaction.summary,
        followUpRequired: interaction.followUpRequired,
        followUpDueDate: interaction.followUpDueDate ? new Date(interaction.followUpDueDate) : null,
        tags: interaction.tags || [],
      });
      setNewTag('');
    }
  }, [isOpen, interaction]);

  const handleSave = async () => {
    await saveNow();
    onClose();
  };

  const handleCancel = () => {
    reset();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Edit Interaction</h2>
            <p className="text-sm text-muted-foreground">
              {contactName} • {format(new Date(interaction.createdAt!), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Autosave Status */}
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
            <Button onClick={handleCancel} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
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

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Interaction Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm(prev => ({ ...prev, type: value as InteractionType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {interactionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {type === 'email' && <Mail className="w-4 h-4" />}
                      {type === 'phone' && <Phone className="w-4 h-4" />}
                      {type === 'text' && <span className="text-sm">💬</span>}
                      {type === 'dm' && <span className="text-sm">📱</span>}
                      {type === 'in_person' && <User className="w-4 h-4" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={form.summary}
              onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Describe the interaction..."
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{form.summary.length}/1000 characters</span>
            </div>
          </div>

          {/* Follow-up Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={form.followUpRequired}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  followUpRequired: e.target.checked 
                }))}
                className="rounded"
              />
              <Label htmlFor="followUpRequired" className="font-medium">
                Follow-up Required
              </Label>
            </div>
            
            {form.followUpRequired && (
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
              </div>
            )}
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
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