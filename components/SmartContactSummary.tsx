import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar, 
  MessageSquare, 
  Bell, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Timer
} from 'lucide-react';
import { calculateContactStats, formatNextReminder, getInteractionTypeLabel, ContactStats } from '@/lib/contactStats';
import { Interaction } from '@/lib/schemas';

interface SmartContactSummaryProps {
  interactions: Interaction[];
  contactId?: string;
  contactName?: string;
}

export function SmartContactSummary({ 
  interactions, 
  contactId, 
  contactName = 'Contact' 
}: SmartContactSummaryProps) {
  const stats = calculateContactStats(interactions, contactId);

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'total':
        return <MessageSquare className="w-4 h-4" />;
      case 'average':
        return <BarChart3 className="w-4 h-4" />;
      case 'longest':
        return <Timer className="w-4 h-4" />;
      case 'common':
        return <TrendingUp className="w-4 h-4" />;
      case 'next':
        return <Bell className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatColor = (statName: string, value: any) => {
    switch (statName) {
      case 'next':
        return stats.nextScheduledReminder.isOverdue ? 'text-destructive' : 'text-blue-600';
      case 'longest':
        return value && parseInt(value) > 30 ? 'text-orange-600' : 'text-green-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Interactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatIcon('total')}
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time interactions with {contactName}
            </p>
          </CardContent>
        </Card>

        {/* Average Time Between Interactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatIcon('average')}
              Average Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageTimeBetweenInteractions || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Between interactions
            </p>
          </CardContent>
        </Card>

        {/* Longest Silence Gap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatIcon('longest')}
              Longest Gap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatColor('longest', stats.longestSilenceGap)}`}>
              {stats.longestSilenceGap || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Longest silence period
            </p>
          </CardContent>
        </Card>

        {/* Most Common Interaction Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatIcon('common')}
              Most Common
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {stats.mostCommonInteractionType 
                ? getInteractionTypeLabel(stats.mostCommonInteractionType)
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Interaction type
            </p>
          </CardContent>
        </Card>

        {/* Next Scheduled Reminder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatIcon('next')}
              Next Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-semibold ${getStatColor('next', null)}`}>
              {formatNextReminder(stats.nextScheduledReminder)}
            </div>
            {stats.nextScheduledReminder.description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stats.nextScheduledReminder.description}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interaction Patterns */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Interaction Patterns</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Interaction Rate</span>
                  <Badge variant="outline">
                    {stats.interactionRate}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Follow-up Rate</span>
                  <Badge variant={stats.pendingFollowUps > 0 ? "destructive" : "outline"}>
                    {stats.followUpRate}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Pending Follow-ups</span>
                  <Badge variant={stats.pendingFollowUps > 0 ? "destructive" : "secondary"}>
                    {stats.pendingFollowUps}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Quick Insights</h4>
              <div className="space-y-3">
                {stats.averageTimeBetweenInteractions && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Average gap: {stats.averageTimeBetweenInteractions}</span>
                  </div>
                )}
                
                {stats.longestSilenceGap && (
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span>Longest gap: {stats.longestSilenceGap}</span>
                  </div>
                )}
                
                {stats.mostCommonInteractionType && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span>Preferred method: {getInteractionTypeLabel(stats.mostCommonInteractionType)}</span>
                  </div>
                )}
                
                {stats.nextScheduledReminder.date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span>Next reminder: {formatNextReminder(stats.nextScheduledReminder)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {stats.nextScheduledReminder.isOverdue && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Overdue Reminder</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              You have an overdue follow-up: {stats.nextScheduledReminder.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 