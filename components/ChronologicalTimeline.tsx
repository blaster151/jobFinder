import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isToday, isThisWeek, isThisMonth, isYesterday, startOfDay, differenceInDays } from 'date-fns';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  User, 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Tag
} from 'lucide-react';
import { Interaction } from '@/lib/schemas';
import { useContactStore } from '@/stores/contactStore';

interface ChronologicalTimelineProps {
  contactId?: string;
  showRemindersOnly?: boolean;
  showInteractionsOnly?: boolean;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  statusFilter?: 'all' | 'overdue' | 'due-soon' | 'upcoming';
}

interface TimelineItem {
  id: string;
  type: 'interaction' | 'reminder';
  date: Date;
  title: string;
  description: string;
  interaction?: Interaction;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  tags: string[];
}

export function ChronologicalTimeline({ 
  contactId, 
  showRemindersOnly = false, 
  showInteractionsOnly = false,
  dateRange = 'all',
  statusFilter = 'all'
}: ChronologicalTimelineProps) {
  const { interactions, contacts } = useContactStore();

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Filter interactions for specific contact if provided
    const filteredInteractions = contactId 
      ? interactions.filter(i => i.contactId === contactId)
      : interactions;

    // Add interactions
    if (!showRemindersOnly) {
      filteredInteractions.forEach(interaction => {
        const contact = contacts.find(c => c.id === interaction.contactId);
        const contactName = contact?.name || 'Unknown Contact';
        
        items.push({
          id: interaction.id!,
          type: 'interaction',
          date: new Date(interaction.createdAt!),
          title: `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} with ${contactName}`,
          description: interaction.summary,
          interaction,
          tags: interaction.tags || [],
        });
      });
    }

    // Add reminders (interactions with followUpRequired)
    if (!showInteractionsOnly) {
      const reminders = filteredInteractions.filter(i => i.followUpRequired && i.followUpDueDate);
      
      reminders.forEach(interaction => {
        const contact = contacts.find(c => c.id === interaction.contactId);
        const contactName = contact?.name || 'Unknown Contact';
        const dueDate = new Date(interaction.followUpDueDate!);
        const now = new Date();
        const isOverdue = dueDate < now;
        const isDueSoon = dueDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000); // Within 24 hours
        
        items.push({
          id: `reminder-${interaction.id}`,
          type: 'reminder',
          date: dueDate,
          title: `Follow-up: ${interaction.type} with ${contactName}`,
          description: interaction.summary,
          interaction,
          isOverdue,
          isDueSoon,
          tags: interaction.tags || [],
        });
      });
    }

    // Apply date range filter
    let filteredItems = items;
    if (dateRange !== 'all') {
      const now = new Date();
      const today = startOfDay(now);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filteredItems = items.filter(item => {
        const itemDate = startOfDay(item.date);
        
        switch (dateRange) {
          case 'today':
            return isToday(itemDate);
          case 'week':
            return itemDate >= weekAgo;
          case 'month':
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredItems = filteredItems.filter(item => {
        if (item.type !== 'reminder') return false;
        
        switch (statusFilter) {
          case 'overdue':
            return item.isOverdue;
          case 'due-soon':
            return item.isDueSoon;
          case 'upcoming':
            return !item.isOverdue && !item.isDueSoon;
          default:
            return true;
        }
      });
    }

    // Sort by date (newest first)
    return filteredItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [interactions, contacts, contactId, showRemindersOnly, showInteractionsOnly, dateRange, statusFilter]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: TimelineItem[] } = {};
    
    timelineItems.forEach(item => {
      const date = startOfDay(item.date);
      let groupKey: string;
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = 'This Week';
      } else if (isThisMonth(date)) {
        groupKey = 'This Month';
      } else {
        const daysDiff = differenceInDays(new Date(), date);
        if (daysDiff < 30) {
          groupKey = 'Last Month';
        } else {
          groupKey = 'Older';
        }
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  }, [timelineItems]);

  const getItemIcon = (item: TimelineItem) => {
    if (item.type === 'reminder') {
      if (item.isOverdue) {
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      }
      if (item.isDueSoon) {
        return <Clock className="w-4 h-4 text-orange-500" />;
      }
      return <Bell className="w-4 h-4 text-blue-500" />;
    }
    
    // Interaction icons
    switch (item.interaction?.type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'text':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'dm':
        return <MessageSquare className="w-4 h-4 text-pink-600" />;
      case 'in_person':
        return <User className="w-4 h-4 text-orange-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getItemBadge = (item: TimelineItem) => {
    if (item.type === 'reminder') {
      if (item.isOverdue) {
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      }
      if (item.isDueSoon) {
        return <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">Due Soon</Badge>;
      }
      return <Badge variant="secondary" className="text-xs">Reminder</Badge>;
    }
    
    return <Badge variant="outline" className="text-xs">Interaction</Badge>;
  };

  const getItemStatus = (item: TimelineItem) => {
    if (item.type === 'reminder') {
      if (item.isOverdue) {
        return (
          <div className="flex items-center gap-1 text-destructive text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Overdue</span>
          </div>
        );
      }
      if (item.isDueSoon) {
        return (
          <div className="flex items-center gap-1 text-orange-600 text-xs">
            <Clock className="w-3 h-3" />
            <span>Due Soon</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1 text-blue-600 text-xs">
          <Bell className="w-3 h-3" />
          <span>Due {format(item.date, 'MMM d')}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <Calendar className="w-3 h-3" />
        <span>{format(item.date, 'MMM d, yyyy')}</span>
      </div>
    );
  };

  if (timelineItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            {showRemindersOnly 
              ? 'No reminders found.'
              : showInteractionsOnly 
                ? 'No interactions found.'
                : 'No timeline items found.'
            }
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([groupName, items]) => (
        <Card key={groupName}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {groupName === 'Today' && <span className="text-green-600">●</span>}
              {groupName === 'Yesterday' && <span className="text-blue-600">●</span>}
              {groupName === 'This Week' && <span className="text-orange-600">●</span>}
              {groupName}
              <Badge variant="outline" className="text-xs">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    item.type === 'reminder' && item.isOverdue
                      ? 'bg-red-50 border-red-200'
                      : item.type === 'reminder' && item.isDueSoon
                      ? 'bg-orange-50 border-orange-200'
                      : item.type === 'reminder'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getItemIcon(item)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {item.title}
                      </h4>
                      {getItemBadge(item)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getItemStatus(item)}
                        
                        {item.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            <div className="flex gap-1">
                              {item.tags.slice(0, 2).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {item.type === 'reminder' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Done
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Snooze
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 