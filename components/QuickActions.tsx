import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, Edit, Plus } from 'lucide-react';

interface QuickActionsProps {
  contactId: string;
  contactName: string;
  onAddReminder: () => void;
  onLogInteraction: () => void;
  onEditContact: () => void;
}

export function QuickActions({
  contactId,
  contactName,
  onAddReminder,
  onLogInteraction,
  onEditContact,
}: QuickActionsProps) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onAddReminder();
          }
          break;
        case 'i':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onLogInteraction();
          }
          break;
        case 'e':
          if (!event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            onEditContact();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onAddReminder, onLogInteraction, onEditContact]);

  return (
    <div className="bg-muted/50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Quick Actions</h3>
        <Badge variant="outline" className="text-xs">
          Keyboard shortcuts available
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          onClick={onAddReminder}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-auto py-3 px-4"
        >
          <Bell className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium text-sm">Add Reminder</div>
            <div className="text-xs text-muted-foreground">Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">R</kbd></div>
          </div>
        </Button>

        <Button
          onClick={onLogInteraction}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-auto py-3 px-4"
        >
          <MessageSquare className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium text-sm">Log Interaction</div>
            <div className="text-xs text-muted-foreground">Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">I</kbd></div>
          </div>
        </Button>

        <Button
          onClick={onEditContact}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-auto py-3 px-4"
        >
          <Edit className="w-4 h-4" />
          <div className="text-left">
            <div className="font-medium text-sm">Edit Contact</div>
            <div className="text-xs text-muted-foreground">Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">E</kbd></div>
          </div>
        </Button>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        💡 Tip: Use keyboard shortcuts to quickly perform actions while viewing {contactName}'s profile
      </div>
    </div>
  );
} 