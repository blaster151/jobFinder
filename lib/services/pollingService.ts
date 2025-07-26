import { ReminderStatusService } from './reminderStatusService';

export interface PollingService {
  // Timer management
  startPolling(interval: number, callback: () => void): void;
  stopPolling(): void;
  setInterval(interval: number): void;
  
  // Polling state
  isPolling(): boolean;
  getLastChecked(): Date | null;
  getNextCheckTime(): Date | null;
  
  // Polling logic
  checkReminders(
    interactions: any[],
    previousOverdue: string[]
  ): {
    currentOverdue: string[];
    newlyOverdue: string[];
    dueSoon: string[];
    dueToday: string[];
  };
}

class PollingServiceImpl implements PollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private isPollingState = false;
  private lastChecked: Date | null = null;
  private currentInterval = 5 * 60 * 1000; // 5 minutes default
  private checkCallback: (() => void) | null = null;

  startPolling(interval: number, callback: () => void): void {
    if (this.isPollingState) return;
    
    this.currentInterval = interval;
    this.checkCallback = callback;
    this.isPollingState = true;
    
    // Initial check
    this.performCheck();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.currentInterval);
  }

  stopPolling(): void {
    this.isPollingState = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.checkCallback = null;
  }

  setInterval(interval: number): void {
    this.currentInterval = interval;
    
    // Restart polling with new interval if currently polling
    if (this.isPollingState && this.checkCallback) {
      this.stopPolling();
      this.startPolling(interval, this.checkCallback);
    }
  }

  isPolling(): boolean {
    return this.isPollingState;
  }

  getLastChecked(): Date | null {
    return this.lastChecked;
  }

  getNextCheckTime(): Date | null {
    if (!this.isPollingState || !this.lastChecked) {
      return null;
    }
    
    return new Date(this.lastChecked.getTime() + this.currentInterval);
  }

  checkReminders(
    interactions: any[],
    previousOverdue: string[]
  ): {
    currentOverdue: string[];
    newlyOverdue: string[];
    dueSoon: string[];
    dueToday: string[];
  } {
    const now = new Date();
    
    // Use the reminder status service to categorize reminders
    const categorized = ReminderStatusService.categorize(interactions, now);
    
    const currentOverdue = categorized.overdue.map(i => i.id!);
    const currentDueSoon = categorized.dueSoon.map(i => i.id!);
    const currentDueToday = categorized.dueToday.map(i => i.id!);
    
    // Find newly overdue reminders
    const newlyOverdue = ReminderStatusService.getNewlyOverdue(
      currentOverdue,
      previousOverdue
    );
    
    this.lastChecked = now;
    
    // Log if there are newly overdue reminders
    if (newlyOverdue.length > 0) {
      console.log(`🔔 ${newlyOverdue.length} reminder(s) became overdue:`, newlyOverdue);
    }
    
    return {
      currentOverdue,
      newlyOverdue,
      dueSoon: currentDueSoon,
      dueToday: currentDueToday,
    };
  }

  private performCheck(): void {
    if (this.checkCallback) {
      this.checkCallback();
    }
  }
}

export const pollingService = new PollingServiceImpl(); 