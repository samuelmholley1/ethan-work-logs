import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';
import Airtable from 'airtable';
import TimesheetTemplate from '@/components/pdf/TimesheetTemplate';
import { apply15MinuteRounding, calculateTotalDuration } from '@/lib/rounding';

export const dynamic = 'force-dynamic';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

interface PageProps {
  params: Promise<{
    week: string;
  }>;
}

async function getTimesheetData(weekStart: Date) {
  const start = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });

  // Fetch work sessions
  const sessionRecords = await base(process.env.AIRTABLE_WORKSESSIONS_TABLE_ID!).select({
    filterByFormula: `AND(
      IS_AFTER({Date}, '${format(start, 'yyyy-MM-dd')}'),
      IS_BEFORE({Date}, '${format(addDays(end, 1), 'yyyy-MM-dd')}')
    )`,
    sort: [{ field: 'Date', direction: 'asc' }],
  }).all();

  const sessions = sessionRecords.map(record => ({
    id: record.id,
    date: record.get('Date') as string || record.get('Name') as string,
    serviceType: record.get('ServiceType') as string || record.get('Name') as string,
    userId: ((record.get('User') as string[]) || [])[0] || '',
  }));

  // Fetch time blocks
  const sessionIds = sessions.map(s => s.id);
  const timeBlocks: any[] = [];

  if (sessionIds.length > 0) {
    const timeBlockRecords = await base(process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID!).select({
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

  // Get user info (assuming first session's user)
  let employeeName = 'Employee Name';
  let employeeId = 'N/A';
  
  if (sessions.length > 0 && sessions[0].userId) {
    try {
      const userRecord = await base(process.env.AIRTABLE_USERS_TABLE_ID!).find(sessions[0].userId);
      employeeName = userRecord.get('Name') as string || 'Employee Name';
      employeeId = userRecord.get('EmployeeID') as string || userRecord.id;
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  }

  // Build daily summaries
  const sessionMap = new Map(timeBlocks.map(b => [b.sessionId, b]));
  const dailySummaries: any[] = [];

  for (const session of sessions) {
    const blocks = timeBlocks.filter(b => b.sessionId === session.id);
    const roundedBlocks = apply15MinuteRounding(blocks);

    let daySummary = dailySummaries.find(d => d.date === session.date);
    if (!daySummary) {
      daySummary = { date: session.date, sessions: [] };
      dailySummaries.push(daySummary);
    }

    daySummary.sessions.push({
      serviceType: session.serviceType,
      roundedBlocks,
    });
  }

  const weeklyTotalMinutes = dailySummaries.reduce(
    (total, day) => total + day.sessions.reduce(
      (dayTotal: number, s: any) => dayTotal + calculateTotalDuration(s.roundedBlocks),
      0
    ),
    0
  );

  return {
    employeeName,
    employeeId,
    weekStart: start,
    weekEnd: end,
    dailySummaries,
    weeklyTotalMinutes,
  };
}

export default async function TimesheetPDFPage({ params }: PageProps) {
  const { week } = await params;
  const data = await getTimesheetData(new Date(week));

  return <TimesheetTemplate data={data} />;
}
