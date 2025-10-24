import { format, getDaysInMonth, startOfMonth } from 'date-fns';

interface OutcomeData {
  id: string;
  title: string;
  description?: string;
}

interface BehavioralEventData {
  id: string;
  outcomeId: string;
  eventType: string;
  promptCount: number | null;
  date: string; // YYYY-MM-DD
  comment?: string;
}

interface BehavioralDataSheetData {
  employeeName: string;
  employeeId: string;
  month: Date;
  serviceType: string;
  outcomes: OutcomeData[];
  events: BehavioralEventData[];
}

export default function BehavioralDataSheetTemplate({ data }: { data: BehavioralDataSheetData }) {
  const daysInMonth = getDaysInMonth(data.month);
  const monthStart = startOfMonth(data.month);
  
  // Group events by outcome and date
  const eventsByOutcomeAndDate = new Map<string, Map<number, BehavioralEventData[]>>();
  
  for (const event of data.events) {
    if (!eventsByOutcomeAndDate.has(event.outcomeId)) {
      eventsByOutcomeAndDate.set(event.outcomeId, new Map());
    }
    
    const dayOfMonth = parseInt(event.date.split('-')[2]);
    const outcomeMap = eventsByOutcomeAndDate.get(event.outcomeId)!;
    
    if (!outcomeMap.has(dayOfMonth)) {
      outcomeMap.set(dayOfMonth, []);
    }
    
    outcomeMap.get(dayOfMonth)!.push(event);
  }
  
  // Helper to format cell content (e.g., "VP/6" or "I" or "VP/3, PP/2")
  const formatCellContent = (outcomeId: string, day: number): string => {
    const events = eventsByOutcomeAndDate.get(outcomeId)?.get(day) || [];
    if (events.length === 0) return '';
    
    // Group by event type
    const byType = new Map<string, { count: number; totalPrompts: number }>();
    
    for (const event of events) {
      if (!byType.has(event.eventType)) {
        byType.set(event.eventType, { count: 0, totalPrompts: 0 });
      }
      const info = byType.get(event.eventType)!;
      info.count += 1;
      info.totalPrompts += event.promptCount || 0;
    }
    
    // Format as "VP/6" or "VP/6, PP/2"
    const parts: string[] = [];
    byType.forEach((info, type) => {
      if (info.totalPrompts > 0) {
        parts.push(`${type}/${info.totalPrompts}`);
      } else {
        parts.push(type);
      }
    });
    
    return parts.join(', ');
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Behavioral Data Sheet - {format(data.month, 'MMMM yyyy')}</title>
        <style>{`
          @page {
            size: letter landscape;
            margin: 0.25in;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          
          .header h1 {
            font-size: 14pt;
            font-weight: bold;
            margin: 0 0 5px 0;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 9pt;
          }
          
          .info-item {
            display: flex;
            gap: 5px;
          }
          
          .info-label {
            font-weight: bold;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 3px;
            text-align: center;
            vertical-align: middle;
          }
          
          th {
            background-color: #d0d0d0;
            font-weight: bold;
            font-size: 7pt;
          }
          
          .outcome-header {
            background-color: #e8e8e8;
            font-weight: bold;
            text-align: left;
            padding: 4px;
            font-size: 8pt;
          }
          
          .day-header {
            width: 2.5%;
            min-width: 25px;
            font-size: 7pt;
          }
          
          .outcome-cell {
            text-align: left;
            padding-left: 5px;
            font-size: 8pt;
            max-width: 150px;
          }
          
          .data-cell {
            font-size: 7pt;
            height: 25px;
            min-height: 25px;
          }
          
          .footer {
            margin-top: 10px;
            font-size: 7pt;
            color: #666;
          }
          
          .legend {
            display: flex;
            gap: 15px;
            margin-top: 8px;
            font-size: 8pt;
          }
          
          .legend-item {
            display: flex;
            gap: 5px;
          }
          
          /* Page break handling for multiple pages */
          .page-break {
            page-break-after: always;
          }
          
          @media print {
            .page-break {
              page-break-after: always;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>BEHAVIORAL DATA SHEET</h1>
          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Employee:</span>
              <span>{data.employeeName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span>{data.employeeId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Month:</span>
              <span>{format(data.month, 'MMMM yyyy')}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Service:</span>
              <span>{data.serviceType}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th className="outcome-cell">Outcome / Target Behavior</th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i + 1} className="day-header">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.outcomes.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 1} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No outcomes configured. Please add outcomes in Airtable.
                </td>
              </tr>
            ) : (
              data.outcomes.map((outcome, idx) => (
                <tr key={outcome.id}>
                  <td className="outcome-cell">
                    <div style={{ fontWeight: 'bold' }}>{outcome.title}</div>
                    {outcome.description && (
                      <div style={{ fontSize: '7pt', color: '#555', marginTop: '2px' }}>
                        {outcome.description}
                      </div>
                    )}
                  </td>
                  {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                    const day = dayIdx + 1;
                    const content = formatCellContent(outcome.id, day);
                    
                    return (
                      <td key={day} className="data-cell">
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="legend">
          <div className="legend-item">
            <span style={{ fontWeight: 'bold' }}>VP:</span>
            <span>Verbal Prompt</span>
          </div>
          <div className="legend-item">
            <span style={{ fontWeight: 'bold' }}>PP:</span>
            <span>Physical Prompt</span>
          </div>
          <div className="legend-item">
            <span style={{ fontWeight: 'bold' }}>I:</span>
            <span>Independent</span>
          </div>
          <div className="legend-item">
            <span style={{ fontWeight: 'bold' }}>U:</span>
            <span>Unable</span>
          </div>
        </div>

        <div className="footer">
          <p style={{ margin: '5px 0' }}>
            * Format: EventType/PromptCount (e.g., "VP/6" means 6 verbal prompts)
          </p>
          <p style={{ margin: '5px 0' }}>
            * Multiple events shown as comma-separated (e.g., "VP/3, PP/2")
          </p>
        </div>
      </body>
    </html>
  );
}
