import { useMemo } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { timelineService, TimelineItem, TimelineGroup } from '@/lib/services/timelineService';

interface UseTimelineOptions {
  contactId?: string;
  showRemindersOnly?: boolean;
  showInteractionsOnly?: boolean;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  statusFilter?: 'all' | 'overdue' | 'due-soon' | 'upcoming';
}

export function useTimeline(options: UseTimelineOptions = {}) {
  const { interactions, contacts } = useContactStore();
  const {
    contactId,
    showRemindersOnly = false,
    showInteractionsOnly = false,
    dateRange = 'all',
    statusFilter = 'all',
  } = options;

  // Create timeline items
  const timelineItems = useMemo(() => {
    return timelineService.createTimelineItems(interactions, contacts, {
      contactId,
      showRemindersOnly,
      showInteractionsOnly,
    });
  }, [interactions, contacts, contactId, showRemindersOnly, showInteractionsOnly]);

  // Filter timeline items
  const filteredItems = useMemo(() => {
    return timelineService.filterTimelineItems(timelineItems, {
      dateRange,
      statusFilter,
    });
  }, [timelineItems, dateRange, statusFilter]);

  // Group timeline items
  const groupedItems = useMemo(() => {
    return timelineService.groupTimelineItems(filteredItems);
  }, [filteredItems]);

  // Get timeline statistics
  const stats = useMemo(() => {
    return timelineService.getTimelineStats(filteredItems);
  }, [filteredItems]);

  // Sort items by date (newest first)
  const sortedItems = useMemo(() => {
    return filteredItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredItems]);

  return {
    // Data
    timelineItems: sortedItems,
    groupedItems,
    stats,
    
    // Filtered data
    filteredItems,
    
    // Utility functions
    getItemsByGroup: (groupName: string) => groupedItems[groupName] || [],
    getGroupNames: () => Object.keys(groupedItems),
    hasItems: () => sortedItems.length > 0,
    getItemById: (id: string) => sortedItems.find(item => item.id === id),
  };
} 