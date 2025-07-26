import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseAutosaveReturn<T> {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
  reset: () => void;
}

export function useAutosave<T>({
  data,
  onSave,
  debounceMs = 1000,
  enabled = true,
  onError
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<T>(data);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  // Update original data when data prop changes (new item loaded)
  useEffect(() => {
    setOriginalData(data);
    setHasUnsavedChanges(false);
  }, [data]);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    if (!enabled || !hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setOriginalData(data);
      
      // Show success toast
      toast({
        title: "Changes saved",
        description: "Your changes have been automatically saved.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Autosave failed:', error);
      
      // Show error toast
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
        duration: 4000,
      });

      // Call custom error handler if provided
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [data, enabled, hasUnsavedChanges, onSave, onError, toast]);

  // Set up debounced save
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (enabled && hasUnsavedChanges) {
      timeoutRef.current = setTimeout(debouncedSave, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debouncedSave, debounceMs, enabled, hasUnsavedChanges]);

  // Detect changes by comparing current data with original
  useEffect(() => {
    const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }, [data, originalData]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await debouncedSave();
  }, [debouncedSave]);

  // Reset function
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasUnsavedChanges(false);
    setOriginalData(data);
  }, [data]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    reset,
  };
} 