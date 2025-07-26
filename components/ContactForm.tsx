// components/ContactForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useContactActions } from '@/hooks/useContactActions';
import { Contact } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ContactFormProps {
  contactToEdit?: Contact;
  onSubmit?: () => void;
}

export const ContactForm = ({ contactToEdit, onSubmit }: ContactFormProps) => {
  const [form, setForm] = useState<Contact>(
    contactToEdit ?? {
      id: '',
      name: '',
      company: '',
      role: '',
      email: '',
      phone: '',
      linkedin: '',
      notes: '',
      flagged: false,
      tags: [],
    }
  );

  const { addContact, flagContact, isLoading, error } = useContactActions();

  useEffect(() => {
    if (contactToEdit) {
      setForm(contactToEdit);
    }
  }, [contactToEdit]);

  const handleChange = (field: keyof Contact, value: string | boolean) => {
    setForm((prev: Contact) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    try {
      if (form.id) {
        // Update existing contact
        await flagContact(form.id, form.flagged ?? false);
      } else {
        // Add new contact
        await addContact({
          ...form,
          flagged: form.flagged ?? false,
        });
      }

      if (onSubmit) onSubmit();
      setForm({
        id: '',
        name: '',
        company: '',
        role: '',
        email: '',
        phone: '',
        linkedin: '',
        notes: '',
        flagged: false,
        tags: [],
      });
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <Label>Company</Label>
        <Input
          value={form.company}
          onChange={(e) => handleChange('company', e.target.value)}
          placeholder="Acme Inc"
        />
      </div>
      <div>
        <Label>Role</Label>
        <Input
          value={form.role}
          onChange={(e) => handleChange('role', e.target.value)}
          placeholder="Hiring Manager"
        />
      </div>
      <div>
        <Label>Email</Label>
        <Input
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="jane@acme.com"
          type="email"
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <Label>LinkedIn</Label>
        <Input
          value={form.linkedin}
          onChange={(e) => handleChange('linkedin', e.target.value)}
          placeholder="https://linkedin.com/in/janedoe"
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Met at a startup mixer, seemed interested in React devs."
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.flagged}
          onCheckedChange={(val) => handleChange('flagged', val)}
        />
        <Label>Flag as important</Label>
      </div>
      <Button onClick={handleSubmit}>
        {contactToEdit ? 'Save Changes' : 'Add Contact'}
      </Button>
    </div>
  );
}; 