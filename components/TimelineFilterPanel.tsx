import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Bell, 
  MessageSquare, 
  Filter, 
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TimelineFilterPanelProps {
  view: 'all' | 'interactions' | 'reminders';
  onViewChange: (view: 'all' | 'interactions' | 'reminders') => void;
  dateRange: 'all' | 'today' | 'week' | 'month';
  onDateRangeChange: (range: 'all' | 'today' | 'week' | 'month') => void;
  statusFilter: 'all' | 'overdue' | 'due-soon' | 'upcoming';
  onStatusFilterChange: (status: 'all' | 'overdue' | 'due-soon' | 'upcoming') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function TimelineFilterPanel({
  view,
  onViewChange,
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  showFilters,
  onToggleFilters,
}: TimelineFilterPanelProps) {
  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as any)}>
            <ToggleGroupItem value="all" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">All</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="interactions" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Interactions</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="reminders" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Reminders</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          <Badge variant="outline" className="text-xs">
            {[dateRange, statusFilter].filter(f => f !== 'all').length}
          </Badge>
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={(value) => onDateRangeChange(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="overdue">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    Overdue
                  </div>
                </SelectItem>
                <SelectItem value="due-soon">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Due Soon
                  </div>
                </SelectItem>
                <SelectItem value="upcoming">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Upcoming
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {showFilters && (dateRange !== 'all' || statusFilter !== 'all') && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {dateRange !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {dateRange === 'today' ? 'Today' : 
               dateRange === 'week' ? 'This Week' : 
               dateRange === 'month' ? 'This Month' : dateRange}
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {statusFilter === 'overdue' ? 'Overdue' :
               statusFilter === 'due-soon' ? 'Due Soon' :
               statusFilter === 'upcoming' ? 'Upcoming' : statusFilter}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
} 