import https from 'https';

const BASE_ID = 'appKuKbAJCP5cAMGf';
const WORKSESSIONS_TABLE = 'tblKLj3eNxaySCKzw';
const TIMEBLOCKS_TABLE = 'tblxdyN67kpTmIBzs';
const PAT_TOKEN = process.env.AIRTABLE_API_KEY;

async function testQuery() {
  console.log('🔍 Testing exact query sequence used by app...\n');

  // Step 1: Get sessions for this week
  const sessionFormula = "AND(IS_AFTER({Date}, '2025-10-27'), IS_BEFORE({Date}, '2025-11-03'))";
  const sessionUrl = `https://api.airtable.com/v0/${BASE_ID}/${WORKSESSIONS_TABLE}?filterByFormula=${encodeURIComponent(sessionFormula)}&sort%5B0%5D%5Bfield%5D=Date&sort%5B0%5D%5Bdirection%5D=asc`;

  const sessionRes = await fetch(sessionUrl, {
    headers: { 'Authorization': `Bearer ${PAT_TOKEN}` }
  });

  const sessionData = await sessionRes.json();
  const sessions = sessionData.records || [];
  const sessionIds = sessions.map(s => s.id);

  console.log(`✅ Step 1: Found ${sessions.length} sessions`);
  console.log(`   Session IDs: ${sessionIds.join(', ')}\n`);

  if (sessions.length === 0) {
    console.log('❌ No sessions found - stopping here');
    return;
  }

  // Show first session's TimeBlocks array
  console.log('📋 First session TimeBlocks field:', sessions[0].fields.TimeBlocks);
  console.log('');

  // Step 2: Query time blocks using the SAME formula as the app
  const tbFilterFormula = `OR(${sessionIds.map(id => `FIND('${id}', ARRAYJOIN({WorkSessions}))`).join(', ')})`;
  console.log(`🔎 TimeBlocks filter formula:\n   ${tbFilterFormula}\n`);
  
  const tbUrl = `https://api.airtable.com/v0/${BASE_ID}/${TIMEBLOCKS_TABLE}?filterByFormula=${encodeURIComponent(tbFilterFormula)}`;
  console.log(`📡 TimeBlocks URL (encoded):\n   ${tbUrl}\n`);

  const tbRes = await fetch(tbUrl, {
    headers: { 'Authorization': `Bearer ${PAT_TOKEN}` }
  });

  if (!tbRes.ok) {
    console.log(`❌ TimeBlocks query failed: ${tbRes.status} ${tbRes.statusText}`);
    const errorText = await tbRes.text();
    console.log(`   Error: ${errorText}`);
    return;
  }

  const tbData = await tbRes.json();
  const timeBlocks = tbData.records || [];

  console.log(`✅ Step 2: Found ${timeBlocks.length} time blocks\n`);

  if (timeBlocks.length === 0) {
    console.log('❌ NO TIME BLOCKS RETURNED!\n');
    console.log('🔍 Let\'s check what\'s in the TimeBlocks table...\n');

    // Get ALL time blocks
    const allTbUrl = `https://api.airtable.com/v0/${BASE_ID}/${TIMEBLOCKS_TABLE}`;
    const allTbRes = await fetch(allTbUrl, {
      headers: { 'Authorization': `Bearer ${PAT_TOKEN}` }
    });
    const allTbData = await allTbRes.json();
    const allTimeBlocks = allTbData.records || [];

    console.log(`📊 Total time blocks in table: ${allTimeBlocks.length}\n`);

    // Check first few time blocks
    console.log('📋 Sample time blocks:');
    allTimeBlocks.slice(0, 3).forEach(tb => {
      console.log(`\n   ID: ${tb.id}`);
      console.log(`   Name: ${tb.fields.Name}`);
      console.log(`   WorkSessions: ${JSON.stringify(tb.fields.WorkSessions)}`);
      console.log(`   StartTime: ${tb.fields.StartTime}`);
      console.log(`   EndTime: ${tb.fields.EndTime}`);
    });

    // Check if any match our session IDs
    console.log('\n🔗 Checking for matches with our session IDs...');
    const matches = allTimeBlocks.filter(tb => {
      const ws = tb.fields.WorkSessions || [];
      return sessionIds.some(sid => ws.includes(sid));
    });

    console.log(`   Found ${matches.length} time blocks linked to these sessions`);
    
    if (matches.length > 0) {
      console.log('\n   ✅ Time blocks exist but query didn\'t find them!');
      console.log('   First matching block:');
      console.log(`      ID: ${matches[0].id}`);
      console.log(`      WorkSessions: ${JSON.stringify(matches[0].fields.WorkSessions)}`);
      console.log(`      Our session IDs: ${JSON.stringify(sessionIds)}`);
    }

  } else {
    console.log('✅ Time blocks found successfully!');
    timeBlocks.slice(0, 3).forEach(tb => {
      console.log(`\n   - ${tb.fields.Name}`);
      console.log(`     Start: ${tb.fields.StartTime}`);
      console.log(`     End: ${tb.fields.EndTime}`);
      console.log(`     Session: ${tb.fields.WorkSessions}`);
    });
  }
}

testQuery().catch(console.error);
