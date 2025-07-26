import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams, useRouter } from 'next/navigation';
import ContactProfilePage from '@/app/contacts/[id]/page';
import { useContactStore } from '@/stores/contactStore';
import { useScrollPositionPersistence } from '@/hooks/useScrollPositionPersistence';
import { Contact, Interaction } from '@/lib/schemas';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: vi.fn(),
}));

vi.mock('@/hooks/useScrollPositionPersistence', () => ({
  useScrollPositionPersistence: vi.fn(),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true,
});

const mockContact: Contact = {
  id: 'contact-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Tech Corp',
  role: 'Software Engineer',
  linkedin: 'https://linkedin.com/in/johndoe',
  notes: 'Great developer, interested in our React position',
  flagged: false,
  tags: ['developer', 'react'],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

const mockInteractions: Interaction[] = [
  {
    id: 'interaction-1',
    contactId: 'contact-1',
    type: 'email',
    summary: 'Initial contact about React position',
    followUpRequired: true,
    followUpDueDate: '2024-01-15T10:00:00Z',
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
    followUpRequired: false,
    followUpDueDate: null,
    tags: ['follow-up'],
    isDone: true,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
];

describe('Contact Profile Page', () => {
  const user = userEvent.setup();
  const mockRouter = {
    back: vi.fn(),
    push: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  } as any;
  const mockSaveScroll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useParams
    vi.mocked(useParams).mockReturnValue({ id: 'contact-1' });
    
    // Mock useRouter
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    
    // Mock useContactStore
    vi.mocked(useContactStore).mockReturnValue({
      contacts: [mockContact],
      interactions: mockInteractions,
      isLoading: false,
      fetchContacts: vi.fn(),
      fetchInteractions: vi.fn(),
      addContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
      addInteraction: vi.fn(),
      updateInteraction: vi.fn(),
      deleteInteraction: vi.fn(),
      markReminderDone: vi.fn(),
      snoozeReminder: vi.fn(),
    });
    
    // Mock useScrollPositionPersistence
    vi.mocked(useScrollPositionPersistence).mockReturnValue({
      saveScroll: mockSaveScroll,
      getSavedScrollPosition: vi.fn(() => 0),
      clearScroll: vi.fn(),
      saveFilters: vi.fn(),
      getSavedFilters: vi.fn(() => null),
      clearFilters: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Enhanced Header Section', () => {
    it('should display contact avatar with initials', () => {
      render(<ContactProfilePage />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
      expect(avatar.closest('div')).toHaveClass('w-16', 'h-16', 'bg-primary/10', 'rounded-full');
      expect(avatar).toHaveClass('text-2xl', 'font-bold', 'text-primary');
    });

    it('should display contact name prominently', () => {
      render(<ContactProfilePage />);

      const name = screen.getByText('John Doe');
      expect(name).toBeInTheDocument();
      expect(name).toHaveClass('text-3xl', 'font-bold');
    });

    it('should display flagged badge when contact is flagged', () => {
      const flaggedContact = { ...mockContact, flagged: true };
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [flaggedContact],
        interactions: mockInteractions,
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText('Flagged')).toBeInTheDocument();
      expect(screen.getByText('Flagged')).toHaveClass('text-xs');
    });

    it('should display title/role with icon', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      // Check that the User icon is present (role section)
      const roleSection = screen.getByText('Software Engineer').closest('div');
      expect(roleSection).toHaveTextContent('Software Engineer');
    });

    it('should display company with icon', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      // Check that the Building icon is present (company section)
      const companySection = screen.getByText('Tech Corp').closest('div');
      expect(companySection).toHaveTextContent('Tech Corp');
    });

    it('should display contact methods (email and phone)', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should display last contacted information', () => {
      render(<ContactProfilePage />);

      // Should show "Last contacted" with relative time
      expect(screen.getByText(/Last contacted/)).toBeInTheDocument();
      expect(screen.getByText(/Last contacted/)).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should display tags/labels', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('developer')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('developer')).toHaveClass('text-xs');
      expect(screen.getByText('react')).toHaveClass('text-xs');
    });

    it('should display edit and delete buttons in header', () => {
      render(<ContactProfilePage />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
      expect(editButton).toHaveClass('size-sm');
      expect(deleteButton).toHaveClass('size-sm');
    });

    it('should display quick stats in header section', () => {
      render(<ContactProfilePage />);

      // Check for the three stat columns
      expect(screen.getByText('Total Interactions')).toBeInTheDocument();
      expect(screen.getByText('Recent (7 days)')).toBeInTheDocument();
      expect(screen.getByText('Pending Follow-ups')).toBeInTheDocument();

      // Check for the stat numbers
      expect(screen.getByText('2')).toBeInTheDocument(); // Total interactions
      expect(screen.getByText('1')).toBeInTheDocument(); // Pending follow-ups
    });

    it('should display LinkedIn profile link when available', () => {
      render(<ContactProfilePage />);

      const linkedinLink = screen.getByText('View LinkedIn Profile');
      expect(linkedinLink).toBeInTheDocument();
      expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johndoe');
      expect(linkedinLink).toHaveAttribute('target', '_blank');
      expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not display LinkedIn link when not available', () => {
      const contactWithoutLinkedin = { ...mockContact, linkedin: undefined };
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [contactWithoutLinkedin],
        interactions: mockInteractions,
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.queryByText('View LinkedIn Profile')).not.toBeInTheDocument();
    });

    it('should calculate last contacted from most recent interaction', () => {
      const recentInteractions = [
        {
          id: 'interaction-1',
          contactId: 'contact-1',
          type: 'email',
          summary: 'Old interaction',
          followUpRequired: false,
          followUpDueDate: null,
          tags: [],
          isDone: true,
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 'interaction-2',
          contactId: 'contact-1',
          type: 'phone',
          summary: 'Recent interaction',
          followUpRequired: false,
          followUpDueDate: null,
          tags: [],
          isDone: true,
          createdAt: '2024-01-10T10:00:00Z', // More recent
          updatedAt: '2024-01-10T10:00:00Z',
        },
      ];

      vi.mocked(useContactStore).mockReturnValue({
        contacts: [mockContact],
        interactions: recentInteractions,
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText(/Last contacted/)).toBeInTheDocument();
    });

    it('should not display last contacted when no interactions exist', () => {
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [mockContact],
        interactions: [],
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.queryByText(/Last contacted/)).not.toBeInTheDocument();
    });

    it('should display contact status in quick overview', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Contact Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should display flagged status when contact is flagged', () => {
      const flaggedContact = { ...mockContact, flagged: true };
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [flaggedContact],
        interactions: mockInteractions,
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText('Contact Status')).toBeInTheDocument();
      expect(screen.getByText('Flagged')).toBeInTheDocument();
    });

    it('should display interaction rate percentage', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Interaction Rate')).toBeInTheDocument();
      // Should show percentage based on recent vs total interactions
      expect(screen.getByText(/50%/)).toBeInTheDocument(); // 1 recent out of 2 total
    });

    it('should display follow-up rate percentage', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Follow-up Rate')).toBeInTheDocument();
      // Should show percentage based on pending vs total interactions
      expect(screen.getByText(/50%/)).toBeInTheDocument(); // 1 pending out of 2 total
    });

    it('should handle empty interaction stats gracefully', () => {
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [mockContact],
        interactions: [],
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Total interactions
      expect(screen.getByText('0%')).toBeInTheDocument(); // Interaction rate
      expect(screen.getByText('0%')).toBeInTheDocument(); // Follow-up rate
    });
  });

  describe('Routing & Navigation', () => {
    it('should render contact profile with correct contact data', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('should navigate back when back button is clicked', async () => {
      render(<ContactProfilePage />);

      const backButton = screen.getByRole('button', { name: /back to contacts/i });
      await user.click(backButton);

      expect(mockSaveScroll).toHaveBeenCalledWith(0);
      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should show loading state when data is loading', () => {
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [],
        interactions: [],
        isLoading: true,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText('Loading contact...')).toBeInTheDocument();
    });

    it('should show not found state when contact does not exist', () => {
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [],
        interactions: [],
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText('Contact Not Found')).toBeInTheDocument();
      expect(screen.getByText(/doesn't exist or has been deleted/i)).toBeInTheDocument();
    });

    it('should navigate to home when back to contacts is clicked in not found state', async () => {
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [],
        interactions: [],
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      const backButton = screen.getByRole('button', { name: /back to contacts/i });
      await user.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Contact Information Display', () => {
    it('should display all contact information correctly', () => {
      render(<ContactProfilePage />);

      // Basic info
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      
      // Contact details
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      
      // Tags
      expect(screen.getByText('developer')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
      
      // Notes
      expect(screen.getByText(/Great developer, interested in our React position/i)).toBeInTheDocument();
    });

    it('should display contact avatar with first letter', () => {
      render(<ContactProfilePage />);

      const avatar = screen.getByText('J');
      expect(avatar).toBeInTheDocument();
      expect(avatar.closest('div')).toHaveClass('bg-primary/10');
    });

    it('should show creation and update dates', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText(/Created Jan 1, 2024/i)).toBeInTheDocument();
    });

    it('should show flagged contact indicator when contact is flagged', () => {
      const flaggedContact = { ...mockContact, flagged: true };
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [flaggedContact],
        interactions: mockInteractions,
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText('Flagged Contact')).toBeInTheDocument();
      expect(screen.getByText(/special attention/i)).toBeInTheDocument();
    });
  });

  describe('Interaction Statistics', () => {
    it('should display correct interaction statistics', () => {
      render(<ContactProfilePage />);

      // Total interactions
      expect(screen.getByText('Total Interactions')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 interactions
      
      // Recent interactions (within 7 days)
      expect(screen.getByText('Recent (7 days)')).toBeInTheDocument();
      
      // Pending follow-ups
      expect(screen.getByText('Pending Follow-ups')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 pending follow-up
    });

    it('should show pending follow-ups with destructive badge when there are pending items', () => {
      render(<ContactProfilePage />);

      const pendingBadge = screen.getByText('1');
      expect(pendingBadge.closest('div')).toHaveClass('text-destructive');
    });
  });

  describe('Edit Contact Functionality', () => {
    it('should open edit modal when edit button is clicked', async () => {
      render(<ContactProfilePage />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
    });

    it('should close edit modal when form is submitted', async () => {
      render(<ContactProfilePage />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Modal should be open
      expect(screen.getByText('Edit Contact')).toBeInTheDocument();

      // Close modal (simulate form submission)
      const closeButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(closeButton);

      // Modal should be closed
      expect(screen.queryByText('Edit Contact')).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions Functionality', () => {
    it('should display Quick Actions section with all three buttons', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Add Reminder')).toBeInTheDocument();
      expect(screen.getByText('Log Interaction')).toBeInTheDocument();
      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
    });

    it('should show keyboard shortcuts information', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Keyboard shortcuts available')).toBeInTheDocument();
      expect(screen.getByText(/Press R/)).toBeInTheDocument();
      expect(screen.getByText(/Press I/)).toBeInTheDocument();
      expect(screen.getByText(/Press E/)).toBeInTheDocument();
    });

    it('should open Add Reminder modal when Add Reminder button is clicked', async () => {
      render(<ContactProfilePage />);

      const addReminderButton = screen.getByRole('button', { name: /add reminder/i });
      await user.click(addReminderButton);

      expect(screen.getByText('Add Reminder')).toBeInTheDocument();
      expect(screen.getByText(/Create a follow-up reminder for John Doe/)).toBeInTheDocument();
    });

    it('should open Log Interaction modal when Log Interaction button is clicked', async () => {
      render(<ContactProfilePage />);

      const logInteractionButton = screen.getByRole('button', { name: /log interaction/i });
      await user.click(logInteractionButton);

      expect(screen.getByText('Log Interaction')).toBeInTheDocument();
      expect(screen.getByText(/Add a new interaction with John Doe/)).toBeInTheDocument();
    });

    it('should open Edit Contact modal when Edit Contact button is clicked', async () => {
      render(<ContactProfilePage />);

      const editContactButton = screen.getByRole('button', { name: /edit contact/i });
      await user.click(editContactButton);

      expect(screen.getByText('Edit Contact')).toBeInTheDocument();
    });

    it('should handle keyboard shortcuts for Quick Actions', async () => {
      render(<ContactProfilePage />);

      // Test 'R' key for Add Reminder
      fireEvent.keyDown(document, { key: 'r' });
      await waitFor(() => {
        expect(screen.getByText('Add Reminder')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(closeButton);

      // Test 'I' key for Log Interaction
      fireEvent.keyDown(document, { key: 'i' });
      await waitFor(() => {
        expect(screen.getByText('Log Interaction')).toBeInTheDocument();
      });

      // Close modal
      const closeButton2 = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton2);

      // Test 'E' key for Edit Contact
      fireEvent.keyDown(document, { key: 'e' });
      await waitFor(() => {
        expect(screen.getByText('Edit Contact')).toBeInTheDocument();
      });
    });

    it('should not trigger keyboard shortcuts when typing in input fields', async () => {
      render(<ContactProfilePage />);

      // Open Add Reminder modal
      const addReminderButton = screen.getByRole('button', { name: /add reminder/i });
      await user.click(addReminderButton);

      // Focus on the textarea
      const textarea = screen.getByPlaceholderText(/What do you need to follow up on/);
      await user.click(textarea);

      // Type 'r' in the textarea - should not trigger the shortcut
      await user.type(textarea, 'r');
      
      // The modal should still be open (not closed by shortcut)
      expect(screen.getByText('Add Reminder')).toBeInTheDocument();
    });
  });

  describe('Delete Contact Functionality', () => {
    it('should open delete confirmation modal when delete button is clicked', async () => {
      render(<ContactProfilePage />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Delete Contact')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete "John Doe"/i)).toBeInTheDocument();
    });

    it('should close delete modal when cancel is clicked', async () => {
      render(<ContactProfilePage />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText('Delete Contact')).not.toBeInTheDocument();
    });

    it('should navigate to home when delete is confirmed', async () => {
      render(<ContactProfilePage />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmDeleteButton = screen.getByRole('button', { name: /delete contact/i });
      await user.click(confirmDeleteButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Scroll Position Persistence', () => {
    it('should save scroll position before navigation', async () => {
      // Mock scroll position
      Object.defineProperty(window, 'scrollY', {
        value: 500,
        writable: true,
      });

      render(<ContactProfilePage />);

      const backButton = screen.getByRole('button', { name: /back to contacts/i });
      await user.click(backButton);

      expect(mockSaveScroll).toHaveBeenCalledWith(500);
    });

    it('should restore scroll position on mount', () => {
      const mockGetSavedScrollPosition = vi.fn(() => 300);
      vi.mocked(useScrollPositionPersistence).mockReturnValue({
        saveScroll: mockSaveScroll,
        getSavedScrollPosition: mockGetSavedScrollPosition,
        clearScroll: vi.fn(),
        saveFilters: vi.fn(),
        getSavedFilters: vi.fn(() => null),
        clearFilters: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(mockGetSavedScrollPosition).toHaveBeenCalled();
    });
  });

  describe('Interactions Section', () => {
    it('should display interactions for the specific contact', () => {
      render(<ContactProfilePage />);

      expect(screen.getByText('Interactions')).toBeInTheDocument();
      expect(screen.getByText(/All interactions and follow-ups with John Doe/i)).toBeInTheDocument();
      
      // Should show the interactions
      expect(screen.getByText('Initial contact about React position')).toBeInTheDocument();
      expect(screen.getByText('Follow-up call, very interested')).toBeInTheDocument();
    });

    it('should show empty state when no interactions exist', () => {
      vi.mocked(useContactStore).mockReturnValue({
        contacts: [mockContact],
        interactions: [],
        isLoading: false,
        fetchContacts: vi.fn(),
        fetchInteractions: vi.fn(),
        addContact: vi.fn(),
        updateContact: vi.fn(),
        deleteContact: vi.fn(),
        addInteraction: vi.fn(),
        updateInteraction: vi.fn(),
        deleteInteraction: vi.fn(),
        markReminderDone: vi.fn(),
        snoozeReminder: vi.fn(),
      });

      render(<ContactProfilePage />);

      expect(screen.getByText(/No interactions with this contact yet/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout', () => {
      render(<ContactProfilePage />);

      const contactInfoGrid = screen.getByText('Contact Information').closest('div');
      expect(contactInfoGrid).toHaveClass('lg:col-span-2');
    });

    it('should have responsive contact details grid', () => {
      render(<ContactProfilePage />);

      const contactDetails = screen.getByText('john@example.com').closest('div');
      expect(contactDetails?.parentElement).toHaveClass('md:grid-cols-2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<ContactProfilePage />);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to contacts/i })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<ContactProfilePage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('John Doe');
    });
  });
}); 