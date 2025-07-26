'use client';

import { PrioritizedRemindersList } from '@/components/PrioritizedRemindersList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { useReminderPriorityStore } from '@/stores/reminderPriorityStore';

export default function PrioritiesPage() {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [limit, setLimit] = useState<number | undefined>(10);
  const { calculateAllPriorities, hasHighPriorityReminders, totalReminders, averagePriorityScore } = useReminderPriorityStore();

  const handleRefresh = () => {
    calculateAllPriorities();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Smart Reminders
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered reminder prioritization based on recency, urgency, and engagement
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Priority Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalReminders}</div>
              <div className="text-sm text-muted-foreground">Total Reminders</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{averagePriorityScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Priority</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {hasHighPriorityReminders ? '⚠️' : '✅'}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {priorityFilter === 'all' ? 'All' : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
              </div>
              <div className="text-sm text-muted-foreground">Filter</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Priority Level:</label>
              <Select value={priorityFilter} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => setPriorityFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High (7+)</SelectItem>
                  <SelectItem value="medium">Medium (4-7)</SelectItem>
                  <SelectItem value="low">Low (&lt;4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Limit:</label>
              <Select value={limit?.toString() || 'all'} onValueChange={(value) => setLimit(value === 'all' ? undefined : parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">How Priority is Calculated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Recency Factor</h4>
              <p className="text-muted-foreground">
                More recent interactions get higher scores. Decays exponentially over 7 days.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Urgency Factor</h4>
              <p className="text-muted-foreground">
                Based on interaction type (in-person highest) and tags (urgent, interview, etc.).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Time Multipliers</h4>
              <p className="text-muted-foreground">
                Overdue reminders get 2x boost, due within 1 hour get 1.5x boost.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritized Reminders List */}
      <PrioritizedRemindersList
        limit={limit}
        showInsights={true}
        showActions={true}
        priorityFilter={priorityFilter}
      />
    </div>
  );
} 