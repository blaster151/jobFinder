import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmartContactSummary } from '@/components/SmartContactSummary';
import { calculateContactStats, formatNextReminder, getInteractionTypeLabel } from '@/lib/contactStats';
import { Interaction } from '@/lib/schemas';

// Mock date-fns to have consistent dates
vi.mock('date-fns', () => ({
  differenceInDays: vi.fn((date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }),
  formatDistanceToNow: vi.fn(() => '2 days ago'),
}));

const mockInteractions: Interaction[] = [
  {
    id: 'interaction-1',
    contactId: 'contact-1',
    type: 'email',
    summary: 'Initial contact about React position',
    followUpRequired: false,
    followUpDueDate: null,
    tags: ['recruitment'],
    isDone: false,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'interaction-2',
    contactId: 'contact-1',
    type: 'phone',
    summary: 'Follow-up call, very interested',
    followUpRequired: true,
    followUpDueDate: '2024-01-20T10:00:00Z',
    tags: ['follow-up'],
    isDone: false,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
  {
    id: 'interaction-3',
    contactId: 'contact-1',
    type: 'email',
    summary: 'Sent follow-up email',
    followUpRequired: true,
    followUpDueDate: '2024-01-10T10:00:00Z', // Overdue
    tags: ['follow-up'],
    isDone: false,
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z',
  },
  {
    id: 'interaction-4',
    contactId: 'contact-1',
    type: 'in_person',
    summary: 'Met at conference',
    followUpRequired: false,
    followUpDueDate: null,
    tags: ['networking'],
    isDone: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

describe('SmartContactSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all stat cards', () => {
      render(
        <SmartContactSummary 
          interactions={mockInteractions}
          contactId="contact-1"
          contactName="John Doe"
        />
      );

      // Check for all main stat cards
      expect(screen.getByText('Total Interactions')).toBeInTheDocument();
      expect(screen.getByText('Average Gap')).toBeInTheDocument();
      expect(screen.getByText('Longest Gap')).toBeInTheDocument();
      expect(screen.getByText('Most Common')).toBeInTheDocument();
      expect(screen.getByText('Next Reminder')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should display correct total interactions count', () => {
      render(
        <SmartContactSummary 
          interactions={mockInteractions}
          contactId="contact-1"
          contactName="John Doe"
        />
      );

      expect(screen.getByText('4')).toBeInTheDocument(); // 4 interactions
    });

    it('should display most common interaction type', () => {
      render(
        <SmartContactSummary 
          interactions={mockInteractions}
          contactId="contact-1"
          contactName="John Doe"
        />
      );

      // Email appears twice, so it should be the most common
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should show overdue reminder alert when there are overdue reminders', () => {
      render(
        <SmartContactSummary 
          interactions={mockInteractions}
          contactId="contact-1"
          contactName="John Doe"
        />
      );

      expect(screen.getByText('Overdue Reminder')).toBeInTheDocument();
      expect(screen.getByText(/You have an overdue follow-up/)).toBeInTheDocument();
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty interactions gracefully', () => {
      render(
        <SmartContactSummary 
          interactions={[]}
          contactId="contact-1"
          contactName="John Doe"
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument(); // Total interactions
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Average gap
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Longest gap
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Most common
    });
  });

  describe('Contact Stats Calculation', () => {
    it('should calculate total interactions correctly', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.totalInteractions).toBe(4);
    });

    it('should calculate average time between interactions', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.averageTimeBetweenInteractions).toBe('4 days');
    });

    it('should calculate longest silence gap', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.longestSilenceGap).toBe('7 days');
    });

    it('should identify most common interaction type', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.mostCommonInteractionType).toBe('email');
    });

    it('should find next scheduled reminder', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.nextScheduledReminder.date).toBeInstanceOf(Date);
      expect(stats.nextScheduledReminder.isOverdue).toBe(true);
    });

    it('should calculate recent interactions correctly', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.recentInteractions).toBe(1); // Only the last interaction is within 7 days
    });

    it('should calculate pending follow-ups correctly', () => {
      const stats = calculateContactStats(mockInteractions, 'contact-1');
      expect(stats.pendingFollowUps).toBe(2); // 2 interactions with followUpRequired and not done
    });
  });

  describe('Utility Functions', () => {
    it('should format next reminder correctly', () => {
      const reminder = {
        date: new Date('2024-01-10T10:00:00Z'),
        description: 'Test reminder',
        isOverdue: true,
      };
      
      const formatted = formatNextReminder(reminder);
      expect(formatted).toBe('Overdue 2 days ago');
    });

    it('should handle null reminder date', () => {
      const reminder = {
        date: null,
        description: null,
        isOverdue: false,
      };
      
      const formatted = formatNextReminder(reminder);
      expect(formatted).toBe('No upcoming reminders');
    });

    it('should get interaction type labels correctly', () => {
      expect(getInteractionTypeLabel('email')).toBe('Email');
      expect(getInteractionTypeLabel('phone')).toBe('Phone Call');
      expect(getInteractionTypeLabel('text')).toBe('Text Message');
      expect(getInteractionTypeLabel('dm')).toBe('Direct Message');
      expect(getInteractionTypeLabel('in_person')).toBe('In Person');
      expect(getInteractionTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('Filtering by Contact ID', () => {
    it('should only show stats for specified contact', () => {
      const mixedInteractions = [
        ...mockInteractions,
                 {
           id: 'interaction-5',
           contactId: 'contact-2',
           type: 'email' as const,
           summary: 'Different contact',
           followUpRequired: false,
           followUpDueDate: null,
           tags: [] as string[],
           isDone: false,
           createdAt: '2024-01-20T10:00:00Z',
           updatedAt: '2024-01-20T10:00:00Z',
         },
      ];

      const stats = calculateContactStats(mixedInteractions, 'contact-1');
      expect(stats.totalInteractions).toBe(4); // Should only count contact-1 interactions
    });

    it('should show all interactions when no contactId is provided', () => {
      const stats = calculateContactStats(mockInteractions);
      expect(stats.totalInteractions).toBe(4);
    });
  });
}); 