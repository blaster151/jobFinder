// components/ContactSelect.tsx
'use client';

import { useState } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { ContactForm } from './ContactForm';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ContactSelectProps {
  selectedContactId: string | null;
  onChange: (id: string | null) => void;
}

export const ContactSelect = ({
  selectedContactId,
  onChange,
}: ContactSelectProps) => {
  const contacts = useContactStore((s) => s.contacts);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Select
        value={selectedContactId ?? ''}
        onValueChange={(val) => onChange(val || null)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a contact (optional)" />
        </SelectTrigger>
        <SelectContent>
          {contacts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} {c.company && `@ ${c.company}`}
            </SelectItem>
          ))}
          <SelectItem value="">None</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="mt-2">
            + Add New Contact
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <h2 className="text-lg font-semibold mb-2">New Contact</h2>
          <ContactForm
            onSubmit={() => {
              setAddOpen(false);
              const newest = useContactStore
                .getState()
                .contacts.slice(-1)[0];
              onChange(newest.id);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}; 