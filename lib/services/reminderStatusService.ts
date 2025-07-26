import { Interaction } from '@/lib/schemas';
import { 
  isOverdue, 
  isDueSoon, 
  isDueToday, 
  isDueWithin1Hour, 
  getDaysUntilDue, 
  getHoursUntilDue,
  DATE_THRESHOLDS 
} from '@/lib/utils/dateUtils';

export interface ReminderStatus {
  isOverdue: boolean;
  isDueSoon: boolean;
  isDueToday: boolean;
  isDueWithin1Hour: boolean;
  isActive: boolean;
  daysUntilDue: number;
  hoursUntilDue: number;
  status: 'overdue' | 'due-soon' | 'due-today' | 'upcoming' | 'done';
}

export interface CategorizedReminders {
  overdue: Interaction[];
  dueSoon: Interaction[];
  dueToday: Interaction[];
  upcoming: Interaction[];
  done: Interaction[];
}

export interface ReminderStats {
  total: number;
  overdue: number;
  dueSoon: number;
  dueToday: number;
  upcoming: number;
  done: number;
}

// Cache for computed reminder statuses
const statusCache = new Map<string, { status: ReminderStatus; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

export class ReminderStatusService {
  /**
   * Get comprehensive status for a single reminder
   */
  static getStatus(interaction: Interaction, referenceDate: Date = new Date()): ReminderStatus {
    const cacheKey = `${interaction.id}-${interaction.followUpDueDate}-${interaction.isDone}-${referenceDate.getTime()}`;
    const now = referenceDate.getTime();
    
    // Check cache first
    const cached = statusCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.status;
    }

    // If reminder is done, return early
    if (interaction.isDone) {
      const status: ReminderStatus = {
        isOverdue: false,
        isDueSoon: false,
        isDueToday: false,
        isDueWithin1Hour: false,
        isActive: false,
        daysUntilDue: 0,
        hoursUntilDue: 0,
        status: 'done',
      };
      
      statusCache.set(cacheKey, { status, timestamp: now });
      return status;
    }

    // If no due date or not required, return upcoming
    if (!interaction.followUpDueDate || !interaction.followUpRequired) {
      const status: ReminderStatus = {
        isOverdue: false,
        isDueSoon: false,
        isDueToday: false,
        isDueWithin1Hour: false,
        isActive: false,
        daysUntilDue: Infinity,
        hoursUntilDue: Infinity,
        status: 'upcoming',
      };
      
      statusCache.set(cacheKey, { status, timestamp: now });
      return status;
    }

    const dueDate = new Date(interaction.followUpDueDate);
    const isOverdueStatus = isOverdue(dueDate, referenceDate);
    const isDueSoonStatus = isDueSoon(dueDate, DATE_THRESHOLDS.DUE_SOON_HOURS, referenceDate);
    const isDueTodayStatus = isDueToday(dueDate, referenceDate);
    const isDueWithin1HourStatus = isDueWithin1Hour(dueDate, referenceDate);
    const daysUntilDue = getDaysUntilDue(dueDate, referenceDate);
    const hoursUntilDue = getHoursUntilDue(dueDate, referenceDate);

    // Determine status
    let status: ReminderStatus['status'];
    if (isOverdueStatus) {
      status = 'overdue';
    } else if (isDueSoonStatus) {
      status = isDueTodayStatus ? 'due-today' : 'due-soon';
    } else {
      status = 'upcoming';
    }

    const reminderStatus: ReminderStatus = {
      isOverdue: isOverdueStatus,
      isDueSoon: isDueSoonStatus,
      isDueToday: isDueTodayStatus,
      isDueWithin1Hour: isDueWithin1HourStatus,
      isActive: interaction.followUpRequired && !interaction.isDone,
      daysUntilDue: Math.max(0, daysUntilDue),
      hoursUntilDue: Math.max(0, hoursUntilDue),
      status,
    };

    // Cache the result
    statusCache.set(cacheKey, { status: reminderStatus, timestamp: now });
    
    return reminderStatus;
  }

  /**
   * Categorize multiple reminders by status
   */
  static categorize(interactions: Interaction[], referenceDate: Date = new Date()): CategorizedReminders {
    const categorized: CategorizedReminders = {
      overdue: [],
      dueSoon: [],
      dueToday: [],
      upcoming: [],
      done: [],
    };

    interactions.forEach(interaction => {
      const status = this.getStatus(interaction, referenceDate);
      
      switch (status.status) {
        case 'overdue':
          categorized.overdue.push(interaction);
          break;
        case 'due-soon':
          categorized.dueSoon.push(interaction);
          break;
        case 'due-today':
          categorized.dueToday.push(interaction);
          break;
        case 'upcoming':
          categorized.upcoming.push(interaction);
          break;
        case 'done':
          categorized.done.push(interaction);
          break;
      }
    });

    return categorized;
  }

  /**
   * Get overdue reminders
   */
  static getOverdue(interactions: Interaction[], referenceDate: Date = new Date()): Interaction[] {
    return interactions.filter(interaction => {
      if (!interaction.followUpRequired || !interaction.followUpDueDate || interaction.isDone) {
        return false;
      }
      return isOverdue(new Date(interaction.followUpDueDate), referenceDate);
    });
  }

  /**
   * Get due soon reminders
   */
  static getDueSoon(interactions: Interaction[], referenceDate: Date = new Date()): Interaction[] {
    return interactions.filter(interaction => {
      if (!interaction.followUpRequired || !interaction.followUpDueDate || interaction.isDone) {
        return false;
      }
      return isDueSoon(new Date(interaction.followUpDueDate), DATE_THRESHOLDS.DUE_SOON_HOURS, referenceDate);
    });
  }

  /**
   * Get due today reminders
   */
  static getDueToday(interactions: Interaction[], referenceDate: Date = new Date()): Interaction[] {
    return interactions.filter(interaction => {
      if (!interaction.followUpRequired || !interaction.followUpDueDate || interaction.isDone) {
        return false;
      }
      return isDueToday(new Date(interaction.followUpDueDate), referenceDate);
    });
  }

  /**
   * Get active reminders (not done)
   */
  static getActive(interactions: Interaction[]): Interaction[] {
    return interactions.filter(interaction => 
      interaction.followUpRequired && !interaction.isDone
    );
  }

  /**
   * Get reminder statistics
   */
  static getStats(interactions: Interaction[], referenceDate: Date = new Date()): ReminderStats {
    const categorized = this.categorize(interactions, referenceDate);
    
    return {
      total: interactions.filter(i => i.followUpRequired && i.followUpDueDate).length,
      overdue: categorized.overdue.length,
      dueSoon: categorized.dueSoon.length,
      dueToday: categorized.dueToday.length,
      upcoming: categorized.upcoming.length,
      done: categorized.done.length,
    };
  }

  /**
   * Find newly overdue reminders
   */
  static getNewlyOverdue(
    currentOverdue: string[],
    previousOverdue: string[]
  ): string[] {
    return currentOverdue.filter(id => !previousOverdue.includes(id));
  }

  /**
   * Clear status cache
   */
  static clearCache(): void {
    statusCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: number } {
    return {
      size: statusCache.size,
      entries: Array.from(statusCache.keys()).length,
    };
  }
} 