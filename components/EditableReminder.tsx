import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InlineEditableReminder } from './InlineEditableReminder';
import { ReminderEditModal } from './ReminderEditModal';
import { Interaction } from '@/lib/schemas';
import { useContactStore } from '@/stores/contactStore';
import { Edit2, Maximize2, Minimize2, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EditableReminderProps {
  interaction: Interaction;
  contactName: string;
  defaultEditMode?: 'inline' | 'modal';
}

export function EditableReminder({ 
  interaction, 
  contactName, 
  defaultEditMode = 'inline' 
}: EditableReminderProps) {
  const [editMode, setEditMode] = useState<'inline' | 'modal'>(defaultEditMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { updateInteraction, markReminderDone, snoozeReminder } = useContactStore();

  const handleSave = async (updates: Partial<Interaction>) => {
    await updateInteraction(interaction.id!, updates);
  };

  const handleDone = async () => {
    if (!interaction.id) return;
    await markReminderDone(interaction.id);
  };

  const handleSnooze = async (days: number) => {
    if (!interaction.id) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    await snoozeReminder(interaction.id, newDate);
  };

  const toggleEditMode = () => {
    setEditMode(editMode === 'inline' ? 'modal' : 'inline');
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const isOverdue = interaction.followUpDueDate ? new Date(interaction.followUpDueDate) < new Date() : false;

  if (editMode === 'modal') {
    return (
      <>
        <div className="border rounded-lg p-4 mb-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-semibold">{contactName}</div>
              <div className="text-sm text-muted-foreground mb-1">
                {interaction.type} — {interaction.summary}
              </div>
              
              {/* Tags Display */}
              {interaction.tags && interaction.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {interaction.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={`text-sm font-medium ${
                isOverdue ? 'text-destructive' : 'text-warning'
              }`}>
                Due: {interaction.followUpDueDate ? format(new Date(interaction.followUpDueDate), "MMM d, yyyy") : 'No due date'}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleDone} variant="outline" size="sm">
                <Check className="w-3 h-3 mr-1" />
                Done
              </Button>
              <div className="relative">
                <Button onClick={() => handleSnooze(1)} variant="ghost" size="sm">
                  <Clock className="w-3 h-3 mr-1" />
                  1d
                </Button>
                <Button onClick={() => handleSnooze(3)} variant="ghost" size="sm">
                  <Clock className="w-3 h-3 mr-1" />
                  3d
                </Button>
                <Button onClick={() => handleSnooze(7)} variant="ghost" size="sm">
                  <Clock className="w-3 h-3 mr-1" />
                  7d
                </Button>
              </div>
              <Button
                onClick={toggleEditMode}
                variant="ghost"
                size="sm"
                title="Switch to inline editing"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={openModal}
                variant="ghost"
                size="sm"
                title="Edit in modal"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <ReminderEditModal
          interaction={interaction}
          contactName={contactName}
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <>
      <div className="border rounded-lg p-4 mb-2 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-semibold">{contactName}</div>
            <div className="text-sm text-muted-foreground mb-1">
              {interaction.type} — {interaction.summary}
            </div>
            
            {/* Tags Display */}
            {interaction.tags && interaction.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {interaction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className={`text-sm font-medium ${
              isOverdue ? 'text-destructive' : 'text-warning'
            }`}>
              Due: {interaction.followUpDueDate ? format(new Date(interaction.followUpDueDate), "MMM d, yyyy") : 'No due date'}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleDone} variant="outline" size="sm">
              <Check className="w-3 h-3 mr-1" />
              Done
            </Button>
            <div className="relative">
              <Button onClick={() => handleSnooze(1)} variant="ghost" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                1d
              </Button>
              <Button onClick={() => handleSnooze(3)} variant="ghost" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                3d
              </Button>
              <Button onClick={() => handleSnooze(7)} variant="ghost" size="sm">
                <Clock className="w-3 h-3 mr-1" />
                7d
              </Button>
            </div>
            <Button
              onClick={toggleEditMode}
              variant="ghost"
              size="sm"
              title="Switch to modal editing"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setEditMode('inline')}
              variant="ghost"
              size="sm"
              title="Edit inline"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <InlineEditableReminder
        interaction={interaction}
        contactName={contactName}
      />
    </>
  );
} 