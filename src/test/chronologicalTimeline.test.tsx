import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChronologicalTimeline } from '@/components/ChronologicalTimeline';
import { useContactStore } from '@/stores/contactStore';
import { Contact, Interaction } from '@/lib/schemas';

// Mock the store
vi.mock('@/stores/contactStore', () => ({
  useContactStore: vi.fn(),
}));

const mockContact: Contact = {
  id: 'contact-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Tech Corp',
  role: 'Software Engineer',
  linkedin: 'https://linkedin.com/in/johndoe',
  notes: 'Great developer',
  flagged: false,
  tags: ['developer'],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

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
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
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
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'interaction-3',
    contactId: 'contact-1',
    type: 'in_person',
    summary: 'Met at conference',
    followUpRequired: true,
    followUpDueDate: '2024-01-10T10:00:00Z', // Overdue
    tags: ['networking'],
    isDone: false,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

describe('ChronologicalTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useContactStore).mockReturnValue({
      interactions: mockInteractions,
      contacts: [mockContact],
      addInteraction: vi.fn(),
      updateInteraction: vi.fn(),
      deleteInteraction: vi.fn(),
      addContact: vi.fn(),
      flagContact: vi.fn(),
      isLoading: false,
    });
  });

  describe('Basic Rendering', () => {
    it('should render timeline with interactions and reminders', () => {
      render(<ChronologicalTimeline />);

      // Should show both interactions and reminders
      expect(screen.getByText('Email with John Doe')).toBeInTheDocument();
      expect(screen.getByText('Follow-up: phone with John Doe')).toBeInTheDocument();
      expect(screen.getByText('Follow-up: in_person with John Doe')).toBeInTheDocument();
    });

    it('should group items by date', () => {
      render(<ChronologicalTimeline />);

      // Should show date groups
      expect(screen.getByText(/This Month/)).toBeInTheDocument();
    });

    it('should show item counts in group headers', () => {
      render(<ChronologicalTimeline />);

      // Should show count badges
      expect(screen.getByText(/3 items/)).toBeInTheDocument();
    });
  });

  describe('Visual Distinctions', () => {
    it('should show different icons for different interaction types', () => {
      render(<ChronologicalTimeline />);

      // Should show interaction badges
      expect(screen.getByText('Interaction')).toBeInTheDocument();
      expect(screen.getByText('Reminder')).toBeInTheDocument();
    });

    it('should show overdue status for late reminders', () => {
      render(<ChronologicalTimeline />);

      // Should show overdue badge
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('should show tags for items', () => {
      render(<ChronologicalTimeline />);

      // Should show tags
      expect(screen.getByText('recruitment')).toBeInTheDocument();
      expect(screen.getByText('follow-up')).toBeInTheDocument();
      expect(screen.getByText('networking')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should show only interactions when showInteractionsOnly is true', () => {
      render(<ChronologicalTimeline showInteractionsOnly={true} />);

      // Should show interaction but not reminders
      expect(screen.getByText('Email with John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Follow-up: phone with John Doe')).not.toBeInTheDocument();
    });

    it('should show only reminders when showRemindersOnly is true', () => {
      render(<ChronologicalTimeline showRemindersOnly={true} />);

      // Should show reminders but not regular interactions
      expect(screen.getByText('Follow-up: phone with John Doe')).toBeInTheDocument();
      expect(screen.getByText('Follow-up: in_person with John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Email with John Doe')).not.toBeInTheDocument();
    });

    it('should filter by contact when contactId is provided', () => {
      render(<ChronologicalTimeline contactId="contact-1" />);

      // Should show items for the specific contact
      expect(screen.getByText('Email with John Doe')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no items exist', () => {
      vi.mocked(useContactStore).mockReturnValue({
        interactions: [],
        contacts: [],
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        addContact: vi.fn(),
        flagContact: vi.fn(),
        isLoading: false,
      });

      render(<ChronologicalTimeline />);

      expect(screen.getByText('No timeline items found.')).toBeInTheDocument();
    });

    it('should show appropriate empty state for interactions only', () => {
      vi.mocked(useContactStore).mockReturnValue({
        interactions: [],
        contacts: [],
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        addContact: vi.fn(),
        flagContact: vi.fn(),
        isLoading: false,
      });

      render(<ChronologicalTimeline showInteractionsOnly={true} />);

      expect(screen.getByText('No interactions found.')).toBeInTheDocument();
    });

    it('should show appropriate empty state for reminders only', () => {
      vi.mocked(useContactStore).mockReturnValue({
        interactions: [],
        contacts: [],
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        addContact: vi.fn(),
        flagContact: vi.fn(),
        isLoading: false,
      });

      render(<ChronologicalTimeline showRemindersOnly={true} />);

      expect(screen.getByText('No reminders found.')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should show action buttons for reminders', () => {
      render(<ChronologicalTimeline showRemindersOnly={true} />);

      // Should show Done and Snooze buttons for reminders
      expect(screen.getAllByText('Done')).toHaveLength(2);
      expect(screen.getAllByText('Snooze')).toHaveLength(2);
    });

    it('should not show action buttons for regular interactions', () => {
      render(<ChronologicalTimeline showInteractionsOnly={true} />);

      // Should not show action buttons for interactions
      expect(screen.queryByText('Done')).not.toBeInTheDocument();
      expect(screen.queryByText('Snooze')).not.toBeInTheDocument();
    });
  });
}); 