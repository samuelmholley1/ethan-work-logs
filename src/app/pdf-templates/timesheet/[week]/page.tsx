import NCLRBillingTemplate from '@/components/pdf/NCLRBillingTemplate';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';

interface PageProps {
  params: Promise<{
    week: string;
  }>;
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

async function getWeekData(weekStartParam: string) {
  try {
    const start = startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });

    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(addDays(end, 1), 'yyyy-MM-dd');
    
    console.log('[Timesheet PDF] Fetching data for week:', startDate, 'to', endDate);

    // Fetch work sessions
    const sessions: WorkSessionData[] = [];
    const wsUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_WORKSESSIONS_TABLE_ID}`;
    
    const wsResponse = await fetch(wsUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (wsResponse.ok) {
      const wsData = await wsResponse.json();
      const allSessions = wsData.records || [];

      // Filter sessions by date range
      const matchingSessions = allSessions.filter((record: any) => {
        const date = record.fields.Date;
        return date >= startDate && date < endDate;
      });

      console.log('[Timesheet PDF] Found', matchingSessions.length, 'sessions');

      for (const record of matchingSessions) {
        const userLinks = record.fields.Users || [];
        sessions.push({
          id: record.id,
          date: record.fields.Date || '',
          serviceType: record.fields.ServiceType || '',
          userId: userLinks[0] || '',
        });
      }
    }

    // Fetch time blocks
    const timeBlocks: TimeBlockData[] = [];
    const sessionIds = sessions.map(s => s.id);

    if (sessionIds.length > 0) {
      const tbUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID}`;
      
      const tbResponse = await fetch(tbUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (tbResponse.ok) {
        const tbData = await tbResponse.json();
        const allTimeBlocks = tbData.records || [];

        const matchingBlocks = allTimeBlocks.filter((record: any) => {
          const sessionLinks = record.fields.WorkSessions || [];
          return sessionIds.some(sid => sessionLinks.includes(sid));
        });

        console.log('[Timesheet PDF] Found', matchingBlocks.length, 'time blocks');

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

    return { sessions, timeBlocks, weekStart: start };
  } catch (error) {
    console.error('[Timesheet PDF] Error fetching data:', error);
    const start = startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 });
    return { sessions: [], timeBlocks: [], weekStart: start };
  }
}

export default async function TimesheetPDFPage({ params }: PageProps) {
  const { week } = await params;
  const { sessions, timeBlocks, weekStart } = await getWeekData(week);

  console.log('[TIMESHEET PDF] Using NCLRBillingTemplate');
  console.log('[TIMESHEET PDF] Sessions:', sessions.length);
  console.log('[TIMESHEET PDF] Time blocks:', timeBlocks.length);

  const data = {
    month: format(weekStart, 'MMMM'),
    year: format(weekStart, 'yyyy'),
    clientName: 'Elijah Wright',
    recordNumber: '816719',
    serviceType: sessions.length > 0 ? sessions[0].serviceType : 'CLS',
    sessions,
    timeBlocks,
  };

  console.log('[TIMESHEET PDF] Data prepared:', JSON.stringify(data, null, 2));

  return <NCLRBillingTemplate data={data} />;
}
