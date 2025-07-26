'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Bell, MessageSquare, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChronologicalTimeline } from '@/components/ChronologicalTimeline';
import { TimelineFilterPanel } from '@/components/TimelineFilterPanel';
import { useContactStore } from '@/stores/contactStore';

export default function TimelinePage() {
  const router = useRouter();
  const { interactions, contacts } = useContactStore();
  
  const [view, setView] = useState<'all' | 'interactions' | 'reminders'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'due-soon' | 'upcoming'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const stats = {
    totalInteractions: interactions.length,
    totalReminders: interactions.filter(i => i.followUpRequired && i.followUpDueDate).length,
    overdueReminders: interactions.filter(i => {
      if (!i.followUpRequired || !i.followUpDueDate) return false;
      return new Date(i.followUpDueDate) < new Date();
    }).length,
    dueSoonReminders: interactions.filter(i => {
      if (!i.followUpRequired || !i.followUpDueDate) return false;
      const dueDate = new Date(i.followUpDueDate);
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return dueDate <= tomorrow && dueDate >= now;
    }).length,
  };

  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={handleBackNavigation}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Timeline</h1>
            <p className="text-muted-foreground">
              Unified view of all interactions and reminders
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalInteractions}</div>
                <div className="text-sm text-muted-foreground">Total Interactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalReminders}</div>
                <div className="text-sm text-muted-foreground">Total Reminders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.overdueReminders}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.dueSoonReminders}</div>
                <div className="text-sm text-muted-foreground">Due Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Panel */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <TimelineFilterPanel
            view={view}
            onViewChange={setView}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
          />
        </CardContent>
      </Card>

      {/* Timeline */}
      <ChronologicalTimeline
        showRemindersOnly={view === 'reminders'}
        showInteractionsOnly={view === 'interactions'}
        dateRange={dateRange}
        statusFilter={statusFilter}
      />
    </div>
  );
} 