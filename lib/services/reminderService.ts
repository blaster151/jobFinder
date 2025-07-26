import { Interaction } from '@/lib/schemas';
import { ReminderStatusService } from './reminderStatusService';
import { FilterService } from './filterService';
import { filterByDateRange, DateRange } from '@/lib/utils/dateUtils';

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
    return ReminderStatusService.categorize(interactions);
  }

  getReminderStatus(interaction: Interaction) {
    const status = ReminderStatusService.getStatus(interaction);
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
    dateRange: DateRange
  ): Interaction[] {
    return filterByDateRange(
      interactions,
      dateRange,
      (interaction) => new Date(interaction.followUpDueDate!),
    );
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
    return ReminderStatusService.getStats(interactions);
  }

  getNewlyOverdueReminders(
    currentOverdue: string[],
    previousOverdue: string[]
  ): string[] {
    return ReminderStatusService.getNewlyOverdue(currentOverdue, previousOverdue);
  }
}

export const reminderService = new ReminderServiceImpl(); 