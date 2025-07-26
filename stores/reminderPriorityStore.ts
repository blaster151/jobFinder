import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  calculateReminderPriority, 
  sortRemindersByPriority, 
  getTopPriorityReminders,
  filterByMinimumPriority,
  groupRemindersByPriority,
  getPriorityInsights,
  boostPriorityForScenario,
  ReminderPriority,
  UrgencyConfig,
  DEFAULT_URGENCY_CONFIG
} from '@/lib/reminderHeuristics';
import { useContactStore } from './contactStore';

interface ReminderPriorityState {
  // Priority calculations
  prioritizedReminders: ReminderPriority[];
  highPriorityReminders: ReminderPriority[];
  mediumPriorityReminders: ReminderPriority[];
  lowPriorityReminders: ReminderPriority[];
  
  // Configuration
  urgencyConfig: UrgencyConfig;
  
  // Actions
  calculateAllPriorities: () => void;
  updateUrgencyConfig: (config: Partial<UrgencyConfig>) => void;
  getTopReminders: (limit?: number) => ReminderPriority[];
  getRemindersByPriority: (minScore: number) => ReminderPriority[];
  getPriorityInsights: (interactionId: string) => string[];
  boostPriority: (interactionId: string, scenario: 'interview' | 'application' | 'networking' | 'urgent') => void;
  
  // Computed state
  hasHighPriorityReminders: boolean;
  totalReminders: number;
  averagePriorityScore: number;
}

export const useReminderPriorityStore = create<ReminderPriorityState>()(
  persist(
    (set, get) => ({
      // Initial state
      prioritizedReminders: [],
      highPriorityReminders: [],
      mediumPriorityReminders: [],
      lowPriorityReminders: [],
      urgencyConfig: DEFAULT_URGENCY_CONFIG,
      
      // Actions
      calculateAllPriorities: () => {
        const { interactions, contacts } = useContactStore.getState();
        
        // Filter active reminders (not done)
        const activeInteractions = interactions.filter(i => 
          i.followUpRequired && !i.isDone && i.followUpDueDate
        );
        
        // Calculate priorities for all active reminders
        const priorities: ReminderPriority[] = activeInteractions.map(interaction => {
          const contact = contacts.find(c => c.id === interaction.contactId);
          if (!contact) {
            throw new Error(`Contact not found for interaction ${interaction.id}`);
          }
          
          return calculateReminderPriority(
            interaction,
            contact,
            interactions,
            get().urgencyConfig
          );
        });
        
        // Sort by priority
        const sortedPriorities = sortRemindersByPriority(priorities);
        
        // Group by priority level
        const { high, medium, low } = groupRemindersByPriority(sortedPriorities);
        
        // Calculate computed values
        const totalReminders = sortedPriorities.length;
        const averagePriorityScore = totalReminders > 0 
          ? sortedPriorities.reduce((sum, p) => sum + p.priorityScore, 0) / totalReminders
          : 0;
        
        set({
          prioritizedReminders: sortedPriorities,
          highPriorityReminders: high,
          mediumPriorityReminders: medium,
          lowPriorityReminders: low,
          hasHighPriorityReminders: high.length > 0,
          totalReminders,
          averagePriorityScore,
        });
      },
      
      updateUrgencyConfig: (config: Partial<UrgencyConfig>) => {
        set(state => ({
          urgencyConfig: { ...state.urgencyConfig, ...config }
        }));
        
        // Recalculate priorities with new config
        get().calculateAllPriorities();
      },
      
      getTopReminders: (limit = 10) => {
        return getTopPriorityReminders(get().prioritizedReminders, limit);
      },
      
      getRemindersByPriority: (minScore = 5.0) => {
        return filterByMinimumPriority(get().prioritizedReminders, minScore);
      },
      
      getPriorityInsights: (interactionId: string) => {
        const reminder = get().prioritizedReminders.find(r => r.interactionId === interactionId);
        return reminder ? getPriorityInsights(reminder) : [];
      },
      
      boostPriority: (interactionId: string, scenario: 'interview' | 'application' | 'networking' | 'urgent') => {
        set(state => {
          const updatedPriorities = state.prioritizedReminders.map(priority => {
            if (priority.interactionId === interactionId) {
              return boostPriorityForScenario(priority, scenario);
            }
            return priority;
          });
          
          // Re-sort and re-group
          const sortedPriorities = sortRemindersByPriority(updatedPriorities);
          const { high, medium, low } = groupRemindersByPriority(sortedPriorities);
          
          return {
            prioritizedReminders: sortedPriorities,
            highPriorityReminders: high,
            mediumPriorityReminders: medium,
            lowPriorityReminders: low,
            hasHighPriorityReminders: high.length > 0,
          };
        });
      },
      
      // Computed state
      hasHighPriorityReminders: false,
      totalReminders: 0,
      averagePriorityScore: 0,
    }),
    {
      name: 'reminder-priority-storage',
      partialize: (state) => ({
        urgencyConfig: state.urgencyConfig,
      }),
    }
  )
);

// Selectors for easy access
export const usePrioritizedReminders = () => useReminderPriorityStore(state => state.prioritizedReminders);
export const useHighPriorityReminders = () => useReminderPriorityStore(state => state.highPriorityReminders);
export const useMediumPriorityReminders = () => useReminderPriorityStore(state => state.mediumPriorityReminders);
export const useLowPriorityReminders = () => useReminderPriorityStore(state => state.lowPriorityReminders);
export const useUrgencyConfig = () => useReminderPriorityStore(state => state.urgencyConfig);
export const usePriorityStats = () => useReminderPriorityStore(state => ({
  hasHighPriorityReminders: state.hasHighPriorityReminders,
  totalReminders: state.totalReminders,
  averagePriorityScore: state.averagePriorityScore,
})); 