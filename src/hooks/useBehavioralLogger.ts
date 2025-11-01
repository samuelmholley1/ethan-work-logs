import { useState, useCallback } from 'react';
import type { Outcome } from '@/types/worklog';

export type EventType = 'VP' | 'PP' | 'I' | 'M' | 'U' | 'NA' | 'R';
export type LoggerStep = 'outcome' | 'eventType' | 'promptCount' | 'notes' | 'confirm';

export interface BehavioralLoggerState {
  step: LoggerStep;
  selectedOutcome: Outcome | null;
  eventType: EventType | null;
  promptCount: number;
  notes: string;
  timestamp: Date;
}

export function useBehavioralLogger(sessionId: string) {
  const [state, setState] = useState<BehavioralLoggerState>({
    step: 'outcome',
    selectedOutcome: null,
    eventType: null,
    promptCount: 1,
    notes: '',
    timestamp: new Date(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectOutcome = useCallback((outcome: Outcome) => {
    setState(prev => ({
      ...prev,
      selectedOutcome: outcome,
      step: 'eventType',
    }));
  }, []);

  const selectEventType = useCallback((type: EventType) => {
    setState(prev => {
      // If VP or PP selected, go to prompt count step
      if (type === 'VP' || type === 'PP') {
        return {
          ...prev,
          eventType: type,
          step: 'promptCount',
        };
      }
      // Otherwise skip to notes
      return {
        ...prev,
        eventType: type,
        promptCount: 0, // Reset prompt count for non-prompt events
        step: 'notes',
      };
    });
  }, []);

  const setPromptCount = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      promptCount: Math.max(0, count),
    }));
  }, []);

  const continueFromPromptCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'notes',
    }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setState(prev => ({
      ...prev,
      notes,
    }));
  }, []);

  const skipNotes = useCallback(() => {
    setState(prev => ({
      ...prev,
      notes: '',
      step: 'confirm',
    }));
  }, []);

  const continueFromNotes = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'confirm',
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      switch (prev.step) {
        case 'eventType':
          return { ...prev, step: 'outcome', selectedOutcome: null };
        case 'promptCount':
          return { ...prev, step: 'eventType', eventType: null };
        case 'notes':
          // If we came from prompt count, go back there
          if (prev.eventType === 'VP' || prev.eventType === 'PP') {
            return { ...prev, step: 'promptCount' };
          }
          // Otherwise go back to event type
          return { ...prev, step: 'eventType', eventType: null };
        case 'confirm':
          return { ...prev, step: 'notes' };
        default:
          return prev;
      }
    });
  }, []);

  const submitEvent = useCallback(async () => {
    if (!state.selectedOutcome || !state.eventType) {
      setError('Missing required fields');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/behavioral-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          outcomeId: state.selectedOutcome.id,
          eventType: state.eventType,
          promptCount: state.promptCount,
          notes: state.notes,
          timestamp: state.timestamp.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save behavioral event');
      }

      // Success! Reset form
      setState({
        step: 'outcome',
        selectedOutcome: null,
        eventType: null,
        promptCount: 1,
        notes: '',
        timestamp: new Date(),
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [state, sessionId]);

  const reset = useCallback(() => {
    setState({
      step: 'outcome',
      selectedOutcome: null,
      eventType: null,
      promptCount: 1,
      notes: '',
      timestamp: new Date(),
    });
    setError(null);
  }, []);

  return {
    state,
    isSubmitting,
    error,
    selectOutcome,
    selectEventType,
    setPromptCount,
    continueFromPromptCount,
    setNotes,
    skipNotes,
    continueFromNotes,
    goBack,
    submitEvent,
    reset,
  };
}
