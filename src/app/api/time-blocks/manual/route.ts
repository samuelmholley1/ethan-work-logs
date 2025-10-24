import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

export async function POST(request: NextRequest) {
  try {
    const { sessionId, startTime, endTime } = await request.json();

    if (!sessionId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for required env vars
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TIME_BLOCKS_TABLE_ID) {
      console.error('Missing Airtable environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Create time block in Airtable
    const records = await base(process.env.AIRTABLE_TIME_BLOCKS_TABLE_ID!).create([
      {
        fields: {
          Name: `${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}`,
          StartTime: new Date(startTime).toISOString(),
          EndTime: new Date(endTime).toISOString(),
          WorkSession: [sessionId], // Link to WorkSession record
        },
      },
    ]);

    return NextResponse.json({ timeBlockId: records[0].id });
  } catch (error) {
    console.error('Error creating manual time block:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('INVALID_PERMISSIONS')) {
        return NextResponse.json(
          { error: 'Permission denied. Check Airtable API key permissions.' },
          { status: 403 }
        );
      }
      if (error.message.includes('NOT_FOUND') || error.message.includes('INVALID_VALUE_FOR_COLUMN')) {
        return NextResponse.json(
          { error: 'Invalid session ID or table configuration.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create time block. Please try again.' },
      { status: 500 }
    );
  }
}
