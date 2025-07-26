import { Interaction } from '@/lib/schemas';
import { getReminderStatus, getRemindersByStatus } from '@/lib/reminderUtils';

export interface ReminderService {
  // Reminder categorization
  categorizeReminders(interactions: Interaction[]): {
    overdue: Interaction[];
    dueSoon: Interaction[];
    dueToday: Interaction[];
    upcoming: Interaction[];
  };
  
  // Reminder status calculations
  getReminderStatus(interaction: Interaction): {
    isOverdue: boolean;
    isDueSoon: boolean;
    isDueToday: boolean;
    isUpcoming: boolean;
    daysUntilDue: number;
  };
  
  // Reminder filtering
  filterRemindersByDateRange(
    interactions: Interaction[],
    dateRange: 'all' | 'today' | 'week' | 'month'
  ): Interaction[];
  
  filterRemindersByStatus(
    interactions: Interaction[],
    status: 'all' | 'overdue' | 'due-soon' | 'upcoming'
  ): Interaction[];
  
  // Reminder statistics
  getReminderStats(interactions: Interaction[]): {
    total: number;
    overdue: number;
    dueSoon: number;
    dueToday: number;
    upcoming: number;
  };
  
  // Notification logic
  getNewlyOverdueReminders(
    currentOverdue: string[],
    previousOverdue: string[]
  ): string[];
}

class ReminderServiceImpl implements ReminderService {
  categorizeReminders(interactions: Interaction[]) {
    return getRemindersByStatus(interactions);
  }

  getReminderStatus(interaction: Interaction) {
    const status = getReminderStatus(interaction);
    return {
      isOverdue: status.isOverdue,
      isDueSoon: status.isDueSoon,
      isDueToday: status.isDueToday,
      isUpcoming: status.status === 'upcoming',
      daysUntilDue: status.daysUntilDue,
    };
  }

  filterRemindersByDateRange(
    interactions: Interaction[],
    dateRange: 'all' | 'today' | 'week' | 'month'
  ): Interaction[] {
    if (dateRange === 'all') {
      return interactions;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return interactions.filter(interaction => {
      if (!interaction.followUpDueDate) return false;
      
      const dueDate = new Date(interaction.followUpDueDate);
      const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      switch (dateRange) {
        case 'today':
          return dueDateStart.getTime() === today.getTime();
        case 'week':
          return dueDateStart >= weekAgo;
        case 'month':
          return dueDateStart >= monthAgo;
        default:
          return true;
      }
    });
  }

  filterRemindersByStatus(
    interactions: Interaction[],
    status: 'all' | 'overdue' | 'due-soon' | 'upcoming'
  ): Interaction[] {
    if (status === 'all') {
      return interactions;
    }

    return interactions.filter(interaction => {
      const reminderStatus = this.getReminderStatus(interaction);
      
      switch (status) {
        case 'overdue':
          return reminderStatus.isOverdue;
        case 'due-soon':
          return reminderStatus.isDueSoon;
        case 'upcoming':
          return reminderStatus.isUpcoming;
        default:
          return true;
      }
    });
  }

  getReminderStats(interactions: Interaction[]) {
    const categorized = this.categorizeReminders(interactions);
    
    return {
      total: interactions.filter(i => i.followUpRequired && i.followUpDueDate).length,
      overdue: categorized.overdue.length,
      dueSoon: categorized.dueSoon.length,
      dueToday: categorized.dueToday.length,
      upcoming: categorized.upcoming.length,
    };
  }

  getNewlyOverdueReminders(
    currentOverdue: string[],
    previousOverdue: string[]
  ): string[] {
    return currentOverdue.filter(id => !previousOverdue.includes(id));
  }
}

export const reminderService = new ReminderServiceImpl(); 