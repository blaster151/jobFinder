import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutosaveInteraction } from '@/components/AutosaveInteraction';
import { Interaction } from '@/lib/schemas';

// Mock the stores and hooks
vi.mock('@/stores/contactStore', () => ({
  useContactStore: () => ({
    updateInteraction: vi.fn(),
    markReminderDone: vi.fn(),
    snoozeReminder: vi.fn(),
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

const mockInteractionWithFollowUp: Interaction = {
  ...mockInteraction,
  id: '2',
  followUpRequired: true,
  followUpDueDate: new Date('2024-12-31').toISOString(),
};

describe('AutosaveInteraction', () => {
  const user = userEvent.setup();
  const mockUpdateInteraction = vi.fn();
  const mockMarkReminderDone = vi.fn();
  const mockSnoozeReminder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the store
    vi.mocked(require('@/stores/contactStore').useContactStore).mockReturnValue({
      updateInteraction: mockUpdateInteraction,
      markReminderDone: mockMarkReminderDone,
      snoozeReminder: mockSnoozeReminder,
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

  it('should render interaction in view mode initially', () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Email — Jan 1, 2024 10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Initial interaction summary')).toBeInTheDocument();
    expect(screen.getByText('initial')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should enter edit mode when edit button is clicked', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should show form fields
    expect(screen.getByDisplayValue('Initial interaction summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should show correct initial values in edit mode', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Check form fields have correct initial values
    expect(screen.getByDisplayValue('Initial interaction summary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('email')).toBeInTheDocument();
    
    // Check tags are displayed
    expect(screen.getByText('initial')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should show follow-up info when interaction has follow-up', () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteractionWithFollowUp} 
        contactName="John Doe" 
      />
    );

    expect(screen.getByText(/Due: Dec 31, 2024/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1d/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3d/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /7d/i })).toBeInTheDocument();
  });

  it('should allow editing summary in edit mode', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const summaryTextarea = screen.getByDisplayValue('Initial interaction summary');
    await user.clear(summaryTextarea);
    await user.type(summaryTextarea, 'Updated interaction summary');

    expect(screen.getByDisplayValue('Updated interaction summary')).toBeInTheDocument();
  });

  it('should allow changing interaction type', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const typeSelect = screen.getByDisplayValue('email');
    await user.click(typeSelect);

    // Should show type options
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Dm')).toBeInTheDocument();
    expect(screen.getByText('In_person')).toBeInTheDocument();
  });

  it('should allow adding and removing tags', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Add new tag
    const tagInput = screen.getByPlaceholderText('Add tag...');
    await user.type(tagInput, 'new-tag');
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Should show new tag
    expect(screen.getByText('new-tag')).toBeInTheDocument();

    // Remove existing tag
    const removeButtons = screen.getAllByRole('button', { name: /×/i });
    await user.click(removeButtons[0]); // Remove first tag

    // Should not show removed tag
    expect(screen.queryByText('initial')).not.toBeInTheDocument();
  });

  it('should toggle follow-up required checkbox', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const followUpCheckbox = screen.getByRole('checkbox', { name: /follow-up required/i });
    await user.click(followUpCheckbox);

    expect(followUpCheckbox).toBeChecked();
  });

  it('should show date picker when follow-up is required', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const followUpCheckbox = screen.getByRole('checkbox', { name: /follow-up required/i });
    await user.click(followUpCheckbox);

    // Should show date picker
    expect(screen.getByRole('textbox', { name: /due date/i })).toBeInTheDocument();
  });

  it('should call markReminderDone when done button is clicked', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteractionWithFollowUp} 
        contactName="John Doe" 
      />
    );

    const doneButton = screen.getByRole('button', { name: /done/i });
    await user.click(doneButton);

    expect(mockMarkReminderDone).toHaveBeenCalledWith('2');
  });

  it('should call snoozeReminder when snooze buttons are clicked', async () => {
    render(
      <AutosaveInteraction 
        interaction={mockInteractionWithFollowUp} 
        contactName="John Doe" 
      />
    );

    const snooze1dButton = screen.getByRole('button', { name: /1d/i });
    await user.click(snooze1dButton);

    expect(mockSnoozeReminder).toHaveBeenCalledWith('2', expect.any(Date));
  });

  it('should show autosave status indicators', async () => {
    // Mock autosave hook to return different states
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: true,
      lastSaved: new Date('2024-01-01T11:00:00Z'),
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should show saving indicator
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should show saved status when last saved is available', async () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: new Date('2024-01-01T11:00:00Z'),
      hasUnsavedChanges: false,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should show saved status
    expect(screen.getByText(/Saved 11:00/)).toBeInTheDocument();
  });

  it('should show unsaved badge when there are unsaved changes', async () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    // Should show unsaved badge
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('should disable save button when saving', async () => {
    vi.mocked(require('@/hooks/useAutosave').useAutosave).mockReturnValue({
      isSaving: true,
      lastSaved: null,
      hasUnsavedChanges: true,
      saveNow: vi.fn(),
      reset: vi.fn(),
    });

    render(
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('should handle overdue follow-up styling', () => {
    const overdueInteraction: Interaction = {
      ...mockInteractionWithFollowUp,
      followUpDueDate: new Date('2020-01-01').toISOString(), // Past date
    };

    render(
      <AutosaveInteraction 
        interaction={overdueInteraction} 
        contactName="John Doe" 
      />
    );

    const dueText = screen.getByText(/Due: Jan 1, 2020/);
    expect(dueText).toHaveClass('text-destructive');
  });

  it('should handle due-soon follow-up styling', () => {
    const dueSoonInteraction: Interaction = {
      ...mockInteractionWithFollowUp,
      followUpDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    };

    render(
      <AutosaveInteraction 
        interaction={dueSoonInteraction} 
        contactName="John Doe" 
      />
    );

    const dueText = screen.getByText(/Due:/);
    expect(dueText).toHaveClass('text-warning');
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
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /save/i });
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
      <AutosaveInteraction 
        interaction={mockInteraction} 
        contactName="John Doe" 
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockReset).toHaveBeenCalled();
  });

  it('should handle empty tags gracefully', () => {
    const interactionWithoutTags: Interaction = {
      ...mockInteraction,
      tags: [],
    };

    render(
      <AutosaveInteraction 
        interaction={interactionWithoutTags} 
        contactName="John Doe" 
      />
    );

    // Should not crash and should show tag input in edit mode
    const editButton = screen.getByRole('button', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it('should handle null follow-up due date', () => {
    const interactionWithoutDueDate: Interaction = {
      ...mockInteraction,
      followUpRequired: true,
      followUpDueDate: null,
    };

    render(
      <AutosaveInteraction 
        interaction={interactionWithoutDueDate} 
        contactName="John Doe" 
      />
    );

    // Should not crash
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
}); 