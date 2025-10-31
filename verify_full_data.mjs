import https from 'https';

const BASE_ID = 'appKuKbAJCP5cAMGf';
const WORKSESSIONS_TABLE = 'tblKLj3eNxaySCKzw';
const TIMEBLOCKS_TABLE = 'tblxdyN67kpTmIBzs';
const PAT_TOKEN = process.env.AIRTABLE_API_KEY;

if (!PAT_TOKEN) {
  console.error('❌ AIRTABLE_API_KEY not found');
  process.exit(1);
}

function fetchData(tableId, formula = '') {
  return new Promise((resolve, reject) => {
    const path = formula 
      ? `/v0/${BASE_ID}/${tableId}?filterByFormula=${encodeURIComponent(formula)}`
      : `/v0/${BASE_ID}/${tableId}`;
    
    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('🔍 Verifying complete data structure...\n');

  // 1. Fetch sessions
  const sessionFormula = "AND(IS_AFTER({Date}, '2025-10-27'), IS_BEFORE({Date}, '2025-11-03'))";
  const sessionsData = await fetchData(WORKSESSIONS_TABLE, sessionFormula);
  const sessions = sessionsData.records || [];
  
  console.log(`✅ Found ${sessions.length} work sessions`);
  
  if (sessions.length === 0) {
    console.log('❌ No sessions found!');
    return;
  }

  // Show first session details
  const firstSession = sessions[0];
  console.log('\n📋 First session details:');
  console.log('  ID:', firstSession.id);
  console.log('  Date:', firstSession.fields.Date);
  console.log('  Service Type:', firstSession.fields.ServiceType);
  console.log('  Raw fields:', JSON.stringify(firstSession.fields, null, 2));

  // 2. Fetch ALL time blocks (no filter)
  const allTimeBlocks = await fetchData(TIMEBLOCKS_TABLE);
  console.log(`\n📊 Total time blocks in table: ${allTimeBlocks.records.length}`);

  // 3. Try to find time blocks for these sessions
  const sessionIds = sessions.map(s => s.id);
  console.log('\n🔗 Session IDs:', sessionIds);

  const timeBlocksForSessions = allTimeBlocks.records.filter(tb => {
    const wsField = tb.fields.WorkSession;
    if (!wsField) return false;
    return sessionIds.some(sid => wsField.includes(sid));
  });

  console.log(`\n⏰ Time blocks linked to these sessions: ${timeBlocksForSessions.length}`);
  
  if (timeBlocksForSessions.length > 0) {
    console.log('\n📋 First time block:');
    const firstTB = timeBlocksForSessions[0];
    console.log('  ID:', firstTB.id);
    console.log('  Start Time:', firstTB.fields.StartTime);
    console.log('  End Time:', firstTB.fields.EndTime);
    console.log('  WorkSession link:', firstTB.fields.WorkSession);
    console.log('  Raw fields:', JSON.stringify(firstTB.fields, null, 2));
  } else {
    console.log('\n❌ NO TIME BLOCKS FOUND!');
    console.log('This explains why Weekly Total is 0:00');
  }
}

verify().catch(console.error);
