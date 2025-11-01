import { NextRequest, NextResponse } from 'next/server';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_ID = process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, startTime, endTime } = body;

    if (!sessionId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, startTime, endTime' },
        { status: 400 }
      );
    }

    // Validate times
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startTime or endTime' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          WorkSessions: [sessionId],
          StartTime: startTime,
          EndTime: endTime,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Time Blocks API] Create failed:', error);
      return NextResponse.json(
        { error: 'Failed to create time block' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Time Blocks API] Create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
