'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFilterStore, ContactFilters } from '@/stores/filterStore';
import { Filter, X, RotateCcw, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function ContactFilterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { contactFilters, setContactFilters, resetContactFilters } = useFilterStore();

  const recentActivityOptions = [
    { value: 'all', label: 'All Activity' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (contactFilters.label) count++;
    if (contactFilters.recentActivity !== 'all') count++;
    if (contactFilters.role) count++;
    if (contactFilters.company) count++;
    if (contactFilters.location) count++;
    return count;
  };

  const clearFilter = (filter: keyof ContactFilters) => {
    setContactFilters({ [filter]: filter === 'recentActivity' ? 'all' : '' });
  };

  const clearAllFilters = () => {
    resetContactFilters();
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="font-medium">Contact Filters</h3>
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
          {contactFilters.label && (
            <Badge variant="outline" className="gap-1">
              Label: {contactFilters.label}
              <button
                onClick={() => clearFilter('label')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {contactFilters.recentActivity !== 'all' && (
            <Badge variant="outline" className="gap-1">
              {recentActivityOptions.find(opt => opt.value === contactFilters.recentActivity)?.label}
              <button
                onClick={() => clearFilter('recentActivity')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {contactFilters.role && (
            <Badge variant="outline" className="gap-1">
              Role: {contactFilters.role}
              <button
                onClick={() => clearFilter('role')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {contactFilters.company && (
            <Badge variant="outline" className="gap-1">
              Company: {contactFilters.company}
              <button
                onClick={() => clearFilter('company')}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {contactFilters.location && (
            <Badge variant="outline" className="gap-1">
              Location: {contactFilters.location}
              <button
                onClick={() => clearFilter('location')}
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
            {/* Label Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Label/Tag</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search labels..."
                  value={contactFilters.label}
                  onChange={(e) => setContactFilters({ label: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Recent Activity Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recent Activity</label>
              <Select
                value={contactFilters.recentActivity}
                onValueChange={(value) => setContactFilters({ recentActivity: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recentActivityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input
                placeholder="Filter by role..."
                value={contactFilters.role}
                onChange={(e) => setContactFilters({ role: e.target.value })}
              />
            </div>

            {/* Company Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                placeholder="Filter by company..."
                value={contactFilters.company}
                onChange={(e) => setContactFilters({ company: e.target.value })}
              />
            </div>

            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder="Filter by location..."
                value={contactFilters.location}
                onChange={(e) => setContactFilters({ location: e.target.value })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
} 