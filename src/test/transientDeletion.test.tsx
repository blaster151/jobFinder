import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTransientDeletionStore } from '@/stores/transientDeletionStore';
import { useTransientDeletion } from '@/hooks/useTransientDeletion';
import { TransientDeletionDemo } from '@/components/TransientDeletionDemo';
import { Interaction } from '@/lib/schemas';

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: () => ({
    deleteInteraction: vi.fn(),
    addInteraction: vi.fn(),
  }),
}));

vi.mock('@/stores/transientDeletionStore', () => ({
  useTransientDeletionStore: vi.fn(),
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

describe('Transient Deletion System', () => {
  const user = userEvent.setup();
  const mockStore = {
    localDeletedItems: [],
    globalDeletedItems: [],
    softDeleteItem: vi.fn(),
    commitSoftDeletion: vi.fn(),
    revertSoftDeletion: vi.fn(),
    hardDeleteItem: vi.fn(),
    undoLocalDeletion: vi.fn(),
    undoGlobalDeletion: vi.fn(),
    getSoftDeletedItems: vi.fn(() => []),
    getHardDeletedItems: vi.fn(() => []),
    clearAllItems: vi.fn(),
    hasSoftDeletedItems: vi.fn(() => false),
    hasPendingDeletions: vi.fn(() => false),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useTransientDeletionStore).mockReturnValue(mockStore);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('TransientDeletionStore', () => {
    it('should initialize with empty state', () => {
      const store = useTransientDeletionStore.getState();
      
      expect(store.localDeletedItems).toEqual([]);
      expect(store.globalDeletedItems).toEqual([]);
    });

    it('should add item to soft delete state', () => {
      const store = useTransientDeletionStore.getState();
      
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      const items = store.localDeletedItems;
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('1');
      expect(items[0].isSoftDeleted).toBe(true);
    });

    it('should commit soft deletion to backend', async () => {
      const store = useTransientDeletionStore.getState();
      
      // Add soft deleted item
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Commit the soft deletion
      await store.commitSoftDeletion('1');

      // Should call backend API
      expect(fetch).toHaveBeenCalledWith('/api/interactions/1', {
        method: 'DELETE',
      });

      // Should move from local to global state
      expect(store.localDeletedItems).toHaveLength(0);
      expect(store.globalDeletedItems).toHaveLength(1);
    });

    it('should revert soft deletion', () => {
      const store = useTransientDeletionStore.getState();
      
      // Add soft deleted item
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      expect(store.localDeletedItems).toHaveLength(1);

      // Revert the soft deletion
      store.revertSoftDeletion('1');

      expect(store.localDeletedItems).toHaveLength(0);
    });

    it('should handle hard delete', async () => {
      const store = useTransientDeletionStore.getState();
      
      // Add item to local state
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Hard delete the item
      await store.hardDeleteItem('1');

      // Should call backend API
      expect(fetch).toHaveBeenCalledWith('/api/interactions/1', {
        method: 'DELETE',
      });

      // Should remove from both local and global state
      expect(store.localDeletedItems).toHaveLength(0);
      expect(store.globalDeletedItems).toHaveLength(0);
    });

    it('should undo global deletion', async () => {
      const store = useTransientDeletionStore.getState();
      
      // Add item to global state (simulating committed deletion)
      store.globalDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: false,
      }];

      // Undo the global deletion
      await store.undoGlobalDeletion('1');

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

      // Should remove from global state
      expect(store.globalDeletedItems).toHaveLength(0);
    });

    it('should get soft deleted items', () => {
      const store = useTransientDeletionStore.getState();
      
      // Add soft deleted item
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      const softDeletedItems = store.getSoftDeletedItems();
      expect(softDeletedItems).toHaveLength(1);
      expect(softDeletedItems[0].isSoftDeleted).toBe(true);
    });

    it('should get hard deleted items', () => {
      const store = useTransientDeletionStore.getState();
      
      // Add item to global state (simulating committed deletion)
      store.globalDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: false,
      }];

      const hardDeletedItems = store.getHardDeletedItems();
      expect(hardDeletedItems).toHaveLength(1);
      expect(hardDeletedItems[0].isSoftDeleted).toBe(false);
    });

    it('should clear expired items', () => {
      const store = useTransientDeletionStore.getState();
      
      // Add expired item
      const expiredDate = new Date(Date.now() - 15000); // 15 seconds ago
      store.globalDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: expiredDate,
        contactName: 'John Doe',
        isSoftDeleted: false,
      }];

      store.clearExpiredItems();
      expect(store.globalDeletedItems).toHaveLength(0);
    });

    it('should check for soft deleted items', () => {
      const store = useTransientDeletionStore.getState();
      
      expect(store.hasSoftDeletedItems()).toBe(false);

      // Add soft deleted item
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      expect(store.hasSoftDeletedItems()).toBe(true);
    });

    it('should check for pending deletions', () => {
      const store = useTransientDeletionStore.getState();
      
      expect(store.hasPendingDeletions()).toBe(false);

      // Add soft deleted item
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      expect(store.hasPendingDeletions()).toBe(true);
    });
  });

  describe('useTransientDeletion Hook', () => {
    it('should provide soft delete functionality', () => {
      const { result } = renderHook(() => useTransientDeletion({
        enableSoftDelete: true,
        softDeleteTimeout: 30000,
        autoCommit: true,
      }));

      expect(typeof result.current.softDeleteItem).toBe('function');
      expect(typeof result.current.commitSoftDeletion).toBe('function');
      expect(typeof result.current.revertSoftDeletion).toBe('function');
    });

    it('should provide hard delete functionality', () => {
      const { result } = renderHook(() => useTransientDeletion());

      expect(typeof result.current.hardDeleteItem).toBe('function');
    });

    it('should provide undo functionality', () => {
      const { result } = renderHook(() => useTransientDeletion());

      expect(typeof result.current.undoLocalDeletion).toBe('function');
      expect(typeof result.current.undoGlobalDeletion).toBe('function');
    });

    it('should provide state queries', () => {
      const { result } = renderHook(() => useTransientDeletion());

      expect(typeof result.current.hasSoftDeletedItems).toBe('boolean');
      expect(typeof result.current.hasPendingDeletions).toBe('boolean');
      expect(typeof result.current.getSoftDeletedItems).toBe('function');
      expect(typeof result.current.getHardDeletedItems).toBe('function');
    });

    it('should handle soft delete with auto-commit', async () => {
      const { result } = renderHook(() => useTransientDeletion({
        autoCommit: true,
        softDeleteTimeout: 1000,
      }));

      result.current.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Should call store soft delete
      expect(mockStore.softDeleteItem).toHaveBeenCalled();

      // Advance time to trigger auto-commit
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // Should call commit soft deletion
      expect(mockStore.commitSoftDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle manual commit of soft deletion', async () => {
      const { result } = renderHook(() => useTransientDeletion({
        autoCommit: false,
      }));

      await result.current.commitSoftDeletion('1');

      expect(mockStore.commitSoftDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle revert of soft deletion', () => {
      const { result } = renderHook(() => useTransientDeletion());

      result.current.revertSoftDeletion('1');

      expect(mockStore.revertSoftDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle hard delete', async () => {
      const { result } = renderHook(() => useTransientDeletion());

      await result.current.hardDeleteItem('1');

      expect(mockStore.hardDeleteItem).toHaveBeenCalledWith('1');
    });

    it('should handle undo local deletion', () => {
      const { result } = renderHook(() => useTransientDeletion());

      result.current.undoLocalDeletion('1');

      expect(mockStore.undoLocalDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle undo global deletion', async () => {
      const { result } = renderHook(() => useTransientDeletion());

      await result.current.undoGlobalDeletion('1');

      expect(mockStore.undoGlobalDeletion).toHaveBeenCalledWith('1');
    });
  });

  describe('TransientDeletionDemo Component', () => {
    const mockInteractions = [mockInteraction];

    beforeEach(() => {
      mockStore.getSoftDeletedItems.mockReturnValue([]);
      mockStore.getHardDeletedItems.mockReturnValue([]);
    });

    it('should render status overview', () => {
      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      expect(screen.getByText('Transient Deletion Status')).toBeInTheDocument();
      expect(screen.getByText('Soft Deleted')).toBeInTheDocument();
      expect(screen.getByText('Hard Deleted')).toBeInTheDocument();
    });

    it('should render available interactions', () => {
      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      expect(screen.getByText('Available Interactions')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('Soft Delete')).toBeInTheDocument();
      expect(screen.getByText('Hard Delete')).toBeInTheDocument();
    });

    it('should handle soft delete', async () => {
      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      const softDeleteButton = screen.getByText('Soft Delete');
      await user.click(softDeleteButton);

      expect(mockStore.softDeleteItem).toHaveBeenCalledWith({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });
    });

    it('should handle hard delete', async () => {
      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      const hardDeleteButton = screen.getByText('Hard Delete');
      await user.click(hardDeleteButton);

      expect(mockStore.hardDeleteItem).toHaveBeenCalledWith('1');
    });

    it('should show soft deleted items', () => {
      const softDeletedItem = {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: true,
      };

      mockStore.getSoftDeletedItems.mockReturnValue([softDeletedItem]);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      expect(screen.getByText('Soft Deleted Items')).toBeInTheDocument();
      expect(screen.getByText('Revert')).toBeInTheDocument();
      expect(screen.getByText('Commit')).toBeInTheDocument();
    });

    it('should show hard deleted items', () => {
      const hardDeletedItem = {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: false,
      };

      mockStore.getHardDeletedItems.mockReturnValue([hardDeletedItem]);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      expect(screen.getByText('Hard Deleted Items')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should handle revert soft deletion', async () => {
      const softDeletedItem = {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: true,
      };

      mockStore.getSoftDeletedItems.mockReturnValue([softDeletedItem]);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      const revertButton = screen.getByText('Revert');
      await user.click(revertButton);

      expect(mockStore.undoLocalDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle commit soft deletion', async () => {
      const softDeletedItem = {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: true,
      };

      mockStore.getSoftDeletedItems.mockReturnValue([softDeletedItem]);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      const commitButton = screen.getByText('Commit');
      await user.click(commitButton);

      expect(mockStore.commitSoftDeletion).toHaveBeenCalledWith('1');
    });

    it('should handle undo global deletion', async () => {
      const hardDeletedItem = {
        id: '1',
        type: 'interaction' as const,
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: false,
      };

      mockStore.getHardDeletedItems.mockReturnValue([hardDeletedItem]);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      const undoButton = screen.getByText('Undo');
      await user.click(undoButton);

      expect(mockStore.undoGlobalDeletion).toHaveBeenCalledWith('1');
    });

    it('should show clear all button when there are pending deletions', () => {
      mockStore.hasPendingDeletions.mockReturnValue(true);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should handle clear all', async () => {
      mockStore.hasPendingDeletions.mockReturnValue(true);

      render(
        <TransientDeletionDemo
          interactions={mockInteractions}
          contactName="John Doe"
        />
      );

      const clearAllButton = screen.getByText('Clear All');
      await user.click(clearAllButton);

      expect(mockStore.clearAllItems).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors during commit', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const store = useTransientDeletionStore.getState();
      
      // Add soft deleted item
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Try to commit - should revert on error
      await store.commitSoftDeletion('1');

      // Should still have the item in local state (reverted)
      expect(store.localDeletedItems).toHaveLength(1);
    });

    it('should handle API errors during hard delete', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const store = useTransientDeletionStore.getState();
      
      // Add item to local state
      store.softDeleteItem({
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        contactName: 'John Doe',
      });

      // Try to hard delete - should throw error
      await expect(store.hardDeleteItem('1')).rejects.toThrow('API Error');
    });

    it('should handle API errors during undo', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('API Error'));

      const store = useTransientDeletionStore.getState();
      
      // Add item to global state
      store.globalDeletedItems = [{
        id: '1',
        type: 'interaction',
        data: mockInteraction,
        deletedAt: new Date(),
        contactName: 'John Doe',
        isSoftDeleted: false,
      }];

      // Try to undo - should throw error
      await expect(store.undoGlobalDeletion('1')).rejects.toThrow('API Error');
    });
  });
}); 