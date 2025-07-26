import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UndoToast } from '@/components/UndoToast';
import { UndoToastManager } from '@/components/UndoToastManager';
import { useDeletedItemsStore } from '@/stores/deletedItemsStore';
import { Interaction } from '@/lib/schemas';

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: () => ({
    addInteraction: vi.fn(),
  }),
}));

vi.mock('@/stores/deletedItemsStore', () => ({
  useDeletedItemsStore: vi.fn(),
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

describe('Undo Toast System', () => {
  const user = userEvent.setup();
  const mockOnUndo = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('UndoToast Component', () => {
    it('should render with correct content', () => {
      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Item Deleted')).toBeInTheDocument();
      expect(screen.getByText('Deleted interaction: "Test Item"')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByText('10s left')).toBeInTheDocument();
    });

    it('should show correct item type in message', () => {
      render(
        <UndoToast
          itemId="1"
          itemType="reminder"
          itemName="Test Reminder"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Deleted reminder: "Test Reminder"')).toBeInTheDocument();
    });

    it('should call onUndo when undo button is clicked', async () => {
      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(mockOnUndo).toHaveBeenCalled();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /×/i });
      await user.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should show loading state when undoing', async () => {
      mockOnUndo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(screen.getByText('Undoing...')).toBeInTheDocument();
      expect(undoButton).toBeDisabled();
    });

    it('should countdown timer correctly', () => {
      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('10s left')).toBeInTheDocument();

      // Advance time by 3 seconds
      vi.advanceTimersByTime(3000);
      expect(screen.getByText('7s left')).toBeInTheDocument();

      // Advance time by 5 more seconds
      vi.advanceTimersByTime(5000);
      expect(screen.getByText('2s left')).toBeInTheDocument();
    });

    it('should auto-dismiss when timer reaches zero', () => {
      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      // Advance time to just before timeout
      vi.advanceTimersByTime(9900);
      expect(mockOnDismiss).not.toHaveBeenCalled();

      // Advance time past timeout
      vi.advanceTimersByTime(100);
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('should format time correctly', () => {
      render(
        <UndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
        />
      );

      // Test various time values
      vi.advanceTimersByTime(1000);
      expect(screen.getByText('9s left')).toBeInTheDocument();

      vi.advanceTimersByTime(500);
      expect(screen.getByText('9s left')).toBeInTheDocument(); // Should round up

      vi.advanceTimersByTime(500);
      expect(screen.getByText('8s left')).toBeInTheDocument();
    });
  });

  describe('UndoToastManager Component', () => {
    const mockDeletedItems = [
      {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
      },
      {
        id: '2',
        type: 'reminder' as const,
        data: { ...mockInteraction, id: '2' },
        deletedAt: new Date(),
        contactName: 'Jane Smith',
      },
    ];

    const mockStore = {
      deletedItems: mockDeletedItems,
      removeDeletedItem: vi.fn(),
    };

    beforeEach(() => {
      vi.mocked(useDeletedItemsStore).mockReturnValue(mockStore);
    });

    it('should not render when no deleted items', () => {
      vi.mocked(useDeletedItemsStore).mockReturnValue({
        ...mockStore,
        deletedItems: [],
      });

      render(<UndoToastManager />);

      expect(screen.queryByText('Item Deleted')).not.toBeInTheDocument();
    });

    it('should render multiple undo toasts', () => {
      render(<UndoToastManager />);

      const toasts = screen.getAllByText('Item Deleted');
      expect(toasts).toHaveLength(2);
    });

    it('should show correct item names in toasts', () => {
      render(<UndoToastManager />);

      expect(screen.getByText('Deleted interaction: "interaction with John Doe"')).toBeInTheDocument();
      expect(screen.getByText('Deleted reminder: "reminder with Jane Smith"')).toBeInTheDocument();
    });

    it('should call removeDeletedItem when toast is dismissed', async () => {
      render(<UndoToastManager />);

      const dismissButtons = screen.getAllByRole('button', { name: /×/i });
      await user.click(dismissButtons[0]);

      expect(mockStore.removeDeletedItem).toHaveBeenCalledWith('1');
    });

    it('should handle undo operation correctly', async () => {
      const mockAddInteraction = vi.fn();
      vi.mocked(require('@/stores/contactStore').useContactStore).mockReturnValue({
        addInteraction: mockAddInteraction,
      });

      render(<UndoToastManager />);

      const undoButtons = screen.getAllByRole('button', { name: /undo/i });
      await user.click(undoButtons[0]);

      expect(mockAddInteraction).toHaveBeenCalledWith({
        contactId: 'contact-1',
        type: 'email',
        summary: 'Test interaction summary',
        followUpRequired: false,
        followUpDueDate: null,
        tags: ['test'],
        isDone: false,
      });
      expect(mockStore.removeDeletedItem).toHaveBeenCalledWith('1');
    });

    it('should handle undo error gracefully', async () => {
      const mockAddInteraction = vi.fn().mockRejectedValue(new Error('Failed to restore'));
      vi.mocked(require('@/stores/contactStore').useContactStore).mockReturnValue({
        addInteraction: mockAddInteraction,
      });

      render(<UndoToastManager />);

      const undoButtons = screen.getAllByRole('button', { name: /undo/i });
      await user.click(undoButtons[0]);

      // Should not crash and should still remove from deleted items
      expect(mockStore.removeDeletedItem).toHaveBeenCalledWith('1');
    });
  });

  describe('DeletedItemsStore', () => {
    it('should add deleted items correctly', () => {
      const store = useDeletedItemsStore.getState();
      
      store.addDeletedItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      const items = store.deletedItems;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('1');
      expect(items[0].type).toBe('interaction');
      expect(items[0].contactName).toBe('John Doe');
    });

    it('should remove deleted items correctly', () => {
      const store = useDeletedItemsStore.getState();
      
      // Add an item first
      store.addDeletedItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      expect(store.deletedItems).toHaveLength(1);

      // Remove the item
      store.removeDeletedItem('1');
      expect(store.deletedItems).toHaveLength(0);
    });

    it('should get deleted item by id', () => {
      const store = useDeletedItemsStore.getState();
      
      store.addDeletedItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      const item = store.getDeletedItem('1');
      expect(item).toBeDefined();
      expect(item?.id).toBe('1');
    });

    it('should return undefined for non-existent item', () => {
      const store = useDeletedItemsStore.getState();
      
      const item = store.getDeletedItem('non-existent');
      expect(item).toBeUndefined();
    });

    it('should clear all items', () => {
      const store = useDeletedItemsStore.getState();
      
      // Add multiple items
      store.addDeletedItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });
      store.addDeletedItem({
        id: '2',
        type: 'reminder',
        data: { ...mockInteraction, id: '2' },
        contactName: 'Jane Smith',
      });

      expect(store.deletedItems).toHaveLength(2);

      // Clear all items
      store.clearAllItems();
      expect(store.deletedItems).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should show undo toast after deleting interaction', async () => {
      // This would be an integration test with the actual deletion flow
      // For now, we'll test the store integration
      const store = useDeletedItemsStore.getState();
      
      store.addDeletedItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      vi.mocked(useDeletedItemsStore).mockReturnValue({
        deletedItems: store.deletedItems,
        removeDeletedItem: store.removeDeletedItem,
        addDeletedItem: store.addDeletedItem,
        getDeletedItem: store.getDeletedItem,
        clearExpiredItems: store.clearExpiredItems,
        clearAllItems: store.clearAllItems,
      });

      render(<UndoToastManager />);

      expect(screen.getByText('Deleted interaction: "interaction with John Doe"')).toBeInTheDocument();
    });

    it('should restore item when undo is clicked', async () => {
      const mockAddInteraction = vi.fn();
      vi.mocked(require('@/stores/contactStore').useContactStore).mockReturnValue({
        addInteraction: mockAddInteraction,
      });

      const store = useDeletedItemsStore.getState();
      store.addDeletedItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      vi.mocked(useDeletedItemsStore).mockReturnValue({
        deletedItems: store.deletedItems,
        removeDeletedItem: store.removeDeletedItem,
        addDeletedItem: store.addDeletedItem,
        getDeletedItem: store.getDeletedItem,
        clearExpiredItems: store.clearExpiredItems,
        clearAllItems: store.clearAllItems,
      });

      render(<UndoToastManager />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(mockAddInteraction).toHaveBeenCalledWith({
        contactId: 'contact-1',
        type: 'email',
        summary: 'Test interaction summary',
        followUpRequired: false,
        followUpDueDate: null,
        tags: ['test'],
        isDone: false,
      });
    });
  });
}); 