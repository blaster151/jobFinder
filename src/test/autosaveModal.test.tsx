import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutosaveInteractionModal } from '@/components/AutosaveInteractionModal';
import { Interaction } from '@/lib/schemas';

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: () => ({
    updateInteraction: vi.fn(),
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the autosave hook
vi.mock('@/hooks/useAutosave', () => ({
  useAutosave: vi.fn(),
}));

const mockInteraction: Interaction = {
  id: '1',
  contactId: 'contact-1',
  type: 'email',
  summary: 'Initial interaction summary',
  followUpRequired: false,
  followUpDueDate: null,
  tags: ['initial', 'test'],
  isDone: false,
  createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
};

describe('AutosaveInteractionModal', () => {
  const user = userEvent.setup();
  const mockUpdateInteraction = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the store
    vi.mocked(require('@/stores/contactStore').useContactStore).mockReturnValue({
      updateInteraction: mockUpdateInteraction,
    });

    // Mock the autosave hook
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Edit Interaction')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Edit Interaction')).toBeInTheDocument();
    expect(screen.getByText('John Doe • Jan 1, 2024 10:00 AM')).toBeInTheDocument();
  });

  it('should show correct initial form values', () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue('Initial interaction summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('email')).toBeInTheDocument();
    expect(screen.getByText('initial')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should show contact info section', () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('contact-1')).toBeInTheDocument();
  });

  it('should allow editing summary', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const summaryTextarea = screen.getByDisplayValue('Initial interaction summary');
    await user.clear(summaryTextarea);
    await user.type(summaryTextarea, 'Updated summary');

    expect(screen.getByDisplayValue('Updated summary')).toBeInTheDocument();
  });

  it('should show character count for summary', () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('25/1000 characters')).toBeInTheDocument();
  });

  it('should allow changing interaction type', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const typeSelect = screen.getByDisplayValue('email');
    await user.click(typeSelect);

    // Should show type options with icons
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Dm')).toBeInTheDocument();
    expect(screen.getByText('In_person')).toBeInTheDocument();
  });

  it('should allow adding new tags', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'new-tag');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('new-tag')).toBeInTheDocument();
  });

  it('should allow removing tags', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /×/i });
    await user.click(removeButtons[0]); // Remove first tag

    expect(screen.queryByText('initial')).not.toBeInTheDocument();
  });

  it('should show tag count', () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('(2/10)')).toBeInTheDocument();
  });

  it('should disable add tag button when limit reached', async () => {
    const interactionWithManyTags: Interaction = {
      ...mockInteraction,
      tags: Array.from({ length: 10 }, (_, i) => `tag${i}`),
    };

    render(
      <AutosaveInteractionModal 
        interaction={interactionWithManyTags}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('should toggle follow-up required checkbox', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const followUpCheckbox = screen.getByRole('checkbox', { name: /follow-up required/i });
    await user.click(followUpCheckbox);

    expect(followUpCheckbox).toBeChecked();
  });

  it('should show date picker when follow-up is required', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const followUpCheckbox = screen.getByRole('checkbox', { name: /follow-up required/i });
    await user.click(followUpCheckbox);

    expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
  });

  it('should handle Enter key for adding tags', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'new-tag');
    await user.keyboard('{Enter}');

    expect(screen.getByText('new-tag')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /×/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show autosave status in header', () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: true,
      lastSaved: new Date('2024-01-01T11:00:00Z'),
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should show saved status when available', () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: new Date('2024-01-01T11:00:00Z'),
      hasUnsavedChanges: false,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Saved 11:00/)).toBeInTheDocument();
  });

  it('should show unsaved badge when there are changes', () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('should disable save button when saving', () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: true,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it('should show saving spinner in save button when saving', () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: true,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should handle interaction with follow-up due date', () => {
    const interactionWithDueDate: Interaction = {
      ...mockInteraction,
      followUpRequired: true,
      followUpDueDate: new Date('2024-12-31').toISOString(),
    };

    render(
      <AutosaveInteractionModal 
        interaction={interactionWithDueDate}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
  });

  it('should handle interaction without tags', () => {
    const interactionWithoutTags: Interaction = {
      ...mockInteraction,
      tags: [],
    };

    render(
      <AutosaveInteractionModal 
        interaction={interactionWithoutTags}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('(0/10)')).toBeInTheDocument();
  });

  it('should handle interaction with null follow-up due date', () => {
    const interactionWithNullDueDate: Interaction = {
      ...mockInteraction,
      followUpRequired: true,
      followUpDueDate: null,
    };

    render(
      <AutosaveInteractionModal 
        interaction={interactionWithNullDueDate}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Should not crash and should show empty date input
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
  });

  it('should call saveNow when save button is clicked', async () => {
    const mockSaveNow = vi.fn();
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: mockSaveNow,
      reset: vi.fn(),
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    expect(mockSaveNow).toHaveBeenCalled();
  });

  it('should call reset when cancel button is clicked', async () => {
    const mockReset = vi.fn();
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: mockReset,
    });

    render(
      <AutosaveInteractionModal 
        interaction={mockInteraction}
        contactName="John Doe"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockReset).toHaveBeenCalled();
  });
}); 