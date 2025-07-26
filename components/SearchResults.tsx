'use client';

import { SearchResult } from '@/stores/searchStore';
import { User, MessageSquare, Bell, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  selectedIndex: number;
  onResultClick: (result: SearchResult) => void;
}

// Highlight matching text in search results
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
        {part}
      </mark>
    ) : part
  );
}

export function SearchResults({ results, query, selectedIndex, onResultClick }: SearchResultsProps) {
  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return <User className="w-4 h-4" />;
      case 'interaction':
        return <MessageSquare className="w-4 h-4" />;
      case 'reminder':
        return <Bell className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return 'Contact';
      case 'interaction':
        return 'Interaction';
      case 'reminder':
        return 'Reminder';
      default:
        return 'Unknown';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'interaction':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reminder':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-sm">
          Try searching for a different term or check your spelling.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {results.map((result, index) => (
        <div
          key={result.id}
          className={`p-4 cursor-pointer transition-colors ${
            index === selectedIndex 
              ? 'bg-muted/50 border-l-2 border-primary' 
              : 'hover:bg-muted/30'
          }`}
          onClick={() => onResultClick(result)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getIcon(result.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">
                  {highlightText(result.title, query)}
                </h3>
                <span className={`text-xs px-2 py-1 rounded ${getTypeColor(result.type)}`}>
                  {getTypeLabel(result.type)}
                </span>
                {result.type === 'reminder' && result.isOverdue && (
                  <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                    Overdue
                  </span>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">
                {highlightText(result.subtitle, query)}
              </p>
              
              {result.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {highlightText(result.description, query)}
                </p>
              )}
              
              {result.type === 'reminder' && result.dueDate && (
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Due: {format(new Date(result.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 