import { useEffect, useCallback } from 'react';
import { useScrollPositionStore } from '@/stores/scrollPositionStore';

interface UseScrollPositionPersistenceOptions {
  pageId: string;
  enableScrollPersistence?: boolean;
  enableFilterPersistence?: boolean;
  debounceMs?: number;
}

export function useScrollPositionPersistence({
  pageId,
  enableScrollPersistence = true,
  enableFilterPersistence = true,
  debounceMs = 100,
}: UseScrollPositionPersistenceOptions) {
  const {
    saveScrollPosition,
    getScrollPosition,
    clearScrollPosition,
    saveFilterState,
    getFilterState,
    clearFilterState,
  } = useScrollPositionStore();

  // Debounced scroll handler
  const debouncedSaveScroll = useCallback(
    debounce((position: number) => {
      if (enableScrollPersistence) {
        saveScrollPosition(pageId, position);
      }
    }, debounceMs),
    [pageId, enableScrollPersistence, saveScrollPosition, debounceMs]
  );

  // Save scroll position
  const saveScroll = useCallback((position: number) => {
    if (enableScrollPersistence) {
      debouncedSaveScroll(position);
    }
  }, [enableScrollPersistence, debouncedSaveScroll]);

  // Get saved scroll position
  const getSavedScrollPosition = useCallback(() => {
    if (enableScrollPersistence) {
      return getScrollPosition(pageId);
    }
    return 0;
  }, [pageId, enableScrollPersistence, getScrollPosition]);

  // Clear scroll position
  const clearScroll = useCallback(() => {
    if (enableScrollPersistence) {
      clearScrollPosition(pageId);
    }
  }, [pageId, enableScrollPersistence, clearScrollPosition]);

  // Save filter state
  const saveFilters = useCallback((filters: any) => {
    if (enableFilterPersistence) {
      saveFilterState(pageId, filters);
    }
  }, [pageId, enableFilterPersistence, saveFilterState]);

  // Get saved filter state
  const getSavedFilters = useCallback(() => {
    if (enableFilterPersistence) {
      return getFilterState(pageId);
    }
    return null;
  }, [pageId, enableFilterPersistence, getFilterState]);

  // Clear filter state
  const clearFilters = useCallback(() => {
    if (enableFilterPersistence) {
      clearFilterState(pageId);
    }
  }, [pageId, enableFilterPersistence, clearFilterState]);

  // Set up scroll listener
  useEffect(() => {
    if (!enableScrollPersistence) return;

    const handleScroll = () => {
      saveScroll(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enableScrollPersistence, saveScroll]);

  // Restore scroll position on mount
  useEffect(() => {
    if (!enableScrollPersistence) return;

    const savedPosition = getSavedScrollPosition();
    if (savedPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    }
  }, [enableScrollPersistence, getSavedScrollPosition]);

  return {
    saveScroll,
    getSavedScrollPosition,
    clearScroll,
    saveFilters,
    getSavedFilters,
    clearFilters,
  };
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 