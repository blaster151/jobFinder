'use client';

import { useEffect, useRef } from 'react';
import { useReminderPolling } from '@/hooks/useReminderPolling';
import { useContactStore } from '@/stores/contactStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getReminderStatus } from '@/lib/reminderUtils';
import { format } from 'date-fns';

interface ReminderPushNotificationsProps {
  enabled?: boolean;
}

export function ReminderPushNotifications({ enabled = true }: ReminderPushNotificationsProps) {
  const { sendNotification, isEnabled, requestPermission } = usePushNotifications();
  const { interactions, contacts, markReminderDone, snoozeReminder } = useContactStore();
  const { recentlyOverdue, dueSoonReminders } = useReminderPolling();
  
  // Track recently shown push notifications to prevent duplicates
  const recentlyShownPushNotifications = useRef<Set<string>>(new Set());
  const DUP_PREVENTION_DURATION = 10 * 60 * 1000; // 10 minutes for push notifications
  
  // Track if app is in background
  const isInBackground = useRef(false);
  
  // Detect if app is in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      isInBackground.current = document.hidden;
    };

    const handleBlur = () => {
      isInBackground.current = true;
    };

    const handleFocus = () => {
      isInBackground.current = false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Clear old entries from recently shown push notifications
  useEffect(() => {
    const interval = setInterval(() => {
      recentlyShownPushNotifications.current.clear();
    }, DUP_PREVENTION_DURATION);

    return () => clearInterval(interval);
  }, []);

  // Request permission on mount if not already granted
  useEffect(() => {
    if (enabled && !isEnabled) {
      requestPermission();
    }
  }, [enabled, isEnabled, requestPermission]);

  // Handle overdue reminders
  useEffect(() => {
    if (!enabled || !isEnabled || recentlyOverdue.length === 0) return;

    recentlyOverdue.forEach(interactionId => {
      const interaction = interactions.find(i => i.id === interactionId);
      const contact = interaction ? contacts.find(c => c.id === interaction.contactId) : null;
      
      if (!interaction || !contact) return;

      const pushNotificationKey = `push-overdue-${interactionId}`;
      
      // Check if we've shown this push notification recently
      if (recentlyShownPushNotifications.current.has(pushNotificationKey)) return;
      
      // Only show push notification if app is in background
      if (!isInBackground.current) return;
      
      recentlyShownPushNotifications.current.add(pushNotificationKey);

      sendNotification({
        title: '🚨 Overdue Reminder',
        body: `${contact.name}: ${interaction.type} — ${interaction.summary}`,
        tag: `reminder-overdue-${interactionId}`,
        requireInteraction: true,
        data: {
          interactionId,
          contactName: contact.name,
          onClick: () => {
            // Focus the app and navigate to the reminder
            window.focus();
            // Could navigate to specific reminder page here
          },
        },
      });
    });
  }, [recentlyOverdue, interactions, contacts, sendNotification, enabled, isEnabled]);

  // Handle due soon reminders (within 1 hour)
  useEffect(() => {
    if (!enabled || !isEnabled || dueSoonReminders.length === 0) return;

    dueSoonReminders.forEach(interactionId => {
      const interaction = interactions.find(i => i.id === interactionId);
      const contact = interaction ? contacts.find(c => c.id === interaction.contactId) : null;
      
      if (!interaction || !contact) return;

      const status = getReminderStatus(interaction);
      
      // Only show push notification for reminders due within 1 hour
      if (!status.isDueWithin1Hour) return;

      const pushNotificationKey = `push-due-soon-${interactionId}`;
      
      // Check if we've shown this push notification recently
      if (recentlyShownPushNotifications.current.has(pushNotificationKey)) return;
      
      // Only show push notification if app is in background
      if (!isInBackground.current) return;
      
      recentlyShownPushNotifications.current.add(pushNotificationKey);

      const hoursUntilDue = Math.round(status.hoursUntilDue);
      const timeText = hoursUntilDue === 1 ? '1 hour' : `${hoursUntilDue} hours`;

      sendNotification({
        title: '⏰ Reminder Due Soon',
        body: `${contact.name}: ${interaction.type} — Due in ${timeText}`,
        tag: `reminder-due-soon-${interactionId}`,
        requireInteraction: false,
        data: {
          interactionId,
          contactName: contact.name,
          onClick: () => {
            // Focus the app and navigate to the reminder
            window.focus();
            // Could navigate to specific reminder page here
          },
        },
      });
    });
  }, [dueSoonReminders, interactions, contacts, sendNotification, enabled, isEnabled]);

  return null; // This component doesn't render anything
} 