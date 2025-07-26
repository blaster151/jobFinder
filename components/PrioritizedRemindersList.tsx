import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  User, 
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { useReminderPriorityStore, usePrioritizedReminders, usePriorityStats } from '@/stores/reminderPriorityStore';
import { useContactStore } from '@/stores/contactStore';
import { getPriorityInsights } from '@/lib/reminderHeuristics';
import { formatDistanceToNow } from 'date-fns';

interface PrioritizedRemindersListProps {
  limit?: number;
  showInsights?: boolean;
  showActions?: boolean;
  priorityFilter?: 'all' | 'high' | 'medium' | 'low';
}

const getInteractionIcon = (type: string) => {
  switch (type) {
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'phone':
      return <Phone className="w-4 h-4" />;
    case 'text':
      return <MessageSquare className="w-4 h-4" />;
    case 'dm':
      return <MessageSquare className="w-4 h-4" />;
    case 'in_person':
      return <MapPin className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
};

const getPriorityColor = (score: number) => {
  if (score >= 7.0) return 'destructive';
  if (score >= 4.0) return 'secondary';
  return 'outline';
};

const getPriorityLabel = (score: number) => {
  if (score >= 7.0) return 'High';
  if (score >= 4.0) return 'Medium';
  return 'Low';
};

export const PrioritizedRemindersList: React.FC<PrioritizedRemindersListProps> = ({
  limit,
  showInsights = true,
  showActions = true,
  priorityFilter = 'all'
}) => {
  const { calculateAllPriorities } = useReminderPriorityStore();
  const prioritizedReminders = usePrioritizedReminders();
  const { hasHighPriorityReminders, totalReminders, averagePriorityScore } = usePriorityStats();
  const { markReminderDone, snoozeReminder } = useContactStore();

  useEffect(() => {
    calculateAllPriorities();
  }, [calculateAllPriorities]);

  // Filter reminders based on priority filter
  const filteredReminders = React.useMemo(() => {
    if (priorityFilter === 'all') {
      return limit ? prioritizedReminders.slice(0, limit) : prioritizedReminders;
    }
    
    const filtered = prioritizedReminders.filter(reminder => {
      switch (priorityFilter) {
        case 'high':
          return reminder.priorityScore >= 7.0;
        case 'medium':
          return reminder.priorityScore >= 4.0 && reminder.priorityScore < 7.0;
        case 'low':
          return reminder.priorityScore < 4.0;
        default:
          return true;
      }
    });
    
    return limit ? filtered.slice(0, limit) : filtered;
  }, [prioritizedReminders, priorityFilter, limit]);

  const handleMarkDone = async (interactionId: string) => {
    await markReminderDone(interactionId);
    calculateAllPriorities(); // Recalculate priorities
  };

  const handleSnooze = async (interactionId: string, hours: number) => {
    await snoozeReminder(interactionId, hours);
    calculateAllPriorities(); // Recalculate priorities
  };

  if (filteredReminders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No reminders to display</p>
          {priorityFilter !== 'all' && (
            <p className="text-sm">Try adjusting the priority filter</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Priority Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Priority Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalReminders}</div>
              <div className="text-muted-foreground">Total Reminders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averagePriorityScore.toFixed(1)}</div>
              <div className="text-muted-foreground">Avg Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {hasHighPriorityReminders ? (
                  <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                )}
              </div>
              <div className="text-muted-foreground">High Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioritized Reminders */}
      <div className="space-y-3">
        {filteredReminders.map((reminder) => {
          const insights = getPriorityInsights(reminder);
          const dueDate = reminder.interaction.followUpDueDate;
          const isOverdue = reminder.status.isOverdue;
          const isDueSoon = reminder.status.isDueWithin1Hour;

          return (
            <Card key={reminder.interactionId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getInteractionIcon(reminder.interaction.type)}
                        <span className="text-sm font-medium">
                          {reminder.contact.name}
                        </span>
                      </div>
                      <Badge variant={getPriorityColor(reminder.priorityScore)}>
                        {getPriorityLabel(reminder.priorityScore)} ({reminder.priorityScore.toFixed(1)})
                      </Badge>
                      {reminder.contact.company && (
                        <span className="text-sm text-muted-foreground">
                          at {reminder.contact.company}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-sm">{reminder.interaction.summary}</p>

                                         {/* Due Date */}
                     {dueDate && (
                       <div className="flex items-center gap-1 text-sm">
                         <Clock className="w-4 h-4" />
                         <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                           {isOverdue ? 'Overdue' : 'Due'} {formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
                         </span>
                         {isDueSoon && !isOverdue && (
                           <Badge variant="secondary" className="ml-2">
                             Due Soon
                           </Badge>
                         )}
                       </div>
                     )}

                    {/* Priority Insights */}
                    {showInsights && insights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {insights.map((insight, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {insight}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Priority Factors */}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Recency: {(reminder.factors.recency * 100).toFixed(0)}%</span>
                      <span>Urgency: {(reminder.factors.urgency * 100).toFixed(0)}%</span>
                      <span>Snooze: {(reminder.factors.snoozeHistory * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleMarkDone(reminder.interactionId)}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSnooze(reminder.interactionId, 24)}
                        className="w-full"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Snooze 24h
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}; 