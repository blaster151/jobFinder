import { z } from 'zod';

// types.ts
export const ContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedin: z.string().url().optional(),
  notes: z.string().optional(),
  flagged: z.boolean().default(false),
});

export type Contact = z.infer<typeof ContactSchema>;

export const InteractionSchema = z.object({
  id: z.string().uuid(),
  contactId: z.string(),
  jobId: z.string().optional(),
  type: z.enum(['email', 'phone', 'text', 'dm', 'in_person']),
  timestamp: z.string(), // ISO
  summary: z.string(),
  followUpRequired: z.boolean().default(false),
  followUpDueDate: z.string().optional(),
});

export type Interaction = z.infer<typeof InteractionSchema>; 