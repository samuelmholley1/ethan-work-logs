interface BehavioralDataSheetData {
  month: string;
  halfMonth: 'first' | 'second';
}

const OUTCOMES = [
  { outcome: '1- Elijah will participate in an integrated social activity of his choice in the community given 4 or less verbal prompts for 6 consecutive months.', key: '1/# A' },
  { outcome: '2. Elijah 3 times per week will make his own choice of activities in the community site given 4 or less Verbal Prompt for 6 consecutive months.', key: '1# A' },
  { outcome: '3- Elijah staff will help him to increase his ability to choose the right activity in the community to help him increase his social activity given 3 or less verbal prompts for 6 months.', key: '1# A' },
  { outcome: '4- Elijah will increase his ability to identify and implement positive coping skills to assist with managing his behaviors given 3 or less verbal prompts for 6 Consecutive months', key: '1/# A' }
];

export default function BehavioralDataSheetTemplate({ data }: { data: BehavioralDataSheetData }) {
  const start = data.halfMonth === 'first' ? 1 : 16;
  const end = data.halfMonth === 'first' ? 15 : 31;
  const days = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>Behavioral Data Sheet - {data.month}</title>
        <style>{`
          @page { size: letter; margin: 0.5in; }
          body { font-family: Arial; font-size: 9pt; margin: 0; }
          .page { page-break-after: always; min-height: 100vh; position: relative; }
          .h1 { text-align: center; font-weight: bold; font-size: 10pt; margin-bottom: 5px; }
          .h2 { text-align: right; font-size: 10pt; margin-bottom: 5px; }
          .h3 { font-weight: bold; font-size: 9pt; margin-bottom: 3px; }
          .h4 { font-size: 8pt; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; font-size: 7pt; }
          th, td { border: 1px solid black; padding: 4px; text-align: center; }
          th { background: #e8e8e8; font-weight: bold; }
          .out { width: 35%; text-align: left; }
          .key { width: 8%; }
          .day { width: 3%; }
          .foot { background: #f0f0f0; font-weight: bold; }
        `}</style>
      </head>
      <body>
        <div className="page">
          <div className="h1">NORTH CAROLINA DIVISION OF MENTAL HEALTH/DEVELOPMENTAL DISABILITIES/SUBSTANCE ABUSE SERVICES</div>
          <div className="h2">{data.month}</div>
          <div className="h3">CONSUMER NAME: ELIJAH WRIGHT - RECORD #: 816719_Medicaid ID#: 9512575698 from 02/11/25 TO 02/10/26 MONTH/YEAR-</div>
          <div className="h4">SPECIFY SERVICE: 1915i T2012 GC-U4 CLS AREA PROGRAM/LME: Alliance Health SERVICE PROVIDER/AGENCY: NC Life of Rehabilitation Services, Inc.</div>
          <table>
            <thead><tr><th className="out">OUTCOME</th><th className="key">KEY</th>{days.map(d => <th key={d} className="day">{d}</th>)}</tr></thead>
            <tbody>
              {OUTCOMES.map((o, i) => <tr key={i}><td className="out">{o.outcome}</td><td className="key">{o.key}</td>{days.map(d => <td key={d}></td>)}</tr>)}
              <tr><td className="out"></td><td className="key">1/#</td>{days.map(d => <td key={d}></td>)}</tr>
              <tr><td className="out"></td><td className="key">A</td>{days.map(d => <td key={d}></td>)}</tr>
              <tr><td className="out"></td><td className="key">1/#</td>{days.map(d => <td key={d}></td>)}</tr>
              <tr><td className="out"></td><td className="key">A</td>{days.map(d => <td key={d}></td>)}</tr>
              <tr className="foot"><td className="out">DURATION (WHEN REQUIRED)</td><td></td>{days.map(d => <td key={d}></td>)}</tr>
              <tr className="foot"><td className="out">DATE</td><td></td>{days.map(d => <td key={d}></td>)}</tr>
              <tr className="foot"><td className="out">INITIALS</td><td></td>{days.map(d => <td key={d}></td>)}</tr>
            </tbody>
          </table>
        </div>
        <div className="page">
          <div className="h1">NORTH CAROLINA DIVISION OF MENTAL HEALTH/DEVELOPMENTAL DISABILITIES/SUBSTANCE ABUSE SERVICES</div>
          <div className="h2">{data.month}</div>
          <div className="h3">CONSUMER NAME: ELIJAH WRIGHT - RECORD #: 816719_Medicaid ID#: 9512575698 from 02/11/25 TO 02/10/26 MONTH/YEAR-</div>
          <div className="h4">SPECIFY SERVICE: 1915i T2012 GC-U4 CLS AREA PROGRAM/LME: Alliance Health SERVICE PROVIDER/AGENCY: NC Life of Rehabilitation Services, Inc.</div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '5px' }}>DATE</div>
            <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '5px' }}>COMMENTS</div>
            <div style={{ border: '1px solid black', minHeight: '150px', padding: '10px' }}></div>
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ALL STAFF PERSONS WORKING WITH THIS INDIVIDUAL MUST FILL OUT THE INFORMATION BELOW</div>
          <table style={{ marginBottom: '20px' }}>
            <thead><tr><th>STAFF NAME (PLEASE PRINT)</th><th>STAFF SIGNATURE, TITLE</th><th>INITIALS</th></tr></thead>
            <tbody>
              <tr><td></td><td>DSP</td><td></td></tr>
              <tr><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td></tr>
            </tbody>
          </table>
          <div style={{ position: 'absolute', bottom: 0, fontSize: '7pt' }}>
            <div><strong>Key:</strong> (VP=Verbal prompt) (PP Physical Prompt) (M=Meet) (U=Not Meet) (I=Independent) (NA=Not Apply) (TL Therapeutic Leave) (R=Refuse)</div>
            <div><strong>Note:</strong> All goals will be measured at 100%</div>
            <div style={{ display: 'flex', marginTop: '10px' }}>
              <span>Qualified Professional Signature(QP):</span>
              <div style={{ flex: 1, borderBottom: '1px solid black', margin: '0 10px' }}></div>
              <span>Date:</span>
              <div style={{ width: '100px', borderBottom: '1px solid black', marginLeft: '10px' }}></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
