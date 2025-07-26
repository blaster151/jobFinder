import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ScrollPositionState {
  // Scroll positions for different pages
  scrollPositions: Record<string, number>;
  
  // Filter states for different pages
  filterStates: Record<string, any>;
  
  // Actions
  saveScrollPosition: (pageId: string, position: number) => void;
  getScrollPosition: (pageId: string) => number;
  clearScrollPosition: (pageId: string) => void;
  
  saveFilterState: (pageId: string, filters: any) => void;
  getFilterState: (pageId: string) => any;
  clearFilterState: (pageId: string) => void;
  
  // Clear all state
  clearAll: () => void;
}

export const useScrollPositionStore = create<ScrollPositionState>()(
  persist(
    (set, get) => ({
      scrollPositions: {},
      filterStates: {},

      saveScrollPosition: (pageId: string, position: number) => {
        set((state) => ({
          scrollPositions: {
            ...state.scrollPositions,
            [pageId]: position,
          },
        }));
      },

      getScrollPosition: (pageId: string) => {
        return get().scrollPositions[pageId] || 0;
      },

      clearScrollPosition: (pageId: string) => {
        set((state) => {
          const newScrollPositions = { ...state.scrollPositions };
          delete newScrollPositions[pageId];
          return { scrollPositions: newScrollPositions };
        });
      },

      saveFilterState: (pageId: string, filters: any) => {
        set((state) => ({
          filterStates: {
            ...state.filterStates,
            [pageId]: filters,
          },
        }));
      },

      getFilterState: (pageId: string) => {
        return get().filterStates[pageId] || null;
      },

      clearFilterState: (pageId: string) => {
        set((state) => {
          const newFilterStates = { ...state.filterStates };
          delete newFilterStates[pageId];
          return { filterStates: newFilterStates };
        });
      },

      clearAll: () => {
        set({
          scrollPositions: {},
          filterStates: {},
        });
      },
    }),
    {
      name: 'scroll-position-storage',
      // Only persist scroll positions and filter states
      partialize: (state) => ({
        scrollPositions: state.scrollPositions,
        filterStates: state.filterStates,
      }),
    }
  )
); 