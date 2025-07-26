# TODO

## Contact & Interaction Management

- [x] Add `Contact` and `Interaction` schemas using Zod
- [x] Create JSON store for contact data and linked interactions
- [x] Build UI to list, search, and filter contacts (with "flagged" toggle)
- [x] Add drawer/modal UI for adding a new contact
- [x] Build interaction timeline view per contact
- [ ] Link interactions to jobs or submissions where applicable
- [x] Show follow-up due dates in Reminder view
- [x] Create "Add New Interaction" form with type selector (email, call, etc.)
- [x] Alert user if follow-up is overdue (e.g., "👀 You haven't replied to Jane from Acme since Tuesday")

## ChatGPT Integration

- [x] Create `PromptLibrary.ts` with sample prompt templates
- [ ] Build "Ask ChatGPT" button in context: job view, contact view, application view
- [ ] Allow user to copy prompt text to clipboard with one click
- [ ] Store logs of used prompts + optional response pastes as part of Interaction or Job notes

## Encouragement System

- [x] Create `Encouragements.ts` with quotes and tags
- [ ] Show random encouragement after:
      - Marking a follow-up done
      - Reviewing daily jobs
      - Returning after >2 days inactive
- [ ] Add "Show Me Another" button for additional encouragement
- [ ] Allow tagging favorites or "this helped" for personalization later

## SPA Structure & Routing

- [x] Set up main routes: `/`, `/jobs/:id`, `/contacts/:id`, `/profile`
- [ ] Create Daily Summary Panel component for dashboard
- [x] Build Reminder Panel as modal/sidebar component
- [ ] Implement Profile Builder multi-step form
- [ ] Create context-aware Prompt Suggestion Box modal
- [ ] Add navigation between main views
- [ ] Implement responsive layout for mobile/desktop

## Global Search Framework

- [x] Design Search Input Component
  - [x] Create GlobalSearchInput with floating command palette
  - [x] Add debounce logic (300ms delay)
  - [x] Support keyboard shortcuts (Ctrl+K, /, etc.)
  - [x] Add to navbar with trigger button
- [x] Define Search Index
  - [x] Create unified in-memory search index (Zustand store)
  - [x] Index contacts: name, company, notes
  - [x] Index interactions: notes, type, contact association
  - [x] Index reminders: title, notes, due date, contact
  - [x] Use Fuse.js for fuzzy search with normalized casing
- [x] Display Results
  - [x] Result list component with icons/types
  - [x] Highlighted matches in search results
  - [x] Clickable entries with deep-linking
  - [x] Contact page navigation
  - [x] Reminders list navigation
  - [x] Interaction section navigation
- [ ] Search Enhancements
  - [ ] Add search filters (type, date range, status)
  - [ ] Implement search history and suggestions
  - [ ] Add search analytics (most searched terms)
  - [ ] Optimize search performance for large datasets
  - [ ] Add search result preview/quick actions

## Reminder System

- [x] Add derived selector for overdue interactions in Zustand
- [x] Create `RemindersPanel.tsx` to display overdue follow-ups
- [x] Link RemindersPanel to `/reminders` route or embed on dashboard
- [x] Optionally allow dismiss/archive per interaction
- [x] Style with shadcn (alerts, warning color, CTA button)

## Reminder Revalidation & Background Polling

- [x] Polling Mechanism
  - [x] Set up polling interval (5 minutes) via useEffect + setInterval
  - [x] Call revalidation function that checks current time
  - [x] Iterate over active reminders and mark as overdue if due time is in past
  - [x] Expose last-checked timestamp in Zustand store
  - [x] Create `useReminderPolling` hook for lifecycle management
  - [x] Add `isDone` field to Interaction model for proper status tracking
- [x] Time-Based Categorization
  - [x] Extend reminder model with derived properties (isDueSoon, isOverdue, isDueToday, isDueWithin1Hour)
  - [x] Cache computed status info to avoid recomputing during every render
  - [x] Create `getReminderStatus` utility with 1-minute cache duration
  - [x] Add `getRemindersByStatus` function for bulk categorization
  - [x] Implement utility functions for testing (createTestInteraction, etc.)
- [x] Notification System
  - [x] Create `ReminderNotification` component for newly overdue reminders
  - [x] Auto-hide notifications after 10 seconds
  - [x] Allow marking reminders as done from notification
  - [x] Show notification count and dismiss all functionality
- [x] In-App Toast Notifications
  - [x] Create toast UI components using Radix UI
  - [x] Implement `useToast` hook for toast management
  - [x] Create `ReminderToastNotifications` component
  - [x] Show destructive toasts for overdue reminders
  - [x] Show warning toasts for reminders due within 1 hour
  - [x] Prevent duplicate toasts via Set tracking with 5-minute prevention
  - [x] Include "Mark Done" action buttons in toasts
  - [x] Auto-dismiss toasts after 8-10 seconds
- [x] Push Notifications
  - [x] Create `usePushNotifications` hook for Notification API management
  - [x] Implement permission request and status tracking
  - [x] Create `ReminderPushNotifications` component for background notifications
  - [x] Detect app background/foreground state using visibility API
  - [x] Show push notifications only when app is in background
  - [x] Prevent duplicate push notifications with 10-minute prevention
  - [x] Include reminder title, contact name, and interaction details
  - [x] Handle notification click events to focus the app
  - [x] Create `NotificationPermissionRequest` component for user-friendly permission flow
  - [x] Add settings page with notification preferences management
  - [x] Integrate push notifications with existing reminder polling system
- [x] Notification System Testing
  - [x] Test toast notifications show only once per reminder per due state
  - [x] Test push notifications are not triggered without permission
  - [x] Test push notifications appear only for reminders marked due/overdue in that tick
  - [x] Test notification payload matches actual reminder data when mocked
  - [x] Test duplicate prevention mechanisms for both toast and push notifications
  - [x] Test background detection and notification timing
  - [x] Test permission request flow and user interaction
- [x] Debug Interface
  - [x] Create `ReminderPollingDebug` component for development
  - [x] Show polling status, last checked time, next check countdown
  - [x] Display overdue and recently overdue counts
  - [x] Manual controls for start/stop/check now
  - [x] Debug info panel with detailed state

## Smart Reminder Heuristics (Advanced)

- [x] Priority Calculation System
  - [x] Create `reminderHeuristics.ts` with priority calculation algorithms
  - [x] Implement recency-based scoring (exponential decay over 7 days)
  - [x] Implement urgency scoring based on interaction type and tags
  - [x] Add snooze penalty calculation (20% reduction per snooze)
  - [x] Apply time-based multipliers (overdue 2x, due-soon 1.5x)
  - [x] Create configurable urgency weights for types and tags
- [x] Priority State Management
  - [x] Create `reminderPriorityStore.ts` for state management
  - [x] Implement priority calculation and caching
  - [x] Add priority grouping (high/medium/low) and filtering
  - [x] Create priority insights and scenario boosting
  - [x] Integrate with existing reminder system and notifications
- [x] Priority UI Components
  - [x] Build `PrioritizedRemindersList.tsx` component with insights
  - [x] Display priority scores, factors, and insights
  - [x] Add priority-based filtering and sorting
  - [x] Show priority statistics and overview
- [x] Priority Testing
  - [x] Create comprehensive unit tests for heuristics system
  - [x] Test priority calculation accuracy and edge cases
  - [x] Test priority sorting, filtering, and grouping
  - [x] Test scenario boosting and insights generation
  - [x] Test urgency ranking behavior (high urgency ranks higher)
  - [x] Test snooze warning system (multiple snoozes trigger warnings)
  - [x] Test recency decay behavior (scores decay unless re-upped)
  - [x] Test exponential decay curves for recency and snooze penalties

## Tag/Label System

- [x] Data Model for Tags
  - [x] Add tags: string[] field to Contacts and Interactions
  - [x] Normalize tag case on insert (lowercase, hyphenated)
  - [x] Update Prisma schema and Zod schemas
- [x] Tag Management Store
  - [x] Create `tagStore.ts` with Zustand persistence
  - [x] Implement tag normalization and suggestions
  - [x] Add tag filtering with AND/OR logic
  - [x] Track tag usage statistics
- [ ] UI for Managing Tags
  - [ ] Tag input component with suggestion + create-new inline
  - [ ] Display tags as badges with remove buttons
  - [ ] Tag management interface for bulk operations
- [ ] Tag Filtering Integration
  - [ ] Integrate tag filtering into existing filter panels
  - [ ] Add tag filter bar that can toggle on/off tags
  - [ ] Support AND/OR logic in tag filtering
  - [ ] Add tag-based search in global search

## Filtered Views per Entity

- [x] Reminders Filters
  - [x] Filter by due date: Today, Next 3 Days, This Week, Overdue
  - [x] Filter by type: Follow-up, Check-in, Custom
  - [x] Filter by status: Done vs Active
  - [x] Create reusable `ReminderFilterPanel` and wire into state
  - [x] Remember last-used filter in localStorage
- [x] Contacts Filters
  - [x] Filter by label/tag (search in name, company, role, notes)
  - [x] Filter by recent activity (last contacted within X days)
  - [x] Filter by role, company, location (if fields exist)
  - [x] Create `ContactFilterPanel` with collapsible interface
- [x] Interactions Filters
  - [x] Filter by type (Call, Email, Interview, etc.)
  - [x] Filter by date range (Today, Week, Month, Custom)
  - [x] Filter by contact
  - [x] Create `InteractionFilterPanel` with custom date range
- [x] Filter Store & Components
  - [x] Create unified `filterStore.ts` with Zustand persistence
  - [x] Build reusable filter components with active filter badges
  - [x] Implement filtered list components for each entity
  - [x] Add filter summary and result counts
- [ ] Filter Enhancements
  - [ ] Add saved filter presets (e.g., "My Weekly Review")
  - [ ] Implement filter export/import functionality
  - [ ] Add filter analytics (most used filters)
  - [ ] Create filter templates for common workflows
  - [ ] Add bulk actions for filtered results

## A. Edit Interactions & Reminders
A.1. Inline Editing
- [x] Add "Edit" buttons to each interaction/reminder row
- [x] Clicking "Edit" transforms the item into an editable form:
  - For interactions: type dropdown, notes textarea
  - For reminders: due date picker, label input, snooze options
- [x] Include Save / Cancel buttons
- [x] Persist changes to local state or backend (depending on current architecture)

A.2. Modal-Based Editing (Alt UX)
- [x] Use a modal or drawer for editing if more space or detail is needed
- [x] Pre-fill form with current values
- [x] Use consistent validation rules (consider Zod reuse)
- [x] Create toggle between inline and modal editing modes
- [x] Implement comprehensive form validation with error messages
- [x] Add quick date selection buttons (Today, Tomorrow, Next Week)
- [x] Include status alerts for overdue and due-soon reminders

A.3. Autosave / Debounce
- [x] Add debounce to autosave fields on blur or idle (500–1000ms)
- [x] Optimistically update UI while saving
- [x] Handle API failures with toast rollback
- [x] Create reusable useAutosave hook with debounce functionality
- [x] Implement autosave status indicators (saving, saved, unsaved)
- [x] Add manual save and reset functionality
- [x] Show success and error toast notifications

A.4. Unit Tests for Autosave & Editing
- [x] Test useAutosave hook functionality (debounce, optimistic updates, error handling)
- [x] Test AutosaveInteraction component (edit mode, form validation, saving, cancellation)
- [x] Test AutosaveInteractionModal component (modal behavior, form validation, autosave)
- [x] Test change detection and form field initialization
- [x] Test save/cancel functionality and state persistence

B. Deletion Flow
B.1. Delete Button
- [x] Add delete icons or menu options to interaction/reminder rows
- [x] Use consistent placement and label (e.g. "Delete" or trash icon)
- [x] Implement delete functionality in contact store
- [x] Create API route for deleting interactions

B.2. Confirmation Dialog
- [x] Clicking delete opens confirmation dialog
- [x] Title: "Are you sure?"
- [x] Body: "This will permanently delete the reminder/interaction"
- [x] Buttons: Cancel / Confirm
- [x] Show item name and type in confirmation
- [x] Loading state during deletion
- [x] Error handling for failed deletions

B.3. Unit Tests for Deletion
- [x] Test DeleteConfirmationDialog component
- [x] Test delete button placement and styling
- [x] Test confirmation dialog UX and accessibility
- [x] Test delete functionality in AutosaveInteraction
- [x] Test delete functionality in ReminderRow
- [x] Test API integration and error handling

B.4. Undo Toast
- [x] After deletion, show a toast: "Deleted [item]. Undo?"
- [x] Undo link restores item with original data
- [x] Store recently deleted item in a temporary queue or ref
- [x] Auto-clear after X seconds (10 seconds)
- [x] Countdown timer showing time remaining
- [x] Loading state during undo operation
- [x] Multiple toasts support for multiple deletions
- [x] Error handling for failed undo operations

B.5. Unit Tests for Undo Toast
- [x] Delete button is visible for each item
- [x] Clicking delete shows confirmation
- [x] Confirming removes item from state
- [x] Undo restores item correctly
- [x] Undo toast disappears after timeout
- [x] Test countdown timer functionality
- [x] Test loading states during undo
- [x] Test multiple toasts management
- [x] Test store operations (add, remove, get, clear)
- [x] Test error handling scenarios

C. State Management & Undo Infrastructure
C.1. Transient Deletion Buffer
- [x] Store deleted items temporarily using useRef() for local memory-only
- [x] Store deleted items temporarily using Zustand/Redux slice if needing global undo
- [x] Allow "soft delete" before committing hard deletion to backend
- [x] Implement soft delete with auto-commit timeout (30 seconds)
- [x] Implement hard delete with immediate backend deletion
- [x] Provide revert functionality for soft deletes
- [x] Provide undo functionality for hard deletes
- [x] Create useTransientDeletion hook with useRef-like local state
- [x] Create TransientDeletionStore for global state management
- [x] Implement demo component showcasing both deletion methods
- [x] Add comprehensive error handling for API failures
- [x] Implement auto-cleanup for expired items

C.2. Unit Tests for Transient Deletion
- [x] Test TransientDeletionStore operations (soft delete, commit, revert, hard delete)
- [x] Test useTransientDeletion hook functionality
- [x] Test TransientDeletionDemo component behavior
- [x] Test soft delete workflow (mark, auto-commit, manual commit, revert)
- [x] Test hard delete workflow (immediate deletion, undo)
- [x] Test error handling scenarios (API failures, network errors)
- [x] Test state management (local vs global, persistence)
- [x] Test timeout and auto-cleanup functionality

C.2. Optimistic UI
- [x] Immediately hide deleted item from UI
- [x] If undo is clicked, restore from buffer
- [x] If backend delete fails, show error toast and restore item
- [x] Create OptimisticDeletionStore for immediate UI updates
- [x] Implement useOptimisticDeletion hook with error recovery
- [x] Create OptimisticUndoToast component with status indicators
- [x] Create OptimisticToastManager for global toast management
- [x] Update AutosaveInteraction to use optimistic deletion
- [x] Add comprehensive error handling with toast notifications
- [x] Implement pending operations tracking
- [x] Add status indicators (pending, committed, error)
- [x] Create comprehensive unit tests for optimistic UI system

C.3. Specific Unit Tests for Optimistic UI
- [x] Deletion optimistic state matches store state
- [x] Undo buffer clears after N seconds or when item is restored
- [x] API error on deletion surfaces a retry or restore option
- [x] Test optimistic state synchronization across multiple operations
- [x] Test concurrent operations maintain state consistency
- [x] Test buffer clearing with multiple items and different timestamps
- [x] Test manual retry after API error
- [x] Test partial failures in batch operations
- [x] Test network timeout handling with restore option
- [x] Test error toast with retry option 

## Contact Profile Page
📄 A. Dedicated Per-Contact View
A.1. Routing & Navigation
- [x] Add a route like /contact/:contactId (if using React Router or similar)
- [x] Clicking a contact from the list navigates to this route
- [x] Scroll position and filters persist on return
- [x] Create dedicated contact profile page with comprehensive layout
- [x] Implement scroll position persistence store and hook
- [x] Add back navigation with state preservation
- [x] Create comprehensive unit tests for contact profile page
- [x] Create unit tests for scroll position persistence system
- [x] Update InteractionSection to accept contactId prop for filtering
- [x] Add contact statistics and interaction overview
- [x] Implement edit and delete contact functionality
- [x] Add responsive design and accessibility features

A.2. Header Section
- [x] Display contact name, avatar/initials, and key metadata
- [x] Show title/role with icon
- [x] Display company (if available) with icon
- [x] Show last contacted information with relative time
- [x] Display labels/tags with proper styling
- [x] Add edit and delete options for the contact itself
- [x] Include contact methods (email, phone) in header
- [x] Show flagged contact indicator when applicable
- [x] Add LinkedIn profile link when available
- [x] Display quick stats in header section
- [x] Calculate and show interaction rates and percentages
- [x] Create comprehensive tests for enhanced header section
- [x] Implement responsive design for header layout
- [x] Add proper accessibility features and ARIA labels

## Deletion Flow
B.1. Delete Button
- [x] Add delete icons or menu options to interaction/reminder rows
- [x] Use consistent placement and label (e.g. "Delete" or trash icon)

B.2. Confirmation Dialog
- [x] Clicking delete opens confirmation dialog:
- [x] Title: "Are you sure?"
- [x] Body: "This will permanently delete the reminder/interaction"
- [x] Buttons: Cancel / Confirm

B.3. Undo Toast
- [x] After deletion, show a toast: "Deleted [item]. Undo?"
- [x] Undo link restores item with original data
- [x] Store recently deleted item in a temporary queue or ref
- [x] Auto-clear after X seconds

## Transient Deletion Buffer
C.1. Transient Deletion Buffer
- [x] Store deleted items temporarily using:
- [x] useRef() for local memory-only
- [x] Zustand/Redux slice if needing global undo
- [x] Allow "soft delete" before committing hard deletion to backend

C.2. Optimistic UI
- [x] Immediately hide deleted item from UI
- [x] If undo is clicked, restore from buffer
- [x] If backend delete fails, show error toast and restore item
- [x] Create OptimisticDeletionStore for immediate UI updates
- [x] Implement useOptimisticDeletion hook with error recovery
- [x] Create OptimisticUndoToast component with status indicators
- [x] Create OptimisticToastManager for global toast management
- [x] Update AutosaveInteraction to use optimistic deletion
- [x] Add comprehensive error handling with toast notifications
- [x] Implement pending operations tracking
- [x] Add status indicators (pending, committed, error)
- [x] Create comprehensive unit tests for optimistic UI system

C.3. Specific Unit Tests for Optimistic UI
- [x] Deletion optimistic state matches store state
- [x] Undo buffer clears after N seconds or when item is restored
- [x] API error on deletion surfaces a retry or restore option
- [x] Test optimistic state synchronization across multiple operations
- [x] Test concurrent operations maintain state consistency
- [x] Test buffer clearing with multiple items and different timestamps
- [x] Test manual retry after API error
- [x] Test partial failures in batch operations
- [x] Test network timeout handling with restore option
- [x] Test error toast with retry option

## Suggested Unit Tests:
- [x] Delete button is visible for each item
- [x] Clicking delete shows confirmation
- [x] Confirming removes item from state
- [x] Undo restores item correctly
- [x] Undo toast disappears after timeout 