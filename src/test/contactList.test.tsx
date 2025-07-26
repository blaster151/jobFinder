import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactList } from '@/components/ContactList';
import { useContactStore } from '@/stores/contactStore';
import { Contact } from '@/lib/schemas';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the contact store
vi.mock('@/stores/contactStore', () => ({
  useContactStore: vi.fn(),
}));

const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Tech Corp',
    role: 'Software Engineer',
    linkedin: 'https://linkedin.com/in/johndoe',
    notes: 'Great developer, interested in our React position',
    flagged: false,
    tags: ['developer', 'react'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'contact-2',
    name: 'Jane Smith',
    email: 'jane@startup.com',
    phone: '+1987654321',
    company: 'Startup Inc',
    role: 'Product Manager',
    linkedin: 'https://linkedin.com/in/janesmith',
    notes: 'Experienced PM, looking for new opportunities',
    flagged: true,
    tags: ['pm', 'startup'],
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-02T10:00:00Z',
  },
  {
    id: 'contact-3',
    name: 'Bob Wilson',
    email: 'bob@bigcorp.com',
    phone: '+1555555555',
    company: 'Big Corp',
    role: 'Senior Developer',
    linkedin: 'https://linkedin.com/in/bobwilson',
    notes: 'Senior developer with 10+ years experience',
    flagged: false,
    tags: ['senior', 'backend'],
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-03T10:00:00Z',
  },
];

describe('ContactList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useContactStore).mockReturnValue(mockContacts);
  });

  describe('Basic Rendering', () => {
    it('should render contact list with all contacts', () => {
      render(<ContactList />);

      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('3 of 3')).toBeInTheDocument();
    });

    it('should display contact information correctly', () => {
      render(<ContactList />);

      // Check for contact details
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('Great developer, interested in our React position')).toBeInTheDocument();
    });

    it('should show flagged indicator for flagged contacts', () => {
      render(<ContactList />);

      // Jane Smith is flagged, so should show flag icon
      const janeCard = screen.getByText('Jane Smith').closest('div');
      expect(janeCard).toBeInTheDocument();
      // The flag icon should be present in the same card
      expect(janeCard?.querySelector('svg')).toBeInTheDocument();
    });

    it('should not show flagged indicator for non-flagged contacts', () => {
      render(<ContactList />);

      // John Doe is not flagged
      const johnCard = screen.getByText('John Doe').closest('div');
      expect(johnCard).toBeInTheDocument();
      // Should not have flag icon
      expect(johnCard?.querySelector('svg[class*="text-destructive"]')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter contacts by name', () => {
      render(<ContactList />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should filter contacts by company', () => {
      render(<ContactList />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'Tech Corp' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should filter contacts by role', () => {
      render(<ContactList />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'Product Manager' } });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should filter contacts by notes', () => {
      render(<ContactList />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'React position' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      render(<ContactList />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByText('No contacts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
      expect(screen.getByText('0 of 3')).toBeInTheDocument();
    });
  });

  describe('Filter Functionality', () => {
    it('should toggle filters panel when filter button is clicked', () => {
      render(<ContactList />);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('Show flagged contacts only')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('should filter by flagged contacts only', () => {
      render(<ContactList />);

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      // Toggle flagged only
      const flaggedSwitch = screen.getByLabelText(/show flagged contacts only/i);
      fireEvent.click(flaggedSwitch);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should filter by company', () => {
      render(<ContactList />);

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      // Select company filter
      const companySelect = screen.getByLabelText('Company');
      fireEvent.change(companySelect, { target: { value: 'Tech Corp' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should filter by role', () => {
      render(<ContactList />);

      // Open filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      // Select role filter
      const roleSelect = screen.getByLabelText('Role');
      fireEvent.change(roleSelect, { target: { value: 'Product Manager' } });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should show active filters summary', () => {
      render(<ContactList />);

      // Open filters and apply some filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      const flaggedSwitch = screen.getByLabelText(/show flagged contacts only/i);
      fireEvent.click(flaggedSwitch);

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Flagged only')).toBeInTheDocument();
    });

    it('should clear all filters when clear all button is clicked', () => {
      render(<ContactList />);

      // Open filters and apply some filters
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      const flaggedSwitch = screen.getByLabelText(/show flagged contacts only/i);
      fireEvent.click(flaggedSwitch);

      // Clear all filters
      const clearButton = screen.getByText('Clear all');
      fireEvent.click(clearButton);

      // All contacts should be visible again
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('3 of 3')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no contacts exist', () => {
      vi.mocked(useContactStore).mockReturnValue([]);
      render(<ContactList />);

      expect(screen.getByText('No contacts yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first contact')).toBeInTheDocument();
      expect(screen.getByText('Add Contact')).toBeInTheDocument();
    });

    it('should show no results state when filters return no results', () => {
      render(<ContactList />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByText('No contacts found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should link to contact detail pages', () => {
      render(<ContactList />);

      const johnLink = screen.getByText('John Doe').closest('a');
      expect(johnLink).toHaveAttribute('href', '/contacts/contact-1');

      const janeLink = screen.getByText('Jane Smith').closest('a');
      expect(janeLink).toHaveAttribute('href', '/contacts/contact-2');
    });

    it('should link to add contact page', () => {
      render(<ContactList />);

      const addButton = screen.getByText('Add Contact');
      expect(addButton.closest('a')).toHaveAttribute('href', '/contacts/new');
    });
  });

  describe('Combined Search and Filters', () => {
    it('should combine search and filters correctly', () => {
      render(<ContactList />);

      // Apply search
      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'Developer' } });

      // Open filters and apply flagged filter
      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      const flaggedSwitch = screen.getByLabelText(/show flagged contacts only/i);
      fireEvent.click(flaggedSwitch);

      // Should show no results because no flagged contacts match "Developer"
      expect(screen.getByText('No contacts found')).toBeInTheDocument();
    });

    it('should show correct count with combined filters', () => {
      render(<ContactList />);

      // Apply search for "Engineer"
      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      fireEvent.change(searchInput, { target: { value: 'Engineer' } });

      // Should show 2 results (John Doe and Bob Wilson both have "Engineer" in their role)
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });
  });
}); 