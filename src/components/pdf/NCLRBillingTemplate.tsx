import { format, parseISO } from 'date-fns';
import { apply15MinuteRounding, formatDuration, calculateTotalDuration } from '@/lib/rounding';

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

interface NCLRBillingData {
  month: string; // e.g., "January"
  year: string;  // e.g., "2025"
  clientName?: string;
  recordNumber?: string;
  serviceType?: string; // e.g., "CLS"
  sessions?: WorkSessionData[];
  timeBlocks?: TimeBlockData[];
}

// Default values
const DEFAULT_CLIENT_NAME = 'Elijah Wright';
const DEFAULT_RECORD_NUMBER = '816719';
const DEFAULT_SERVICE_TYPE = 'CLS';

export default function NCLRBillingTemplate({ data }: { data: NCLRBillingData }) {
  console.log('[NCLR TEMPLATE] Rendering with data:', {
    month: data.month,
    year: data.year,
    sessionsCount: data.sessions?.length || 0,
    timeBlocksCount: data.timeBlocks?.length || 0
  });

  // Process the actual timesheet data if provided
  const dailyEntries: { [key: number]: { timeIn: string; timeOut: string; duration: string } } = {};
  
  if (data.sessions && data.timeBlocks) {
    console.log('[NCLR TEMPLATE] Processing sessions and time blocks...');
    // Group time blocks by session
    const sessionMap = new Map<string, TimeBlockData[]>();
    for (const block of data.timeBlocks) {
      if (!sessionMap.has(block.sessionId)) {
        sessionMap.set(block.sessionId, []);
      }
      sessionMap.get(block.sessionId)!.push(block);
    }

    // Process each session and populate daily entries
    for (const session of data.sessions) {
      const blocks = sessionMap.get(session.id) || [];
      if (blocks.length === 0) continue;

      const roundedBlocks = apply15MinuteRounding(blocks);
      const dayOfMonth = new Date(session.date).getDate();

      // For simplicity, take the first and last time block for the day
      if (roundedBlocks.length > 0) {
        const firstBlock = roundedBlocks[0];
        const lastBlock = roundedBlocks[roundedBlocks.length - 1];
        const totalMinutes = calculateTotalDuration(roundedBlocks);

        dailyEntries[dayOfMonth] = {
          timeIn: format(firstBlock.roundedStartTime, 'h:mm a'),
          timeOut: format(lastBlock.roundedEndTime, 'h:mm a'),
          duration: formatDuration(totalMinutes),
        };
        console.log('[NCLR TEMPLATE] Day', dayOfMonth, ':', dailyEntries[dayOfMonth]);
      }
    }
  }

  console.log('[NCLR TEMPLATE] Daily entries count:', Object.keys(dailyEntries).length);

  // Calculate total hours
  let totalMinutes = 0;
  if (data.sessions && data.timeBlocks) {
    const sessionMap = new Map<string, TimeBlockData[]>();
    for (const block of data.timeBlocks) {
      if (!sessionMap.has(block.sessionId)) {
        sessionMap.set(block.sessionId, []);
      }
      sessionMap.get(block.sessionId)!.push(block);
    }

    for (const session of data.sessions) {
      const blocks = sessionMap.get(session.id) || [];
      const roundedBlocks = apply15MinuteRounding(blocks);
      totalMinutes += calculateTotalDuration(roundedBlocks);
    }
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`NCLR Billing Sheet - ${data.month} ${data.year}`}</title>
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
            max-width: 8.5in;
          }
          
          .header-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .header-month-year {
            text-align: center;
            margin-bottom: 15px;
            font-size: 11pt;
          }
          
          .info-box {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 10px;
            font-size: 10pt;
            line-height: 1.4;
          }
          
          .info-box-service {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 10px;
            font-size: 11pt;
          }
          
          .yellow-highlight {
            background-color: #FFFFE0;
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 10pt;
            line-height: 1.5;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
          }
          
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 10pt;
          }
          
          .col-number {
            width: 8%;
          }
          
          .col-time {
            width: 25%;
          }
          
          .row-cell {
            height: 25px;
            font-size: 10pt;
          }
          
          .total-section {
            text-align: right;
            margin-bottom: 20px;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 10px;
          }
          
          .total-label {
            font-weight: bold;
            font-size: 11pt;
          }
          
          .total-box {
            border: 1px solid #000;
            width: 100px;
            height: 30px;
            display: inline-block;
          }
          
          .signature-section {
            margin-top: 30px;
            font-size: 10pt;
          }
          
          .signature-line {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            gap: 10px;
          }
          
          .sig-label {
            white-space: nowrap;
          }
          
          .sig-underline {
            border-bottom: 1px solid #000;
            flex: 1;
            min-width: 150px;
            height: 20px;
          }
          
          .sig-date-label {
            white-space: nowrap;
            margin-left: 10px;
          }
          
          .sig-date-underline {
            border-bottom: 1px solid #000;
            width: 100px;
            display: inline-block;
            height: 20px;
          }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <div className="header-title">
          North Carolina Life Of Rehabilitation Community Billing Sheet
        </div>
        
        <div className="header-month-year">
          Month: {data.month || '___________'} year: {data.year || '___________'}
        </div>

        {/* Contact Info Box */}
        <div className="info-box">
          6028 the plaza charlotte nc 28215 phone # 704-733-9677 24 hours emergency #704-728-3034
          <br />
          email: eduardo.nclc@gmail.com or life.of.rehabilitation@gmail.com
        </div>

        {/* Client Info Box */}
        <div className="info-box">
          Client Name: {data.clientName || DEFAULT_CLIENT_NAME} RECORD #: {data.recordNumber || DEFAULT_RECORD_NUMBER}
        </div>

        {/* Service Box */}
        <div className="info-box-service">
          SERVICE: <strong>{data.serviceType || DEFAULT_SERVICE_TYPE}</strong>
        </div>

        {/* Yellow Highlighted Instruction Box */}
        <div className="yellow-highlight">
          <strong>BILLING SHEETS ARE FROM TUESDAYS TO MONDAYS.</strong> Billing Sheet need to fax every monday night no later than tuesday before 9 AM
        </div>

        {/* Main Timesheet Table */}
        <table>
          <thead>
            <tr>
              <th className="col-number">#</th>
              <th className="col-time">time in</th>
              <th className="col-time">time out</th>
              <th className="col-time">duration</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const entry = dailyEntries[dayNum];
              
              return (
                <tr key={dayNum}>
                  <td className="row-cell">{dayNum}</td>
                  <td className="row-cell">{entry?.timeIn || ''}</td>
                  <td className="row-cell">{entry?.timeOut || ''}</td>
                  <td className="row-cell">{entry?.duration || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total Hours */}
        <div className="total-section">
          <span className="total-label">Total Hours</span>
          <div className="total-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}>
            {totalMinutes > 0 ? formatDuration(totalMinutes) : ''}
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <div className="signature-line">
            <span className="sig-label">Staff Name</span>
            <div className="sig-underline"></div>
            <span className="sig-label">(DC) Staff signature</span>
            <div className="sig-underline"></div>
            <span className="sig-date-label">DATE</span>
            <div className="sig-date-underline"></div>
          </div>
          
          <div className="signature-line">
            <span className="sig-label">Guardian Name</span>
            <div className="sig-underline"></div>
            <span className="sig-label">Guardian signature</span>
            <div className="sig-underline"></div>
            <span className="sig-date-label">DATE</span>
            <div className="sig-date-underline"></div>
          </div>
        </div>
      </body>
    </html>
  );
}
