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

    // Create work session in Airtable
    const records = await base(process.env.AIRTABLE_WORK_SESSIONS_TABLE_ID!).create([
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

    return NextResponse.json({ sessionId: records[0].id });
  } catch (error) {
    console.error('Error creating manual session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
