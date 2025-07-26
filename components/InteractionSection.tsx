import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { format } from 'date-fns';
import { useContactStore } from '@/stores/contactStore';
import { InteractionType } from '@/lib/schemas';
import { AutosaveInteraction } from './AutosaveInteraction';

const interactionTypes: InteractionType[] = ['email', 'phone', 'text', 'dm', 'in_person'];

interface InteractionSectionProps {
  contactId?: string;
}

export default function InteractionSection({ contactId }: InteractionSectionProps) {
  const [formState, setFormState] = useState({ type: 'email' as InteractionType, notes: '' });
  const interactions = useContactStore((state) => state.interactions);
  const contacts = useContactStore((state) => state.contacts);
  const addInteraction = useContactStore((state) => state.addInteraction);

  // Filter interactions for specific contact if contactId is provided
  const filteredInteractions = contactId 
    ? interactions.filter(i => i.contactId === contactId)
    : interactions;

  const handleAdd = () => {
    if (!formState.notes.trim()) return;
    
    addInteraction({
      contactId: contactId || 'general', // Use provided contactId or general
      type: formState.type,
      summary: formState.notes,
      followUpRequired: false,
      tags: [],
      isDone: false,
    });
    setFormState({ type: 'email', notes: '' });
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.name || 'Unknown Contact';
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Add Interaction</h2>
        <div className="flex gap-2 items-center mb-2">
          <Select
            value={formState.type}
            onValueChange={(value) => setFormState((s) => ({ ...s, type: value as InteractionType }))}
          >
            <SelectTrigger className="w-32" />
            <SelectContent>
              {interactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Notes about the interaction..."
            className="flex-1"
            value={formState.notes}
            onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
          />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredInteractions.length === 0 && (
          <div className="text-muted-foreground italic text-sm">
            {contactId ? 'No interactions with this contact yet.' : 'No interactions yet.'}
          </div>
        )}
        {filteredInteractions.map((interaction) => (
          <AutosaveInteraction
            key={interaction.id}
            interaction={interaction}
            contactName={getContactName(interaction.contactId)}
          />
        ))}
      </div>
    </div>
  );
} 