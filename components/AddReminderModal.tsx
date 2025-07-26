import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useContactStore } from '@/stores/contactStore';
import { InteractionType } from '@/lib/schemas';

interface AddReminderModalProps {
  contactId: string;
  contactName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddReminderModal({
  contactId,
  contactName,
  isOpen,
  onClose,
}: AddReminderModalProps) {
  const [form, setForm] = useState({
    summary: '',
    followUpDueDate: new Date(),
    type: 'email' as InteractionType,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addInteraction } = useContactStore();

  const handleSubmit = async () => {
    if (!form.summary.trim()) return;

    setIsSubmitting(true);
    try {
      await addInteraction({
        contactId,
        type: form.type,
        summary: form.summary,
        followUpRequired: true,
        followUpDueDate: form.followUpDueDate.toISOString(),
        tags: [],
        isDone: false,
      });
      
      // Reset form
      setForm({
        summary: '',
        followUpDueDate: new Date(),
        type: 'email',
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDate = (days: number) => {
    setForm(prev => ({
      ...prev,
      followUpDueDate: addDays(new Date(), days),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Add Reminder</h2>
            <p className="text-sm text-muted-foreground">
              Create a follow-up reminder for {contactName}
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Reminder Notes */}
          <div className="space-y-2">
            <Label htmlFor="summary">Reminder Notes</Label>
            <Textarea
              id="summary"
              value={form.summary}
              onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="What do you need to follow up on?"
              className="min-h-[100px]"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.followUpDueDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.followUpDueDate}
                    onSelect={(date) => date && setForm(prev => ({ ...prev, followUpDueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Quick Date Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(1)}
              >
                Tomorrow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(3)}
              >
                +3 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(7)}
              >
                +1 week
              </Button>
            </div>
          </div>

          {/* Interaction Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Follow-up Type</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as InteractionType }))}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="text">Text Message</option>
              <option value="dm">Direct Message</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!form.summary.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Reminder'}
          </Button>
        </div>
      </div>
    </div>
  );
} 