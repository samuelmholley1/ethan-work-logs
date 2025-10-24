import { Suspense } from 'react';
import Link from 'next/link';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import Airtable from 'airtable';
import { apply15MinuteRounding, formatDuration, calculateTotalDuration, type RoundedTimeBlock } from '@/lib/rounding';
import { PDFDownloadLink } from '@/components/PDFDownloadLink';
import { WeekNavigator } from '@/components/WeekNavigator';

export const dynamic = 'force-dynamic';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

interface WorkSessionData {
  id: string;
  date: string;
  serviceType: string;
  userId: string;
}

interface TimeBlockData {
  id: string;
  startTime: string;
  endTime: string | null;
  sessionId: string;
}

interface BehavioralEventData {
  id: string;
  eventType: string;
  promptCount: number | null;
  timestamp: string;
  sessionId: string;
}

async function getWeekData(weekStartParam?: string) {
  const start = weekStartParam 
    ? startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 })
    : startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(start, { weekStartsOn: 1 }); // Sunday

  // Fetch work sessions for the week
  const sessionRecords = await base(process.env.AIRTABLE_WORK_SESSIONS_TABLE_ID!).select({
    filterByFormula: `AND(
      IS_AFTER({Date}, '${format(start, 'yyyy-MM-dd')}'),
      IS_BEFORE({Date}, '${format(addDays(end, 1), 'yyyy-MM-dd')}')
    )`,
    sort: [{ field: 'Date', direction: 'asc' }],
  }).all();

  const sessions: WorkSessionData[] = sessionRecords.map(record => ({
    id: record.id,
    date: record.get('Date') as string || record.get('Name') as string,
    serviceType: record.get('ServiceType') as string || record.get('Name') as string,
    userId: ((record.get('User') as string[]) || [])[0] || '',
  }));

  // Fetch all time blocks for these sessions
  const sessionIds = sessions.map(s => s.id);
  const timeBlocks: TimeBlockData[] = [];

  if (sessionIds.length > 0) {
    const filterFormula = `OR(${sessionIds.map(id => `RECORD_ID() = '${id}'`).join(', ')})`;
    const timeBlockRecords = await base(process.env.AIRTABLE_TIME_BLOCKS_TABLE_ID!).select({
      filterByFormula: `OR(${sessionIds.map(id => `FIND('${id}', ARRAYJOIN({WorkSession}))`).join(', ')})`,
    }).all();

    for (const record of timeBlockRecords) {
      const sessionLinks = record.get('WorkSession') as string[] || [];
      timeBlocks.push({
        id: record.id,
        startTime: record.get('StartTime') as string || record.get('Name') as string,
        endTime: record.get('EndTime') as string || null,
        sessionId: sessionLinks[0] || '',
      });
    }
  }

  // Fetch behavioral events for these sessions
  const behavioralEvents: BehavioralEventData[] = [];
  
  if (sessionIds.length > 0) {
    const eventRecords = await base(process.env.AIRTABLE_BEHAVIORAL_EVENTS_TABLE_ID!).select({
      filterByFormula: `OR(${sessionIds.map(id => `FIND('${id}', ARRAYJOIN({WorkSession}))`).join(', ')})`,
    }).all();

    for (const record of eventRecords) {
      const sessionLinks = record.get('WorkSession') as string[] || [];
      behavioralEvents.push({
        id: record.id,
        eventType: record.get('EventType') as string || record.get('Name') as string,
        promptCount: record.get('PromptCount') as number || null,
        timestamp: record.get('Timestamp') as string || record.get('Name') as string,
        sessionId: sessionLinks[0] || '',
      });
    }
  }

  return { sessions, timeBlocks, behavioralEvents, weekStart: start };
}

async function WeekSummary({ weekStart }: { weekStart?: string }) {
  const { sessions, timeBlocks, behavioralEvents, weekStart: start } = await getWeekData(weekStart);

  // Group time blocks by session
  const sessionMap = new Map<string, TimeBlockData[]>();
  for (const block of timeBlocks) {
    if (!sessionMap.has(block.sessionId)) {
      sessionMap.set(block.sessionId, []);
    }
    sessionMap.get(block.sessionId)!.push(block);
  }

  // Build daily summaries
  const dailySummaries: Array<{
    date: string;
    sessions: Array<{
      serviceType: string;
      roundedBlocks: RoundedTimeBlock[];
      totalMinutes: number;
    }>;
  }> = [];

  for (const session of sessions) {
    const blocks = sessionMap.get(session.id) || [];
    const roundedBlocks = apply15MinuteRounding(blocks.map(b => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
      sessionId: b.sessionId,
    })));

    const totalMinutes = calculateTotalDuration(roundedBlocks);

    // Find or create daily summary
    let daySummary = dailySummaries.find(d => d.date === session.date);
    if (!daySummary) {
      daySummary = { date: session.date, sessions: [] };
      dailySummaries.push(daySummary);
    }

    daySummary.sessions.push({
      serviceType: session.serviceType,
      roundedBlocks,
      totalMinutes,
    });
  }

  // Calculate weekly total
  const weeklyTotal = dailySummaries.reduce(
    (total, day) => total + day.sessions.reduce((dayTotal, s) => dayTotal + s.totalMinutes, 0),
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Timesheet Summary
        </h2>
        <p className="text-sm text-gray-600">
          Week of {format(start, 'MMM d, yyyy')}
        </p>
      </div>

      {dailySummaries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No work sessions found for this week.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailySummaries.map((day) =>
                  day.sessions.map((session, sessionIdx) =>
                    session.roundedBlocks.map((block, blockIdx) => (
                      <tr key={`${day.date}-${sessionIdx}-${blockIdx}`}>
                        {blockIdx === 0 && sessionIdx === 0 && (
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            rowSpan={day.sessions.reduce((sum, s) => sum + s.roundedBlocks.length, 0)}
                          >
                            {format(new Date(day.date), 'EEE, MMM d')}
                          </td>
                        )}
                        {blockIdx === 0 && (
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                            rowSpan={session.roundedBlocks.length}
                          >
                            {session.serviceType}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {format(block.roundedStartTime, 'h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {format(block.roundedEndTime, 'h:mm a')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDuration(block.duration)}
                        </td>
                      </tr>
                    ))
                  )
                )}
                <tr className="bg-emerald-50">
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    Weekly Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700">
                    {formatDuration(weeklyTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Behavioral Data Tally */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Behavioral Data Summary
            </h3>
            
            {behavioralEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No behavioral events recorded for this week.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {['VP', 'PP', 'I', 'U'].map(eventType => {
                    const events = behavioralEvents.filter(e => e.eventType === eventType);
                    const totalPrompts = events.reduce((sum, e) => sum + (e.promptCount || 0), 0);
                    
                    return (
                      <div key={eventType} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-emerald-600 mb-1">
                          {eventType}
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {events.length}
                        </div>
                        <div className="text-sm text-gray-600">
                          {totalPrompts > 0 && (
                            <span className="font-medium">
                              {totalPrompts} prompts
                            </span>
                          )}
                          {events.length === 1 ? ' event' : ' events'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {(() => {
                  const unknownEvents = behavioralEvents.filter(
                    e => !['VP', 'PP', 'I', 'U'].includes(e.eventType)
                  );
                  if (unknownEvents.length > 0) {
                    const typeSet = new Set<string>();
                    unknownEvents.forEach(e => typeSet.add(e.eventType));
                    const unknownTypes = Array.from(typeSet);
                    return (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Warning: Found {unknownEvents.length} event(s) with unknown type(s): {unknownTypes.join(', ')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Timesheet</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/pdf-templates/timesheet/${format(start, 'yyyy-MM-dd')}`}
                  target="_blank"
                  className="px-4 py-2 bg-emerald-600 text-white text-center rounded-md hover:bg-emerald-700"
                >
                  📄 View
                </Link>
                <PDFDownloadLink
                  href={`/api/generate-pdf/timesheet?week=${format(start, 'yyyy-MM-dd')}`}
                  filename={`timesheet-${format(start, 'yyyy-MM-dd')}.pdf`}
                  className="px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  ⬇️ Download PDF
                </PDFDownloadLink>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Behavioral Data Sheet</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/pdf-templates/behavioral/${format(start, 'yyyy-MM')}`}
                  target="_blank"
                  className="px-4 py-2 bg-purple-600 text-white text-center rounded-md hover:bg-purple-700"
                >
                  📊 View
                </Link>
                <PDFDownloadLink
                  href={`/api/generate-pdf/behavioral-sheet?month=${format(start, 'yyyy-MM')}`}
                  filename={`behavioral-data-${format(start, 'yyyy-MM')}.pdf`}
                  className="px-4 py-2 bg-indigo-600 text-white text-center rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  ⬇️ Download PDF
                </PDFDownloadLink>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{
    week?: string;
  }>;
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Summary & Export
          </h1>
          <p className="text-gray-600">
            View and export your timesheet and behavioral data.
          </p>
        </div>

        <WeekNavigator />

        <Suspense fallback={<div className="bg-white rounded-lg shadow-md p-6">Loading...</div>}>
          <WeekSummary weekStart={params.week} />
        </Suspense>

        <div className="mt-6 flex gap-4">
          <Link
            href="/manual-entry"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            + Add Manual Entry
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ← Back to Timer
          </Link>
        </div>
      </div>
    </div>
  );
}
