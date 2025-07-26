// src/app/contacts/new/page.tsx
'use client';

import { ContactForm } from '@/components/ContactForm';
import { useRouter } from 'next/navigation';

export default function NewContactPage() {
  const router = useRouter();

  const handleSubmit = () => {
    router.push('/');
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add a New Contact</h1>
      <ContactForm onSubmit={handleSubmit} />
    </div>
  );
} 