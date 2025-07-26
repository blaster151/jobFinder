import { useState, useEffect, useCallback, useMemo } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { notificationService } from '@/lib/services/notificationService';
import { useReminderPolling } from '@/hooks/useReminderPolling';

interface UseNotificationManagerOptions {
  autoHide?: boolean;
  autoHideDelay?: number;
  onNotificationShow?: (count: number) => void;
  onNotificationHide?: () => void;
}

export function useNotificationManager(options: UseNotificationManagerOptions = {}) {
  const {
    autoHide = true,
    autoHideDelay,
    onNotificationShow,
    onNotificationHide,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { interactions, contacts } = useContactStore();
  
  const { recentlyOverdue, markAsChecked, clearRecentlyOverdue } = useReminderPolling({
    onNewlyOverdue: (ids) => {
      const count = notificationService.getNotificationCount(ids);
      setNotificationCount(count);
      setIsVisible(true);
      onNotificationShow?.(count);
      
      // Auto-hide if enabled
      if (autoHide) {
        const delay = autoHideDelay || notificationService.getAutoHideDelay();
        setTimeout(() => {
          setIsVisible(false);
          onNotificationHide?.();
        }, delay);
      }
    },
  });

  const overdueReminders = useMemo(() => {
    return notificationService.getOverdueRemindersData(
      recentlyOverdue,
      interactions,
      contacts
    );
  }, [recentlyOverdue, interactions, contacts]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onNotificationHide?.();
  }, [onNotificationHide]);

  const handleMarkDone = useCallback((interactionId: string) => {
    markAsChecked(interactionId);
    const newCount = notificationService.getNotificationCount(
      notificationService.markAsChecked(interactionId, recentlyOverdue)
    );
    setNotificationCount(newCount);
    
    if (newCount <= 0) {
      setIsVisible(false);
      onNotificationHide?.();
    }
  }, [markAsChecked, recentlyOverdue, onNotificationHide]);

  const handleDismissAll = useCallback(() => {
    clearRecentlyOverdue();
    setIsVisible(false);
    setNotificationCount(0);
    onNotificationHide?.();
  }, [clearRecentlyOverdue, onNotificationHide]);

  const shouldShow = useMemo(() => {
    return notificationService.shouldShowNotification(recentlyOverdue) && isVisible;
  }, [recentlyOverdue, isVisible]);

  return {
    // State
    isVisible: shouldShow,
    notificationCount,
    overdueReminders,
    
    // Actions
    handleDismiss,
    handleMarkDone,
    handleDismissAll,
    
    // Utility
    hasNotifications: () => notificationCount > 0,
    getNotificationCount: () => notificationCount,
  };
} 