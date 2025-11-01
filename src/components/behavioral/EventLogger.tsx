'use client';

import { useEffect } from 'react';
import { useBehavioralLogger } from '@/hooks/useBehavioralLogger';
import OutcomeSelector from './OutcomeSelector';
import EventTypeButtons from './EventTypeButtons';
import PromptCounter from './PromptCounter';
import EventNotes from './EventNotes';
import type { Outcome } from '@/types/worklog';

interface EventLoggerProps {
  sessionId: string;
  outcomes: Outcome[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EventLogger({ 
  sessionId, 
  outcomes, 
  onSuccess,
  onCancel 
}: EventLoggerProps) {
  const {
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
  } = useBehavioralLogger(sessionId);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      if (state.step === 'outcome') {
        if (onCancel) onCancel();
      } else {
        goBack();
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [state.step, goBack, onCancel]);

  // Prevent accidental page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.step !== 'outcome' && state.selectedOutcome) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.step, state.selectedOutcome]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (state.step === 'outcome') {
          if (onCancel) onCancel();
        } else {
          goBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.step, isSubmitting, goBack, onCancel]);

  const handleSubmit = async () => {
    const success = await submitEvent();
    if (success) {
      // Success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };

  // Validate outcomes exist
  if (!outcomes || outcomes.length === 0) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Outcomes Available
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to load behavioral outcomes. Please try again later.
          </p>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Screen Reader Announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {state.step === 'outcome' && 'Step 1 of 5: Select an outcome'}
        {state.step === 'eventType' && 'Step 2 of 5: Select event type'}
        {state.step === 'promptCount' && 'Step 3 of 5: Enter prompt count'}
        {state.step === 'notes' && 'Step 4 of 5: Add optional notes'}
        {state.step === 'confirm' && 'Step 5 of 5: Review and confirm'}
        {error && `Error: ${error}`}
        {isSubmitting && 'Saving event...'}
      </div>

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={state.step === 'outcome' ? handleCancel : goBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
            aria-label={state.step === 'outcome' ? 'Cancel logging' : 'Go back'}
          >
            <span className="text-xl">←</span>
            <span>{state.step === 'outcome' ? 'Cancel' : 'Back'}</span>
          </button>

          <h1 className="text-lg font-bold text-gray-900">
            Log Behavioral Event
          </h1>

          <div className="w-20 text-right">
            <span className="text-xs text-gray-500">
              {state.step === 'outcome' && '1/5'}
              {state.step === 'eventType' && '2/5'}
              {state.step === 'promptCount' && '3/5'}
              {state.step === 'notes' && '4/5'}
              {state.step === 'confirm' && '5/5'}
            </span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{
              width: `${
                state.step === 'outcome' ? 20 :
                state.step === 'eventType' ? 40 :
                state.step === 'promptCount' ? 60 :
                state.step === 'notes' ? 80 :
                100
              }%`
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="pb-safe">
        {state.step === 'outcome' && (
          <OutcomeSelector
            outcomes={outcomes}
            onSelect={selectOutcome}
          />
        )}

        {state.step === 'eventType' && (
          <EventTypeButtons
            onSelect={selectEventType}
            selectedOutcomeName={state.selectedOutcome?.title}
          />
        )}

        {state.step === 'promptCount' && state.eventType && (state.eventType === 'VP' || state.eventType === 'PP') && (
          <PromptCounter
            initialCount={state.promptCount}
            onCountChange={setPromptCount}
            onContinue={continueFromPromptCount}
            eventType={state.eventType}
          />
        )}

        {state.step === 'notes' && (
          <EventNotes
            initialNotes={state.notes}
            onNotesChange={setNotes}
            onSkip={skipNotes}
            onContinue={continueFromNotes}
          />
        )}

        {state.step === 'confirm' && (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Ready to Save
                </h2>
                <p className="text-gray-600">
                  Review your behavioral event entry
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Outcome
                  </h3>
                  <p className="text-sm text-gray-900">
                    {state.selectedOutcome?.title}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Event Type
                  </h3>
                  <p className="text-sm text-gray-900">
                    {state.eventType}
                  </p>
                </div>

                {state.promptCount > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Prompts
                    </h3>
                    <p className="text-sm text-gray-900">
                      {state.promptCount} {state.promptCount === 1 ? 'prompt' : 'prompts'}
                    </p>
                  </div>
                )}

                {state.notes && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Notes
                    </h3>
                    <p className="text-sm text-gray-900">
                      {state.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Time
                  </h3>
                  <p className="text-sm text-gray-900">
                    {state.timestamp.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
