import { z } from 'zod';

// Contact Schemas
export const ContactSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  flagged: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ContactCreateSchema = ContactSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const ContactUpdateSchema = ContactSchema.partial().omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Interaction Schemas
export const InteractionTypeSchema = z.enum(['email', 'phone', 'text', 'dm', 'in_person']);

export const InteractionSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  contactId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  type: InteractionTypeSchema,
  summary: z.string().min(1, 'Summary is required'),
  followUpRequired: z.boolean().default(false),
  followUpDueDate: z.string().datetime().optional().nullable(),
  isDone: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const InteractionCreateSchema = InteractionSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const InteractionUpdateSchema = InteractionSchema.partial().omit({ 
  id: true, 
  contactId: true, 
  createdAt: true, 
  updatedAt: true 
});

// API Response Schemas
export const ContactWithInteractionsSchema = ContactSchema.extend({
  interactions: z.array(InteractionSchema).optional(),
});

export const InteractionWithContactSchema = InteractionSchema.extend({
  contact: ContactSchema.optional(),
});

// TypeScript types inferred from schemas
export type Contact = z.infer<typeof ContactSchema>;
export type ContactCreate = z.infer<typeof ContactCreateSchema>;
export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;
export type InteractionCreate = z.infer<typeof InteractionCreateSchema>;
export type InteractionUpdate = z.infer<typeof InteractionUpdateSchema>;
export type InteractionType = z.infer<typeof InteractionTypeSchema>;
export type ContactWithInteractions = z.infer<typeof ContactWithInteractionsSchema>;
export type InteractionWithContact = z.infer<typeof InteractionWithContactSchema>; 