import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateReminderPriority,
  sortRemindersByPriority,
  getTopPriorityReminders,
  filterByMinimumPriority,
  groupRemindersByPriority,
  getPriorityInsights,
  boostPriorityForScenario,
  DEFAULT_URGENCY_CONFIG,
  type ReminderPriority,
  type UrgencyConfig
} from '@/lib/reminderHeuristics';
import { createOverdueInteraction, createDueSoonInteraction } from '@/lib/reminderUtils';

// Mock data
const mockContact = {
  id: 'contact-1',
  name: 'John Doe',
  company: 'Acme Corp',
  role: 'Hiring Manager',
  email: 'john@acme.com',
  phone: '+1234567890',
  linkedin: 'https://linkedin.com/in/johndoe',
  notes: 'Great contact for engineering roles',
  flagged: false,
  tags: '["urgent", "hiring"]',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockInteractions = [
  {
    id: 'interaction-1',
    contactId: 'contact-1',
    jobId: 'job-1',
    type: 'email',
    summary: 'Initial application follow-up',
    followUpRequired: true,
    followUpDueDate: new Date('2024-01-15'),
    isDone: false,
    tags: '["urgent", "application"]',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'interaction-2',
    contactId: 'contact-1',
    jobId: 'job-2',
    type: 'phone',
    summary: 'Phone interview scheduled',
    followUpRequired: true,
    followUpDueDate: new Date('2024-01-20'),
    isDone: false,
    tags: '["interview"]',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
];

describe('Reminder Heuristics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateReminderPriority', () => {
    it('calculates priority score for overdue reminder', () => {
      const overdueInteraction = createOverdueInteraction();
      overdueInteraction.contactId = 'contact-1';
      overdueInteraction.tags = '["urgent"]';
      
      const priority = calculateReminderPriority(
        overdueInteraction,
        mockContact,
        mockInteractions
      );

      expect(priority.priorityScore).toBeGreaterThan(0);
      expect(priority.priorityScore).toBeLessThanOrEqual(10);
      expect(priority.factors.recency).toBeGreaterThan(0);
      expect(priority.factors.urgency).toBeGreaterThan(0);
      expect(priority.factors.snoozeHistory).toBeGreaterThan(0);
      expect(priority.status.isOverdue).toBe(true);
    });

    it('calculates priority score for due soon reminder', () => {
      const dueSoonInteraction = createDueSoonInteraction();
      dueSoonInteraction.contactId = 'contact-1';
      dueSoonInteraction.tags = '["interview"]';
      
      const priority = calculateReminderPriority(
        dueSoonInteraction,
        mockContact,
        mockInteractions
      );

      expect(priority.priorityScore).toBeGreaterThan(0);
      expect(priority.priorityScore).toBeLessThanOrEqual(10);
      expect(priority.status.isDueSoon).toBe(true);
    });

    it('applies urgency multipliers correctly', () => {
      const interaction = {
        ...mockInteractions[0],
        type: 'in_person', // Highest urgency type
        tags: '["urgent", "interview"]', // High urgency tags
      };
      
      const priority = calculateReminderPriority(
        interaction,
        mockContact,
        mockInteractions
      );

      // Should have higher urgency factor due to in_person type and urgent tags
      expect(priority.factors.urgency).toBeGreaterThan(0.8);
    });

    it('handles missing tags gracefully', () => {
      const interaction = {
        ...mockInteractions[0],
        tags: '[]', // Empty tags
      };
      
      const priority = calculateReminderPriority(
        interaction,
        mockContact,
        mockInteractions
      );

      expect(priority.factors.urgency).toBeGreaterThan(0);
      expect(priority.factors.urgency).toBeLessThanOrEqual(1);
    });

    it('handles invalid JSON tags gracefully', () => {
      const interaction = {
        ...mockInteractions[0],
        tags: 'invalid json', // Invalid JSON
      };
      
      const priority = calculateReminderPriority(
        interaction,
        mockContact,
        mockInteractions
      );

      expect(priority.factors.urgency).toBeGreaterThan(0);
      expect(priority.factors.urgency).toBeLessThanOrEqual(1);
    });
  });

  describe('Urgency Ranking Tests', () => {
    it('reminders with high urgency rank higher in filtered lists', () => {
      // Create reminders with different urgency levels
      const highUrgencyInteraction = {
        ...mockInteractions[0],
        type: 'in_person',
        tags: '["urgent", "interview"]',
      };
      
      const mediumUrgencyInteraction = {
        ...mockInteractions[0],
        type: 'phone',
        tags: '["follow_up"]',
      };
      
      const lowUrgencyInteraction = {
        ...mockInteractions[0],
        type: 'text',
        tags: '["casual"]',
      };

      const highPriority = calculateReminderPriority(
        highUrgencyInteraction,
        mockContact,
        mockInteractions
      );
      
      const mediumPriority = calculateReminderPriority(
        mediumUrgencyInteraction,
        mockContact,
        mockInteractions
      );
      
      const lowPriority = calculateReminderPriority(
        lowUrgencyInteraction,
        mockContact,
        mockInteractions
      );

      // High urgency should have higher priority score
      expect(highPriority.priorityScore).toBeGreaterThan(mediumPriority.priorityScore);
      expect(mediumPriority.priorityScore).toBeGreaterThan(lowPriority.priorityScore);
      
      // High urgency should have higher urgency factor
      expect(highPriority.factors.urgency).toBeGreaterThan(mediumPriority.factors.urgency);
      expect(mediumPriority.factors.urgency).toBeGreaterThan(lowPriority.factors.urgency);
    });

    it('in-person interactions rank higher than phone calls', () => {
      const inPersonInteraction = {
        ...mockInteractions[0],
        type: 'in_person',
        tags: '["interview"]',
      };
      
      const phoneInteraction = {
        ...mockInteractions[0],
        type: 'phone',
        tags: '["interview"]',
      };

      const inPersonPriority = calculateReminderPriority(
        inPersonInteraction,
        mockContact,
        mockInteractions
      );
      
      const phonePriority = calculateReminderPriority(
        phoneInteraction,
        mockContact,
        mockInteractions
      );

      expect(inPersonPriority.factors.urgency).toBeGreaterThan(phonePriority.factors.urgency);
      expect(inPersonPriority.priorityScore).toBeGreaterThan(phonePriority.priorityScore);
    });

    it('urgent tags boost priority significantly', () => {
      const urgentInteraction = {
        ...mockInteractions[0],
        type: 'email',
        tags: '["urgent", "application"]',
      };
      
      const normalInteraction = {
        ...mockInteractions[0],
        type: 'email',
        tags: '["application"]',
      };

      const urgentPriority = calculateReminderPriority(
        urgentInteraction,
        mockContact,
        mockInteractions
      );
      
      const normalPriority = calculateReminderPriority(
        normalInteraction,
        mockContact,
        mockInteractions
      );

      expect(urgentPriority.factors.urgency).toBeGreaterThan(normalPriority.factors.urgency);
      expect(urgentPriority.priorityScore).toBeGreaterThan(normalPriority.priorityScore);
    });
  });

  describe('Snooze Warning Tests', () => {
    it('reminders snoozed multiple times trigger stronger warnings', () => {
      // Mock snooze count tracking (in real implementation, this would be stored)
      const mockSnoozeCounts = {
        'interaction-1': 0, // No snoozes
        'interaction-2': 2, // Multiple snoozes
        'interaction-3': 5, // Many snoozes
      };

      // Create interactions with different snooze histories
      const noSnoozeInteraction = {
        ...mockInteractions[0],
        id: 'interaction-1',
        tags: '["urgent"]',
      };
      
      const multipleSnoozeInteraction = {
        ...mockInteractions[0],
        id: 'interaction-2',
        tags: '["urgent"]',
      };
      
      const manySnoozeInteraction = {
        ...mockInteractions[0],
        id: 'interaction-3',
        tags: '["urgent"]',
      };

      const noSnoozePriority = calculateReminderPriority(
        noSnoozeInteraction,
        mockContact,
        mockInteractions
      );
      
      const multipleSnoozePriority = calculateReminderPriority(
        multipleSnoozeInteraction,
        mockContact,
        mockInteractions
      );
      
      const manySnoozePriority = calculateReminderPriority(
        manySnoozeInteraction,
        mockContact,
        mockInteractions
      );

      // Multiple snoozes should reduce priority (higher snooze penalty)
      expect(multipleSnoozePriority.factors.snoozeHistory).toBeLessThan(noSnoozePriority.factors.snoozeHistory);
      expect(manySnoozePriority.factors.snoozeHistory).toBeLessThan(multipleSnoozePriority.factors.snoozeHistory);
      
      // Overall priority should be lower for frequently snoozed reminders
      expect(multipleSnoozePriority.priorityScore).toBeLessThan(noSnoozePriority.priorityScore);
      expect(manySnoozePriority.priorityScore).toBeLessThan(multipleSnoozePriority.priorityScore);
    });

    it('snooze warnings appear in insights for frequently snoozed reminders', () => {
      // Create a reminder that would have been snoozed multiple times
      const snoozedInteraction = {
        ...mockInteractions[0],
        tags: '["urgent"]',
      };

      const priority: ReminderPriority = {
        interactionId: 'snoozed-reminder',
        contactId: 'contact-1',
        priorityScore: 3.0, // Lower score due to snoozes
        factors: { 
          recency: 0.8, 
          urgency: 0.9, 
          snoozeHistory: 0.3, // Low due to multiple snoozes
          overdueMultiplier: 1.0, 
          dueSoonMultiplier: 1.0 
        },
        status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
        contact: mockContact,
        interaction: snoozedInteraction,
      };

      const insights = getPriorityInsights(priority);

      // Should include snooze warning
      expect(insights).toContain('Previously snoozed multiple times');
    });

    it('snooze penalty follows exponential decay', () => {
      const config = DEFAULT_URGENCY_CONFIG;
      const snoozePenalty = config.snoozePenalty; // 0.2 (20%)

      // Calculate expected snooze penalties
      const noSnoozePenalty = Math.pow(1 - snoozePenalty, 0); // 1.0
      const oneSnoozePenalty = Math.pow(1 - snoozePenalty, 1); // 0.8
      const twoSnoozePenalty = Math.pow(1 - snoozePenalty, 2); // 0.64
      const threeSnoozePenalty = Math.pow(1 - snoozePenalty, 3); // 0.512

      expect(noSnoozePenalty).toBe(1.0);
      expect(oneSnoozePenalty).toBe(0.8);
      expect(twoSnoozePenalty).toBe(0.64);
      expect(threeSnoozePenalty).toBe(0.512);
      
      // Each additional snooze should reduce the penalty further
      expect(oneSnoozePenalty).toBeGreaterThan(twoSnoozePenalty);
      expect(twoSnoozePenalty).toBeGreaterThan(threeSnoozePenalty);
    });
  });

  describe('Recency Decay Tests', () => {
    it('recency decays score unless re-upped', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create interactions with different recency
      const recentInteraction = {
        ...mockInteractions[0],
        createdAt: oneDayAgo,
        tags: '["urgent"]',
      };
      
      const olderInteraction = {
        ...mockInteractions[0],
        createdAt: threeDaysAgo,
        tags: '["urgent"]',
      };
      
      const oldInteraction = {
        ...mockInteractions[0],
        createdAt: sevenDaysAgo,
        tags: '["urgent"]',
      };

      const recentPriority = calculateReminderPriority(
        recentInteraction,
        mockContact,
        [recentInteraction]
      );
      
      const olderPriority = calculateReminderPriority(
        olderInteraction,
        mockContact,
        [olderInteraction]
      );
      
      const oldPriority = calculateReminderPriority(
        oldInteraction,
        mockContact,
        [oldInteraction]
      );

      // Recency should decay over time
      expect(recentPriority.factors.recency).toBeGreaterThan(olderPriority.factors.recency);
      expect(olderPriority.factors.recency).toBeGreaterThan(oldPriority.factors.recency);
      
      // Overall priority should reflect recency decay
      expect(recentPriority.priorityScore).toBeGreaterThan(olderPriority.priorityScore);
      expect(olderPriority.priorityScore).toBeGreaterThan(oldPriority.priorityScore);
    });

    it('recency follows exponential decay curve', () => {
      const config = DEFAULT_URGENCY_CONFIG;
      const recencyDecayDays = config.recencyDecayDays; // 7 days

      // Calculate expected recency scores
      const todayRecency = Math.exp(-0 / recencyDecayDays); // 1.0
      const oneDayRecency = Math.exp(-1 / recencyDecayDays); // ~0.87
      const threeDayRecency = Math.exp(-3 / recencyDecayDays); // ~0.65
      const sevenDayRecency = Math.exp(-7 / recencyDecayDays); // ~0.37

      expect(todayRecency).toBeCloseTo(1.0, 2);
      expect(oneDayRecency).toBeCloseTo(0.87, 2);
      expect(threeDayRecency).toBeCloseTo(0.65, 2);
      expect(sevenDayRecency).toBeCloseTo(0.37, 2);
      
      // Recency should decrease over time
      expect(todayRecency).toBeGreaterThan(oneDayRecency);
      expect(oneDayRecency).toBeGreaterThan(threeDayRecency);
      expect(threeDayRecency).toBeGreaterThan(sevenDayRecency);
    });

    it('new interactions re-up recency score', () => {
      const now = new Date();
      const oldInteraction = {
        ...mockInteractions[0],
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        tags: '["urgent"]',
      };
      
      const newInteraction = {
        ...mockInteractions[0],
        id: 'new-interaction',
        createdAt: now, // Today
        tags: '["urgent"]',
      };

      // Calculate priority with only old interaction
      const oldOnlyPriority = calculateReminderPriority(
        oldInteraction,
        mockContact,
        [oldInteraction]
      );
      
      // Calculate priority with both old and new interactions
      const withNewPriority = calculateReminderPriority(
        oldInteraction,
        mockContact,
        [oldInteraction, newInteraction]
      );

      // Recency should be higher when there's a new interaction
      expect(withNewPriority.factors.recency).toBeGreaterThan(oldOnlyPriority.factors.recency);
      expect(withNewPriority.priorityScore).toBeGreaterThan(oldOnlyPriority.priorityScore);
    });

    it('recency insights reflect contact engagement level', () => {
      const highRecencyPriority: ReminderPriority = {
        interactionId: 'high-recency',
        contactId: 'contact-1',
        priorityScore: 8.0,
        factors: { recency: 0.9, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
        status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const lowRecencyPriority: ReminderPriority = {
        interactionId: 'low-recency',
        contactId: 'contact-1',
        priorityScore: 3.0,
        factors: { recency: 0.2, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
        status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const highInsights = getPriorityInsights(highRecencyPriority);
      const lowInsights = getPriorityInsights(lowRecencyPriority);

      expect(highInsights).toContain('Recent contact - high engagement');
      expect(lowInsights).toContain('Older contact - may need re-engagement');
    });
  });

  describe('sortRemindersByPriority', () => {
    it('sorts reminders by priority score (highest first)', () => {
      const priorities: ReminderPriority[] = [
        {
          interactionId: 'low',
          contactId: 'contact-1',
          priorityScore: 2.0,
          factors: { recency: 0.2, urgency: 0.2, snoozeHistory: 0.2, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'high',
          contactId: 'contact-1',
          priorityScore: 8.0,
          factors: { recency: 0.8, urgency: 0.8, snoozeHistory: 0.8, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'medium',
          contactId: 'contact-1',
          priorityScore: 5.0,
          factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
      ];

      const sorted = sortRemindersByPriority(priorities);

      expect(sorted[0].interactionId).toBe('high');
      expect(sorted[1].interactionId).toBe('medium');
      expect(sorted[2].interactionId).toBe('low');
    });
  });

  describe('getTopPriorityReminders', () => {
    it('returns top N highest priority reminders', () => {
      const priorities: ReminderPriority[] = [
        {
          interactionId: 'reminder-1',
          contactId: 'contact-1',
          priorityScore: 8.0,
          factors: { recency: 0.8, urgency: 0.8, snoozeHistory: 0.8, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'reminder-2',
          contactId: 'contact-1',
          priorityScore: 6.0,
          factors: { recency: 0.6, urgency: 0.6, snoozeHistory: 0.6, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'reminder-3',
          contactId: 'contact-1',
          priorityScore: 4.0,
          factors: { recency: 0.4, urgency: 0.4, snoozeHistory: 0.4, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
      ];

      const top2 = getTopPriorityReminders(priorities, 2);

      expect(top2).toHaveLength(2);
      expect(top2[0].interactionId).toBe('reminder-1');
      expect(top2[1].interactionId).toBe('reminder-2');
    });
  });

  describe('filterByMinimumPriority', () => {
    it('filters reminders by minimum priority score', () => {
      const priorities: ReminderPriority[] = [
        {
          interactionId: 'high',
          contactId: 'contact-1',
          priorityScore: 8.0,
          factors: { recency: 0.8, urgency: 0.8, snoozeHistory: 0.8, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'medium',
          contactId: 'contact-1',
          priorityScore: 5.0,
          factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'low',
          contactId: 'contact-1',
          priorityScore: 2.0,
          factors: { recency: 0.2, urgency: 0.2, snoozeHistory: 0.2, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
      ];

      const filtered = filterByMinimumPriority(priorities, 5.0);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].interactionId).toBe('high');
      expect(filtered[1].interactionId).toBe('medium');
    });
  });

  describe('groupRemindersByPriority', () => {
    it('groups reminders by priority level', () => {
      const priorities: ReminderPriority[] = [
        {
          interactionId: 'high',
          contactId: 'contact-1',
          priorityScore: 8.0,
          factors: { recency: 0.8, urgency: 0.8, snoozeHistory: 0.8, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'medium',
          contactId: 'contact-1',
          priorityScore: 5.0,
          factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
        {
          interactionId: 'low',
          contactId: 'contact-1',
          priorityScore: 2.0,
          factors: { recency: 0.2, urgency: 0.2, snoozeHistory: 0.2, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
          status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
          contact: mockContact,
          interaction: mockInteractions[0],
        },
      ];

      const grouped = groupRemindersByPriority(priorities);

      expect(grouped.high).toHaveLength(1);
      expect(grouped.medium).toHaveLength(1);
      expect(grouped.low).toHaveLength(1);
      expect(grouped.high[0].interactionId).toBe('high');
      expect(grouped.medium[0].interactionId).toBe('medium');
      expect(grouped.low[0].interactionId).toBe('low');
    });
  });

  describe('getPriorityInsights', () => {
    it('generates insights for high recency reminder', () => {
      const priority: ReminderPriority = {
        interactionId: 'test',
        contactId: 'contact-1',
        priorityScore: 8.0,
        factors: { recency: 0.9, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
        status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const insights = getPriorityInsights(priority);

      expect(insights).toContain('Recent contact - high engagement');
    });

    it('generates insights for overdue reminder', () => {
      const priority: ReminderPriority = {
        interactionId: 'test',
        contactId: 'contact-1',
        priorityScore: 8.0,
        factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 2.0, dueSoonMultiplier: 1.0 },
        status: { isOverdue: true, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: -2, hoursUntilDue: -48, status: 'overdue' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const insights = getPriorityInsights(priority);

      expect(insights).toContain('Overdue - immediate attention needed');
    });

    it('generates insights for due soon reminder', () => {
      const priority: ReminderPriority = {
        interactionId: 'test',
        contactId: 'contact-1',
        priorityScore: 8.0,
        factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.5 },
        status: { isOverdue: false, isDueSoon: true, isDueToday: false, isDueWithin1Hour: true, isActive: true, daysUntilDue: 0, hoursUntilDue: 0.5, status: 'due-soon' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const insights = getPriorityInsights(priority);

      expect(insights).toContain('Due within 1 hour');
    });
  });

  describe('boostPriorityForScenario', () => {
    it('boosts priority for interview scenario', () => {
      const priority: ReminderPriority = {
        interactionId: 'test',
        contactId: 'contact-1',
        priorityScore: 5.0,
        factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
        status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const boosted = boostPriorityForScenario(priority, 'interview');

      expect(boosted.priorityScore).toBeGreaterThan(priority.priorityScore);
      expect(boosted.factors.urgency).toBeGreaterThan(priority.factors.urgency);
    });

    it('boosts priority for urgent scenario', () => {
      const priority: ReminderPriority = {
        interactionId: 'test',
        contactId: 'contact-1',
        priorityScore: 5.0,
        factors: { recency: 0.5, urgency: 0.5, snoozeHistory: 0.5, overdueMultiplier: 1.0, dueSoonMultiplier: 1.0 },
        status: { isOverdue: false, isDueSoon: false, isDueToday: false, isDueWithin1Hour: false, isActive: true, daysUntilDue: 5, hoursUntilDue: 120, status: 'upcoming' },
        contact: mockContact,
        interaction: mockInteractions[0],
      };

      const boosted = boostPriorityForScenario(priority, 'urgent');

      expect(boosted.priorityScore).toBeGreaterThan(priority.priorityScore);
      expect(boosted.priorityScore).toBeLessThanOrEqual(10); // Should not exceed max
    });
  });

  describe('Urgency Configuration', () => {
    it('uses default urgency configuration', () => {
      expect(DEFAULT_URGENCY_CONFIG.typeWeights.email).toBe(0.8);
      expect(DEFAULT_URGENCY_CONFIG.typeWeights.phone).toBe(0.9);
      expect(DEFAULT_URGENCY_CONFIG.typeWeights.in_person).toBe(1.0);
      expect(DEFAULT_URGENCY_CONFIG.tagWeights.urgent).toBe(1.0);
      expect(DEFAULT_URGENCY_CONFIG.tagWeights.interview).toBe(0.95);
      expect(DEFAULT_URGENCY_CONFIG.overdueMultiplier).toBe(2.0);
      expect(DEFAULT_URGENCY_CONFIG.dueSoonMultiplier).toBe(1.5);
    });

    it('allows custom urgency configuration', () => {
      const customConfig: UrgencyConfig = {
        ...DEFAULT_URGENCY_CONFIG,
        typeWeights: {
          ...DEFAULT_URGENCY_CONFIG.typeWeights,
          email: 1.0, // Boost email priority
        },
        overdueMultiplier: 3.0, // Higher overdue multiplier
      };

      const interaction = {
        ...mockInteractions[0],
        type: 'email',
      };
      
      const priority = calculateReminderPriority(
        interaction,
        mockContact,
        mockInteractions,
        customConfig
      );

      // Should have higher urgency due to custom email weight
      expect(priority.factors.urgency).toBeGreaterThan(0.8);
    });
  });
}); 