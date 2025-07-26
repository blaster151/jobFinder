import { Interaction, Contact } from '@prisma/client';
import { getReminderStatus, ReminderStatus } from './reminderUtils';

export interface ReminderPriority {
  interactionId: string;
  contactId: string;
  priorityScore: number;
  factors: {
    recency: number;
    urgency: number;
    snoozeHistory: number;
    overdueMultiplier: number;
    dueSoonMultiplier: number;
  };
  status: ReminderStatus;
  contact: Contact;
  interaction: Interaction;
}

export interface UrgencyConfig {
  // Interaction type urgency weights (0-1)
  typeWeights: Record<string, number>;
  // Tag-based urgency weights
  tagWeights: Record<string, number>;
  // Recency decay factor (days)
  recencyDecayDays: number;
  // Snooze penalty factor
  snoozePenalty: number;
  // Overdue multiplier
  overdueMultiplier: number;
  // Due soon multiplier
  dueSoonMultiplier: number;
}

// Default urgency configuration
export const DEFAULT_URGENCY_CONFIG: UrgencyConfig = {
  typeWeights: {
    email: 0.8,
    phone: 0.9,
    text: 0.6,
    dm: 0.7,
    in_person: 1.0,
  },
  tagWeights: {
    urgent: 1.0,
    high_priority: 0.9,
    follow_up: 0.8,
    interview: 0.95,
    application: 0.7,
    networking: 0.6,
    casual: 0.4,
  },
  recencyDecayDays: 7, // Contact recency decays over 7 days
  snoozePenalty: 0.2, // Each snooze reduces priority by 20%
  overdueMultiplier: 2.0, // Overdue reminders get 2x priority
  dueSoonMultiplier: 1.5, // Due soon reminders get 1.5x priority
};

/**
 * Calculate recency score based on last interaction with contact
 * More recent interactions get higher scores
 */
function calculateRecencyScore(
  contact: Contact,
  interactions: Interaction[],
  config: UrgencyConfig
): number {
  const contactInteractions = interactions.filter(i => i.contactId === contact.id);
  
  if (contactInteractions.length === 0) {
    return 0.5; // Default score for new contacts
  }

  // Find most recent interaction
  const mostRecent = contactInteractions.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);
    return currentDate > latestDate ? current : latest;
  });

  const daysSinceLastInteraction = (Date.now() - new Date(mostRecent.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  
  // Exponential decay: newer interactions get higher scores
  const recencyScore = Math.exp(-daysSinceLastInteraction / config.recencyDecayDays);
  
  return Math.max(0.1, Math.min(1.0, recencyScore)); // Clamp between 0.1 and 1.0
}

/**
 * Calculate urgency score based on interaction type and tags
 */
function calculateUrgencyScore(
  interaction: Interaction,
  config: UrgencyConfig
): number {
  // Base urgency from interaction type
  const typeWeight = config.typeWeights[interaction.type] || 0.5;
  
  // Tag-based urgency
  let tagWeight = 0.5; // Default weight
  try {
    const tags = JSON.parse(interaction.tags || '[]') as string[];
    if (tags && tags.length > 0) {
      const tagScores = tags
        .map((tag: string) => config.tagWeights[tag.toLowerCase()] || 0.5)
        .filter((score: number) => score > 0);
      
      if (tagScores.length > 0) {
        tagWeight = Math.max(...tagScores); // Use highest tag weight
      }
    }
  } catch (error) {
    // If JSON parsing fails, use default weight
    console.warn('Failed to parse interaction tags:', error);
  }
  
  // Combine type and tag weights
  return (typeWeight + tagWeight) / 2;
}

/**
 * Calculate snooze penalty based on snooze history
 */
function calculateSnoozePenalty(
  interaction: Interaction,
  config: UrgencyConfig
): number {
  // This would need to be implemented based on how snoozes are tracked
  // For now, we'll use a placeholder that could be enhanced later
  const snoozeCount = 0; // TODO: Track snooze count in interaction or separate table
  
  // Each snooze reduces priority by the penalty factor
  const penalty = Math.pow(1 - config.snoozePenalty, snoozeCount);
  
  return Math.max(0.1, penalty); // Minimum 10% priority
}

/**
 * Calculate time-based multiplier based on reminder status
 */
function calculateTimeMultiplier(
  status: ReminderStatus,
  config: UrgencyConfig
): number {
  if (status.isOverdue) {
    return config.overdueMultiplier;
  } else if (status.isDueWithin1Hour) {
    return config.dueSoonMultiplier;
  } else if (status.isDueSoon) {
    return 1.2; // Slight boost for due soon
  }
  
  return 1.0; // No multiplier for upcoming reminders
}

/**
 * Calculate comprehensive priority score for a reminder
 */
export function calculateReminderPriority(
  interaction: Interaction,
  contact: Contact,
  allInteractions: Interaction[],
  config: UrgencyConfig = DEFAULT_URGENCY_CONFIG
): ReminderPriority {
  const status = getReminderStatus(interaction);
  
  // Calculate individual factors
  const recency = calculateRecencyScore(contact, allInteractions, config);
  const urgency = calculateUrgencyScore(interaction, config);
  const snoozeHistory = calculateSnoozePenalty(interaction, config);
  const overdueMultiplier = status.isOverdue ? config.overdueMultiplier : 1.0;
  const dueSoonMultiplier = status.isDueWithin1Hour ? config.dueSoonMultiplier : 1.0;
  
  // Calculate base priority score (0-1)
  const baseScore = (recency + urgency + snoozeHistory) / 3;
  
  // Apply time-based multiplier
  const timeMultiplier = calculateTimeMultiplier(status, config);
  
  // Final priority score
  const priorityScore = baseScore * timeMultiplier;
  
  return {
    interactionId: interaction.id,
    contactId: contact.id,
    priorityScore: Math.max(0, Math.min(10, priorityScore * 10)), // Scale to 0-10
    factors: {
      recency,
      urgency,
      snoozeHistory,
      overdueMultiplier,
      dueSoonMultiplier,
    },
    status,
    contact,
    interaction,
  };
}

/**
 * Sort reminders by priority score (highest first)
 */
export function sortRemindersByPriority(
  reminders: ReminderPriority[]
): ReminderPriority[] {
  return [...reminders].sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get top N highest priority reminders
 */
export function getTopPriorityReminders(
  reminders: ReminderPriority[],
  limit: number = 10
): ReminderPriority[] {
  return sortRemindersByPriority(reminders).slice(0, limit);
}

/**
 * Filter reminders by minimum priority score
 */
export function filterByMinimumPriority(
  reminders: ReminderPriority[],
  minScore: number = 5.0
): ReminderPriority[] {
  return reminders.filter(reminder => reminder.priorityScore >= minScore);
}

/**
 * Group reminders by priority level
 */
export function groupRemindersByPriority(
  reminders: ReminderPriority[]
): {
  high: ReminderPriority[];
  medium: ReminderPriority[];
  low: ReminderPriority[];
} {
  const high: ReminderPriority[] = [];
  const medium: ReminderPriority[] = [];
  const low: ReminderPriority[] = [];
  
  reminders.forEach(reminder => {
    if (reminder.priorityScore >= 7.0) {
      high.push(reminder);
    } else if (reminder.priorityScore >= 4.0) {
      medium.push(reminder);
    } else {
      low.push(reminder);
    }
  });
  
  return { high, medium, low };
}

/**
 * Calculate priority insights for a reminder
 */
export function getPriorityInsights(priority: ReminderPriority): string[] {
  const insights: string[] = [];
  
  if (priority.factors.recency > 0.8) {
    insights.push('Recent contact - high engagement');
  } else if (priority.factors.recency < 0.3) {
    insights.push('Older contact - may need re-engagement');
  }
  
  if (priority.factors.urgency > 0.8) {
    insights.push('High urgency interaction type');
  }
  
  if (priority.factors.snoozeHistory < 0.5) {
    insights.push('Previously snoozed multiple times');
  }
  
  if (priority.status.isOverdue) {
    insights.push('Overdue - immediate attention needed');
  } else if (priority.status.isDueWithin1Hour) {
    insights.push('Due within 1 hour');
  }
  
  return insights;
}

/**
 * Boost priority score for specific scenarios
 */
export function boostPriorityForScenario(
  priority: ReminderPriority,
  scenario: 'interview' | 'application' | 'networking' | 'urgent'
): ReminderPriority {
  const boostFactors = {
    interview: 1.5,
    application: 1.3,
    networking: 1.2,
    urgent: 2.0,
  };
  
  const boost = boostFactors[scenario] || 1.0;
  
  return {
    ...priority,
    priorityScore: Math.min(10, priority.priorityScore * boost),
    factors: {
      ...priority.factors,
      urgency: Math.min(1.0, priority.factors.urgency * boost),
    },
  };
} 