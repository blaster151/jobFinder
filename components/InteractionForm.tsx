// components/InteractionForm.tsx
'use client';

import { useState } from 'react';
import { Interaction, useContactStore } from '@/stores/contactStore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface InteractionFormProps {
  contactId?: string;
  jobId?: string;
  onSubmit?: (interaction: Omit<Interaction, 'id' | 'timestamp'>) => void;
  onCancel?: () => void;
}

export const InteractionForm = ({ contactId, jobId, onSubmit, onCancel }: InteractionFormProps) => {
  const [form, setForm] = useState({
    type: 'email' as Interaction['type'],
    summary: '',
    followUpRequired: false,
    followUpDueDate: '',
  });

  const { addInteraction } = useContactStore();

  const handleSubmit = () => {
    if (!form.summary.trim() || !contactId) return;

    const interaction: Omit<Interaction, 'id' | 'timestamp'> = {
      contactId,
      jobId,
      type: form.type,
      summary: form.summary,
      followUpRequired: form.followUpRequired,
      followUpDueDate: form.followUpDueDate || undefined,
    };

    addInteraction(interaction);
    if (onSubmit) onSubmit(interaction);
  };

  if (!contactId) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a contact to log an interaction
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Log Interaction</Label>
      
      <div>
        <Label>Type</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={form.type}
          onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as Interaction['type'] }))}
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="text">Text</option>
          <option value="dm">DM</option>
          <option value="in_person">In Person</option>
        </select>
      </div>

      <div>
        <Label>Summary</Label>
        <Textarea
          value={form.summary}
          onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
          placeholder="What happened? What was discussed?"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={form.followUpRequired}
          onCheckedChange={(val) => setForm(prev => ({ ...prev, followUpRequired: val }))}
        />
        <Label>Follow-up required</Label>
      </div>

      {form.followUpRequired && (
        <div>
          <Label>Follow-up due date</Label>
          <Input
            type="date"
            value={form.followUpDueDate}
            onChange={(e) => setForm(prev => ({ ...prev, followUpDueDate: e.target.value }))}
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!form.summary.trim()}>
          Log Interaction
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}; 