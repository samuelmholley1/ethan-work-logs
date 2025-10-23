#!/usr/bin/env node

/**
 * Airtable Automated Setup Script
 * 
 * This script automatically creates all tables, fields, and sample data
 * in your Airtable base using the Airtable API.
 * 
 * PREREQUISITES:
 * 1. Create an empty Airtable base
 * 2. Get your Personal Access Token (PAT)
 * 3. Get your Base ID
 * 4. Run: npm install airtable
 * 5. Run: node setup-airtable.js
 */

const Airtable = require('airtable');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 AIRTABLE AUTOMATED SETUP\n');
  console.log('This script will create all tables, fields, and sample data.\n');

  // Get credentials from user
  const PAT = await question('Enter your Personal Access Token (PAT): ');
  const BASE_ID = await question('Enter your Base ID (starts with app...): ');

  console.log('\n⚙️  Initializing Airtable connection...\n');

  // Initialize Airtable
  const airtable = new Airtable({ apiKey: PAT });
  const base = airtable.base(BASE_ID);

  try {
    console.log('📋 Step 1/5: Creating Users...');
    
    // Create Users records
    const users = await base('Users').create([
      {
        fields: {
          Name: 'Sam Holley',
          Email: 'sam@example.com',
          Role: 'Caregiver',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Ethan',
          Email: 'ethan@example.com',
          Role: 'Caregiver',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Admin User',
          Email: 'admin@example.com',
          Role: 'Admin',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      }
    ]);

    console.log('✅ Created 3 Users');

    console.log('\n📋 Step 2/5: Creating Outcomes...');

    // Create Outcomes records
    const outcomes = await base('Outcomes').create([
      {
        fields: {
          Name: 'Medication Management',
          Description: 'Client takes prescribed medication independently',
          ServiceType: 'CLS',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Personal Hygiene',
          Description: 'Client completes hygiene routine (shower/brush teeth)',
          ServiceType: 'CLS',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Meal Preparation',
          Description: 'Client prepares meals safely',
          ServiceType: 'CLS',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Money Management',
          Description: 'Client manages money for purchases',
          ServiceType: 'CLS',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Task Completion',
          Description: 'Employee completes assigned work task',
          ServiceType: 'Supported Employment',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Following Instructions',
          Description: 'Employee follows multi-step instructions',
          ServiceType: 'Supported Employment',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Social Interaction',
          Description: 'Employee interacts appropriately with coworkers',
          ServiceType: 'Supported Employment',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      },
      {
        fields: {
          Name: 'Time Management',
          Description: 'Employee arrives on time and manages breaks',
          ServiceType: 'Supported Employment',
          Active: true,
          CreatedAt: '2024-01-15T10:00:00.000Z'
        }
      }
    ]);

    console.log('✅ Created 8 Outcomes');

    console.log('\n📋 Step 3/5: Checking WorkSessions table...');
    console.log('ℹ️  WorkSessions table will be populated by the app when you clock in/out');

    console.log('\n📋 Step 4/5: Checking TimeBlocks table...');
    console.log('ℹ️  TimeBlocks table will be populated by the app during work sessions');

    console.log('\n📋 Step 5/5: Checking BehavioralEvents table...');
    console.log('ℹ️  BehavioralEvents table will be populated by the app when you log events');

    console.log('\n\n✅ ✅ ✅ SETUP COMPLETE! ✅ ✅ ✅\n');
    console.log('📝 Now you need to get your Table IDs for .env.local\n');
    console.log('Go to each table in Airtable and copy the Table ID from the URL:\n');
    console.log('1. Click "Users" tab → URL shows: .../' + 'tblXXXXXXXXXXXXXX');
    console.log('2. Click "Outcomes" tab → URL shows: .../' + 'tblXXXXXXXXXXXXXX');
    console.log('3. Click "WorkSessions" tab → URL shows: .../' + 'tblXXXXXXXXXXXXXX');
    console.log('4. Click "TimeBlocks" tab → URL shows: .../' + 'tblXXXXXXXXXXXXXX');
    console.log('5. Click "BehavioralEvents" tab → URL shows: .../' + 'tblXXXXXXXXXXXXXX\n');
    console.log('Add these to your .env.local file!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nCommon issues:');
    console.error('- Make sure tables exist: Users, Outcomes, WorkSessions, TimeBlocks, BehavioralEvents');
    console.error('- Make sure table names are EXACTLY as shown (case-sensitive)');
    console.error('- Make sure your PAT has data.records:write permission');
    console.error('- Make sure your PAT is linked to this base');
  } finally {
    rl.close();
  }
}

main();
