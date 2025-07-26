import { Interaction } from '@/lib/schemas';
import { differenceInDays, differenceInHours, formatDistanceToNow } from 'date-fns';

export interface ContactStats {
  totalInteractions: number;
  averageTimeBetweenInteractions: string | null;
  longestSilenceGap: string | null;
  mostCommonInteractionType: string | null;
  nextScheduledReminder: {
    date: Date | null;
    description: string | null;
    isOverdue: boolean;
  };
  recentInteractions: number;
  pendingFollowUps: number;
  interactionRate: number;
  followUpRate: number;
}

export function calculateContactStats(
  interactions: Interaction[],
  contactId?: string
): ContactStats {
  // Filter interactions for specific contact if provided
  const contactInteractions = contactId 
    ? interactions.filter(i => i.contactId === contactId)
    : interactions;

  if (contactInteractions.length === 0) {
    return {
      totalInteractions: 0,
      averageTimeBetweenInteractions: null,
      longestSilenceGap: null,
      mostCommonInteractionType: null,
      nextScheduledReminder: { date: null, description: null, isOverdue: false },
      recentInteractions: 0,
      pendingFollowUps: 0,
      interactionRate: 0,
      followUpRate: 0,
    };
  }

  // Sort interactions by date (oldest first)
  const sortedInteractions = [...contactInteractions].sort(
    (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  // Calculate average time between interactions
  let averageTimeBetweenInteractions: string | null = null;
  if (sortedInteractions.length > 1) {
    const timeGaps: number[] = [];
    for (let i = 1; i < sortedInteractions.length; i++) {
      const prevDate = new Date(sortedInteractions[i - 1].createdAt!);
      const currDate = new Date(sortedInteractions[i].createdAt!);
      const gapInDays = differenceInDays(currDate, prevDate);
      timeGaps.push(gapInDays);
    }
    
    const averageGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;
    averageTimeBetweenInteractions = `${Math.round(averageGap)} days`;
  }

  // Calculate longest silence gap
  let longestSilenceGap: string | null = null;
  if (sortedInteractions.length > 1) {
    const timeGaps: number[] = [];
    for (let i = 1; i < sortedInteractions.length; i++) {
      const prevDate = new Date(sortedInteractions[i - 1].createdAt!);
      const currDate = new Date(sortedInteractions[i].createdAt!);
      const gapInDays = differenceInDays(currDate, prevDate);
      timeGaps.push(gapInDays);
    }
    
    const maxGap = Math.max(...timeGaps);
    longestSilenceGap = `${maxGap} days`;
  }

  // Calculate most common interaction type
  const typeCounts: Record<string, number> = {};
  contactInteractions.forEach(interaction => {
    typeCounts[interaction.type] = (typeCounts[interaction.type] || 0) + 1;
  });
  
  const mostCommonInteractionType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  // Find next scheduled reminder
  const now = new Date();
  const upcomingReminders = contactInteractions
    .filter(i => i.followUpRequired && i.followUpDueDate && !i.isDone)
    .map(i => ({
      date: new Date(i.followUpDueDate!),
      description: i.summary,
      isOverdue: new Date(i.followUpDueDate!) < now,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextScheduledReminder = upcomingReminders.length > 0 
    ? upcomingReminders[0]
    : { date: null, description: null, isOverdue: false };

  // Calculate recent interactions (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentInteractions = contactInteractions.filter(i => 
    new Date(i.createdAt!) > weekAgo
  ).length;

  // Calculate pending follow-ups
  const pendingFollowUps = contactInteractions.filter(i => 
    i.followUpRequired && !i.isDone
  ).length;

  // Calculate rates
  const interactionRate = contactInteractions.length > 0 
    ? Math.round((recentInteractions / contactInteractions.length) * 100)
    : 0;

  const followUpRate = contactInteractions.length > 0
    ? Math.round((pendingFollowUps / contactInteractions.length) * 100)
    : 0;

  return {
    totalInteractions: contactInteractions.length,
    averageTimeBetweenInteractions,
    longestSilenceGap,
    mostCommonInteractionType,
    nextScheduledReminder,
    recentInteractions,
    pendingFollowUps,
    interactionRate,
    followUpRate,
  };
}

export function formatNextReminder(reminder: { date: Date | null; description: string | null; isOverdue: boolean }): string {
  if (!reminder.date) return 'No upcoming reminders';
  
  const timeAgo = formatDistanceToNow(reminder.date, { addSuffix: true });
  const status = reminder.isOverdue ? 'Overdue' : 'Due';
  
  return `${status} ${timeAgo}`;
}

export function getInteractionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Phone Call',
    text: 'Text Message',
    dm: 'Direct Message',
    in_person: 'In Person',
  };
  
  return labels[type] || type;
} 