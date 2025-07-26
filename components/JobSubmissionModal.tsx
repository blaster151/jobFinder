// components/JobSubmissionModal.tsx
'use client';

import { useState } from 'react';
import { ContactSelect } from './ContactSelect';
import { InteractionForm } from './InteractionForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface JobSubmissionModalProps {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
  onSubmit: (submission: JobSubmission) => void;
}

export interface JobSubmission {
  jobId: string;
  submissionDate: string;
  notes: string;
  contactId?: string;
  interaction?: {
    type: 'email' | 'phone' | 'text' | 'dm' | 'in_person';
    summary: string;
    followUpRequired: boolean;
    followUpDueDate?: string;
  };
}

export const JobSubmissionModal = ({ 
  jobId, 
  jobTitle, 
  company, 
  onClose, 
  onSubmit 
}: JobSubmissionModalProps) => {
  const [submission, setSubmission] = useState<JobSubmission>({
    jobId,
    submissionDate: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
  });

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showInteractionForm, setShowInteractionForm] = useState(false);

  const handleSubmit = () => {
    const finalSubmission: JobSubmission = {
      ...submission,
      contactId: selectedContactId || undefined,
    };
    onSubmit(finalSubmission);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Submit Application</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          {/* Job Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">{jobTitle}</h3>
            <p className="text-muted-foreground">{company}</p>
          </div>

          {/* Submission Details */}
          <div className="space-y-4">
            <div>
              <Label>Submission Date</Label>
              <Input
                type="date"
                value={submission.submissionDate}
                onChange={(e) => setSubmission(prev => ({ 
                  ...prev, 
                  submissionDate: e.target.value 
                }))}
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={submission.notes}
                onChange={(e) => setSubmission(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="Any notes about this application..."
              />
            </div>
          </div>

          {/* Contact Association */}
          <div className="border-t pt-4">
            <ContactSelect
              selectedContactId={selectedContactId}
              onChange={setSelectedContactId}
            />
          </div>

          {/* Interaction Logging */}
          {selectedContactId && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Switch
                  checked={showInteractionForm}
                  onCheckedChange={setShowInteractionForm}
                />
                <Label>Log an interaction with this contact</Label>
              </div>

              {showInteractionForm && (
                <InteractionForm
                  contactId={selectedContactId}
                  jobId={jobId}
                  onCancel={() => setShowInteractionForm(false)}
                />
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Submit Application
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 