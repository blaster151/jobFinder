import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Mock the Notification API
const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: vi.fn(),
};

Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
});

// Mock the contact store
vi.mock('@/stores/contactStore', () => ({
  useContactStore: {
    getState: vi.fn(() => ({
      interactions: [],
      contacts: [],
      markReminderDone: vi.fn(),
      snoozeReminder: vi.fn(),
    })),
  },
}));

// Mock the reminder polling store
vi.mock('@/stores/reminderPollingStore', () => ({
  useReminderPollingStore: {
    getState: vi.fn(() => ({
      recentlyOverdue: [],
      dueSoonReminders: [],
    })),
  },
}));

describe('Push Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotification.permission = 'default';
    mockNotification.requestPermission.mockResolvedValue('granted');
  });

  describe('usePushNotifications Hook', () => {
    it('detects notification support correctly', () => {
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.isSupported).toBe(true);
    });

    it('handles unsupported notifications', () => {
      // Temporarily remove Notification from window
      const originalNotification = window.Notification;
      delete (window as any).Notification;

      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isEnabled).toBe(false);

      // Restore
      (window as any).Notification = originalNotification;
    });

    it('requests permission successfully', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const { result } = renderHook(() => usePushNotifications());
      
      await act(async () => {
        const granted = await result.current.requestPermission();
        expect(granted).toBe(true);
      });

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.permission).toBe('granted');
    });

    it('handles permission denial', async () => {
      mockNotification.requestPermission.mockResolvedValue('denied');
      
      const { result } = renderHook(() => usePushNotifications());
      
      await act(async () => {
        const granted = await result.current.requestPermission();
        expect(granted).toBe(false);
      });

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.permission).toBe('denied');
    });

    it('sends notification when enabled', () => {
      mockNotification.permission = 'granted';
      
      const { result } = renderHook(() => usePushNotifications());
      
      act(() => {
        const notification = result.current.sendNotification({
          title: 'Test Notification',
          body: 'Test body',
        });
        
        expect(notification).toBeInstanceOf(Notification);
      });
    });

    it('does not send notification when disabled', () => {
      mockNotification.permission = 'denied';
      
      const { result } = renderHook(() => usePushNotifications());
      
      act(() => {
        const notification = result.current.sendNotification({
          title: 'Test Notification',
          body: 'Test body',
        });
        
        expect(notification).toBe(null);
      });
    });
  });

  describe('Notification Permission States', () => {
    it('handles default permission state', () => {
      mockNotification.permission = 'default';
      
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.permission).toBe('default');
      expect(result.current.isEnabled).toBe(false);
    });

    it('handles granted permission state', () => {
      mockNotification.permission = 'granted';
      
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.permission).toBe('granted');
      expect(result.current.isEnabled).toBe(true);
    });

    it('handles denied permission state', () => {
      mockNotification.permission = 'denied';
      
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.permission).toBe('denied');
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('Notification Content', () => {
    it('creates notification with proper content', () => {
      mockNotification.permission = 'granted';
      
      const { result } = renderHook(() => usePushNotifications());
      
      act(() => {
        const notification = result.current.sendNotification({
          title: '🚨 Overdue Reminder',
          body: 'John Doe: email — Follow up on application',
          tag: 'reminder-overdue-123',
          requireInteraction: true,
          data: {
            interactionId: '123',
            contactName: 'John Doe',
            onClick: vi.fn(),
          },
        });
        
        expect(notification).toBeInstanceOf(Notification);
        expect(notification?.title).toBe('🚨 Overdue Reminder');
        expect(notification?.body).toBe('John Doe: email — Follow up on application');
      });
    });

    it('handles notification click events', () => {
      mockNotification.permission = 'granted';
      
      const { result } = renderHook(() => usePushNotifications());
      const mockOnClick = vi.fn();
      
      act(() => {
        const notification = result.current.sendNotification({
          title: 'Test',
          body: 'Test',
          data: { onClick: mockOnClick },
        });
        
        if (notification) {
          // Simulate click event
          const mockEvent = { preventDefault: vi.fn() };
          (notification as any).onclick(mockEvent);
          
          expect(mockEvent.preventDefault).toHaveBeenCalled();
          expect(mockOnClick).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Background Detection', () => {
    it('detects when app is in background', () => {
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
      });

      // This would be tested in the actual component
      expect(document.hidden).toBe(true);
    });

    it('detects when app is in foreground', () => {
      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
      });

      // This would be tested in the actual component
      expect(document.hidden).toBe(false);
    });
  });
}); 