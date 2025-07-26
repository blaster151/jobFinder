import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { format, addDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"

export function SnoozeReminderDialog({ open, onClose, onSnooze }: {
  open: boolean
  onClose: () => void
  onSnooze: (newDate: Date) => void
}) {
  const [customDate, setCustomDate] = useState<Date | null>(null)

  const handlePick = (days: number) => {
    onSnooze(addDays(new Date(), days))
    onClose()
  }

  const handleCustomPick = () => {
    if (customDate) {
      onSnooze(customDate)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Snooze Reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => handlePick(1)} variant="outline">+1 day</Button>
            <Button onClick={() => handlePick(3)} variant="outline">+3 days</Button>
            <Button onClick={() => handlePick(7)} variant="outline">+7 days</Button>
          </div>

          <div className="pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">Pick a custom date:</p>
            <Calendar
              mode="single"
              selected={customDate || undefined}
              onSelect={(date) => setCustomDate(date || null)}
              initialFocus
            />
            <Button onClick={handleCustomPick} disabled={!customDate}>
              Snooze to {customDate ? format(customDate, "PPP") : "..."}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 