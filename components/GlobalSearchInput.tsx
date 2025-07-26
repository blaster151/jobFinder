'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchStore, SearchResult } from '@/stores/searchStore';
import { Search, Command } from 'lucide-react';
import { SearchResults } from './SearchResults';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function GlobalSearchInput() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { query, results, isSearching, isOpen, setQuery, setOpen, clearSearch } = useSearchStore();
  
  const debouncedQuery = useDebounce(query, 300);

  // Update search when debounced query changes
  useEffect(() => {
    if (debouncedQuery !== query) {
      setQuery(debouncedQuery);
    }
  }, [debouncedQuery, setQuery, query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen(true);
    }
    
    if (e.key === 'Escape') {
      setOpen(false);
      clearSearch();
    }
  }, [setOpen, clearSearch]);

  // Global keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setOpen(false);
    clearSearch();
  };

  const handleKeyDownInDialog = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    }
  };



  return (
    <>
      {/* Search trigger button */}
      <Button
        variant="outline"
        className="w-64 justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        Search contacts, interactions...
        <div className="ml-auto flex items-center gap-1">
          <Command className="w-3 h-3" />
          <span className="text-xs">K</span>
        </div>
      </Button>

      {/* Search dialog */}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={inputRef}
                placeholder="Search contacts, interactions, reminders..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInDialog}
                className="pl-10 pr-4 py-3 text-lg border-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isSearching && (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            )}

            {!isSearching && query && results.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {!isSearching && !query && (
              <div className="p-4 text-center text-muted-foreground">
                Start typing to search...
              </div>
            )}

            <SearchResults
              results={results}
              query={query}
              selectedIndex={selectedIndex}
              onResultClick={handleResultClick}
            />
          </div>

          {results.length > 0 && (
            <div className="p-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-4">
                  <span>↑↓ to navigate</span>
                  <span>Enter to select</span>
                  <span>Esc to close</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 