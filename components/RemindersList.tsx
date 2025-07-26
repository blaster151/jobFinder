import { useMemo } from "react"
import { useContactStore } from "@/stores/contactStore"
import { ReminderRow } from "./ReminderRow"
import { Interaction } from "@/lib/schemas"

type RemindersListProps = {
  view: 'overdue' | 'week'
}

export function RemindersList({ view }: RemindersListProps) {
  const { interactions, contacts } = useContactStore()

  const filteredReminders = useMemo(() => {
    const now = new Date()
    const inAWeek = new Date()
    inAWeek.setDate(now.getDate() + 7)

    return interactions
      .filter((i) => {
        if (!i.followUpRequired || !i.followUpDueDate) return false
        const due = new Date(i.followUpDueDate)
        return view === 'overdue'
          ? due < now
          : due >= now && due <= inAWeek
      })
      .sort(
        (a, b) =>
          new Date(a.followUpDueDate!).getTime() -
          new Date(b.followUpDueDate!).getTime()
      )
  }, [interactions, view])

  if (!filteredReminders.length) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        {view === 'overdue' 
          ? '🎉 You\'re all caught up on follow-ups!'
          : '📅 No follow-ups due in the next 7 days'
        }
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredReminders.map((interaction) => {
        const contact = contacts.find((c) => c.id === interaction.contactId)
        const contactName = contact?.name || 'Unknown Contact'
        
        return (
          <ReminderRow
            key={interaction.id}
            interaction={interaction}
            contactName={contactName}
          />
        )
      })}
    </div>
  )
} 