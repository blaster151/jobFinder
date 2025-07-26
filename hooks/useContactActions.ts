import { useState } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { contactService } from '@/lib/services/contactService';
import { Contact, ContactCreate, InteractionCreate, Interaction } from '@/lib/schemas';

export function useContactActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { contacts, interactions, setContacts, setInteractions } = useContactStore();

  const addContact = async (contact: ContactCreate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newContact = await contactService.addContact(contact);
      setContacts([newContact, ...contacts]);
      return newContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedContact = await contactService.updateContact(id, updates);
      setContacts(contacts.map(c => c.id === id ? updatedContact : c));
      return updatedContact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const flagContact = async (id: string, flagged: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contactService.flagContact(id, flagged);
      setContacts(contacts.map(c => c.id === id ? { ...c, flagged } : c));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to flag contact';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContact = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contactService.deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
      // Also remove related interactions
      setInteractions(interactions.filter(i => i.contactId !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addInteraction = async (interaction: InteractionCreate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newInteraction = await contactService.addInteraction(interaction);
      setInteractions([newInteraction, ...interactions]);
      return newInteraction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add interaction';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInteraction = async (id: string, updates: Partial<Interaction>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedInteraction = await contactService.updateInteraction(id, updates);
      setInteractions(interactions.map(i => i.id === id ? updatedInteraction : i));
      return updatedInteraction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update interaction';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInteraction = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contactService.deleteInteraction(id);
      setInteractions(interactions.filter(i => i.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete interaction';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const markReminderDone = async (interactionId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contactService.markReminderDone(interactionId);
      setInteractions(interactions.map(i => 
        i.id === interactionId 
          ? { ...i, isDone: true }
          : i
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark reminder done';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const snoozeReminder = async (interactionId: string, newDate: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contactService.snoozeReminder(interactionId, newDate);
      setInteractions(interactions.map(i => 
        i.id === interactionId 
          ? { ...i, followUpDueDate: newDate.toISOString() }
          : i
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to snooze reminder';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Actions
    addContact,
    updateContact,
    flagContact,
    deleteContact,
    addInteraction,
    updateInteraction,
    deleteInteraction,
    markReminderDone,
    snoozeReminder,
    
    // State
    isLoading,
    error,
    clearError,
  };
} 