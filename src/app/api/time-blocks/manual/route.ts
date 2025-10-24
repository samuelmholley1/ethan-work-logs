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
    return NextResponse.json(
      { error: 'Failed to create time block' },
      { status: 500 }
    );
  }
}
