import { startOfMonth, endOfMonth, format } from 'date-fns';
import Airtable from 'airtable';
import BehavioralDataSheetTemplate from '@/components/pdf/BehavioralDataSheetTemplate';

export const dynamic = 'force-dynamic';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

interface PageProps {
  params: Promise<{
    month: string; // YYYY-MM format
  }>;
  searchParams: Promise<{
    serviceType?: string;
  }>;
}

async function getBehavioralDataSheetData(month: Date, serviceType?: string) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  // Fetch work sessions for the month (optionally filtered by service type)
  let sessionFilter = `AND(
    IS_AFTER({Date}, '${format(start, 'yyyy-MM-dd')}'),
    IS_BEFORE({Date}, '${format(end, 'yyyy-MM-dd')}')
  )`;
  
  if (serviceType) {
    sessionFilter = `AND(${sessionFilter}, {ServiceType} = '${serviceType}')`;
  }

  const sessionRecords = await base(process.env.AIRTABLE_WORKSESSIONS_TABLE_ID!).select({
    filterByFormula: sessionFilter,
  }).all();

  const sessionIds = sessionRecords.map(r => r.id);

  // Fetch behavioral events for these sessions
  const events: any[] = [];
  
  if (sessionIds.length > 0) {
    const eventRecords = await base(process.env.AIRTABLE_BEHAVIORALEVENTS_TABLE_ID!).select({
      filterByFormula: `OR(${sessionIds.map(id => `FIND('${id}', ARRAYJOIN({WorkSession}))`).join(', ')})`,
    }).all();

    for (const record of eventRecords) {
      const outcomeLinks = record.get('Outcome') as string[] || [];
      const sessionLinks = record.get('WorkSession') as string[] || [];
      const timestamp = record.get('Timestamp') as string || record.get('Name') as string;
      
      // Find the session to get the date
      const sessionRecord = sessionRecords.find(s => s.id === sessionLinks[0]);
      const date = sessionRecord ? sessionRecord.get('Date') as string : format(new Date(timestamp), 'yyyy-MM-dd');

      events.push({
        id: record.id,
        outcomeId: outcomeLinks[0] || '',
        eventType: record.get('EventType') as string || record.get('Name') as string,
        promptCount: record.get('PromptCount') as number || null,
        comment: record.get('Comment') as string || null,
        date,
      });
    }
  }

  // Fetch all outcomes (or filter by service type if needed)
  const outcomeRecords = await base(process.env.AIRTABLE_OUTCOMES_TABLE_ID!).select({
    sort: [{ field: 'Name', direction: 'asc' }],
  }).all();

  const outcomes = outcomeRecords.map(record => ({
    id: record.id,
    title: record.get('Title') as string || record.get('Name') as string,
    description: record.get('Description') as string || undefined,
  }));

  // Get user info (from first session)
  let employeeName = 'Employee Name';
  let employeeId = 'N/A';
  
  if (sessionRecords.length > 0) {
    const userLinks = sessionRecords[0].get('User') as string[] || [];
    if (userLinks.length > 0) {
      try {
        const userRecord = await base(process.env.AIRTABLE_USERS_TABLE_ID!).find(userLinks[0]);
        employeeName = userRecord.get('Name') as string || 'Employee Name';
        employeeId = userRecord.get('EmployeeID') as string || userRecord.id;
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
  }

  return {
    employeeName,
    employeeId,
    month: start,
    serviceType: serviceType || 'All Services',
    outcomes,
    events,
  };
}

export default async function BehavioralDataSheetPDFPage({ params, searchParams }: PageProps) {
  const { month } = await params;
  const { serviceType } = await searchParams;
  
  // Parse month (YYYY-MM)
  const [year, monthNum] = month.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);

  const data = await getBehavioralDataSheetData(monthDate, serviceType);

  return <BehavioralDataSheetTemplate data={data} />;
}
