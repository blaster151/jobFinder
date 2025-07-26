import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getReminderStatus,
  getRemindersByStatus,
  clearStatusCache,
  getStatusCacheStats,
  createTestInteraction,
  createOverdueInteraction,
  createDueSoonInteraction,
  createDoneInteraction,
  type ReminderStatus,
} from '@/lib/reminderUtils';

describe('Reminder Utils', () => {
  beforeEach(() => {
    clearStatusCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getReminderStatus', () => {
    it('marks reminder as overdue if past dueDate and not done', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const interaction = createTestInteraction({
        followUpDueDate: yesterday.toISOString(),
        isDone: false,
      });

      const status = getReminderStatus(interaction);

      expect(status.isOverdue).toBe(true);
      expect(status.status).toBe('overdue');
      expect(status.isActive).toBe(true);
    });

    it('flags reminder as due soon if within 24h threshold', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const interaction = createTestInteraction({
        followUpDueDate: tomorrow.toISOString(),
        isDone: false,
      });

      const status = getReminderStatus(interaction);

      expect(status.isDueSoon).toBe(true);
      expect(status.status).toBe('due-soon');
      expect(status.hoursUntilDue).toBeLessThan(24);
      expect(status.hoursUntilDue).toBeGreaterThan(0);
    });

    it('does not update status for reminders marked done', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const interaction = createTestInteraction({
        followUpDueDate: yesterday.toISOString(),
        isDone: true,
      });

      const status = getReminderStatus(interaction);

      expect(status.isOverdue).toBe(false);
      expect(status.isDueSoon).toBe(false);
      expect(status.isDueToday).toBe(false);
      expect(status.isActive).toBe(false);
      expect(status.status).toBe('done');
    });

    it('marks reminder as due today if due date is today', () => {
      const today = new Date();
      today.setHours(18, 0, 0, 0); // 6 PM today
      
      const interaction = createTestInteraction({
        followUpDueDate: today.toISOString(),
        isDone: false,
      });

      const status = getReminderStatus(interaction);

      expect(status.isDueToday).toBe(true);
      expect(status.isDueSoon).toBe(true);
      expect(status.status).toBe('due-soon');
    });

    it('marks reminder as upcoming if due date is more than 24h away', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const interaction = createTestInteraction({
        followUpDueDate: nextWeek.toISOString(),
        isDone: false,
      });

      const status = getReminderStatus(interaction);

      expect(status.isDueSoon).toBe(false);
      expect(status.isOverdue).toBe(false);
      expect(status.status).toBe('upcoming');
      expect(status.daysUntilDue).toBeGreaterThan(1);
    });

    it('handles reminders without due date', () => {
      const interaction = createTestInteraction({
        followUpDueDate: undefined,
        isDone: false,
      });

      const status = getReminderStatus(interaction);

      expect(status.isActive).toBe(false);
      expect(status.status).toBe('upcoming');
      expect(status.daysUntilDue).toBe(Infinity);
    });

    it('handles reminders without followUpRequired', () => {
      const interaction = createTestInteraction({
        followUpRequired: false,
        isDone: false,
      });

      const status = getReminderStatus(interaction);

      expect(status.isActive).toBe(false);
      expect(status.status).toBe('upcoming');
    });
  });

  describe('getRemindersByStatus', () => {
    it('categorizes reminders correctly by status', () => {
      const overdue = createOverdueInteraction();
      const dueSoon = createDueSoonInteraction();
      const done = createDoneInteraction();
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcoming = createTestInteraction({
        followUpDueDate: nextWeek.toISOString(),
      });

      const interactions = [overdue, dueSoon, done, upcoming];
      const categorized = getRemindersByStatus(interactions);

      expect(categorized.overdue).toHaveLength(1);
      expect(categorized.overdue[0].id).toBe(overdue.id);
      
      expect(categorized.dueSoon).toHaveLength(1);
      expect(categorized.dueSoon[0].id).toBe(dueSoon.id);
      
      expect(categorized.done).toHaveLength(1);
      expect(categorized.done[0].id).toBe(done.id);
      
      expect(categorized.upcoming).toHaveLength(1);
      expect(categorized.upcoming[0].id).toBe(upcoming.id);
    });

    it('handles empty interactions array', () => {
      const categorized = getRemindersByStatus([]);

      expect(categorized.overdue).toHaveLength(0);
      expect(categorized.dueSoon).toHaveLength(0);
      expect(categorized.dueToday).toHaveLength(0);
      expect(categorized.upcoming).toHaveLength(0);
      expect(categorized.done).toHaveLength(0);
    });
  });

  describe('Caching', () => {
    it('caches status results and returns cached value', () => {
      const interaction = createTestInteraction();
      
      // First call should compute and cache
      const status1 = getReminderStatus(interaction);
      const cacheStats1 = getStatusCacheStats();
      
      expect(cacheStats1.size).toBe(1);
      
      // Second call should return cached value
      const status2 = getReminderStatus(interaction);
      const cacheStats2 = getStatusCacheStats();
      
      expect(cacheStats2.size).toBe(1);
      expect(status1).toEqual(status2);
    });

    it('creates new cache entry when interaction changes', () => {
      const interaction1 = createTestInteraction({ id: '1' });
      const interaction2 = createTestInteraction({ id: '2' });
      
      getReminderStatus(interaction1);
      getReminderStatus(interaction2);
      
      const cacheStats = getStatusCacheStats();
      expect(cacheStats.size).toBe(2);
    });

    it('clears cache when clearStatusCache is called', () => {
      const interaction = createTestInteraction();
      
      getReminderStatus(interaction);
      expect(getStatusCacheStats().size).toBe(1);
      
      clearStatusCache();
      expect(getStatusCacheStats().size).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    it('createTestInteraction creates valid interaction with defaults', () => {
      const interaction = createTestInteraction();
      
      expect(interaction.id).toBe('test-id');
      expect(interaction.contactId).toBe('test-contact-id');
      expect(interaction.type).toBe('email');
      expect(interaction.followUpRequired).toBe(true);
      expect(interaction.isDone).toBe(false);
      expect(interaction.tags).toEqual([]);
    });

    it('createTestInteraction allows overriding properties', () => {
      const interaction = createTestInteraction({
        id: 'custom-id',
        isDone: true,
        tags: ['urgent', 'follow-up'],
      });
      
      expect(interaction.id).toBe('custom-id');
      expect(interaction.isDone).toBe(true);
      expect(interaction.tags).toEqual(['urgent', 'follow-up']);
    });

    it('createOverdueInteraction creates overdue reminder', () => {
      const interaction = createOverdueInteraction();
      const status = getReminderStatus(interaction);
      
      expect(status.isOverdue).toBe(true);
      expect(status.status).toBe('overdue');
    });

    it('createDueSoonInteraction creates due soon reminder', () => {
      const interaction = createDueSoonInteraction();
      const status = getReminderStatus(interaction);
      
      expect(status.isDueSoon).toBe(true);
      expect(status.status).toBe('due-soon');
    });

    it('createDoneInteraction creates done reminder', () => {
      const interaction = createDoneInteraction();
      const status = getReminderStatus(interaction);
      
      expect(status.status).toBe('done');
    });
  });

  describe('Edge Cases', () => {
    it('handles exact due date (not overdue)', () => {
      const now = new Date();
      const interaction = createTestInteraction({
        followUpDueDate: now.toISOString(),
      });

      const status = getReminderStatus(interaction);

      expect(status.isOverdue).toBe(false);
      expect(status.isDueSoon).toBe(true);
    });

    it('handles due date exactly 24 hours from now', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const now = new Date(); // Re-declare now to get current time
      tomorrow.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      const interaction = createTestInteraction({
        followUpDueDate: tomorrow.toISOString(),
      });

      const status = getReminderStatus(interaction);

      expect(status.isDueSoon).toBe(true);
      expect(status.hoursUntilDue).toBeCloseTo(24, 0);
    });

    it('handles invalid date strings gracefully', () => {
      const interaction = createTestInteraction({
        followUpDueDate: 'invalid-date',
      });

      // Should not throw, but may have unexpected behavior
      expect(() => getReminderStatus(interaction)).not.toThrow();
    });
  });
}); 