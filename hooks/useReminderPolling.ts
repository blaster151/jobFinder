import { useEffect, useRef } from 'react';
import { useReminderPollingStore } from '@/stores/reminderPollingStore';

interface UseReminderPollingOptions {
  autoStart?: boolean;
  interval?: number; // in milliseconds
  onNewlyOverdue?: (interactionIds: string[]) => void;
  onPollingStart?: () => void;
  onPollingStop?: () => void;
}

export function useReminderPolling(options: UseReminderPollingOptions = {}) {
  const {
    autoStart = true,
    interval,
    onNewlyOverdue,
    onPollingStart,
    onPollingStop,
  } = options;

  const {
    isPolling,
    lastChecked,
    pollingInterval,
    overdueReminders,
    dueSoonReminders,
    dueTodayReminders,
    recentlyOverdue,
    startPolling,
    stopPolling,
    setPollingInterval,
    checkReminders,
    markAsChecked,
    clearRecentlyOverdue,
    getDebugInfo,
  } = useReminderPollingStore();

  const prevRecentlyOverdueRef = useRef<string[]>([]);
  const isInitializedRef = useRef(false);

  // Set custom interval if provided
  useEffect(() => {
    if (interval && interval !== pollingInterval) {
      setPollingInterval(interval);
    }
  }, [interval, pollingInterval, setPollingInterval]);

  // Auto-start polling
  useEffect(() => {
    if (autoStart && !isPolling && !isInitializedRef.current) {
      startPolling();
      isInitializedRef.current = true;
      onPollingStart?.();
    }
  }, [autoStart, isPolling, startPolling, onPollingStart]);

  // Handle newly overdue reminders
  useEffect(() => {
    const prevRecentlyOverdue = prevRecentlyOverdueRef.current;
    const newlyOverdue = recentlyOverdue.filter(
      id => !prevRecentlyOverdue.includes(id)
    );

    if (newlyOverdue.length > 0 && onNewlyOverdue) {
      onNewlyOverdue(newlyOverdue);
    }

    prevRecentlyOverdueRef.current = recentlyOverdue;
  }, [recentlyOverdue, onNewlyOverdue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPolling) {
        stopPolling();
        onPollingStop?.();
      }
    };
  }, [isPolling, stopPolling, onPollingStop]);

  // Manual control functions
  const start = () => {
    if (!isPolling) {
      startPolling();
      onPollingStart?.();
    }
  };

  const stop = () => {
    if (isPolling) {
      stopPolling();
      onPollingStop?.();
    }
  };

  const check = () => {
    checkReminders();
  };

  return {
    // State
    isPolling,
    lastChecked,
    pollingInterval,
    overdueReminders,
    dueSoonReminders,
    dueTodayReminders,
    recentlyOverdue,
    
    // Actions
    start,
    stop,
    check,
    markAsChecked,
    clearRecentlyOverdue,
    
    // Debug
    getDebugInfo,
  };
} 