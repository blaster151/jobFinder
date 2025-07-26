// src/app/contacts/[id]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useContactStore } from '@/stores/contactStore';
import InteractionSection from '@/components/InteractionSection';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ContactDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const contact = useContactStore((s) =>
    s.contacts.find((c) => c.id === id)
  );

  if (!contact) return <p className="p-4">Contact not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{contact.name}</h1>
          <p className="text-muted-foreground text-lg">
            {contact.role} at {contact.company}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1">
          <div className="border rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Contact Info</h2>
            <div className="space-y-2 text-sm">
              {contact.email && (
                <div>
                  <span className="font-medium">Email:</span> {contact.email}
                </div>
              )}
              {contact.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {contact.phone}
                </div>
              )}
              {contact.linkedin && (
                <div>
                  <span className="font-medium">LinkedIn:</span> 
                  <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    View Profile
                  </a>
                </div>
              )}
              {contact.notes && (
                <div>
                  <span className="font-medium">Notes:</span>
                  <p className="text-muted-foreground mt-1">{contact.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactions */}
        <div className="lg:col-span-2">
          <InteractionSection contactId={id} />
        </div>
      </div>
    </div>
  );
} 