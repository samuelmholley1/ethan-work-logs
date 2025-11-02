import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

/**
 * GET /api/sessions?userId=xxx&date=YYYY-MM-DD
 * Fetch active session for a user on a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_WORKSESSIONS_TABLE_ID || !process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID) {
      console.error('Missing Airtable environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Fetch active session for this user today
    const sessionUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_WORKSESSIONS_TABLE_ID}`;
    const filterFormula = `AND({Date} = '${date}', {Status} = 'Active', SEARCH('${userId}', ARRAYJOIN({User})) > 0)`;
    
    const sessionResponse = await fetch(`${sessionUrl}?filterByFormula=${encodeURIComponent(filterFormula)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    if (!sessionResponse.ok) {
      throw new Error(`Airtable API error: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    
    if (!sessionData.records || sessionData.records.length === 0) {
      // No active session
      return NextResponse.json({ session: null });
    }

    const session = sessionData.records[0];
    
    // Fetch time blocks for this session
    const timeBlockUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TIMEBLOCKS_TABLE_ID}`;
    
    const timeBlockResponse = await fetch(timeBlockUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    let activeTimeBlockId = null;
    if (timeBlockResponse.ok) {
      const timeBlockData = await timeBlockResponse.json();
      const allBlocks = timeBlockData.records || [];
      
      // Find blocks linked to this session without endTime
      const activeBlock = allBlocks.find((record: any) => {
        const sessionLinks = record.fields.WorkSessions || [];
        return sessionLinks.includes(session.id) && !record.fields.EndTime;
      });
      
      if (activeBlock) {
        activeTimeBlockId = activeBlock.id;
      }
    }

    return NextResponse.json({
      session: {
        id: session.id,
        serviceType: session.fields.ServiceType,
        date: session.fields.Date,
        status: session.fields.Status,
        activeTimeBlockId,
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * Create a new work session (for clock in)
 */
export async function POST(request: NextRequest) {
  try {
    const { date, serviceType, userId, status = 'Active' } = await request.json();

    if (!date || !serviceType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: date, serviceType, userId' },
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

    // CRITICAL: Check for existing active session for this user today
    // Prevents double clock-in
    try {
      const checkUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_WORKSESSIONS_TABLE_ID}`;
      const filterFormula = `AND({Date} = '${new Date(date).toISOString().split('T')[0]}', {Status} = 'Active', SEARCH('${userId}', ARRAYJOIN({User})) > 0)`;
      
      const checkResponse = await fetch(`${checkUrl}?filterByFormula=${encodeURIComponent(filterFormula)}`, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.records && checkData.records.length > 0) {
          return NextResponse.json(
            { error: 'You already have an active session today. Please clock out first.' },
            { status: 409 } // Conflict
          );
        }
      }
    } catch (checkError) {
      console.warn('Error checking for duplicate session:', checkError);
      // Continue with creation - better to allow than block on check failure
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
          Status: status,
        },
      },
    ]);
    
    const records = await Promise.race([createPromise, timeoutPromise]) as any[];

    return NextResponse.json({ 
      sessionId: records[0].id,
      date: records[0].fields.Date,
      serviceType: records[0].fields.ServiceType,
      status: records[0].fields.Status
    });
  } catch (error) {
    console.error('Error creating session:', error);
    
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

/**
 * PATCH /api/sessions/:id
 * Update session status (for clock out)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, status } = await request.json();

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, status' },
        { status: 400 }
      );
    }

    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_WORKSESSIONS_TABLE_ID) {
      console.error('Missing Airtable environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout: Airtable is taking too long to respond')), 30000)
    );

    const updatePromise = base(process.env.AIRTABLE_WORKSESSIONS_TABLE_ID!).update([
      {
        id: sessionId,
        fields: {
          Status: status,
        },
      },
    ]);

    const records = await Promise.race([updatePromise, timeoutPromise]) as any[];

    return NextResponse.json({
      sessionId: records[0].id,
      status: records[0].fields.Status
    });
  } catch (error) {
    console.error('Error updating session:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout. Airtable is taking too long to respond.' },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update session. Please try again.' },
      { status: 500 }
    );
  }
}
