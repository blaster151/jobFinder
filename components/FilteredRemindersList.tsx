'use client';

import { useMemo } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { useFilterStore } from '@/stores/filterStore';
import { ReminderRow } from './ReminderRow';
import { ReminderFilterPanel } from './ReminderFilterPanel';
import { FilterService } from '@/lib/services/filterService';
import { ReminderStatusService } from '@/lib/services/reminderStatusService';

export function FilteredRemindersList() {
  const { interactions, contacts } = useContactStore();
  const { reminderFilters } = useFilterStore();

  const filteredReminders = useMemo(() => {
    // Use the unified filter service
    const filterOptions = {
      dateRange: reminderFilters.dueDate as any,
      type: reminderFilters.type as any,
      status: reminderFilters.status as any,
    };

    const result = FilterService.filterReminders(interactions, filterOptions);
    
    // Sort by due date (overdue first, then by date)
    return FilterService.sortInteractions(result.items, 'dueDate', 'asc');
  }, [interactions, reminderFilters]);

  const getFilterSummary = () => {
    const activeFilters = [];
    if (reminderFilters.dueDate !== 'all') {
      const dueDateLabels = {
        'today': 'Today',
        'next3days': 'Next 3 Days',
        'thisWeek': 'This Week',
        'overdue': 'Overdue',
      };
      activeFilters.push(dueDateLabels[reminderFilters.dueDate]);
    }
    if (reminderFilters.type !== 'all') {
      const typeLabels = {
        'follow-up': 'Follow-up',
        'check-in': 'Check-in',
        'custom': 'Custom',
      };
      activeFilters.push(typeLabels[reminderFilters.type]);
    }
    if (reminderFilters.status !== 'all') {
      const statusLabels = {
        'active': 'Active',
        'done': 'Done',
      };
      activeFilters.push(statusLabels[reminderFilters.status]);
    }
    return activeFilters;
  };

  return (
    <div className="space-y-6">
      <ReminderFilterPanel />
      
      {/* Filter Summary */}
      {getFilterSummary().length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredReminders.length} reminder{filteredReminders.length !== 1 ? 's' : ''} 
          {getFilterSummary().length > 0 && (
            <> filtered by: {getFilterSummary().join(', ')}</>
          )}
        </div>
      )}

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            {getFilterSummary().length > 0 
              ? 'No reminders match your current filters.'
              : 'No reminders due at the moment.'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReminders.map((interaction) => {
            const contact = contacts.find((c) => c.id === interaction.contactId);
            const contactName = contact?.name || 'Unknown Contact';

            return (
              <ReminderRow
                key={interaction.id}
                interaction={interaction}
                contactName={contactName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
} 