import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '@/hooks/useAutosave';

// Mock the toast hook
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const mockSaveFunction = vi.fn();

  const defaultOptions = {
    data: { name: 'Test', value: 123 },
    onSave: mockSaveFunction,
    debounceMs: 1000,
    enabled: true,
  };

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAutosave(defaultOptions));

    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(typeof result.current.saveNow).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should detect changes when data differs from original', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Initial state - no changes
    expect(result.current.hasUnsavedChanges).toBe(false);

    // Update data
    rerender({ data: { name: 'Updated', value: 123 } });

    // Should detect changes
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should debounce save calls', async () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make multiple rapid changes
    rerender({ data: { name: 'Change1', value: 123 } });
    rerender({ data: { name: 'Change2', value: 123 } });
    rerender({ data: { name: 'Change3', value: 123 } });

    // Should not have saved yet
    expect(mockSaveFunction).not.toHaveBeenCalled();

    // Advance time by less than debounce period
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Still should not have saved
    expect(mockSaveFunction).not.toHaveBeenCalled();

    // Advance time past debounce period
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should have saved once with the latest data
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveFunction).toHaveBeenCalledWith({ name: 'Change3', value: 123 });
  });

  it('should not save when disabled', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data, enabled: false }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });

    // Advance time past debounce period
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have saved
    expect(mockSaveFunction).not.toHaveBeenCalled();
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should handle successful save', async () => {
    mockSaveFunction.mockResolvedValueOnce(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });

    // Advance time to trigger save
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for save to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should have saved successfully
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSaved).toBeInstanceOf(Date);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should handle save errors', async () => {
    const mockError = new Error('Save failed');
    mockSaveFunction.mockRejectedValueOnce(mockError);

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });

    // Advance time to trigger save
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for save to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should have failed
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.hasUnsavedChanges).toBe(true); // Still has unsaved changes
  });

  it('should call custom error handler when provided', async () => {
    const mockError = new Error('Save failed');
    const mockErrorHandler = vi.fn();
    mockSaveFunction.mockRejectedValueOnce(mockError);

    const { rerender } = renderHook(
      ({ data }) => useAutosave({ 
        ...defaultOptions, 
        data, 
        onError: mockErrorHandler 
      }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });

    // Advance time to trigger save
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for save to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Should have called error handler
    expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
  });

  it('should allow manual save with saveNow', async () => {
    mockSaveFunction.mockResolvedValueOnce(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });

    // Manual save
    await act(async () => {
      await result.current.saveNow();
    });

    // Should have saved immediately
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveFunction).toHaveBeenCalledWith({ name: 'Updated', value: 123 });
    expect(result.current.isSaving).toBe(false);
    expect(result.current.lastSaved).toBeInstanceOf(Date);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should reset state with reset function', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Reset
    act(() => {
      result.current.reset();
    });

    // Should reset state
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should update original data when data prop changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Load new data (simulating new item loaded)
    rerender({ data: { name: 'NewItem', value: 456 } });

    // Should reset to no changes
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('should clear timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { rerender, unmount } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes to trigger timeout
    rerender({ data: { name: 'Updated', value: 123 } });

    // Unmount
    unmount();

    // Should have cleared timeout
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle complex nested objects', () => {
    const complexData = {
      user: {
        name: 'John',
        settings: {
          theme: 'dark',
          notifications: true
        }
      },
      items: ['item1', 'item2']
    };

    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data }),
      { initialProps: { data: complexData } }
    );

    // Make nested change
    const updatedData = {
      ...complexData,
      user: {
        ...complexData.user,
        settings: {
          ...complexData.user.settings,
          theme: 'light'
        }
      }
    };

    rerender({ data: updatedData });

    // Should detect changes
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should handle different debounce intervals', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutosave({ ...defaultOptions, data, debounceMs: 500 }),
      { initialProps: { data: { name: 'Test', value: 123 } } }
    );

    // Make changes
    rerender({ data: { name: 'Updated', value: 123 } });

    // Advance time by less than custom debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should not have saved yet
    expect(mockSaveFunction).not.toHaveBeenCalled();

    // Advance time past custom debounce
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should have saved
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
  });
}); 