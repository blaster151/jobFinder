// components/RemindersPanel.tsx
'use client';

import { useContactStore } from '@/stores/contactStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReminderStatusService } from '@/lib/services/reminderStatusService';

export const RemindersPanel = () => {
  const interactions = useContactStore((s) => s.interactions);
  const contacts = useContactStore((s) => s.contacts);

  const due = ReminderStatusService.getOverdue(interactions);

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h2 className="text-xl font-bold mb-4">🔔 Follow-Ups Due</h2>
      {due.length === 0 ? (
        <p className="text-muted-foreground">Nothing due right now — nice job keeping up!</p>
      ) : (
        <ul className="space-y-3">
          {due.map((i) => {
            const contact = contacts.find((c) => c.id === i.contactId);
            const daysOverdue = getDaysOverdue(i.followUpDueDate!);
            const isOverdue = daysOverdue > 0;
            
            return (
              <li key={i.id} className="border p-3 rounded-lg bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{contact?.name || 'Unknown Contact'}</div>
                  <div className={`text-sm px-2 py-1 rounded ${
                    isOverdue 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {isOverdue 
                      ? `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`
                      : 'Due today'
                    }
                  </div>
                </div>
                <div className="text-muted-foreground text-sm mb-2">
                  {i.type} logged on {new Date(i.createdAt!).toLocaleDateString()}
                </div>
                <div className="text-sm mb-2">
                  <strong>Summary:</strong> {i.summary}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  ⚠ Follow-up was due {new Date(i.followUpDueDate!).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <Link href={`/contacts/${i.contactId}`}>
                    <Button variant="outline" size="sm">
                      Go to Contact
                    </Button>
                  </Link>
                  {i.jobId && (
                    <Link href={`/jobs/${i.jobId}`}>
                      <Button variant="outline" size="sm">
                        View Job
                      </Button>
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}; 