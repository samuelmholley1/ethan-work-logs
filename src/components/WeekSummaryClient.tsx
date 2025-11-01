'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { EditableTimesheet } from '@/components/EditableTimesheet';

interface WeekSummaryClientProps {
  dailySummaries: any[];
  weekStart: Date;
  behavioralEvents: any[];
  weekStartParam?: string;
}

export function WeekSummaryClient({
  dailySummaries: initialSummaries,
  weekStart,
  behavioralEvents,
  weekStartParam,
}: WeekSummaryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Editable Timesheet */}
      <EditableTimesheet
        dailySummaries={initialSummaries}
        weekStartDate={weekStart}
        onRefresh={handleRefresh}
      />

      {/* Behavioral Data Tally */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Behavioral Events
        </h3>
        
        {behavioralEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No behavioral events recorded for this week.
          </p>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {behavioralEvents.length} {behavioralEvents.length === 1 ? 'event' : 'events'} recorded
            </div>
            <div className="space-y-3">
              {behavioralEvents.map((event, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        {event.eventType}
                      </div>
                      {event.notes && (
                        <div className="text-sm text-gray-600 mb-2">
                          {event.notes}
                        </div>
                      )}
                      {event.timestamp && (
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PDF Export Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Timesheet</p>
            <Link
              href={`/pdf-templates/timesheet/${format(weekStart, 'yyyy-MM-dd')}`}
              target="_blank"
              className="block px-4 py-2 bg-emerald-600 text-white text-center rounded-md hover:bg-emerald-700"
            >
              🖨️ Print PDF
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Behavioral Data Sheet</p>
            <Link
              href={`/pdf-templates/behavioral/${format(weekStart, 'yyyy-MM')}`}
              target="_blank"
              className="block px-4 py-2 bg-purple-600 text-white text-center rounded-md hover:bg-purple-700"
            >
              🖨️ Print PDF
            </Link>
          </div>
        </div>
      </div>

      {/* Refresh indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Refreshing...
        </div>
      )}
    </div>
  );
}
