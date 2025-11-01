import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, outcomeId, eventType, promptCount, notes, timestamp } = body;

    // Validate required fields
    if (!sessionId || !outcomeId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, outcomeId, and eventType are required' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['VP', 'PP', 'I', 'M', 'U', 'NA', 'R'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate prompt count
    const validPromptCount = typeof promptCount === 'number' && promptCount >= 0;
    if (promptCount !== undefined && !validPromptCount) {
      return NextResponse.json(
        { error: 'Prompt count must be a non-negative number' },
        { status: 400 }
      );
    }

    // Build notes with prompt count if provided
    let finalNotes = notes?.trim() || '';
    if (promptCount > 0) {
      const promptInfo = `Prompt Count: ${promptCount}`;
      finalNotes = finalNotes ? `${finalNotes}\n\n${promptInfo}` : promptInfo;
    }

    // Create behavioral event in Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_BEHAVIORALEVENTS_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Name: `${eventType} Event`,
            WorkSessions: [sessionId],
            Outcomes: [outcomeId],
            Timestamp: timestamp || new Date().toISOString(),
            Notes: finalNotes,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Airtable API error:', errorData);
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create behavioral event' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      event: {
        id: data.id,
        ...data.fields,
      },
    });
  } catch (error) {
    console.error('Error creating behavioral event:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    let filterFormula = '';
    
    if (sessionId) {
      filterFormula = `FIND("${sessionId}", ARRAYJOIN({WorkSessions}))`;
    } else if (date) {
      // Filter by date - check if timestamp starts with date
      filterFormula = `FIND("${date}", {Timestamp}) = 1`;
    }

    const url = new URL(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_BEHAVIORALEVENTS_TABLE_ID}`
    );
    
    if (filterFormula) {
      url.searchParams.set('filterByFormula', filterFormula);
    }
    url.searchParams.set('sort[0][field]', 'Timestamp');
    url.searchParams.set('sort[0][direction]', 'desc');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch behavioral events' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const events = data.records.map((record: any) => ({
      id: record.id,
      eventType: record.fields.Name || '',
      timestamp: record.fields.Timestamp || '',
      notes: record.fields.Notes || '',
      sessionId: record.fields.WorkSessions?.[0] || '',
      outcomeId: record.fields.Outcomes?.[0] || '',
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching behavioral events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
