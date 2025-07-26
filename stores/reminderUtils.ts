// stores/reminderUtils.ts
import { useContactStore } from './contactStore';
import { usePathname } from 'next/navigation';

export const useReminderCount = () => {
  const pathname = usePathname();
  const interactions = useContactStore((s) => s.interactions);

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 3);

  let overdue = 0;
  let upcoming = 0;

  for (const i of interactions) {
    if (!i.followUpRequired || !i.followUpDueDate) continue;

    const due = new Date(i.followUpDueDate);

    if (due <= now) overdue++;
    else if (due <= soon) upcoming++;
  }

  const total = overdue + upcoming;
  const hidden = pathname === '/reminders';

  return { overdue, upcoming, total, hidden };
}; 