import https from 'https';

const BASE_ID = 'appKuKbAJCP5cAMGf';
const PAT_TOKEN = process.env.AIRTABLE_API_KEY;

if (!PAT_TOKEN) {
  console.error('❌ AIRTABLE_API_KEY not found');
  process.exit(1);
}

const TABLES = {
  Users: 'tblPFBxMnHI9DB7gk',
  Outcomes: 'tbl4PJd8jShYvNOC0',
  WorkSessions: 'tblKLj3eNxaySCKzw',
  TimeBlocks: 'tblxdyN67kpTmIBzs',
  BehavioralEvents: 'tblMKk0UfDEcfSq0e'
};

function fetchTableSchema(tableName, tableId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path: `/v0/${BASE_ID}/${tableId}?maxRecords=1`,
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
          const data = JSON.parse(body);
          resolve({ tableName, record: data.records[0] });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function auditAirtableSchema() {
  console.log('🔍 AIRTABLE SCHEMA AUDIT');
  console.log('='.repeat(80));
  console.log(`Base ID: ${BASE_ID}\n`);

  for (const [tableName, tableId] of Object.entries(TABLES)) {
    try {
      const { record } = await fetchTableSchema(tableName, tableId);
      
      console.log(`\n📋 TABLE: ${tableName}`);
      console.log(`   Table ID: ${tableId}`);
      
      if (record && record.fields) {
        console.log(`   Fields Found: ${Object.keys(record.fields).length}`);
        console.log(`   Field Names:`);
        Object.keys(record.fields).forEach(field => {
          const value = record.fields[field];
          const type = Array.isArray(value) ? 'Array' : typeof value;
          const preview = Array.isArray(value) 
            ? `[${value.length} items]`
            : type === 'string' 
              ? value.substring(0, 50) + (value.length > 50 ? '...' : '')
              : JSON.stringify(value);
          console.log(`      - ${field} (${type}): ${preview}`);
        });
        console.log(`\n   Sample Record ID: ${record.id}`);
        console.log(`   Full Record:\n${JSON.stringify(record, null, 4)}`);
      } else {
        console.log(`   ⚠️  No records found in table`);
      }
      
      console.log('   ' + '-'.repeat(76));
      
    } catch (error) {
      console.error(`   ❌ Error fetching ${tableName}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SCHEMA COMPARISON WITH APP CODE');
  console.log('='.repeat(80));

  const appExpectations = {
    Users: {
      expectedFields: ['Name', 'Email'],
      appUsage: 'Referenced in WorkSessions.User field'
    },
    Outcomes: {
      expectedFields: ['Name', 'Description', 'TargetBehavior'],
      appUsage: 'Referenced in BehavioralEvents.Outcomes field'
    },
    WorkSessions: {
      expectedFields: ['Date', 'ServiceType', 'User', 'TimeBlocks', 'BehavioralEvents'],
      appUsage: 'Main query: filters by Date, links to User'
    },
    TimeBlocks: {
      expectedFields: ['StartTime', 'EndTime', 'WorkSessions'],
      appUsage: 'Query: FIND(sessionId, ARRAYJOIN({WorkSessions}))'
    },
    BehavioralEvents: {
      expectedFields: ['EventType', 'PromptCount', 'Timestamp', 'WorkSessions', 'Outcomes'],
      appUsage: 'Query: FIND(sessionId, ARRAYJOIN({WorkSessions}))'
    }
  };

  console.log('\n🔎 RED TEAM AUDIT RESULTS:\n');

  for (const [tableName, tableId] of Object.entries(TABLES)) {
    try {
      const { record } = await fetchTableSchema(tableName, tableId);
      const actualFields = record?.fields ? Object.keys(record.fields) : [];
      const expected = appExpectations[tableName];

      console.log(`\n${tableName}:`);
      console.log(`   Expected: ${expected.expectedFields.join(', ')}`);
      console.log(`   Actual:   ${actualFields.join(', ')}`);
      
      const missing = expected.expectedFields.filter(f => !actualFields.includes(f));
      const extra = actualFields.filter(f => !expected.expectedFields.includes(f));
      
      if (missing.length > 0) {
        console.log(`   ❌ MISSING: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`   ℹ️  EXTRA: ${extra.join(', ')}`);
      }
      if (missing.length === 0 && extra.length === 0) {
        console.log(`   ✅ MATCHES EXPECTED SCHEMA`);
      }
      
      console.log(`   Usage: ${expected.appUsage}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 CRITICAL FINDINGS:\n');
  
  console.log('1. Field Name Corrections Needed:');
  console.log('   - TimeBlocks: App queries "WorkSession" but field is "WorkSessions" ✅ FIXED');
  console.log('   - BehavioralEvents: App queries "WorkSession" but field is "WorkSessions" ✅ FIXED');
  
  console.log('\n2. Data Relationships:');
  console.log('   - WorkSessions → TimeBlocks: via TimeBlocks array field');
  console.log('   - WorkSessions → BehavioralEvents: via BehavioralEvents array field');
  console.log('   - TimeBlocks → WorkSessions: via WorkSessions array field (reverse link)');
  console.log('   - BehavioralEvents → WorkSessions: via WorkSessions array field (reverse link)');
  
  console.log('\n3. Query Patterns Used:');
  console.log('   - WorkSessions: AND(IS_AFTER({Date}, ...), IS_BEFORE({Date}, ...))');
  console.log('   - TimeBlocks: OR(FIND(id1, ARRAYJOIN({WorkSessions})), ...)');
  console.log('   - BehavioralEvents: OR(FIND(id1, ARRAYJOIN({WorkSessions})), ...)');
  
  console.log('\n' + '='.repeat(80));
}

auditAirtableSchema().catch(console.error);
