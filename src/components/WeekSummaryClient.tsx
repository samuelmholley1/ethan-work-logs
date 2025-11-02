'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { EditableTimesheetSeniorStyle } from '@/components/EditableTimesheetSeniorStyle';

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

  // Auto-refresh data every 3 seconds to sync with other devices
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-8">
      {/* PDF Export Buttons - At Top */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Link
          href={`/pdf-templates/timesheet/${format(weekStart, 'yyyy-MM-dd')}`}
          target="_blank"
          className="px-4 sm:px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Export Timesheet PDF
        </Link>
        <Link
          href={`/pdf-templates/behavioral/${format(weekStart, 'yyyy-MM')}`}
          target="_blank"
          className="px-4 sm:px-6 py-3 bg-[#427d78] text-white font-semibold rounded-lg hover:bg-[#356760] transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Behavioral PDF
        </Link>
      </div>

      {/* Editable Timesheet */}
      <EditableTimesheetSeniorStyle
        dailySummaries={initialSummaries}
        weekStartDate={weekStart}
        onRefresh={handleRefresh}
      />

      {/* Behavioral Data Tally */}
      <div className="bg-white rounded-lg shadow-sm border-2 border-teal-500 p-6">
        <h3 className="text-xl font-semibold text-teal-700 mb-4">
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
