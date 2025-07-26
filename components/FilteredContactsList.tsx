'use client';

import { useMemo } from 'react';
import { useContactStore } from '@/stores/contactStore';
import { useFilterStore } from '@/stores/filterStore';
import { ContactFilterPanel } from './ContactFilterPanel';
import { ContactList } from './ContactList';
import { addDays, isAfter, isBefore } from 'date-fns';

export function FilteredContactsList() {
  const { contacts, interactions } = useContactStore();
  const { contactFilters } = useFilterStore();

  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];

    // Apply label filter
    if (contactFilters.label) {
      const searchTerm = contactFilters.label.toLowerCase();
      filtered = filtered.filter((contact) => {
        const searchableText = [
          contact.name,
          contact.company,
          contact.role,
          contact.notes,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(searchTerm);
      });
    }

    // Apply recent activity filter
    if (contactFilters.recentActivity !== 'all') {
      const daysMap = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
      };
      const days = daysMap[contactFilters.recentActivity];
      const cutoffDate = addDays(new Date(), -days);

      filtered = filtered.filter((contact) => {
        const contactInteractions = interactions.filter((i) => i.contactId === contact.id);
        return contactInteractions.some((i) => {
          const interactionDate = new Date(i.createdAt!);
          return isAfter(interactionDate, cutoffDate);
        });
      });
    }

    // Apply role filter
    if (contactFilters.role) {
      const roleTerm = contactFilters.role.toLowerCase();
      filtered = filtered.filter((contact) => 
        contact.role?.toLowerCase().includes(roleTerm)
      );
    }

    // Apply company filter
    if (contactFilters.company) {
      const companyTerm = contactFilters.company.toLowerCase();
      filtered = filtered.filter((contact) => 
        contact.company?.toLowerCase().includes(companyTerm)
      );
    }

    // Apply location filter (if we had a location field)
    if (contactFilters.location) {
      const locationTerm = contactFilters.location.toLowerCase();
      // For now, we'll search in notes as a proxy for location
      filtered = filtered.filter((contact) => 
        contact.notes?.toLowerCase().includes(locationTerm)
      );
    }

    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, interactions, contactFilters]);

  const getFilterSummary = () => {
    const activeFilters = [];
    if (contactFilters.label) activeFilters.push(`Label: "${contactFilters.label}"`);
    if (contactFilters.recentActivity !== 'all') {
      const activityLabels = {
        '7days': 'Last 7 Days',
        '30days': 'Last 30 Days',
        '90days': 'Last 90 Days',
      };
      activeFilters.push(activityLabels[contactFilters.recentActivity]);
    }
    if (contactFilters.role) activeFilters.push(`Role: "${contactFilters.role}"`);
    if (contactFilters.company) activeFilters.push(`Company: "${contactFilters.company}"`);
    if (contactFilters.location) activeFilters.push(`Location: "${contactFilters.location}"`);
    return activeFilters;
  };

  return (
    <div className="space-y-6">
      <ContactFilterPanel />
      
      {/* Filter Summary */}
      {getFilterSummary().length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} 
          {getFilterSummary().length > 0 && (
            <> filtered by: {getFilterSummary().join(', ')}</>
          )}
        </div>
      )}

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            {getFilterSummary().length > 0 
              ? 'No contacts match your current filters.'
              : 'No contacts found.'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {contact.role && `${contact.role}`}
                    {contact.role && contact.company && ' at '}
                    {contact.company}
                  </p>
                  {contact.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {contact.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {contact.flagged && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Flagged
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 