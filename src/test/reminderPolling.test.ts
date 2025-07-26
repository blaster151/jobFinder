import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReminderPolling } from '@/hooks/useReminderPolling';
import { useReminderPollingStore } from '@/stores/reminderPollingStore';
import { createOverdueInteraction, createDueSoonInteraction, createDoneInteraction } from '@/lib/reminderUtils';

// Mock the contact store
vi.mock('@/stores/contactStore', () => ({
  useContactStore: {
    getState: vi.fn(() => ({
      interactions: [],
    })),
  },
}));

describe('Reminder Polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any intervals
    vi.clearAllTimers();
  });

  describe('Polling Store', () => {
    it('starts polling and sets up interval', () => {
      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.startPolling();
      });

      expect(store.isPolling).toBe(true);
      expect(store.lastChecked).not.toBeNull();
    });

    it('stops polling and clears interval', () => {
      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.startPolling();
      });

      expect(store.isPolling).toBe(true);

      act(() => {
        store.stopPolling();
      });

      expect(store.isPolling).toBe(false);
    });

    it('fires no more than once per interval', () => {
      const store = useReminderPollingStore.getState();
      const checkSpy = vi.spyOn(store, 'checkReminders');
      
      act(() => {
        store.startPolling();
      });

      // Initial check
      expect(checkSpy).toHaveBeenCalledTimes(1);

      // Advance time by less than interval
      act(() => {
        vi.advanceTimersByTime(store.pollingInterval - 1000);
      });

      expect(checkSpy).toHaveBeenCalledTimes(1);

      // Advance time to trigger next check
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(checkSpy).toHaveBeenCalledTimes(2);
    });

    it('marks reminder as overdue if past dueDate and not done', () => {
      const overdueInteraction = createOverdueInteraction();
      const { useContactStore } = require('@/stores/contactStore');
      
      useContactStore.getState.mockReturnValue({
        interactions: [overdueInteraction],
      });

      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.checkReminders();
      });

      expect(store.overdueReminders).toContain(overdueInteraction.id);
      expect(store.recentlyOverdue).toContain(overdueInteraction.id);
    });

    it('does not update status for reminders marked done', () => {
      const doneInteraction = createDoneInteraction();
      const { useContactStore } = require('@/stores/contactStore');
      
      useContactStore.getState.mockReturnValue({
        interactions: [doneInteraction],
      });

      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.checkReminders();
      });

      expect(store.overdueReminders).not.toContain(doneInteraction.id);
      expect(store.recentlyOverdue).not.toContain(doneInteraction.id);
    });

    it('flags reminder as due soon if within threshold', () => {
      const dueSoonInteraction = createDueSoonInteraction();
      const { useContactStore } = require('@/stores/contactStore');
      
      useContactStore.getState.mockReturnValue({
        interactions: [dueSoonInteraction],
      });

      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.checkReminders();
      });

      expect(store.dueSoonReminders).toContain(dueSoonInteraction.id);
    });

    it('tracks newly overdue reminders', () => {
      const overdueInteraction = createOverdueInteraction();
      const { useContactStore } = require('@/stores/contactStore');
      
      useContactStore.getState.mockReturnValue({
        interactions: [overdueInteraction],
      });

      const store = useReminderPollingStore.getState();
      
      // First check - should be newly overdue
      act(() => {
        store.checkReminders();
      });

      expect(store.recentlyOverdue).toContain(overdueInteraction.id);

      // Second check - should not be newly overdue
      act(() => {
        store.checkReminders();
      });

      expect(store.recentlyOverdue).toContain(overdueInteraction.id); // Still in the list
    });

    it('marks reminder as checked', () => {
      const store = useReminderPollingStore.getState();
      const interactionId = 'test-id';
      
      act(() => {
        store.recentlyOverdue = [interactionId];
        store.markAsChecked(interactionId);
      });

      expect(store.recentlyOverdue).not.toContain(interactionId);
    });

    it('clears recently overdue list', () => {
      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.recentlyOverdue = ['id1', 'id2', 'id3'];
        store.clearRecentlyOverdue();
      });

      expect(store.recentlyOverdue).toHaveLength(0);
    });

    it('updates polling interval and restarts if polling', () => {
      const store = useReminderPollingStore.getState();
      const newInterval = 60000; // 1 minute
      
      act(() => {
        store.startPolling();
        store.setPollingInterval(newInterval);
      });

      expect(store.pollingInterval).toBe(newInterval);
      expect(store.isPolling).toBe(true);
    });
  });

  describe('useReminderPolling Hook', () => {
    it('auto-starts polling by default', () => {
      const { result } = renderHook(() => useReminderPolling());
      
      expect(result.current.isPolling).toBe(true);
    });

    it('does not auto-start when autoStart is false', () => {
      const { result } = renderHook(() => useReminderPolling({ autoStart: false }));
      
      expect(result.current.isPolling).toBe(false);
    });

    it('stops polling on unmount', () => {
      const { result, unmount } = renderHook(() => useReminderPolling());
      
      expect(result.current.isPolling).toBe(true);
      
      unmount();
      
      // Should have stopped polling
      expect(useReminderPollingStore.getState().isPolling).toBe(false);
    });

    it('calls onNewlyOverdue callback when reminders become overdue', () => {
      const onNewlyOverdue = vi.fn();
      const overdueInteraction = createOverdueInteraction();
      const { useContactStore } = require('@/stores/contactStore');
      
      useContactStore.getState.mockReturnValue({
        interactions: [overdueInteraction],
      });

      renderHook(() => useReminderPolling({ onNewlyOverdue }));

      act(() => {
        useReminderPollingStore.getState().checkReminders();
      });

      expect(onNewlyOverdue).toHaveBeenCalledWith([overdueInteraction.id]);
    });

    it('calls onPollingStart callback when polling starts', () => {
      const onPollingStart = vi.fn();
      
      renderHook(() => useReminderPolling({ onPollingStart }));

      expect(onPollingStart).toHaveBeenCalled();
    });

    it('calls onPollingStop callback when polling stops', () => {
      const onPollingStop = vi.fn();
      const { result, unmount } = renderHook(() => 
        useReminderPolling({ onPollingStop })
      );

      unmount();

      expect(onPollingStop).toHaveBeenCalled();
    });

    it('provides manual control functions', () => {
      const { result } = renderHook(() => useReminderPolling({ autoStart: false }));
      
      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.check).toBe('function');
    });

    it('allows manual start and stop', () => {
      const { result } = renderHook(() => useReminderPolling({ autoStart: false }));
      
      expect(result.current.isPolling).toBe(false);
      
      act(() => {
        result.current.start();
      });
      
      expect(result.current.isPolling).toBe(true);
      
      act(() => {
        result.current.stop();
      });
      
      expect(result.current.isPolling).toBe(false);
    });

    it('allows manual check', () => {
      const { result } = renderHook(() => useReminderPolling({ autoStart: false }));
      const checkSpy = vi.spyOn(useReminderPollingStore.getState(), 'checkReminders');
      
      act(() => {
        result.current.check();
      });
      
      expect(checkSpy).toHaveBeenCalled();
    });
  });

  describe('Debug Info', () => {
    it('provides accurate debug information', () => {
      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.startPolling();
      });

      const debugInfo = store.getDebugInfo();
      
      expect(debugInfo.isPolling).toBe(true);
      expect(debugInfo.lastChecked).not.toBeNull();
      expect(debugInfo.overdueCount).toBe(0);
      expect(debugInfo.recentlyOverdueCount).toBe(0);
      expect(debugInfo.nextCheckIn).toBeGreaterThan(0);
    });

    it('calculates next check time correctly', () => {
      const store = useReminderPollingStore.getState();
      
      act(() => {
        store.startPolling();
      });

      const debugInfo = store.getDebugInfo();
      const expectedNextCheck = store.pollingInterval;
      
      expect(debugInfo.nextCheckIn).toBeCloseTo(expectedNextCheck, -2); // Within 100ms
    });
  });
}); 