import https from 'https';

const BASE_ID = 'appKuKbAJCP5cAMGf';
const WORKSESSIONS_TABLE = 'tblKLj3eNxaySCKzw';
const PAT_TOKEN = process.env.AIRTABLE_API_KEY;

if (!PAT_TOKEN) {
  console.error('❌ AIRTABLE_API_KEY not found in environment');
  process.exit(1);
}

function fetchWorkSessions() {
  return new Promise((resolve, reject) => {
    const filterFormula = encodeURIComponent("AND(IS_AFTER({Date}, '2025-10-27'), IS_BEFORE({Date}, '2025-11-03'))");
    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path: `/v0/${BASE_ID}/${WORKSESSIONS_TABLE}?filterByFormula=${filterFormula}&sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=asc`,
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

console.log('🔍 Verifying Airtable data for Week of Oct 27, 2025...');
console.log('Filter: IS_AFTER(2025-10-27) AND IS_BEFORE(2025-11-03)');
console.log('Expected: Oct 28, 29, 30, 31, Nov 1, 2\n');

fetchWorkSessions()
  .then(response => {
    const records = response.records;
    console.log(`✅ Found ${records.length} work sessions\n`);
    
    if (records.length > 0) {
      console.log('📅 Sessions:');
      records.forEach(record => {
        console.log(`  - ${record.fields.Date}: ${record.fields.ServiceType || 'No service type'}`);
      });
      console.log('\n🎉 Data exists! Production should show this data.');
    } else {
      console.log('❌ No sessions found!');
      console.log('\n💡 Possible causes:');
      console.log('  1. Dates were not updated correctly');
      console.log('  2. Data was deleted from Airtable');
      console.log('  3. Different Airtable base being used');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
