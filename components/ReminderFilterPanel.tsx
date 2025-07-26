'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFilterStore, ReminderFilters } from '@/stores/filterStore';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function ReminderFilterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { reminderFilters, setReminderFilters, resetReminderFilters } = useFilterStore();

  const dueDateOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'next3days', label: 'Next 3 Days' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'check-in', label: 'Check-in' },
    { value: 'custom', label: 'Custom' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (reminderFilters.dueDate !== 'all') count++;
    if (reminderFilters.type !== 'all') count++;
    if (reminderFilters.status !== 'all') count++;
    return count;
  };

  const getFilterLabel = (filter: keyof ReminderFilters) => {
    const value = reminderFilters[filter];
    if (value === 'all') return null;
    
    const options = {
      dueDate: dueDateOptions,
      type: typeOptions,
      status: statusOptions,
    };
    
    return options[filter].find(opt => opt.value === value)?.label;
  };

  const clearFilter = (filter: keyof ReminderFilters) => {
    setReminderFilters({ [filter]: 'all' });
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetReminderFilters}
              className="h-8 px-2"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
          
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {isOpen ? 'Hide' : 'Show'} Filters
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Active Filter Badges */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.keys(reminderFilters).map((filter) => {
            const label = getFilterLabel(filter as keyof ReminderFilters);
            if (!label) return null;
            
            return (
              <Badge key={filter} variant="outline" className="gap-1">
                {label}
                <button
                  onClick={() => clearFilter(filter as keyof ReminderFilters)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filter Controls */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Due Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Select
                value={reminderFilters.dueDate}
                onValueChange={(value) => setReminderFilters({ dueDate: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dueDateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={reminderFilters.type}
                onValueChange={(value) => setReminderFilters({ type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={reminderFilters.status}
                onValueChange={(value) => setReminderFilters({ status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
} 