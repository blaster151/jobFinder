'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isEnabled: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSupported: false,
    isEnabled: false,
  });

  // Check if notifications are supported
  useEffect(() => {
    const isSupported = 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'denied';
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission,
      isEnabled: permission === 'granted',
    }));
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const isEnabled = permission === 'granted';
      
      setState(prev => ({
        ...prev,
        permission,
        isEnabled,
      }));

      return isEnabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  // Send notification
  const sendNotification = useCallback((options: PushNotificationOptions): Notification | null => {
    if (!state.isSupported || !state.isEnabled) {
      console.warn('Notifications not available or not enabled');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Handle action clicks
        if (options.data?.onClick) {
          options.data.onClick();
        }
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [state.isSupported, state.isEnabled]);

  // Close all notifications
  const closeAllNotifications = useCallback(() => {
    if (state.isSupported) {
      // Note: Service Worker notifications are not widely supported
      // This is a simplified implementation
      console.log('Close all notifications called');
    }
  }, [state.isSupported]);

  return {
    ...state,
    requestPermission,
    sendNotification,
    closeAllNotifications,
  };
} 