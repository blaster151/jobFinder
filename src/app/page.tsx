'use client';

import { ContactList } from '@/components/ContactList'
import { RemindersPanel } from '@/components/RemindersPanel'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useContactStore } from '@/stores/contactStore'
import { useEffect } from 'react'

export default function Home() {
  const { fetchContacts, fetchInteractions, isLoading } = useContactStore();

  useEffect(() => {
    fetchContacts();
    fetchInteractions();
  }, [fetchContacts, fetchInteractions]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RemindersPanel />
            <ContactList />
          </div>
        )}
      </div>
    </main>
  )
} 