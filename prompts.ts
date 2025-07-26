// Prompt JSON Format
export interface PromptTemplate {
  id: string;
  title: string;
  whenToUse: string;
  prompt: string;
}

export const PromptLibrary: PromptTemplate[] = [
  {
    id: 'summarize-job',
    title: 'Summarize Job Description',
    whenToUse: 'When you paste a dense job post.',
    prompt: 'Summarize the following job in three key responsibilities and three ideal traits they want in a candidate:\n\n{paste_here}'
  },
  {
    id: 'refine-resume-line',
    title: 'Refine Resume Line',
    whenToUse: 'Improving a bullet point on your resume.',
    prompt: 'Rewrite this resume line to better emphasize impact and action:\n\n{paste_here}'
  },
  {
    id: 'diagnose-rejection',
    title: 'Diagnose a Rejection',
    whenToUse: 'When ghosted or declined after interview.',
    prompt: 'Based on this job and my response, what might I change in future applications?\n\nJob:\n{paste_job}\n\nResponse:\n{paste_your_note}'
  },
  {
    id: 'rewrite-followup',
    title: 'Rewrite Follow-Up Email',
    whenToUse: 'After you\'ve applied but want to follow up politely.',
    prompt: 'Rewrite this email to be more confident yet respectful:\n\n{paste_here}'
  }
]; 