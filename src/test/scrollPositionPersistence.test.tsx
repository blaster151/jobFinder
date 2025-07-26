import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollPositionPersistence } from '@/hooks/useScrollPositionPersistence';
import { useScrollPositionStore } from '@/stores/scrollPositionStore';

// Mock the store
vi.mock('@/stores/scrollPositionStore', () => ({
  useScrollPositionStore: vi.fn(),
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

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  cb(0);
  return 1;
});

describe('Scroll Position Persistence', () => {
  const mockStore = {
    saveScrollPosition: vi.fn(),
    getScrollPosition: vi.fn(),
    clearScrollPosition: vi.fn(),
    saveFilterState: vi.fn(),
    getFilterState: vi.fn(),
    clearFilterState: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useScrollPositionStore).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('useScrollPositionPersistence Hook', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ pageId: 'test-page' })
      );

      expect(result.current.saveScroll).toBeDefined();
      expect(result.current.getSavedScrollPosition).toBeDefined();
      expect(result.current.clearScroll).toBeDefined();
      expect(result.current.saveFilters).toBeDefined();
      expect(result.current.getSavedFilters).toBeDefined();
      expect(result.current.clearFilters).toBeDefined();
    });

    it('should save scroll position when enabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: true 
        })
      );

      act(() => {
        result.current.saveScroll(500);
      });

      expect(mockStore.saveScrollPosition).toHaveBeenCalledWith('test-page', 500);
    });

    it('should not save scroll position when disabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: false 
        })
      );

      act(() => {
        result.current.saveScroll(500);
      });

      expect(mockStore.saveScrollPosition).not.toHaveBeenCalled();
    });

    it('should get saved scroll position when enabled', () => {
      mockStore.getScrollPosition.mockReturnValue(300);

      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: true 
        })
      );

      const position = result.current.getSavedScrollPosition();
      expect(position).toBe(300);
      expect(mockStore.getScrollPosition).toHaveBeenCalledWith('test-page');
    });

    it('should return 0 when scroll persistence is disabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: false 
        })
      );

      const position = result.current.getSavedScrollPosition();
      expect(position).toBe(0);
      expect(mockStore.getScrollPosition).not.toHaveBeenCalled();
    });

    it('should clear scroll position when enabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: true 
        })
      );

      act(() => {
        result.current.clearScroll();
      });

      expect(mockStore.clearScrollPosition).toHaveBeenCalledWith('test-page');
    });

    it('should not clear scroll position when disabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: false 
        })
      );

      act(() => {
        result.current.clearScroll();
      });

      expect(mockStore.clearScrollPosition).not.toHaveBeenCalled();
    });

    it('should save filter state when enabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableFilterPersistence: true 
        })
      );

      const filters = { search: 'test', status: 'active' };
      act(() => {
        result.current.saveFilters(filters);
      });

      expect(mockStore.saveFilterState).toHaveBeenCalledWith('test-page', filters);
    });

    it('should not save filter state when disabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableFilterPersistence: false 
        })
      );

      const filters = { search: 'test', status: 'active' };
      act(() => {
        result.current.saveFilters(filters);
      });

      expect(mockStore.saveFilterState).not.toHaveBeenCalled();
    });

    it('should get saved filter state when enabled', () => {
      const savedFilters = { search: 'test', status: 'active' };
      mockStore.getFilterState.mockReturnValue(savedFilters);

      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableFilterPersistence: true 
        })
      );

      const filters = result.current.getSavedFilters();
      expect(filters).toEqual(savedFilters);
      expect(mockStore.getFilterState).toHaveBeenCalledWith('test-page');
    });

    it('should return null when filter persistence is disabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableFilterPersistence: false 
        })
      );

      const filters = result.current.getSavedFilters();
      expect(filters).toBeNull();
      expect(mockStore.getFilterState).not.toHaveBeenCalled();
    });

    it('should clear filter state when enabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableFilterPersistence: true 
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(mockStore.clearFilterState).toHaveBeenCalledWith('test-page');
    });

    it('should not clear filter state when disabled', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableFilterPersistence: false 
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(mockStore.clearFilterState).not.toHaveBeenCalled();
    });

    it('should debounce scroll position saves', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          debounceMs: 100 
        })
      );

      // Call saveScroll multiple times quickly
      act(() => {
        result.current.saveScroll(100);
        result.current.saveScroll(200);
        result.current.saveScroll(300);
      });

      // Should not be called immediately
      expect(mockStore.saveScrollPosition).not.toHaveBeenCalled();

      // Advance time past debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Should be called with the last value
      expect(mockStore.saveScrollPosition).toHaveBeenCalledWith('test-page', 300);
      expect(mockStore.saveScrollPosition).toHaveBeenCalledTimes(1);
    });

    it('should restore scroll position on mount when position exists', () => {
      mockStore.getScrollPosition.mockReturnValue(500);

      renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: true 
        })
      );

      expect(mockStore.getScrollPosition).toHaveBeenCalledWith('test-page');
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not restore scroll position when disabled', () => {
      renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: false 
        })
      );

      expect(mockStore.getScrollPosition).not.toHaveBeenCalled();
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('should not restore scroll position when position is 0', () => {
      mockStore.getScrollPosition.mockReturnValue(0);

      renderHook(() => 
        useScrollPositionPersistence({ 
          pageId: 'test-page',
          enableScrollPersistence: true 
        })
      );

      expect(mockStore.getScrollPosition).toHaveBeenCalledWith('test-page');
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Position Store', () => {
    it('should save scroll position for specific page', () => {
      const store = useScrollPositionStore.getState();
      
      act(() => {
        store.saveScrollPosition('page-1', 500);
      });

      expect(mockStore.saveScrollPosition).toHaveBeenCalledWith('page-1', 500);
    });

    it('should get scroll position for specific page', () => {
      mockStore.getScrollPosition.mockReturnValue(300);
      const store = useScrollPositionStore.getState();
      
      const position = store.getScrollPosition('page-1');
      expect(position).toBe(300);
      expect(mockStore.getScrollPosition).toHaveBeenCalledWith('page-1');
    });

    it('should return 0 for non-existent page', () => {
      mockStore.getScrollPosition.mockReturnValue(0);
      const store = useScrollPositionStore.getState();
      
      const position = store.getScrollPosition('non-existent');
      expect(position).toBe(0);
    });

    it('should clear scroll position for specific page', () => {
      const store = useScrollPositionStore.getState();
      
      act(() => {
        store.clearScrollPosition('page-1');
      });

      expect(mockStore.clearScrollPosition).toHaveBeenCalledWith('page-1');
    });

    it('should save filter state for specific page', () => {
      const store = useScrollPositionStore.getState();
      const filters = { search: 'test', status: 'active' };
      
      act(() => {
        store.saveFilterState('page-1', filters);
      });

      expect(mockStore.saveFilterState).toHaveBeenCalledWith('page-1', filters);
    });

    it('should get filter state for specific page', () => {
      const savedFilters = { search: 'test', status: 'active' };
      mockStore.getFilterState.mockReturnValue(savedFilters);
      const store = useScrollPositionStore.getState();
      
      const filters = store.getFilterState('page-1');
      expect(filters).toEqual(savedFilters);
      expect(mockStore.getFilterState).toHaveBeenCalledWith('page-1');
    });

    it('should return null for non-existent page filters', () => {
      mockStore.getFilterState.mockReturnValue(null);
      const store = useScrollPositionStore.getState();
      
      const filters = store.getFilterState('non-existent');
      expect(filters).toBeNull();
    });

    it('should clear filter state for specific page', () => {
      const store = useScrollPositionStore.getState();
      
      act(() => {
        store.clearFilterState('page-1');
      });

      expect(mockStore.clearFilterState).toHaveBeenCalledWith('page-1');
    });
  });

  describe('Integration Tests', () => {
    it('should persist scroll position across navigation', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ pageId: 'contact-1' })
      );

      // Save scroll position
      act(() => {
        result.current.saveScroll(500);
      });

      expect(mockStore.saveScrollPosition).toHaveBeenCalledWith('contact-1', 500);

      // Get saved position
      mockStore.getScrollPosition.mockReturnValue(500);
      const position = result.current.getSavedScrollPosition();
      expect(position).toBe(500);
    });

    it('should persist filter state across navigation', () => {
      const { result } = renderHook(() => 
        useScrollPositionPersistence({ pageId: 'contact-1' })
      );

      const filters = { search: 'john', status: 'active' };

      // Save filter state
      act(() => {
        result.current.saveFilters(filters);
      });

      expect(mockStore.saveFilterState).toHaveBeenCalledWith('contact-1', filters);

      // Get saved filters
      mockStore.getFilterState.mockReturnValue(filters);
      const savedFilters = result.current.getSavedFilters();
      expect(savedFilters).toEqual(filters);
    });

    it('should handle multiple pages independently', () => {
      const { result: result1 } = renderHook(() => 
        useScrollPositionPersistence({ pageId: 'contact-1' })
      );

      const { result: result2 } = renderHook(() => 
        useScrollPositionPersistence({ pageId: 'contact-2' })
      );

      // Save different positions for different pages
      act(() => {
        result1.current.saveScroll(500);
        result2.current.saveScroll(1000);
      });

      expect(mockStore.saveScrollPosition).toHaveBeenCalledWith('contact-1', 500);
      expect(mockStore.saveScrollPosition).toHaveBeenCalledWith('contact-2', 1000);
    });
  });
}); 