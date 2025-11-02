import { NextRequest, NextResponse } from 'next/server';

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_ID = process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID!;
const API_KEY = process.env.AIRTABLE_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, startTime, endTime } = body;

    if (!sessionId || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, startTime' },
        { status: 400 }
      );
    }

    // Validate start time
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for startTime' },
        { status: 400 }
      );
    }

    // Validate end time if provided
    if (endTime) {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format for endTime' },
          { status: 400 }
        );
      }
      if (end <= start) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }
    }

    // CRITICAL: Verify session exists and is Active
    try {
      const sessionUrl = `https://api.airtable.com/v0/${BASE_ID}/${process.env.AIRTABLE_WORKSESSIONS_TABLE_ID}/${sessionId}`;
      const sessionResponse = await fetch(sessionUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      if (!sessionResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid session ID. Please clock in first.' },
          { status: 404 }
        );
      }

      const sessionData = await sessionResponse.json();
      if (sessionData.fields.Status !== 'Active') {
        return NextResponse.json(
          { error: 'Session is not active. Please clock in again.' },
          { status: 400 }
        );
      }
    } catch (sessionError) {
      console.error('Error validating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to validate session. Please try again.' },
        { status: 500 }
      );
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

    const fields: any = {
      WorkSessions: [sessionId],
      StartTime: startTime,
    };

    // Only include EndTime if provided
    if (endTime) {
      fields.EndTime = endTime;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
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
}export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeBlockId, endTime } = body;

    if (!timeBlockId || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: timeBlockId, endTime' },
        { status: 400 }
      );
    }

    // Validate end time
    const end = new Date(endTime);
    if (isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for endTime' },
        { status: 400 }
      );
    }

    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${timeBlockId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          EndTime: endTime,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Time Blocks API] Update failed:', error);
      return NextResponse.json(
        { error: 'Failed to update time block' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Time Blocks API] Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
