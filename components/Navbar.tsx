// components/Navbar.tsx
'use client';

import Link from 'next/link';
import { ReminderBadge } from './ReminderBadge';
import { GlobalSearchInput } from './GlobalSearchInput';
import { Button } from '@/components/ui/button';
import { Settings, TrendingUp, Calendar } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-background">
      <Link href="/" className="text-xl font-bold">
        JobFinder
      </Link>
      <nav className="flex items-center space-x-4">
        <GlobalSearchInput />
        <Link href="/jobs/sample-job">
          <Button variant="outline" size="sm">
            Sample Job
          </Button>
        </Link>
        <Link href="/contacts/new">
          <Button variant="outline" size="sm">
            Add Contact
          </Button>
        </Link>
        <Link href="/timeline">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/priorities">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
        <ReminderBadge />
      </nav>
    </header>
  );
}; 