import { format, parseISO } from 'date-fns';
import { apply15MinuteRounding, formatDuration, calculateTotalDuration, type RoundedTimeBlock } from '@/lib/rounding';

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

interface TimesheetData {
  month: string;
  year: string;
  weekStart: string;
  sessions: WorkSessionData[];
  timeBlocks: TimeBlockData[];
}

export default function WeeklyTimesheetTemplate({ data }: { data: TimesheetData }) {
  // Group time blocks by session
  const sessionMap = new Map<string, TimeBlockData[]>();
  for (const block of data.timeBlocks) {
    if (!sessionMap.has(block.sessionId)) {
      sessionMap.set(block.sessionId, []);
    }
    sessionMap.get(block.sessionId)!.push(block);
  }

  // Apply 15-minute rounding and calculate totals
  const roundedSessions = data.sessions.map(session => {
    const blocks = sessionMap.get(session.id) || [];
    const roundedBlocks = apply15MinuteRounding(blocks);
    const totalMinutes = calculateTotalDuration(roundedBlocks);
    
    return {
      ...session,
      blocks: roundedBlocks,
      totalMinutes
    };
  });

  const weekTotalMinutes = roundedSessions.reduce((sum, s) => sum + s.totalMinutes, 0);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`Timesheet - Week of ${data.weekStart}`}</title>
        <style>{`
          @page {
            size: letter;
            margin: 0.5in;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .header-title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .header-week {
            font-size: 14pt;
            color: #555;
          }
          
          .session {
            margin-bottom: 20px;
            break-inside: avoid;
          }
          
          .session-header {
            background-color: #10b981;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            font-size: 10pt;
          }
          
          td {
            font-size: 10pt;
          }
          
          .time-col {
            width: 30%;
          }
          
          .duration-col {
            width: 25%;
          }
          
          .total-row {
            background-color: #f9fafb;
            font-weight: bold;
          }
          
          .week-total {
            margin-top: 30px;
            padding: 15px;
            background-color: #ecfdf5;
            border: 2px solid #10b981;
            text-align: right;
          }
          
          .week-total-label {
            font-size: 14pt;
            font-weight: bold;
            margin-right: 20px;
          }
          
          .week-total-value {
            font-size: 16pt;
            font-weight: bold;
            color: #059669;
          }
          
          .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-size: 12pt;
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div className="header-title">Weekly Timesheet</div>
          <div className="header-week">Week of {format(parseISO(data.weekStart), 'MMMM d, yyyy')}</div>
        </div>

        {data.sessions.length === 0 ? (
          <div className="no-data">
            No work sessions found for this week.
          </div>
        ) : (
          <>
            {roundedSessions.map((session) => (
              <div key={session.id} className="session">
                <div className="session-header">
                  {format(parseISO(session.date), 'EEEE, MMMM d, yyyy')} - {session.serviceType}
                </div>
                
                {session.blocks.length === 0 ? (
                  <div style={{ padding: '10px', color: '#6b7280' }}>
                    No time blocks recorded
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th className="time-col">Start Time</th>
                        <th className="time-col">End Time</th>
                        <th className="duration-col">Duration</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.blocks.map((block, idx) => (
                        <tr key={idx}>
                          <td>{format(block.originalStartTime, 'h:mm a')}</td>
                          <td>{format(block.originalEndTime, 'h:mm a')}</td>
                          <td>{formatDuration(block.duration)}</td>
                          <td>
                            {(block.originalStartTime.getTime() !== block.roundedStartTime.getTime() ||
                              block.originalEndTime.getTime() !== block.roundedEndTime.getTime()) && (
                              <span style={{ color: '#059669', fontSize: '9pt' }}>
                                ✓ Rounded ({format(block.roundedStartTime, 'h:mm a')} - {format(block.roundedEndTime, 'h:mm a')})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan={2}>Session Total</td>
                        <td>{formatDuration(session.totalMinutes)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            ))}
            
            <div className="week-total">
              <span className="week-total-label">Week Total:</span>
              <span className="week-total-value">{formatDuration(weekTotalMinutes)}</span>
            </div>
          </>
        )}
      </body>
    </html>
  );
}
