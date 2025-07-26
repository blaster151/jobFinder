import { Interaction, Contact } from '@/lib/schemas';
import { format, isToday, isThisWeek, isThisMonth, isYesterday, startOfDay, differenceInDays } from 'date-fns';

export interface TimelineItem {
  id: string;
  type: 'interaction' | 'reminder';
  date: Date;
  title: string;
  description: string;
  interaction?: Interaction;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  tags: string[];
}

export interface TimelineGroup {
  [key: string]: TimelineItem[];
}

export interface TimelineService {
  // Timeline item creation
  createTimelineItems(
    interactions: Interaction[],
    contacts: Contact[],
    options: {
      contactId?: string;
      showRemindersOnly?: boolean;
      showInteractionsOnly?: boolean;
    }
  ): TimelineItem[];
  
  // Timeline filtering
  filterTimelineItems(
    items: TimelineItem[],
    options: {
      dateRange?: 'all' | 'today' | 'week' | 'month';
      statusFilter?: 'all' | 'overdue' | 'due-soon' | 'upcoming';
    }
  ): TimelineItem[];
  
  // Timeline grouping
  groupTimelineItems(items: TimelineItem[]): TimelineGroup;
  
  // Timeline statistics
  getTimelineStats(items: TimelineItem[]): {
    total: number;
    interactions: number;
    reminders: number;
    overdue: number;
    dueSoon: number;
  };
}

class TimelineServiceImpl implements TimelineService {
  createTimelineItems(
    interactions: Interaction[],
    contacts: Contact[],
    options: {
      contactId?: string;
      showRemindersOnly?: boolean;
      showInteractionsOnly?: boolean;
    }
  ): TimelineItem[] {
    const items: TimelineItem[] = [];
    const { contactId, showRemindersOnly, showInteractionsOnly } = options;

    // Filter interactions for specific contact if provided
    const filteredInteractions = contactId 
      ? interactions.filter(i => i.contactId === contactId)
      : interactions;

    // Add interactions
    if (!showRemindersOnly) {
      filteredInteractions.forEach(interaction => {
        const contact = contacts.find(c => c.id === interaction.contactId);
        const contactName = contact?.name || 'Unknown Contact';
        
        items.push({
          id: interaction.id!,
          type: 'interaction',
          date: new Date(interaction.createdAt!),
          title: `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} with ${contactName}`,
          description: interaction.summary,
          interaction,
          tags: interaction.tags || [],
        });
      });
    }

    // Add reminders (interactions with followUpRequired)
    if (!showInteractionsOnly) {
      const reminders = filteredInteractions.filter(i => i.followUpRequired && i.followUpDueDate);
      
      reminders.forEach(interaction => {
        const contact = contacts.find(c => c.id === interaction.contactId);
        const contactName = contact?.name || 'Unknown Contact';
        const dueDate = new Date(interaction.followUpDueDate!);
        const now = new Date();
        const isOverdue = dueDate < now;
        const isDueSoon = dueDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000); // Within 24 hours
        
        items.push({
          id: `reminder-${interaction.id}`,
          type: 'reminder',
          date: dueDate,
          title: `Follow-up: ${interaction.type} with ${contactName}`,
          description: interaction.summary,
          interaction,
          isOverdue,
          isDueSoon,
          tags: interaction.tags || [],
        });
      });
    }

    return items;
  }

  filterTimelineItems(
    items: TimelineItem[],
    options: {
      dateRange?: 'all' | 'today' | 'week' | 'month';
      statusFilter?: 'all' | 'overdue' | 'due-soon' | 'upcoming';
    }
  ): TimelineItem[] {
    let filteredItems = items;
    const { dateRange = 'all', statusFilter = 'all' } = options;

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const today = startOfDay(now);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filteredItems = items.filter(item => {
        const itemDate = startOfDay(item.date);
        
        switch (dateRange) {
          case 'today':
            return isToday(itemDate);
          case 'week':
            return itemDate >= weekAgo;
          case 'month':
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredItems = filteredItems.filter(item => {
        if (item.type !== 'reminder') return false;
        
        switch (statusFilter) {
          case 'overdue':
            return item.isOverdue;
          case 'due-soon':
            return item.isDueSoon;
          case 'upcoming':
            return !item.isOverdue && !item.isDueSoon;
          default:
            return true;
        }
      });
    }

    return filteredItems;
  }

  groupTimelineItems(items: TimelineItem[]): TimelineGroup {
    const groups: TimelineGroup = {};
    
    items.forEach(item => {
      const date = startOfDay(item.date);
      let groupKey: string;
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = 'This Week';
      } else if (isThisMonth(date)) {
        groupKey = 'This Month';
      } else {
        const daysDiff = differenceInDays(new Date(), date);
        if (daysDiff < 30) {
          groupKey = 'Last Month';
        } else {
          groupKey = 'Older';
        }
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  }

  getTimelineStats(items: TimelineItem[]) {
    return {
      total: items.length,
      interactions: items.filter(item => item.type === 'interaction').length,
      reminders: items.filter(item => item.type === 'reminder').length,
      overdue: items.filter(item => item.isOverdue).length,
      dueSoon: items.filter(item => item.isDueSoon).length,
    };
  }
}

export const timelineService = new TimelineServiceImpl(); 