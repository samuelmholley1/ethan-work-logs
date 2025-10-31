interface NCLRBillingData {
  month: string; // e.g., "January"
  year: string;  // e.g., "2025"
  clientName?: string;
  recordNumber?: string;
  serviceType?: string; // e.g., "CLS"
}

// Default values
const DEFAULT_CLIENT_NAME = 'Elijah Wright';
const DEFAULT_RECORD_NUMBER = '816719';
const DEFAULT_SERVICE_TYPE = 'CLS';

export default function NCLRBillingTemplate({ data }: { data: NCLRBillingData }) {
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
            {Array.from({ length: 31 }, (_, i) => (
              <tr key={i + 1}>
                <td className="row-cell">{i + 1}</td>
                <td className="row-cell"></td>
                <td className="row-cell"></td>
                <td className="row-cell"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Hours */}
        <div className="total-section">
          <span className="total-label">Total Hours</span>
          <div className="total-box"></div>
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
