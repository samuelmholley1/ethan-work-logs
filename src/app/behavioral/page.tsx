'use client';

import { useState, useEffect } from 'react';
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
  useEffect(() => {
    async function fetchEvents() {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await fetch(`/api/behavioral-events?date=${today}`);
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    }

    fetchEvents();
  }, []);

  // Check for active session
  useEffect(() => {
    // Try to get active session from localStorage
    const savedSession = localStorage.getItem('activeWorkSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setActiveSessionId(session.id);
      } catch (error) {
        console.error('Error parsing saved session:', error);
      }
    }
  }, []);

  const handleLogEvent = () => {
    if (!activeSessionId) {
      alert('Please start a work session first');
      return;
    }
    setShowLogger(true);
  };

  const handleSuccess = async () => {
    setShowLogger(false);
    
    // Refresh events
    const today = format(new Date(), 'yyyy-MM-dd');
    const response = await fetch(`/api/behavioral-events?date=${today}`);
    
    if (response.ok) {
      const data = await response.json();
      setEvents(data.events || []);
    }

    // Show success feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  if (showLogger) {
    return (
      <EventLogger
        sessionId={activeSessionId || ''}
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
      {!activeSessionId && (
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ No active work session. Start a session to log behavioral events.
            </p>
          </div>
        </div>
      )}

      {/* Events Timeline */}
      <EventTimeline events={events} isLoading={isLoadingEvents} />

      {/* Floating Action Button */}
      <button
        onClick={handleLogEvent}
        disabled={!activeSessionId || isLoadingOutcomes}
        className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 z-50"
        aria-label="Log new event"
      >
        +
      </button>
    </div>
  );
}
