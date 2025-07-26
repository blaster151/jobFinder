// components/ContactList.tsx
import React from 'react';
import { useContactStore } from '@/stores/contactStore';
import Link from 'next/link';

export const ContactList = () => {
  const contacts = useContactStore((s) => s.contacts);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Contacts</h2>
      <ul className="space-y-2">
        {contacts.map((c) => (
          <li key={c.id} className="border p-2 rounded hover:bg-muted">
            <Link href={`/contacts/${c.id}`}>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-muted-foreground">
                {c.role} at {c.company}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}; 