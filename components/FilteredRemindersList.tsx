'use client';

import { useMemo } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { useFilterStore } from '@/stores/filterStore';
import { ReminderRow } from './ReminderRow';
import { ReminderFilterPanel } from './ReminderFilterPanel';
import { format, isToday, isThisWeek, addDays, isAfter, isBefore } from 'date-fns';

export function FilteredRemindersList() {
  const { interactions, contacts } = useContactStore();
  const { reminderFilters } = useFilterStore();

  const filteredReminders = useMemo(() => {
    let filtered = interactions.filter((i) => i.followUpRequired && i.followUpDueDate && !i.isDone);

    // Apply due date filter
    if (reminderFilters.dueDate !== 'all') {
      const now = new Date();
      const today = new Date();
      const next3Days = addDays(today, 3);
      const endOfWeek = addDays(today, 7);

      filtered = filtered.filter((i) => {
        const dueDate = new Date(i.followUpDueDate!);
        
        switch (reminderFilters.dueDate) {
          case 'today':
            return isToday(dueDate);
          case 'next3days':
            return isAfter(dueDate, today) && isBefore(dueDate, next3Days);
          case 'thisWeek':
            return isThisWeek(dueDate);
          case 'overdue':
            return isBefore(dueDate, today);
          default:
            return true;
        }
      });
    }

    // Apply type filter
    if (reminderFilters.type !== 'all') {
      filtered = filtered.filter((i) => {
        // Map interaction types to reminder types
        const typeMapping: Record<string, string> = {
          'email': 'follow-up',
          'phone': 'check-in',
          'text': 'check-in',
          'dm': 'follow-up',
          'in_person': 'custom',
        };
        
        const reminderType = typeMapping[i.type] || 'custom';
        return reminderType === reminderFilters.type;
      });
    }

    // Apply status filter
    if (reminderFilters.status !== 'all') {
      filtered = filtered.filter((i) => {
        const isDone = !i.followUpRequired;
        return reminderFilters.status === 'done' ? isDone : !isDone;
      });
    }

    // Sort by due date (overdue first, then by date)
    return filtered.sort((a, b) => {
      const aDate = new Date(a.followUpDueDate!);
      const bDate = new Date(b.followUpDueDate!);
      const now = new Date();
      
      const aOverdue = isBefore(aDate, now);
      const bOverdue = isBefore(bDate, now);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return aDate.getTime() - bDate.getTime();
    });
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