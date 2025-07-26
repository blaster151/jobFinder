// src/app/reminders/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FilteredRemindersList } from '@/components/FilteredRemindersList';

export default function RemindersPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🔔 Follow-Up Reminders</h1>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <FilteredRemindersList />
    </div>
  );
} 