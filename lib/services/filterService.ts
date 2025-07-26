import { Interaction, Contact } from '@/lib/schemas';
import { filterByDateRange, DateRange, DATE_RANGES } from '@/lib/utils/dateUtils';
import { ReminderStatusService } from './reminderStatusService';

export interface FilterOptions {
  dateRange?: DateRange;
  status?: 'all' | 'overdue' | 'due-soon' | 'upcoming' | 'done';
  type?: 'all' | 'email' | 'phone' | 'text' | 'dm' | 'in_person';
  contactId?: string;
  searchTerm?: string;
  tags?: string[];
  flagged?: boolean;
}

export interface FilterResult<T> {
  items: T[];
  total: number;
  filtered: number;
  appliedFilters: string[];
}

export class FilterService {
  /**
   * Filter interactions by multiple criteria
   */
  static filterInteractions(
    interactions: Interaction[],
    options: FilterOptions,
    referenceDate: Date = new Date()
  ): FilterResult<Interaction> {
    let filtered = [...interactions];
    const appliedFilters: string[] = [];

    // Filter by contact ID
    if (options.contactId) {
      filtered = filtered.filter(i => i.contactId === options.contactId);
      appliedFilters.push(`Contact: ${options.contactId}`);
    }

    // Filter by date range
    if (options.dateRange && options.dateRange !== DATE_RANGES.ALL) {
      filtered = filterByDateRange(
        filtered,
        options.dateRange,
        (interaction) => new Date(interaction.followUpDueDate || interaction.createdAt!),
        referenceDate
      );
      appliedFilters.push(`Date: ${options.dateRange}`);
    }

    // Filter by status
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(interaction => {
        const status = ReminderStatusService.getStatus(interaction, referenceDate);
        return status.status === options.status;
      });
      appliedFilters.push(`Status: ${options.status}`);
    }

    // Filter by type
    if (options.type && options.type !== 'all') {
      filtered = filtered.filter(i => i.type === options.type);
      appliedFilters.push(`Type: ${options.type}`);
    }

    // Filter by search term
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.summary.toLowerCase().includes(searchLower) ||
        i.type.toLowerCase().includes(searchLower)
      );
      appliedFilters.push(`Search: "${options.searchTerm}"`);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(i => 
        options.tags!.some(tag => i.tags?.includes(tag))
      );
      appliedFilters.push(`Tags: ${options.tags.join(', ')}`);
    }

    return {
      items: filtered,
      total: interactions.length,
      filtered: filtered.length,
      appliedFilters,
    };
  }

  /**
   * Filter contacts by multiple criteria
   */
  static filterContacts(
    contacts: Contact[],
    options: FilterOptions
  ): FilterResult<Contact> {
    let filtered = [...contacts];
    const appliedFilters: string[] = [];

    // Filter by search term
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(contact => {
        const searchableText = [
          contact.name,
          contact.company,
          contact.role,
          contact.notes,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(searchLower);
      });
      appliedFilters.push(`Search: "${options.searchTerm}"`);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(contact => 
        options.tags!.some(tag => contact.tags?.includes(tag))
      );
      appliedFilters.push(`Tags: ${options.tags.join(', ')}`);
    }

    // Filter by flagged status
    if (options.flagged !== undefined) {
      filtered = filtered.filter(contact => contact.flagged === options.flagged);
      appliedFilters.push(`Flagged: ${options.flagged ? 'Yes' : 'No'}`);
    }

    return {
      items: filtered,
      total: contacts.length,
      filtered: filtered.length,
      appliedFilters,
    };
  }

  /**
   * Filter reminders specifically
   */
  static filterReminders(
    interactions: Interaction[],
    options: FilterOptions,
    referenceDate: Date = new Date()
  ): FilterResult<Interaction> {
    // First, filter to only include reminders
    const reminders = interactions.filter(i => 
      i.followUpRequired && i.followUpDueDate
    );

    // Then apply other filters
    return this.filterInteractions(reminders, options, referenceDate);
  }

  /**
   * Filter by date range only
   */
  static filterByDateRange<T>(
    items: T[],
    range: DateRange,
    getDate: (item: T) => Date,
    referenceDate: Date = new Date()
  ): T[] {
    return filterByDateRange(items, range, getDate, referenceDate);
  }

  /**
   * Filter by status only
   */
  static filterByStatus<T>(
    items: T[],
    status: string,
    getStatus: (item: T) => string,
    referenceDate: Date = new Date()
  ): T[] {
    if (status === 'all') return items;
    
    return items.filter(item => getStatus(item) === status);
  }

  /**
   * Filter by type only
   */
  static filterByType<T>(
    items: T[],
    type: string,
    getType: (item: T) => string
  ): T[] {
    if (type === 'all') return items;
    
    return items.filter(item => getType(item) === type);
  }

  /**
   * Filter by search term only
   */
  static filterBySearch<T>(
    items: T[],
    searchTerm: string,
    getSearchableText: (item: T) => string
  ): T[] {
    if (!searchTerm.trim()) return items;
    
    const searchLower = searchTerm.toLowerCase();
    return items.filter(item => 
      getSearchableText(item).toLowerCase().includes(searchLower)
    );
  }

  /**
   * Filter by tags only
   */
  static filterByTags<T>(
    items: T[],
    tags: string[],
    getTags: (item: T) => string[]
  ): T[] {
    if (!tags || tags.length === 0) return items;
    
    return items.filter(item => 
      tags.some(tag => getTags(item).includes(tag))
    );
  }

  /**
   * Sort interactions by various criteria
   */
  static sortInteractions(
    interactions: Interaction[],
    sortBy: 'date' | 'dueDate' | 'type' | 'contact' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc',
    referenceDate: Date = new Date()
  ): Interaction[] {
    const sorted = [...interactions];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
          break;
        
        case 'dueDate':
          const aDue = a.followUpDueDate ? new Date(a.followUpDueDate).getTime() : 0;
          const bDue = b.followUpDueDate ? new Date(b.followUpDueDate).getTime() : 0;
          comparison = aDue - bDue;
          break;
        
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        
        case 'contact':
          comparison = a.contactId.localeCompare(b.contactId);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Get filter summary for display
   */
  static getFilterSummary(appliedFilters: string[]): string {
    if (appliedFilters.length === 0) {
      return 'All items';
    }
    
    return appliedFilters.join(', ');
  }

  /**
   * Check if any filters are applied
   */
  static hasActiveFilters(options: FilterOptions): boolean {
    return !!(
      options.dateRange ||
      options.status ||
      options.type ||
      options.contactId ||
      options.searchTerm ||
      (options.tags && options.tags.length > 0) ||
      options.flagged !== undefined
    );
  }
} 