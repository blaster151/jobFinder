// src/app/jobs/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { JobSubmissionModal, JobSubmission } from '@/components/JobSubmissionModal';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Sample job data - in a real app this would come from a store or API
  const job = {
    id: jobId,
    title: 'Senior React Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    description: 'We are looking for a senior React developer to join our team...',
    salary: '$120k - $150k',
  };

  const handleSubmission = (submission: JobSubmission) => {
    console.log('Job submission:', submission);
    // Here you would save the submission to your store
    // and potentially show a success message
    alert('Application submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Job Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">{job.company}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>📍 {job.location}</span>
            <span>💰 {job.salary}</span>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="prose max-w-none">
            <p>{job.description}</p>
            <p>This is a sample job posting to demonstrate the JobSubmissionModal functionality. In a real application, this would contain the full job description, requirements, and benefits.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            size="lg"
            onClick={() => setShowSubmissionModal(true)}
          >
            I Applied
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setShowSubmissionModal(true)}
          >
            Follow Up
          </Button>
        </div>

        {/* Submission Modal */}
        {showSubmissionModal && (
          <JobSubmissionModal
            jobId={job.id}
            jobTitle={job.title}
            company={job.company}
            onClose={() => setShowSubmissionModal(false)}
            onSubmit={handleSubmission}
          />
        )}
      </div>
    </div>
  );
} 