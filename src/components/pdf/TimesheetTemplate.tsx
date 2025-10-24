import { format } from 'date-fns';
import type { RoundedTimeBlock } from '@/lib/rounding';

interface TimesheetData {
  employeeName: string;
  employeeId: string;
  weekStart: Date;
  weekEnd: Date;
  dailySummaries: Array<{
    date: string;
    sessions: Array<{
      serviceType: string;
      roundedBlocks: RoundedTimeBlock[];
    }>;
  }>;
  weeklyTotalMinutes: number;
}

export default function TimesheetTemplate({ data }: { data: TimesheetData }) {
  const formatTime = (date: Date) => format(date, 'h:mm a');
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Timesheet - {format(data.weekStart, 'MMM d, yyyy')}</title>
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
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 10px;
          }
          
          .info-block {
            flex: 1;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 9pt;
          }
          
          .info-value {
            font-size: 11pt;
            border-bottom: 1px solid #333;
            min-height: 20px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background-color: #e0e0e0;
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            font-size: 10pt;
          }
          
          td {
            border: 1px solid #000;
            padding: 8px;
            font-size: 10pt;
          }
          
          .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          
          .signature-block {
            flex: 1;
            margin: 0 20px;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 9pt;
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <h1>EMPLOYEE TIMESHEET</h1>
          <p style={{ margin: 0, fontSize: '10pt' }}>
            Week of {format(data.weekStart, 'MMMM d, yyyy')} - {format(data.weekEnd, 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="info-section">
          <div className="info-block" style={{ marginRight: '20px' }}>
            <div className="info-label">Employee Name:</div>
            <div className="info-value">{data.employeeName}</div>
          </div>
          <div className="info-block">
            <div className="info-label">Employee ID:</div>
            <div className="info-value">{data.employeeId}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Date</th>
              <th style={{ width: '20%' }}>Service Type</th>
              <th style={{ width: '15%' }}>Time In</th>
              <th style={{ width: '15%' }}>Time Out</th>
              <th style={{ width: '15%' }}>Duration</th>
              <th style={{ width: '20%' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.dailySummaries.map((day, dayIdx) =>
              day.sessions.map((session, sessionIdx) =>
                session.roundedBlocks.map((block, blockIdx) => (
                  <tr key={`${dayIdx}-${sessionIdx}-${blockIdx}`}>
                    {sessionIdx === 0 && blockIdx === 0 && (
                      <td
                        rowSpan={day.sessions.reduce(
                          (sum, s) => sum + s.roundedBlocks.length,
                          0
                        )}
                      >
                        {format(new Date(day.date), 'EEE, MMM d')}
                      </td>
                    )}
                    {blockIdx === 0 && (
                      <td rowSpan={session.roundedBlocks.length}>
                        {session.serviceType}
                      </td>
                    )}
                    <td>{formatTime(block.roundedStartTime)}</td>
                    <td>{formatTime(block.roundedEndTime)}</td>
                    <td>{formatDuration(block.duration)}</td>
                    {blockIdx === 0 && (
                      <td rowSpan={session.roundedBlocks.length}></td>
                    )}
                  </tr>
                ))
              )
            )}
            <tr className="total-row">
              <td colSpan={4} style={{ textAlign: 'right' }}>
                WEEKLY TOTAL:
              </td>
              <td colSpan={2}>{formatDuration(data.weeklyTotalMinutes)}</td>
            </tr>
          </tbody>
        </table>

        <div className="signature-section">
          <div className="signature-block">
            <div className="signature-line">
              Employee Signature
            </div>
            <div style={{ fontSize: '9pt', marginTop: '5px' }}>Date: _____________</div>
          </div>
          <div className="signature-block">
            <div className="signature-line">
              Supervisor Signature
            </div>
            <div style={{ fontSize: '9pt', marginTop: '5px' }}>Date: _____________</div>
          </div>
        </div>

        <div style={{ marginTop: '30px', fontSize: '8pt', color: '#666', textAlign: 'center' }}>
          * All times are rounded to the nearest 15-minute interval per company policy
        </div>
      </body>
    </html>
  );
}
