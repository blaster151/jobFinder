import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TagStats {
  tag: string;
  count: number;
  lastUsed: Date;
}

interface TagStore {
  // All tags used across the app
  allTags: string[];
  
  // Tag suggestions and management
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  normalizeTag: (tag: string) => string;
  getTagSuggestions: (input: string, existingTags?: string[]) => string[];
  
  // Tag statistics
  getTagStats: () => TagStats[];
  updateTagUsage: (tags: string[]) => void;
  
  // Tag filtering
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  clearSelectedTags: () => void;
  
  // Filter logic
  filterLogic: 'AND' | 'OR';
  setFilterLogic: (logic: 'AND' | 'OR') => void;
}

// Tag normalization function
const normalizeTag = (tag: string): string => {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      allTags: [],
      selectedTags: [],
      filterLogic: 'OR',
      
      addTag: (tag: string) => {
        const normalized = get().normalizeTag(tag);
        if (normalized && !get().allTags.includes(normalized)) {
          set((state) => ({
            allTags: [...state.allTags, normalized].sort()
          }));
        }
      },
      
      removeTag: (tag: string) => {
        set((state) => ({
          allTags: state.allTags.filter(t => t !== tag),
          selectedTags: state.selectedTags.filter(t => t !== tag)
        }));
      },
      
      normalizeTag: normalizeTag,
      
      getTagSuggestions: (input: string, existingTags: string[] = []) => {
        const normalized = normalizeTag(input);
        const allTags = get().allTags;
        
        if (!normalized) return [];
        
        // Filter out already selected tags
        const availableTags = allTags.filter(tag => 
          !existingTags.includes(tag) && 
          tag.includes(normalized)
        );
        
        // Return top 5 suggestions
        return availableTags.slice(0, 5);
      },
      
      getTagStats: () => {
        // This would be populated from actual usage data
        // For now, return basic stats
        return get().allTags.map(tag => ({
          tag,
          count: 0, // Would be calculated from actual data
          lastUsed: new Date()
        }));
      },
      
      updateTagUsage: (tags: string[]) => {
        // Add new tags to the global list
        tags.forEach(tag => get().addTag(tag));
      },
      
      setSelectedTags: (tags: string[]) => {
        set({ selectedTags: tags });
      },
      
      toggleTag: (tag: string) => {
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter(t => t !== tag)
            : [...state.selectedTags, tag]
        }));
      },
      
      clearSelectedTags: () => {
        set({ selectedTags: [] });
      },
      
      setFilterLogic: (logic: 'AND' | 'OR') => {
        set({ filterLogic: logic });
      },
    }),
    {
      name: 'jobfinder-tags',
      partialize: (state) => ({
        allTags: state.allTags,
        selectedTags: state.selectedTags,
        filterLogic: state.filterLogic,
      }),
    }
  )
);

// Utility function to check if an item matches selected tags
export const matchesSelectedTags = (
  itemTags: string[],
  selectedTags: string[],
  filterLogic: 'AND' | 'OR'
): boolean => {
  if (selectedTags.length === 0) return true;
  
  if (filterLogic === 'AND') {
    return selectedTags.every(tag => itemTags.includes(tag));
  } else {
    return selectedTags.some(tag => itemTags.includes(tag));
  }
}; 