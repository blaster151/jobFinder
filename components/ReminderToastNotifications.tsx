'use client';

import { useEffect, useRef } from 'react';
import { useReminderPolling } from '@/hooks/useReminderPolling';
import { useContactStore } from '@/stores/contactStore';
import { useToast } from '@/hooks/useToast';
import { getReminderStatus } from '@/lib/reminderUtils';
import { format } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReminderToastNotificationsProps {
  enabled?: boolean;
}

export function ReminderToastNotifications({ enabled = true }: ReminderToastNotificationsProps) {
  const { toast } = useToast();
  const { interactions, contacts, markReminderDone } = useContactStore();
  const { recentlyOverdue, dueSoonReminders } = useReminderPolling();
  
  // Track recently shown toasts to prevent duplicates
  const recentlyShownToasts = useRef<Set<string>>(new Set());
  const DUP_PREVENTION_DURATION = 5 * 60 * 1000; // 5 minutes

  // Clear old entries from recently shown toasts
  useEffect(() => {
    const interval = setInterval(() => {
      recentlyShownToasts.current.clear();
    }, DUP_PREVENTION_DURATION);

    return () => clearInterval(interval);
  }, []);

  // Handle overdue reminders
  useEffect(() => {
    if (!enabled || recentlyOverdue.length === 0) return;

    recentlyOverdue.forEach(interactionId => {
      const interaction = interactions.find(i => i.id === interactionId);
      const contact = interaction ? contacts.find(c => c.id === interaction.contactId) : null;
      
      if (!interaction || !contact) return;

      const toastKey = `overdue-${interactionId}`;
      
      // Check if we've shown this toast recently
      if (recentlyShownToasts.current.has(toastKey)) return;
      
      recentlyShownToasts.current.add(toastKey);

      toast({
        variant: "destructive",
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Reminder</span>
          </div>
        ),
        description: (
          <div className="space-y-2">
            <p className="font-medium">{contact.name}</p>
            <p className="text-sm opacity-90">
              {interaction.type} — {interaction.summary}
            </p>
            <p className="text-xs opacity-75">
              Due: {interaction.followUpDueDate 
                ? format(new Date(interaction.followUpDueDate), 'MMM d, yyyy')
                : 'No due date'
              }
            </p>
          </div>
        ),
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markReminderDone(interactionId)}
            className="h-8 px-3"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Mark Done
          </Button>
        ),
        duration: 10000, // 10 seconds
      });
    });
  }, [recentlyOverdue, interactions, contacts, toast, enabled, markReminderDone]);

  // Handle due soon reminders (within 1 hour)
  useEffect(() => {
    if (!enabled || dueSoonReminders.length === 0) return;

    dueSoonReminders.forEach(interactionId => {
      const interaction = interactions.find(i => i.id === interactionId);
      const contact = interaction ? contacts.find(c => c.id === interaction.contactId) : null;
      
      if (!interaction || !contact) return;

      const status = getReminderStatus(interaction);
      
      // Only show toast for reminders due within 1 hour
      if (!status.isDueWithin1Hour) return;

      const toastKey = `due-soon-${interactionId}`;
      
      // Check if we've shown this toast recently
      if (recentlyShownToasts.current.has(toastKey)) return;
      
      recentlyShownToasts.current.add(toastKey);

      toast({
        variant: "warning",
        title: (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Due Soon</span>
          </div>
        ),
        description: (
          <div className="space-y-2">
            <p className="font-medium">{contact.name}</p>
            <p className="text-sm opacity-90">
              {interaction.type} — {interaction.summary}
            </p>
            <p className="text-xs opacity-75">
              Due in {Math.round(status.hoursUntilDue)} hour{status.hoursUntilDue !== 1 ? 's' : ''}
            </p>
          </div>
        ),
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markReminderDone(interactionId)}
            className="h-8 px-3"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Mark Done
          </Button>
        ),
        duration: 8000, // 8 seconds
      });
    });
  }, [dueSoonReminders, interactions, contacts, toast, enabled, markReminderDone]);

  return null; // This component doesn't render anything
} 