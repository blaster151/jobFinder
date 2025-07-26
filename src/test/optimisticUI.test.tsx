import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOptimisticDeletionStore } from '@/stores/optimisticDeletionStore';
import { useOptimisticDeletion } from '@/hooks/useOptimisticDeletion';
import { OptimisticUndoToast } from '@/components/OptimisticUndoToast';
import { OptimisticToastManager } from '@/components/OptimisticToastManager';
import { AutosaveInteraction } from '@/components/AutosaveInteraction';
import { Interaction } from '@/lib/schemas';

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: () => ({
    deleteInteraction: vi.fn(),
    addInteraction: vi.fn(),
    updateInteraction: vi.fn(),
    markReminderDone: vi.fn(),
    snoozeReminder: vi.fn(),
  }),
}));

vi.mock('@/stores/optimisticDeletionStore', () => ({
  useOptimisticDeletionStore: vi.fn(),
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

// Mock fetch for API calls
global.fetch = vi.fn();

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

describe('Optimistic UI System', () => {
  const user = userEvent.setup();
  const mockStore = {
    optimisticDeletedItems: [] as any[],
    pendingOperations: new Map(),
    optimisticDeleteItem: vi.fn(),
    commitOptimisticDeletion: vi.fn(),
    revertOptimisticDeletion: vi.fn(),
    undoOptimisticDeletion: vi.fn(),
    getOptimisticDeletedItems: vi.fn(() => []),
    clearExpiredItems: vi.fn(),
    clearAllItems: vi.fn(),
    hasOptimisticDeletions: vi.fn(() => false),
    hasPendingOperations: vi.fn(() => false),
    isItemOptimisticallyDeleted: vi.fn(() => false),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useOptimisticDeletionStore).mockReturnValue(mockStore);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Optimistic State Synchronization', () => {
    it('should match optimistic state with store state', () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add item to store
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: false,
      }];

      // Check that optimistic state matches
      expect(store.optimisticDeletedItems).toHaveLength(1);
      expect(store.optimisticDeletedItems[0].id).toBe('1');
      expect(store.optimisticDeletedItems[0].isOptimistic).toBe(true);
      expect(store.optimisticDeletedItems[0].isCommitted).toBe(false);
    });

    it('should sync optimistic state across multiple operations', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      // First deletion
      await store.optimisticDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Second deletion
      await store.optimisticDeleteItem({
        id: '2',
        type: 'reminder',
        data: { ...mockInteraction, id: '2' },
        contactName: 'Jane Smith',
      });

      // Check that both items are in optimistic state
      expect(store.optimisticDeletedItems).toHaveLength(2);
      expect(store.optimisticDeletedItems[0].id).toBe('1');
      expect(store.optimisticDeletedItems[1].id).toBe('2');
      expect(store.optimisticDeletedItems.every(item => item.isOptimistic)).toBe(true);
    });

    it('should maintain state consistency during concurrent operations', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Start multiple concurrent deletions
      const promises = [
        store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        }),
        store.optimisticDeleteItem({
          id: '2',
          type: 'reminder',
          data: { ...mockInteraction, id: '2' },
          contactName: 'Jane Smith',
        }),
        store.optimisticDeleteItem({
          id: '3',
          type: 'interaction',
          data: { ...mockInteraction, id: '3' },
          contactName: 'Bob Wilson',
        }),
      ];

      await Promise.all(promises);

      // Check that all items are in optimistic state
      expect(store.optimisticDeletedItems).toHaveLength(3);
      expect(store.optimisticDeletedItems.every(item => item.isOptimistic)).toBe(true);
      expect(store.pendingOperations.size).toBe(0); // All operations completed
    });
  });

  describe('Undo Buffer Clearing', () => {
    it('should clear undo buffer after timeout', () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add item to optimistic state
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: true,
      }];

      // Advance time past the undo timeout (10 seconds)
      vi.advanceTimersByTime(11000);

      // Trigger auto-clear
      store.clearExpiredItems();

      // Buffer should be cleared
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should clear undo buffer when item is restored', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add item to optimistic state
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: true,
      }];

      // Restore the item
      await store.undoOptimisticDeletion('1');

      // Buffer should be cleared
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should clear multiple items from buffer after timeout', () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add multiple items with different timestamps
      const now = new Date();
      store.optimisticDeletedItems = [
        {
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          deletedAt: new Date(now.getTime() - 15000), // 15 seconds ago
          contactName: 'John Doe',
          isOptimistic: true,
          isCommitted: true,
        },
        {
          id: '2',
          type: 'reminder',
          data: { ...mockInteraction, id: '2' },
          deletedAt: new Date(now.getTime() - 5000), // 5 seconds ago
          contactName: 'Jane Smith',
          isOptimistic: true,
          isCommitted: true,
        },
        {
          id: '3',
          type: 'interaction',
          data: { ...mockInteraction, id: '3' },
          deletedAt: new Date(now.getTime() - 2000), // 2 seconds ago
          contactName: 'Bob Wilson',
          isOptimistic: true,
          isCommitted: true,
        },
      ];

      // Clear expired items
      store.clearExpiredItems();

      // Only recent items should remain (within 10 second window)
      expect(store.optimisticDeletedItems).toHaveLength(2);
      expect(store.optimisticDeletedItems.map(item => item.id)).toEqual(['2', '3']);
    });

    it('should clear buffer when all items are restored', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add multiple items
      store.optimisticDeletedItems = [
        {
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          deletedAt: new Date(),
          contactName: 'John Doe',
          isOptimistic: true,
          isCommitted: true,
        },
        {
          id: '2',
          type: 'reminder',
          data: { ...mockInteraction, id: '2' },
          deletedAt: new Date(),
          contactName: 'Jane Smith',
          isOptimistic: true,
          isCommitted: true,
        },
      ];

      // Restore all items
      await Promise.all([
        store.undoOptimisticDeletion('1'),
        store.undoOptimisticDeletion('2'),
      ]);

      // Buffer should be completely cleared
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });
  });

  describe('API Error Handling with Retry/Restore Options', () => {
    it('should surface retry option on API error during deletion', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network Error'));

      const store = useOptimisticDeletionStore.getState();
      
      try {
        await store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Item should be reverted (restored to UI)
      expect(store.optimisticDeletedItems).toHaveLength(0);
      
      // Error should be available for retry
      expect(store.hasOptimisticDeletions()).toBe(false);
    });

    it('should provide restore option when backend deletion fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
      } as Response);

      const store = useOptimisticDeletionStore.getState();
      
      try {
        await store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Item should be automatically restored
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should handle network timeout with restore option', async () => {
      vi.mocked(fetch).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const store = useOptimisticDeletionStore.getState();
      
      try {
        await store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Item should be restored on timeout
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should allow manual retry after API error', async () => {
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      });

      const store = useOptimisticDeletionStore.getState();
      
      // First attempt fails
      try {
        await store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Item should be restored
      expect(store.optimisticDeletedItems).toHaveLength(0);

      // Second attempt succeeds
      await store.optimisticDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Item should be in optimistic state
      expect(store.optimisticDeletedItems).toHaveLength(1);
      expect(store.optimisticDeletedItems[0].isCommitted).toBe(true);
    });

    it('should show error toast with retry option', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useOptimisticDeletion({
        enableErrorRecovery: true,
        showErrorToast: true,
      }));

      try {
        await result.current.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Error recovery should be triggered
      expect(mockStore.revertOptimisticDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle partial failures in batch operations', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Mock fetch to fail for specific IDs
      vi.mocked(fetch).mockImplementation((url) => {
        const urlString = typeof url === 'string' ? url : url.toString();
        if (urlString.includes('/1')) {
          return Promise.reject(new Error('Item 1 failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);
      });

      // Attempt to delete multiple items
      const results = await Promise.allSettled([
        store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        }),
        store.optimisticDeleteItem({
          id: '2',
          type: 'reminder',
          data: { ...mockInteraction, id: '2' },
          contactName: 'Jane Smith',
        }),
      ]);

      // One should succeed, one should fail
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');

      // Only successful deletion should remain in optimistic state
      expect(store.optimisticDeletedItems).toHaveLength(1);
      expect(store.optimisticDeletedItems[0].id).toBe('2');
    });
  });

  describe('OptimisticDeletionStore', () => {
    it('should initialize with empty state', () => {
      const store = useOptimisticDeletionStore.getState();
      
      expect(store.optimisticDeletedItems).toEqual([]);
      expect(store.pendingOperations.size).toBe(0);
    });

    it('should immediately hide item from UI on optimistic delete', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      await store.optimisticDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      const items = store.optimisticDeletedItems;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('1');
      expect(items[0].isOptimistic).toBe(true);
      expect(items[0].isCommitted).toBe(false);
    });

    it('should track pending operations', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      await store.optimisticDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      expect(store.pendingOperations.size).toBe(1);
      expect(store.pendingOperations.has('1')).toBe(true);
    });

    it('should mark item as committed on successful backend operation', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      await store.optimisticDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Simulate successful backend operation
      const items = store.optimisticDeletedItems;
      expect(items[0].isCommitted).toBe(true);
    });

    it('should revert optimistic deletion on backend failure', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const store = useOptimisticDeletionStore.getState();
      
      try {
        await store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Should revert the optimistic deletion
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should handle undo optimistic deletion', async () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add item to optimistic state
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: true,
      }];

      await store.undoOptimisticDeletion('1');

      // Should call backend API to restore
      expect(fetch).toHaveBeenCalledWith('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: 'contact-1',
          type: 'email',
          summary: 'Test interaction summary',
          followUpRequired: false,
          followUpDueDate: null,
          tags: ['test'],
          isDone: false,
        }),
      });

      // Should remove from optimistic state
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should check if item is optimistically deleted', () => {
      const store = useOptimisticDeletionStore.getState();
      
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: false,
      }];

      expect(store.isItemOptimisticallyDeleted('1')).toBe(true);
      expect(store.isItemOptimisticallyDeleted('2')).toBe(false);
    });

    it('should clear expired items', () => {
      const store = useOptimisticDeletionStore.getState();
      
      // Add expired item
      const expiredDate = new Date(Date.now() - 15000); // 15 seconds ago
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: expiredDate,
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: true,
      }];

      store.clearExpiredItems();
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });
  });

  describe('useOptimisticDeletion Hook', () => {
    it('should provide optimistic delete functionality', () => {
      const { result } = renderHook(() => useOptimisticDeletion({
        enableErrorRecovery: true,
        showSuccessToast: true,
        showErrorToast: true,
      }));

      expect(typeof result.current.optimisticDeleteItem).toBe('function');
      expect(typeof result.current.revertOptimisticDeletion).toBe('function');
      expect(typeof result.current.undoOptimisticDeletion).toBe('function');
    });

    it('should handle optimistic delete with success toast', async () => {
      const { result } = renderHook(() => useOptimisticDeletion({
        showSuccessToast: true,
      }));

      await result.current.optimisticDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      expect(mockStore.optimisticDeleteItem).toHaveBeenCalled();
    });

    it('should handle optimistic delete with error recovery', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useOptimisticDeletion({
        enableErrorRecovery: true,
        showErrorToast: true,
      }));

      try {
        await result.current.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Should revert optimistic deletion
      expect(mockStore.revertOptimisticDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle undo optimistic deletion', async () => {
      const { result } = renderHook(() => useOptimisticDeletion());

      await result.current.undoOptimisticDeletion('1');

      expect(mockStore.undoOptimisticDeletion).toHaveBeenCalledWith('1');
    });

    it('should check if item is optimistically deleted', () => {
      const { result } = renderHook(() => useOptimisticDeletion());

      result.current.isItemOptimisticallyDeleted('1');

      expect(mockStore.isItemOptimisticallyDeleted).toHaveBeenCalledWith('1');
    });
  });

  describe('OptimisticUndoToast Component', () => {
    const mockOnUndo = vi.fn();
    const mockOnDismiss = vi.fn();

    it('should render with correct content', () => {
      render(
        <OptimisticUndoToast
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

    it('should show pending status when isPending is true', () => {
      render(
        <OptimisticUndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
          isPending={true}
        />
      );

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
    });

    it('should show committed status when isCommitted is true', () => {
      render(
        <OptimisticUndoToast
          itemId="1"
          itemType="interaction"
          itemName="Test Item"
          onUndo={mockOnUndo}
          onDismiss={mockOnDismiss}
          isCommitted={true}
        />
      );

      expect(screen.getByText('Deleted')).toBeInTheDocument();
    });

    it('should call onUndo when undo button is clicked', async () => {
      render(
        <OptimisticUndoToast
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
        <OptimisticUndoToast
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

    it('should auto-dismiss when timer reaches zero', () => {
      render(
        <OptimisticUndoToast
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
  });

  describe('OptimisticToastManager Component', () => {
    const mockOptimisticItems = [
      {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: false,
      },
      {
        id: '2',
        type: 'reminder' as const,
        data: { ...mockInteraction, id: '2' },
        deletedAt: new Date(),
        contactName: 'Jane Smith',
        isOptimistic: true,
        isCommitted: true,
      },
    ];

    beforeEach(() => {
      mockStore.optimisticDeletedItems = mockOptimisticItems;
      mockStore.pendingOperations = new Map([['1', Promise.resolve()]]);
    });

    it('should not render when no optimistic deletions', () => {
      mockStore.optimisticDeletedItems = [];

      render(<OptimisticToastManager />);

      expect(screen.queryByText('Item Deleted')).not.toBeInTheDocument();
    });

    it('should render multiple optimistic toasts', () => {
      render(<OptimisticToastManager />);

      const toasts = screen.getAllByText('Item Deleted');
      expect(toasts).toHaveLength(2);
    });

    it('should show correct status for pending operations', () => {
      render(<OptimisticToastManager />);

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.getByText('Deleted')).toBeInTheDocument();
    });

    it('should handle undo operation', async () => {
      render(<OptimisticToastManager />);

      const undoButtons = screen.getAllByRole('button', { name: /undo/i });
      await user.click(undoButtons[0]);

      expect(mockStore.undoOptimisticDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle dismiss operation', async () => {
      render(<OptimisticToastManager />);

      const dismissButtons = screen.getAllByRole('button', { name: /×/i });
      await user.click(dismissButtons[0]);

      expect(mockStore.revertOptimisticDeletion).toHaveBeenCalledWith('1');
    });
  });

  describe('AutosaveInteraction with Optimistic UI', () => {
    it('should not render when item is optimistically deleted', () => {
      mockStore.isItemOptimisticallyDeleted.mockReturnValue(true);

      render(
        <AutosaveInteraction
          interaction={mockInteraction}
          contactName="John Doe"
        />
      );

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should render normally when item is not optimistically deleted', () => {
      mockStore.isItemOptimisticallyDeleted.mockReturnValue(false);

      render(
        <AutosaveInteraction
          interaction={mockInteraction}
          contactName="John Doe"
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should use optimistic deletion when delete is confirmed', async () => {
      mockStore.isItemOptimisticallyDeleted.mockReturnValue(false);

      render(
        <AutosaveInteraction
          interaction={mockInteraction}
          contactName="John Doe"
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Should open confirmation dialog
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      expect(mockStore.optimisticDeleteItem).toHaveBeenCalledWith({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during optimistic delete', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const store = useOptimisticDeletionStore.getState();
      
      try {
        await store.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Should revert optimistic deletion
      expect(store.optimisticDeletedItems).toHaveLength(0);
    });

    it('should handle API errors during undo', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const store = useOptimisticDeletionStore.getState();
      
      // Add item to optimistic state
      store.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: true,
      }];

      try {
        await store.undoOptimisticDeletion('1');
      } catch (error) {
        // Expected to throw
      }

      // Should still have the item in optimistic state
      expect(store.optimisticDeletedItems).toHaveLength(1);
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network Error'));

      const { result } = renderHook(() => useOptimisticDeletion({
        enableErrorRecovery: true,
        showErrorToast: true,
      }));

      try {
        await result.current.optimisticDeleteItem({
          id: '1',
          type: 'interaction',
          data: mockInteraction,
          contactName: 'John Doe',
        });
      } catch (error) {
        // Expected to throw
      }

      // Should revert and show error toast
      expect(mockStore.revertOptimisticDeletion).toHaveBeenCalledWith('1');
    });
  });

  describe('Integration Tests', () => {
    it('should immediately hide item from UI on delete', async () => {
      mockStore.isItemOptimisticallyDeleted.mockReturnValue(false);

      const { rerender } = render(
        <AutosaveInteraction
          interaction={mockInteraction}
          contactName="John Doe"
        />
      );

      // Item should be visible initially
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Simulate optimistic deletion
      mockStore.isItemOptimisticallyDeleted.mockReturnValue(true);

      rerender(
        <AutosaveInteraction
          interaction={mockInteraction}
          contactName="John Doe"
        />
      );

      // Item should be hidden
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('should show toast with undo option after deletion', async () => {
      mockStore.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: false,
      }];

      render(<OptimisticToastManager />);

      expect(screen.getByText('Item Deleted')).toBeInTheDocument();
      expect(screen.getByText('Deleted interaction: "interaction with John Doe"')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    });

    it('should restore item when undo is clicked', async () => {
      mockStore.optimisticDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isOptimistic: true,
        isCommitted: true,
      }];

      render(<OptimisticToastManager />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(mockStore.undoOptimisticDeletion).toHaveBeenCalledWith('1');
    });
  });
}); 