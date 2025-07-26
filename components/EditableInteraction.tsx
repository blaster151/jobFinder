import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InlineEditableInteraction } from './InlineEditableInteraction';
import { InteractionEditModal } from './InteractionEditModal';
import { Interaction } from '@/lib/schemas';
import { useContactStore } from '@/stores/contactStore';
import { Edit2, Maximize2, Minimize2 } from 'lucide-react';

interface EditableInteractionProps {
  interaction: Interaction;
  contactName: string;
  defaultEditMode?: 'inline' | 'modal';
}

export function EditableInteraction({ 
  interaction, 
  contactName, 
  defaultEditMode = 'inline' 
}: EditableInteractionProps) {
  const [editMode, setEditMode] = useState<'inline' | 'modal'>(defaultEditMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { updateInteraction } = useContactStore();

  const handleSave = async (updates: Partial<Interaction>) => {
    await updateInteraction(interaction.id!, updates);
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

  if (editMode === 'modal') {
    return (
      <>
        <div className="border rounded-lg p-4 mb-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-semibold">{contactName}</div>
              <div className="text-sm text-muted-foreground mb-1">
                {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} — {new Date(interaction.createdAt!).toLocaleString()}
              </div>
              <div className="text-base whitespace-pre-wrap mb-2">{interaction.summary}</div>
              
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

              {/* Follow-up Info */}
              {interaction.followUpRequired && interaction.followUpDueDate && (
                <div className="text-sm font-medium text-warning">
                  Due: {new Date(interaction.followUpDueDate).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
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

        <InteractionEditModal
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
              {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} — {new Date(interaction.createdAt!).toLocaleString()}
            </div>
            <div className="text-base whitespace-pre-wrap mb-2">{interaction.summary}</div>
            
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

            {/* Follow-up Info */}
            {interaction.followUpRequired && interaction.followUpDueDate && (
              <div className="text-sm font-medium text-warning">
                Due: {new Date(interaction.followUpDueDate).toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
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

      <InlineEditableInteraction
        interaction={interaction}
        contactName={contactName}
      />
    </>
  );
} 