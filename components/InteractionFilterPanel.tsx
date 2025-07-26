'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFilterStore, InteractionFilters } from '@/stores/filterStore';
import { useContactStore } from '@/stores/contactStore';
import { Filter, X, RotateCcw, Calendar } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function InteractionFilterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { interactionFilters, setInteractionFilters, resetInteractionFilters } = useFilterStore();
  const { contacts } = useContactStore();

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'text', label: 'Text' },
    { value: 'dm', label: 'Direct Message' },
    { value: 'in_person', label: 'In Person' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (interactionFilters.type !== 'all') count++;
    if (interactionFilters.dateRange !== 'all') count++;
    if (interactionFilters.contactId) count++;
    if (interactionFilters.customDateFrom || interactionFilters.customDateTo) count++;
    return count;
  };

  const clearFilter = (filter: keyof InteractionFilters) => {
    if (filter === 'type' || filter === 'dateRange') {
      setInteractionFilters({ [filter]: 'all' });
    } else if (filter === 'contactId') {
      setInteractionFilters({ [filter]: '' });
    } else if (filter === 'customDateFrom' || filter === 'customDateTo') {
      setInteractionFilters({ [filter]: undefined });
    }
  };

  const clearAllFilters = () => {
    resetInteractionFilters();
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact?.name || 'Unknown Contact';
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Interaction Filters</h3>
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
              onClick={clearAllFilters}
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
          {interactionFilters.type !== 'all' && (
            <Badge variant="outline" className="gap-1">
              {typeOptions.find(opt => opt.value === interactionFilters.type)?.label}
              <button
                onClick={() => clearFilter('type')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {interactionFilters.dateRange !== 'all' && (
            <Badge variant="outline" className="gap-1">
              {dateRangeOptions.find(opt => opt.value === interactionFilters.dateRange)?.label}
              <button
                onClick={() => clearFilter('dateRange')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {interactionFilters.contactId && (
            <Badge variant="outline" className="gap-1">
              Contact: {getContactName(interactionFilters.contactId)}
              <button
                onClick={() => clearFilter('contactId')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {(interactionFilters.customDateFrom || interactionFilters.customDateTo) && (
            <Badge variant="outline" className="gap-1">
              Custom Date Range
              <button
                onClick={() => {
                  clearFilter('customDateFrom');
                  clearFilter('customDateTo');
                }}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Controls */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={interactionFilters.type}
                onValueChange={(value) => setInteractionFilters({ type: value as any })}
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

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={interactionFilters.dateRange}
                onValueChange={(value) => setInteractionFilters({ dateRange: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Select
                value={interactionFilters.contactId}
                onValueChange={(value) => setInteractionFilters({ contactId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All contacts</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id!}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            {interactionFilters.dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="date"
                      value={interactionFilters.customDateFrom || ''}
                      onChange={(e) => setInteractionFilters({ customDateFrom: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="date"
                      value={interactionFilters.customDateTo || ''}
                      onChange={(e) => setInteractionFilters({ customDateTo: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
} 