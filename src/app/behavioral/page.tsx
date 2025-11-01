'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import EventLogger from '@/components/behavioral/EventLogger';
import EventTimeline from '@/components/behavioral/EventTimeline';
import type { Outcome } from '@/types/worklog';

export default function BehavioralPage() {
  const [showLogger, setShowLogger] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingOutcomes, setIsLoadingOutcomes] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Validate and get active session
  const validateSession = useCallback(() => {
    try {
      const savedSession = localStorage.getItem('activeWorkSession');
      if (!savedSession) {
        setActiveSessionId(null);
        setSessionError('No active work session found');
        return null;
      }

      const session = JSON.parse(savedSession);
      
      // Validate session structure
      if (!session.id || !session.date) {
        setActiveSessionId(null);
        setSessionError('Invalid session data');
        return null;
      }

      // Check if session is from today
      const today = format(new Date(), 'yyyy-MM-dd');
      if (session.date !== today) {
        setActiveSessionId(null);
        setSessionError('Session is not from today. Please start a new session.');
        return null;
      }

      // Check if session is still active
      if (session.status !== 'Active') {
        setActiveSessionId(null);
        setSessionError('Session has ended. Please start a new session.');
        return null;
      }

      setActiveSessionId(session.id);
      setSessionError(null);
      return session.id;
    } catch (error) {
      console.error('Error validating session:', error);
      setActiveSessionId(null);
      setSessionError('Error loading session data');
      return null;
    }
  }, []);

  // Fetch outcomes on mount
  useEffect(() => {
    async function fetchOutcomes() {
      try {
        // For now, use hardcoded outcomes until we have the API
        // TODO: Replace with actual API call
        const mockOutcomes: Outcome[] = [
          {
            id: 'outcome1',
            title: 'Integrated Social Activity',
            description: 'Elijah will participate in an integrated social activity of his choice in the community given 4 or less verbal prompts for 6 consecutive months.',
            serviceType: 'CLS',
            order: 1,
          },
          {
            id: 'outcome2',
            title: 'Weekly Choice of Activities',
            description: 'Elijah 3 times per week will make his own choice of activities in the community site given 4 or less Verbal Prompt for 6 consecutive months.',
            serviceType: 'CLS',
            order: 2,
          },
          {
            id: 'outcome3',
            title: 'Choosing Right Activity',
            description: 'Elijah staff will help him to increase his ability to choose the right activity in the community to help him increase his social activity given 3 or less verbal prompts for 6 months.',
            serviceType: 'CLS',
            order: 3,
          },
          {
            id: 'outcome4',
            title: 'Positive Coping Skills',
            description: 'Elijah will increase his ability to identify and implement positive coping skills to assist with managing his behaviors given 3 or less verbal prompts for 6 Consecutive months.',
            serviceType: 'CLS',
            order: 4,
          },
        ];
        
        setOutcomes(mockOutcomes);
      } catch (error) {
        console.error('Error fetching outcomes:', error);
      } finally {
        setIsLoadingOutcomes(false);
      }
    }

    fetchOutcomes();
  }, []);

  // Fetch today's events
  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch(`/api/behavioral-events?date=${today}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events:', response.status);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    
    // Auto-refresh events every 30 seconds
    const intervalId = setInterval(fetchEvents, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  // Validate session on mount and when page becomes visible
  useEffect(() => {
    validateSession();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        validateSession();
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check session every 60 seconds
    const sessionCheckInterval = setInterval(validateSession, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, [validateSession, fetchEvents]);

  const handleLogEvent = () => {
    // Allow logging even without active session - use a placeholder
    if (!activeSessionId) {
      // Create a temporary session ID or use 'manual-entry'
      setShowLogger(true);
      return;
    }
    setShowLogger(true);
  };

  const handleSuccess = async () => {
    setShowLogger(false);
    
    // Refresh events immediately
    await fetchEvents();

    // Show success feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  if (showLogger) {
    return (
      <EventLogger
        sessionId={activeSessionId || 'manual-entry'}
        outcomes={outcomes}
        onSuccess={handleSuccess}
        onCancel={() => setShowLogger(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Behavioral Events
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Status Card */}
      {sessionError && (
        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  No active session
                </p>
                <p className="text-xs text-blue-800">
                  You can still log behavioral events. They'll be saved without a work session link.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Timeline */}
      <EventTimeline events={events} isLoading={isLoadingEvents} />

      {/* Floating Action Button */}
      <button
        onClick={handleLogEvent}
        disabled={isLoadingOutcomes}
        className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 z-50"
        aria-label="Log new event"
      >
        +
      </button>
    </div>
  );
}
