import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, outcomeId, eventType, promptCount, notes, timestamp } = body;

    if (!sessionId || !outcomeId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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
            Notes: notes || '',
            // Store prompt count and event type in notes since fields don't exist
            ...(promptCount > 0 && {
              Notes: `${notes ? notes + '\n\n' : ''}Prompt Count: ${promptCount}`
            }),
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create behavioral event' },
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
    return NextResponse.json(
      { error: 'Internal server error' },
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
