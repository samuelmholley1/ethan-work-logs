import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

export async function POST(request: NextRequest) {
  try {
    const { date, serviceType, userId } = await request.json();

    if (!date || !serviceType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for required env vars
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_WORKSESSIONS_TABLE_ID) {
      console.error('Missing Airtable environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Create work session in Airtable with 30s timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout: Airtable is taking too long to respond')), 30000)
    );
    
    const createPromise = base(process.env.AIRTABLE_WORKSESSIONS_TABLE_ID!).create([
      {
        fields: {
          Name: `${serviceType} - ${new Date(date).toLocaleDateString()}`,
          Date: new Date(date).toISOString().split('T')[0],
          ServiceType: serviceType,
          User: [userId], // Link to User record
          Status: 'Completed',
        },
      },
    ]);
    
    const records = await Promise.race([createPromise, timeoutPromise]) as any[];

    return NextResponse.json({ sessionId: records[0].id });
  } catch (error) {
    console.error('Error creating manual session:', error);
    
    // Handle specific Airtable errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout. Airtable is taking too long to respond. Please check your connection and try again.' },
          { status: 504 }
        );
      }
      if (error.message.includes('INVALID_PERMISSIONS')) {
        return NextResponse.json(
          { error: 'Permission denied. Check Airtable API key permissions.' },
          { status: 403 }
        );
      }
      if (error.message.includes('NOT_FOUND') || error.message.includes('INVALID_VALUE_FOR_COLUMN')) {
        return NextResponse.json(
          { error: 'Invalid user ID or table configuration.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create session. Please try again.' },
      { status: 500 }
    );
  }
}
