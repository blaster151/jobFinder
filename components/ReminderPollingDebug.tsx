'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReminderPolling } from '@/hooks/useReminderPolling';
import { format } from 'date-fns';
import { Play, Pause, RefreshCw, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';

interface ReminderPollingDebugProps {
  show?: boolean;
}

export function ReminderPollingDebug({ show = false }: ReminderPollingDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isPolling,
    lastChecked,
    pollingInterval,
    overdueReminders,
    dueSoonReminders,
    dueTodayReminders,
    recentlyOverdue,
    start,
    stop,
    check,
    clearRecentlyOverdue,
    getDebugInfo,
  } = useReminderPolling({
    autoStart: true,
    onNewlyOverdue: (ids) => {
      console.log('🔔 Newly overdue reminders:', ids);
    },
  });

  const debugInfo = getDebugInfo();

  if (!show) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur-sm border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Reminder Polling</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isPolling ? "default" : "secondary"} className="text-xs">
              {isPolling ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
                  Active
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Paused
                </>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Status Info */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Last Checked:</span>
              <span className="font-mono">
                {lastChecked ? format(lastChecked, 'HH:mm:ss') : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Interval:</span>
              <span className="font-mono">{pollingInterval / 1000}s</span>
            </div>
            <div className="flex justify-between">
              <span>Next Check:</span>
              <span className="font-mono">
                {debugInfo.nextCheckIn > 0 
                  ? `${Math.ceil(debugInfo.nextCheckIn / 1000)}s` 
                  : 'Now'
                }
              </span>
            </div>
          </div>

          {/* Counts */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {overdueReminders.length} Overdue
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {dueSoonReminders.length} Due Soon
            </Badge>
            <Badge variant="default" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {dueTodayReminders.length} Due Today
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="w-3 h-3 mr-1" />
              {recentlyOverdue.length} New
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isPolling ? "outline" : "default"}
              onClick={isPolling ? stop : start}
              className="flex-1"
            >
              {isPolling ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={check}
              className="flex-1"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Check Now
            </Button>
          </div>

          {/* Recently Overdue List */}
          {recentlyOverdue.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Recently Overdue:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearRecentlyOverdue}
                  className="h-4 w-4 p-0"
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
              </div>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {recentlyOverdue.map((id) => (
                  <div
                    key={id}
                    className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded"
                  >
                    {id.slice(0, 8)}...
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info */}
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      )}
    </Card>
  );
} 