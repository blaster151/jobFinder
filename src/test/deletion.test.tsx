import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { AutosaveInteraction } from '@/components/AutosaveInteraction';
import { ReminderRow } from '@/components/ReminderRow';
import { Interaction } from '@/lib/schemas';

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: () => ({
    updateInteraction: vi.fn(),
    markReminderDone: vi.fn(),
    snoozeReminder: vi.fn(),
    deleteInteraction: vi.fn(),
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAutosave', () => ({
  useAutosave: () => ({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveNow: vi.fn(),
    reset: vi.fn(),
  }),
}));

const mockInteraction: Interaction = {
  id: '1',
  contactId: 'contact-1',
  type: 'email',
  summary: 'Test interaction summary',
  followUpRequired: false,
  followUpDueDate: null,
  tags: ['test'],
  isDone: false,
  createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
};

describe('Deletion Flow', () => {
  const user = userEvent.setup();
  const mockDeleteInteraction = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the store
    vi.mocked(require('@/stores/contactStore').useContactStore).mockReturnValue({
      updateInteraction: vi.fn(),
      markReminderDone: vi.fn(),
      snoozeReminder: vi.fn(),
      deleteInteraction: mockDeleteInteraction,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DeleteConfirmationDialog', () => {
    it('should not render when isOpen is false', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
    });

    it('should show default message for interaction', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          itemType="interaction"
        />
      );

      expect(screen.getByText(/This will permanently delete the interaction/)).toBeInTheDocument();
    });

    it('should show custom message when provided', () => {
      const customMessage = 'Custom deletion message';
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          message={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should show item name when provided', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          itemName="Test Item"
        />
      );

      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', async () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onConfirm when delete button is clicked', async () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });

    it('should show loading state when isLoading is true', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    });

    it('should disable buttons when loading', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    });

    it('should show different item types correctly', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          itemType="reminder"
        />
      );

      expect(screen.getByText(/This will permanently delete the reminder/)).toBeInTheDocument();

      rerender(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          itemType="contact"
        />
      );

      expect(screen.getByText(/This will permanently delete the contact/)).toBeInTheDocument();
    });
  });

  describe('AutosaveInteraction Delete Button', () => {
    it('should show delete button in view mode', () => {
      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('text-destructive');
    });

    it('should open delete confirmation dialog when delete button is clicked', async () => {
      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText(/This will permanently delete the interaction/)).toBeInTheDocument();
    });

    it('should call deleteInteraction when confirmed', async () => {
      mockDeleteInteraction.mockResolvedValueOnce(undefined);

      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      expect(mockDeleteInteraction).toHaveBeenCalledWith('1');
    });

    it('should handle delete error gracefully', async () => {
      mockDeleteInteraction.mockRejectedValueOnce(new Error('Delete failed'));

      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      // Should not crash and should close dialog
      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });

    it('should show loading state during deletion', async () => {
      mockDeleteInteraction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  describe('ReminderRow Delete Button', () => {
    it('should show delete button', () => {
      render(
        <ReminderRow 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('text-destructive');
    });

    it('should open delete confirmation dialog when delete button is clicked', async () => {
      render(
        <ReminderRow 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
      expect(screen.getByText(/This will permanently delete the reminder/)).toBeInTheDocument();
    });

    it('should call deleteInteraction when confirmed', async () => {
      mockDeleteInteraction.mockResolvedValueOnce(undefined);

      render(
        <ReminderRow 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      expect(mockDeleteInteraction).toHaveBeenCalledWith('1');
    });

    it('should show correct item name in confirmation dialog', async () => {
      render(
        <ReminderRow 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('reminder for John Doe')).toBeInTheDocument();
    });
  });

  describe('Delete Button Placement and Styling', () => {
    it('should have consistent delete button placement', () => {
      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      const editButton = screen.getByRole('button', { name: /edit/i });
      
      // Delete button should be next to edit button
      expect(deleteButton.parentElement).toBe(editButton.parentElement);
    });

    it('should have destructive styling for delete buttons', () => {
      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveClass('text-destructive');
      expect(deleteButton).toHaveClass('hover:text-destructive');
    });

    it('should use trash icon consistently', () => {
      render(
        <AutosaveInteraction 
          interaction={mockInteraction} 
          contactName="John Doe" 
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      const trashIcon = deleteButton.querySelector('svg');
      expect(trashIcon).toBeInTheDocument();
    });
  });

  describe('Delete Confirmation Dialog UX', () => {
    it('should show warning icon in dialog header', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const warningIcon = screen.getByRole('img', { hidden: true });
      expect(warningIcon).toBeInTheDocument();
    });

    it('should show item preview when itemName is provided', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          itemName="Test Item"
        />
      );

      const itemPreview = screen.getByText('Test Item');
      expect(itemPreview).toBeInTheDocument();
      expect(itemPreview.closest('div')).toHaveClass('bg-muted/50');
    });

    it('should close dialog when clicking outside', async () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const backdrop = screen.getByRole('presentation', { hidden: true });
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle keyboard navigation', async () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      // Tab to cancel button
      await user.tab();
      expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();

      // Tab to delete button
      await user.tab();
      expect(screen.getByRole('button', { name: /delete/i })).toHaveFocus();
    });
  });
}); 