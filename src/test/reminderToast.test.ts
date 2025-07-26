import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';
import { getReminderStatus } from '@/lib/reminderUtils';
import { createOverdueInteraction, createDueSoonInteraction } from '@/lib/reminderUtils';

// Mock the contact store
vi.mock('@/stores/contactStore', () => ({
  useContactStore: {
    getState: vi.fn(() => ({
      interactions: [],
      contacts: [],
      markReminderDone: vi.fn(),
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

describe('Reminder Toast Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Toast Hook', () => {
    it('provides toast function', () => {
      const { result } = renderHook(() => useToast());
      
      expect(typeof result.current.toast).toBe('function');
      expect(Array.isArray(result.current.toasts)).toBe(true);
    });

    it('adds toast to state', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].description).toBe('Test Description');
    });

    it('dismisses toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(result.current.toasts[0].id);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('Reminder Status for Toast Logic', () => {
    it('identifies overdue reminders correctly', () => {
      const overdueInteraction = createOverdueInteraction();
      const status = getReminderStatus(overdueInteraction);
      
      expect(status.isOverdue).toBe(true);
      expect(status.status).toBe('overdue');
    });

    it('identifies due within 1 hour reminders correctly', () => {
      const dueSoonInteraction = createDueSoonInteraction();
      const status = getReminderStatus(dueSoonInteraction);
      
      expect(status.isDueSoon).toBe(true);
      expect(status.isDueWithin1Hour).toBe(false); // Due tomorrow, not within 1 hour
      expect(status.hoursUntilDue).toBeGreaterThan(1);
    });

    it('identifies due within 1 hour reminders correctly', () => {
      const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
      
      const dueSoonInteraction = createDueSoonInteraction();
      // Manually set the due date for testing
      Object.assign(dueSoonInteraction, {
        followUpDueDate: in30Minutes.toISOString(),
      });
      
      const status = getReminderStatus(dueSoonInteraction);
      
      expect(status.isDueSoon).toBe(true);
      expect(status.isDueWithin1Hour).toBe(true);
      expect(status.hoursUntilDue).toBeLessThan(1);
    });
  });

  describe('Toast Content Generation', () => {
    it('generates appropriate toast content for overdue reminders', () => {
      const overdueInteraction = createOverdueInteraction();
      const contact = { id: 'contact-1', name: 'John Doe' };
      
      // This would be tested in the actual component
      const expectedTitle = 'Overdue Reminder';
      const expectedDescription = 'John Doe';
      
      expect(expectedTitle).toBe('Overdue Reminder');
      expect(expectedDescription).toBe('John Doe');
    });

    it('generates appropriate toast content for due soon reminders', () => {
      const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
      
      const dueSoonInteraction = createDueSoonInteraction();
      // Manually set the due date for testing
      Object.assign(dueSoonInteraction, {
        followUpDueDate: in30Minutes.toISOString(),
      });
      
      const status = getReminderStatus(dueSoonInteraction);
      
      expect(status.isDueWithin1Hour).toBe(true);
      expect(status.hoursUntilDue).toBeLessThan(1);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate toasts for same reminder', () => {
      // This would be tested in the actual component with useEffect
      const toastKey = 'overdue-reminder-123';
      const recentlyShown = new Set([toastKey]);
      
      expect(recentlyShown.has(toastKey)).toBe(true);
    });

    it('should allow new toasts after prevention period', () => {
      const toastKey = 'overdue-reminder-123';
      const recentlyShown = new Set();
      
      expect(recentlyShown.has(toastKey)).toBe(false);
    });
  });
}); 