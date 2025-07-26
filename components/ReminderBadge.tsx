// components/ReminderBadge.tsx
'use client';

import Link from 'next/link';
import { useContactStore } from '@/stores/contactStore';
import { ReminderStatusService } from '@/lib/services/reminderStatusService';
import { Bell } from 'lucide-react';

export const ReminderBadge = () => {
  const { interactions } = useContactStore();
  
  const stats = ReminderStatusService.getStats(interactions);
  const total = stats.total;
  const overdue = stats.overdue;
  const upcoming = stats.dueSoon + stats.dueToday;
  const hidden = false; // Always show if there are reminders

  if (hidden || total === 0) return null;

  const displayCount = overdue > 0 ? overdue : upcoming;
  const badgeColor = overdue > 0 ? 'bg-destructive' : 'bg-warning';
  const badgeTextColor = overdue > 0 ? 'text-destructive-foreground' : 'text-warning-foreground';

  return (
    <Link href="/reminders" className="relative inline-block p-2 hover:bg-muted rounded-md transition-colors group">
      <Bell className="h-5 w-5" />
      <span className={`absolute top-1 right-1 ${badgeColor} ${badgeTextColor} text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium`}>
        {displayCount > 9 ? '9+' : displayCount}
      </span>
      <span className="absolute text-xs bg-popover text-popover-foreground border px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition top-full mt-1 z-10 whitespace-nowrap">
        {overdue > 0
          ? `${overdue} overdue`
          : `${upcoming} due soon`}
      </span>
    </Link>
  );
}; 