import { 
  startOfDay, 
  isToday, 
  isThisWeek, 
  isThisMonth, 
  isYesterday, 
  addDays, 
  isAfter, 
  isBefore,
  differenceInDays 
} from 'date-fns';

export const DATE_RANGES = {
  ALL: 'all',
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  NEXT_3_DAYS: 'next3days',
  WEEK: 'week',
  THIS_WEEK: 'thisWeek',
  MONTH: 'month',
  OVERDUE: 'overdue',
} as const;

export type DateRange = typeof DATE_RANGES[keyof typeof DATE_RANGES];

export const DATE_THRESHOLDS = {
  DUE_SOON_HOURS: 24,
  DUE_WITHIN_1_HOUR: 1,
  WEEK_DAYS: 7,
  MONTH_DAYS: 30,
  NEXT_3_DAYS: 3,
} as const;

export interface DateRangeConfig {
  range: DateRange;
  startDate?: Date;
  endDate?: Date;
  customDays?: number;
}

export function getDateRangeBounds(range: DateRange, referenceDate: Date = new Date()) {
  const now = referenceDate;
  const today = startOfDay(now);
  
  switch (range) {
    case DATE_RANGES.TODAY:
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    
    case DATE_RANGES.TOMORROW:
      const tomorrow = addDays(today, 1);
      return {
        start: tomorrow,
        end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    
    case DATE_RANGES.NEXT_3_DAYS:
      return {
        start: today,
        end: addDays(today, DATE_THRESHOLDS.NEXT_3_DAYS),
      };
    
    case DATE_RANGES.WEEK:
      const weekAgo = new Date(today.getTime() - DATE_THRESHOLDS.WEEK_DAYS * 24 * 60 * 60 * 1000);
      return {
        start: weekAgo,
        end: today,
      };
    
    case DATE_RANGES.THIS_WEEK:
      return {
        start: today,
        end: addDays(today, DATE_THRESHOLDS.WEEK_DAYS),
      };
    
    case DATE_RANGES.MONTH:
      const monthAgo = new Date(today.getTime() - DATE_THRESHOLDS.MONTH_DAYS * 24 * 60 * 60 * 1000);
      return {
        start: monthAgo,
        end: today,
      };
    
    case DATE_RANGES.OVERDUE:
      return {
        start: new Date(0), // Beginning of time
        end: today,
      };
    
    case DATE_RANGES.ALL:
    default:
      return {
        start: new Date(0),
        end: new Date(8640000000000000), // Max date
      };
  }
}

export function isDateInRange(date: Date, range: DateRange, referenceDate: Date = new Date()): boolean {
  if (range === DATE_RANGES.ALL) return true;
  
  const bounds = getDateRangeBounds(range, referenceDate);
  const dateToCheck = startOfDay(date);
  
  return dateToCheck >= bounds.start && dateToCheck <= bounds.end;
}

export function filterByDateRange<T>(
  items: T[],
  range: DateRange,
  getDate: (item: T) => Date,
  referenceDate: Date = new Date()
): T[] {
  if (range === DATE_RANGES.ALL) return items;
  
  return items.filter(item => {
    const itemDate = getDate(item);
    return isDateInRange(itemDate, range, referenceDate);
  });
}

export function getGroupKey(date: Date, referenceDate: Date = new Date()): string {
  const itemDate = startOfDay(date);
  const today = startOfDay(referenceDate);
  
  if (isToday(itemDate)) {
    return 'Today';
  } else if (isYesterday(itemDate)) {
    return 'Yesterday';
  } else if (isThisWeek(itemDate)) {
    return 'This Week';
  } else if (isThisMonth(itemDate)) {
    return 'This Month';
  } else {
    const daysDiff = differenceInDays(referenceDate, itemDate);
    if (daysDiff < 30) {
      return 'Last Month';
    } else {
      return 'Older';
    }
  }
}

export function groupByDateRange<T>(
  items: T[],
  getDate: (item: T) => Date,
  referenceDate: Date = new Date()
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  
  items.forEach(item => {
    const date = getDate(item);
    const groupKey = getGroupKey(date, referenceDate);
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  });
  
  return groups;
}

export function isOverdue(date: Date, referenceDate: Date = new Date()): boolean {
  return date < referenceDate;
}

export function isDueSoon(date: Date, hoursThreshold: number = DATE_THRESHOLDS.DUE_SOON_HOURS, referenceDate: Date = new Date()): boolean {
  const timeUntilDue = date.getTime() - referenceDate.getTime();
  const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
  return hoursUntilDue >= 0 && hoursUntilDue <= hoursThreshold;
}

export function isDueToday(date: Date, referenceDate: Date = new Date()): boolean {
  return isToday(startOfDay(date));
}

export function isDueWithin1Hour(date: Date, referenceDate: Date = new Date()): boolean {
  return isDueSoon(date, DATE_THRESHOLDS.DUE_WITHIN_1_HOUR, referenceDate);
}

export function getDaysUntilDue(date: Date, referenceDate: Date = new Date()): number {
  const timeUntilDue = date.getTime() - referenceDate.getTime();
  return Math.ceil(timeUntilDue / (1000 * 60 * 60 * 24));
}

export function getHoursUntilDue(date: Date, referenceDate: Date = new Date()): number {
  const timeUntilDue = date.getTime() - referenceDate.getTime();
  return timeUntilDue / (1000 * 60 * 60);
} 