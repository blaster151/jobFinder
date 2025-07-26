import { Interaction, Contact } from '@/lib/schemas';

export interface NotificationService {
  // Notification state management
  shouldShowNotification(overdueIds: string[]): boolean;
  getNotificationCount(overdueIds: string[]): number;
  
  // Notification data processing
  getOverdueRemindersData(
    overdueIds: string[],
    interactions: Interaction[],
    contacts: Contact[]
  ): Array<{ interaction: Interaction; contact: Contact }>;
  
  // Notification timing
  getAutoHideDelay(): number;
  shouldAutoHide(): boolean;
  
  // Notification actions
  markAsChecked(interactionId: string, overdueIds: string[]): string[];
  clearAllNotifications(overdueIds: string[]): string[];
}

class NotificationServiceImpl implements NotificationService {
  shouldShowNotification(overdueIds: string[]): boolean {
    return overdueIds.length > 0;
  }

  getNotificationCount(overdueIds: string[]): number {
    return overdueIds.length;
  }

  getOverdueRemindersData(
    overdueIds: string[],
    interactions: Interaction[],
    contacts: Contact[]
  ): Array<{ interaction: Interaction; contact: Contact }> {
    return overdueIds
      .map(id => {
        const interaction = interactions.find(i => i.id === id);
        const contact = interaction ? contacts.find(c => c.id === interaction.contactId) : null;
        return { interaction, contact };
      })
      .filter(item => item.interaction && item.contact) as Array<{ interaction: Interaction; contact: Contact }>;
  }

  getAutoHideDelay(): number {
    return 10000; // 10 seconds
  }

  shouldAutoHide(): boolean {
    return true;
  }

  markAsChecked(interactionId: string, overdueIds: string[]): string[] {
    return overdueIds.filter(id => id !== interactionId);
  }

  clearAllNotifications(overdueIds: string[]): string[] {
    return [];
  }
}

export const notificationService = new NotificationServiceImpl(); 