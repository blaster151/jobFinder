'use client';

import { useNotificationManager } from '@/hooks/useNotificationManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderNotificationProps {
  show?: boolean;
}

export function ReminderNotification({ show = true }: ReminderNotificationProps) {
  const {
    isVisible,
    notificationCount,
    overdueReminders,
    handleDismiss,
    handleMarkDone,
    handleDismissAll,
  } = useNotificationManager();

  if (!show || !isVisible) {
    return null;
  }

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 bg-background/95 backdrop-blur-sm border-2 border-destructive/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-destructive" />
            <CardTitle className="text-lg">Overdue Reminders</CardTitle>
            <Badge variant="destructive" className="ml-2">
              {notificationCount}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="h-6 w-6 p-0"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {overdueReminders.map(({ interaction, contact }) => (
            <div
              key={interaction!.id}
              className="p-3 border rounded-lg bg-destructive/5 border-destructive/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {contact!.name}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {interaction!.type} — {interaction!.summary}
                  </div>
                  <div className="text-xs text-destructive font-medium">
                    Due: {interaction!.followUpDueDate 
                      ? format(new Date(interaction!.followUpDueDate), 'MMM d, yyyy')
                      : 'No due date'
                    }
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkDone(interaction!.id!)}
                  className="flex-shrink-0"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Done
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 