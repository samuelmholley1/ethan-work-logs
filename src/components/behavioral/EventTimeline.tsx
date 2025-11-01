'use client';

import { format, parseISO } from 'date-fns';
import type { EventType } from '@/hooks/useBehavioralLogger';

interface BehavioralEvent {
  id: string;
  eventType: string;
  timestamp: string;
  notes?: string;
  promptCount?: number;
  outcomeName?: string;
}

interface EventTimelineProps {
  events: BehavioralEvent[];
  isLoading?: boolean;
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'I': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✅' },
  'VP': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '💬' },
  'PP': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🤝' },
  'M': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⭐' },
  'U': { bg: 'bg-red-100', text: 'text-red-700', icon: '⚠️' },
  'NA': { bg: 'bg-gray-100', text: 'text-gray-700', icon: '➖' },
  'R': { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🚫' },
};

export default function EventTimeline({ events, isLoading }: EventTimelineProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Events Today
        </h3>
        <p className="text-sm text-gray-600">
          Start logging behavioral events to track progress
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Today's Events
        </h3>
        <span className="text-sm text-gray-600">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => {
          const eventTypeCode = event.eventType.includes('-') 
            ? event.eventType.split('-')[0].trim()
            : event.eventType;
          
          const colorScheme = EVENT_TYPE_COLORS[eventTypeCode] || EVENT_TYPE_COLORS['NA'];
          
          const timestamp = event.timestamp 
            ? format(parseISO(event.timestamp), 'h:mm a')
            : 'Just now';

          return (
            <div
              key={event.id}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* Icon & Badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full ${colorScheme.bg} flex items-center justify-center text-xl`}>
                  {colorScheme.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {event.eventType}
                    </h4>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {timestamp}
                    </span>
                  </div>

                  {event.outcomeName && (
                    <p className="text-xs text-gray-600 mb-2">
                      {event.outcomeName}
                    </p>
                  )}

                  {event.promptCount !== undefined && event.promptCount > 0 && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${colorScheme.bg} ${colorScheme.text} text-xs font-medium mb-2`}>
                      <span>{event.promptCount}</span>
                      <span>{event.promptCount === 1 ? 'prompt' : 'prompts'}</span>
                    </div>
                  )}

                  {event.notes && (
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
