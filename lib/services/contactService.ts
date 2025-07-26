import { Contact, Interaction, ContactCreate, InteractionCreate } from '@/lib/schemas';

export interface ContactService {
  // Contact operations
  fetchContacts(): Promise<Contact[]>;
  addContact(contact: ContactCreate): Promise<Contact>;
  updateContact(id: string, updates: Partial<Contact>): Promise<Contact>;
  flagContact(id: string, flagged: boolean): Promise<void>;
  deleteContact(id: string): Promise<void>;
  
  // Interaction operations
  fetchInteractions(): Promise<Interaction[]>;
  addInteraction(interaction: InteractionCreate): Promise<Interaction>;
  updateInteraction(id: string, updates: Partial<Interaction>): Promise<Interaction>;
  deleteInteraction(id: string): Promise<void>;
  markReminderDone(interactionId: string): Promise<void>;
  snoozeReminder(interactionId: string, newDate: Date): Promise<void>;
  
  // Business logic
  getDueFollowUps(interactions: Interaction[]): Interaction[];
  getOverdueCount(interactions: Interaction[]): number;
  getContactInteractions(contactId: string, interactions: Interaction[]): Interaction[];
}

class ContactServiceImpl implements ContactService {
  async fetchContacts(): Promise<Contact[]> {
    const response = await fetch('/api/contacts');
    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }
    return response.json();
  }

  async addContact(contact: ContactCreate): Promise<Contact> {
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) {
      throw new Error('Failed to add contact');
    }
    return response.json();
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const response = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update contact');
    }
    return response.json();
  }

  async flagContact(id: string, flagged: boolean): Promise<void> {
    const response = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged }),
    });
    if (!response.ok) {
      throw new Error('Failed to flag contact');
    }
  }

  async deleteContact(id: string): Promise<void> {
    const response = await fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete contact');
    }
  }

  async fetchInteractions(): Promise<Interaction[]> {
    const response = await fetch('/api/interactions');
    if (!response.ok) {
      throw new Error('Failed to fetch interactions');
    }
    return response.json();
  }

  async addInteraction(interaction: InteractionCreate): Promise<Interaction> {
    const response = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction),
    });
    if (!response.ok) {
      throw new Error('Failed to add interaction');
    }
    return response.json();
  }

  async updateInteraction(id: string, updates: Partial<Interaction>): Promise<Interaction> {
    const response = await fetch(`/api/interactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update interaction');
    }
    return response.json();
  }

  async deleteInteraction(id: string): Promise<void> {
    const response = await fetch(`/api/interactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete interaction');
    }
  }

  async markReminderDone(interactionId: string): Promise<void> {
    const response = await fetch(`/api/interactions/${interactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: true }),
    });
    if (!response.ok) {
      throw new Error('Failed to mark reminder done');
    }
  }

  async snoozeReminder(interactionId: string, newDate: Date): Promise<void> {
    const response = await fetch(`/api/interactions/${interactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUpDueDate: newDate.toISOString() }),
    });
    if (!response.ok) {
      throw new Error('Failed to snooze reminder');
    }
  }

  // Business logic methods
  getDueFollowUps(interactions: Interaction[]): Interaction[] {
    const today = new Date();
    return interactions.filter((i) =>
      i.followUpRequired &&
      i.followUpDueDate &&
      !i.isDone &&
      new Date(i.followUpDueDate) <= today
    );
  }

  getOverdueCount(interactions: Interaction[]): number {
    return this.getDueFollowUps(interactions).length;
  }

  getContactInteractions(contactId: string, interactions: Interaction[]): Interaction[] {
    return interactions.filter(i => i.contactId === contactId);
  }
}

export const contactService = new ContactServiceImpl(); 