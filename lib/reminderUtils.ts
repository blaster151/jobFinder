import { Interaction } from '@/lib/schemas';

export interface ReminderStatus {
  isDueSoon: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueWithin1Hour: boolean;
  isActive: boolean;
  daysUntilDue: number;
  hoursUntilDue: number;
  status: 'overdue' | 'due-soon' | 'due-today' | 'upcoming' | 'done';
}

// Cache for computed reminder statuses
const statusCache = new Map<string, { status: ReminderStatus; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

// Thresholds for categorization
const DUE_SOON_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DUE_TODAY_THRESHOLD = 24 * 60 * 60 * 1000; // End of day
const DUE_WITHIN_1_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

export function getReminderStatus(interaction: Interaction): ReminderStatus {
  const cacheKey = `${interaction.id}-${interaction.followUpDueDate}-${interaction.isDone}`;
  const now = Date.now();
  
  // Check cache first
  const cached = statusCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.status;
  }

  // If reminder is done, return early
  if (interaction.isDone) {
    const status: ReminderStatus = {
      isDueSoon: false,
      isOverdue: false,
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

  // If no due date, return upcoming
  if (!interaction.followUpDueDate || !interaction.followUpRequired) {
    const status: ReminderStatus = {
      isDueSoon: false,
      isOverdue: false,
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

  const dueDate = new Date(interaction.followUpDueDate).getTime();
  const timeUntilDue = dueDate - now;
  const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
  const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24);

  // Determine status
  let status: ReminderStatus['status'];
  let isDueSoon = false;
  let isOverdue = false;
  let isDueToday = false;
  let isDueWithin1Hour = false;

  if (timeUntilDue < 0) {
    // Overdue
    status = 'overdue';
    isOverdue = true;
  } else if (timeUntilDue <= DUE_SOON_THRESHOLD) {
    // Due soon (within 24 hours)
    status = 'due-soon';
    isDueSoon = true;
    
    // Check if due today
    const today = new Date();
    const dueDateObj = new Date(interaction.followUpDueDate);
    isDueToday = dueDateObj.toDateString() === today.toDateString();
    
    // Check if due within 1 hour
    isDueWithin1Hour = timeUntilDue <= DUE_WITHIN_1_HOUR;
  } else {
    // Upcoming
    status = 'upcoming';
  }

  const reminderStatus: ReminderStatus = {
    isDueSoon,
    isOverdue,
    isDueToday,
    isDueWithin1Hour,
    isActive: interaction.followUpRequired && !interaction.isDone,
    daysUntilDue: Math.max(0, daysUntilDue),
    hoursUntilDue: Math.max(0, hoursUntilDue),
    status,
  };

  // Cache the result
  statusCache.set(cacheKey, { status: reminderStatus, timestamp: now });
  
  return reminderStatus;
}

export function getRemindersByStatus(interactions: Interaction[]) {
  const categorized = {
    overdue: [] as Interaction[],
    dueSoon: [] as Interaction[],
    dueToday: [] as Interaction[],
    upcoming: [] as Interaction[],
    done: [] as Interaction[],
  };

  interactions.forEach(interaction => {
    const status = getReminderStatus(interaction);
    
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

export function clearStatusCache() {
  statusCache.clear();
}

export function getStatusCacheStats() {
  return {
    size: statusCache.size,
    entries: Array.from(statusCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp,
    })),
  };
}

// Utility functions for testing
export function createTestInteraction(
  overrides: Partial<Interaction> = {}
): Interaction {
  return {
    id: 'test-id',
    contactId: 'test-contact-id',
    type: 'email',
    summary: 'Test interaction',
    followUpRequired: true,
    followUpDueDate: new Date().toISOString(),
    isDone: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createOverdueInteraction(): Interaction {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return createTestInteraction({
    followUpDueDate: yesterday.toISOString(),
  });
}

export function createDueSoonInteraction(): Interaction {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return createTestInteraction({
    followUpDueDate: tomorrow.toISOString(),
  });
}

export function createDoneInteraction(): Interaction {
  return createTestInteraction({
    isDone: true,
  });
} 