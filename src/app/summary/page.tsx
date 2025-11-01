import { Suspense } from 'react';
import Link from 'next/link';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import Airtable from 'airtable';
import { apply15MinuteRounding, formatDuration, calculateTotalDuration, type RoundedTimeBlock } from '@/lib/rounding';
import { PDFDownloadLink } from '@/components/PDFDownloadLink';
import { WeekNavigator } from '@/components/WeekNavigator';
import { WeekSummaryClient } from '@/components/WeekSummaryClient';

export const dynamic = 'force-dynamic';

function getAirtableBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable environment variables');
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
}

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
  notes?: string;
}

async function getWeekData(weekStartParam?: string) {
  try {
    const start = weekStartParam 
      ? startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(start, { weekStartsOn: 1 }); // Sunday

    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(addDays(end, 1), 'yyyy-MM-dd');
    
    console.log('[Summary] Fetching sessions for week:', startDate, 'to', endDate);

    // Use fetch instead of Airtable SDK for better debugging
    const filterFormula = `AND(IS_AFTER({Date}, '${startDate}'), IS_BEFORE({Date}, '${endDate}'))`;
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_WORKSESSIONS_TABLE_ID}?filterByFormula=${encodeURIComponent(filterFormula)}&sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=asc`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const sessionRecords = data.records || [];

    console.log('[Summary] Found', sessionRecords.length, 'sessions');

    const sessions: WorkSessionData[] = sessionRecords.map((record: any) => ({
      id: record.id,
      date: record.fields.Date || record.fields.Name,
      serviceType: record.fields.ServiceType || record.fields.Name,
      userId: (record.fields.Users || [])[0] || '', // Fixed: Users (plural) not User
    }));

    // Fetch all time blocks for these sessions
    const sessionIds = sessions.map(s => s.id);
    const timeBlocks: TimeBlockData[] = [];

    if (sessionIds.length > 0) {
      // Fetch ALL time blocks and filter in code since Airtable formula isn't working
      const tbUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID}`;
      
      const tbResponse = await fetch(tbUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (tbResponse.ok) {
        const tbData = await tbResponse.json();
        const allTimeBlocks = tbData.records || [];

        // Filter in code instead of using Airtable formula
        const matchingBlocks = allTimeBlocks.filter((record: any) => {
          const sessionLinks = record.fields.WorkSessions || [];
          return sessionIds.some(sid => sessionLinks.includes(sid));
        });

        console.log('[Summary] Found', matchingBlocks.length, 'time blocks (filtered from', allTimeBlocks.length, 'total)');

        for (const record of matchingBlocks) {
          const sessionLinks = record.fields.WorkSessions || [];
          timeBlocks.push({
            id: record.id,
            startTime: record.fields.StartTime || record.fields.Name,
            endTime: record.fields.EndTime || null,
            sessionId: sessionLinks[0] || '',
          });
        }
      }
    }

    // Fetch behavioral events for these sessions
    const behavioralEvents: BehavioralEventData[] = [];

    if (sessionIds.length > 0) {
      // Fetch ALL behavioral events and filter in code
      const evUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_BEHAVIORALEVENTS_TABLE_ID}`;
      
      const evResponse = await fetch(evUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (evResponse.ok) {
        const evData = await evResponse.json();
        const allEvents = evData.records || [];

        // Filter in code instead of using Airtable formula
        const matchingEvents = allEvents.filter((record: any) => {
          const sessionLinks = record.fields.WorkSessions || [];
          return sessionIds.some(sid => sessionLinks.includes(sid));
        });

        console.log('[Summary] Found', matchingEvents.length, 'behavioral events (filtered from', allEvents.length, 'total)');

        for (const record of matchingEvents) {
          const sessionLinks = record.fields.WorkSessions || [];
          // Parse event type from Name field (e.g., "Event 5" -> extract from Notes or use Name)
          const eventName = record.fields.Name || '';
          const notes = record.fields.Notes || '';
          
          behavioralEvents.push({
            id: record.id,
            eventType: eventName, // Using Name since EventType field doesn't exist
            promptCount: null, // PromptCount field doesn't exist in schema
            timestamp: record.fields.Timestamp || eventName,
            sessionId: sessionLinks[0] || '',
            notes: notes,
          });
        }
      }
    }

    return { sessions, timeBlocks, behavioralEvents, weekStart: start };
  } catch (error) {
    console.error('Error fetching Airtable data:', error);
    // Return empty data instead of throwing
    const start = weekStartParam 
      ? startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });
    return { sessions: [], timeBlocks: [], behavioralEvents: [], weekStart: start };
  }
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

  // Serialize data for client component (convert Dates to ISO strings)
  const serializedSummaries = dailySummaries.map(day => ({
    ...day,
    sessions: day.sessions.map(session => ({
      ...session,
      roundedBlocks: session.roundedBlocks.map(block => ({
        id: block.id,
        roundedStartTime: block.roundedStartTime,
        roundedEndTime: block.roundedEndTime,
        duration: block.duration,
        sessionId: block.sessionId,
      })),
    })),
  }));

  return (
    <WeekSummaryClient
      dailySummaries={serializedSummaries}
      weekStart={start}
      behavioralEvents={behavioralEvents}
      weekStartParam={weekStart}
    />
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
    <div className="min-h-screen bg-gray-50">
      {/* Header with teal gradient - matching senior center style */}
      <div className="bg-gradient-to-r from-[#427d78] to-[#5eb3a1] shadow-sm border-b-2 border-teal-600">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-white">Timesheet Summary</h1>
          <p className="text-sm text-white/90 mt-1">
            Ethan's Work Logs - View and edit timesheet and behavioral data
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <WeekNavigator />

        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading timesheet data...</p>
            </div>
          </div>
        }>
          <WeekSummary weekStart={params.week} />
        </Suspense>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/manual-entry"
            className="px-4 sm:px-6 py-3 bg-[#427d78] text-white font-semibold rounded-lg hover:bg-[#356760] transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Manual Entry
          </Link>
          <Link
            href="/"
            className="px-4 sm:px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Timer
          </Link>
        </div>
      </div>
    </div>
  );
}
