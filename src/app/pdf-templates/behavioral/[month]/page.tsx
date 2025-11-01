import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import BehavioralDataSheetTemplate from '@/components/pdf/BehavioralDataSheetTemplate';

interface PageProps {
  params: Promise<{
    month: string; // YYYY-MM format
  }>;
  searchParams: Promise<{
    half?: 'first' | 'second'; // Optional: first or second half of month
  }>;
}

interface BehavioralEventData {
  id: string;
  eventType: string;
  timestamp: string;
  sessionId: string;
  notes?: string;
}

async function getMonthData(monthParam: string) {
  try {
    const [year, monthNum] = monthParam.split('-').map(Number);
    const monthDate = new Date(year, monthNum - 1, 1);
    
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    const startDate = format(start, 'yyyy-MM-dd');
    const endDate = format(addDays(end, 1), 'yyyy-MM-dd');
    
    console.log('[Behavioral PDF] Fetching data for month:', startDate, 'to', endDate);

    // Fetch all work sessions for the month
    const sessionIds: string[] = [];
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

      const matchingSessions = allSessions.filter((record: any) => {
        const date = record.fields.Date;
        return date >= startDate && date < endDate;
      });

      sessionIds.push(...matchingSessions.map((r: any) => r.id));
      console.log('[Behavioral PDF] Found', matchingSessions.length, 'sessions');
    }

    // Fetch behavioral events
    const behavioralEvents: BehavioralEventData[] = [];

    if (sessionIds.length > 0) {
      const evUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_BEHAVIORALEVENTS_TABLE_ID}`;
      
      const evResponse = await fetch(evUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (evResponse.ok) {
        const evData = await evResponse.json();
        const allEvents = evData.records || [];

        const matchingEvents = allEvents.filter((record: any) => {
          const sessionLinks = record.fields.WorkSessions || [];
          return sessionIds.some(sid => sessionLinks.includes(sid));
        });

        console.log('[Behavioral PDF] Found', matchingEvents.length, 'behavioral events');

        for (const record of matchingEvents) {
          const sessionLinks = record.fields.WorkSessions || [];
          const eventName = record.fields.Name || '';
          const notes = record.fields.Notes || '';
          
          behavioralEvents.push({
            id: record.id,
            eventType: eventName,
            timestamp: record.fields.Timestamp || eventName,
            sessionId: sessionLinks[0] || '',
            notes: notes,
          });
        }
      }
    }

    return { behavioralEvents };
  } catch (error) {
    console.error('[Behavioral PDF] Error fetching data:', error);
    return { behavioralEvents: [] };
  }
}

export default async function BehavioralDataSheetPDFPage({ params, searchParams }: PageProps) {
  const { month } = await params;
  const { half } = await searchParams;
  
  const { behavioralEvents } = await getMonthData(month);
  
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);
  
  // Format as "MARCH 2025"
  const monthStr = format(monthDate, 'MMMM yyyy').toUpperCase();
  
  // Filter events by half month if specified
  const halfMonth = half || 'first';
  const filteredEvents = behavioralEvents.filter((event) => {
    try {
      const eventDate = new Date(event.timestamp);
      const dayOfMonth = eventDate.getDate();
      
      if (halfMonth === 'first') {
        return dayOfMonth >= 1 && dayOfMonth <= 15;
      } else {
        return dayOfMonth >= 16 && dayOfMonth <= 31;
      }
    } catch (e) {
      return false; // Exclude events with invalid timestamps
    }
  });
  
  console.log('[Behavioral PDF] Filtered', filteredEvents.length, 'events for', halfMonth, 'half');
  
  const data = {
    month: monthStr,
    halfMonth,
    events: filteredEvents,
  };

  return <BehavioralDataSheetTemplate data={data} />;
}
