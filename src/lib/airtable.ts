import Airtable from 'airtable'
import type {
  User,
  UserFields,
  Outcome,
  OutcomeFields,
  WorkSession,
  WorkSessionFields,
  TimeBlock,
  TimeBlockFields,
  BehavioralEvent,
  BehavioralEventFields,
} from '@/types/worklog'

// Initialize Airtable with API token
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT_TOKEN || 'placeholder_key',
})

const base = airtable.base(process.env.AIRTABLE_BASE_ID || 'placeholder_base')

// Table references
const usersTable = base('Users')
const outcomesTable = base('Outcomes')
const workSessionsTable = base('WorkSessions')
const timeBlocksTable = base('TimeBlocks')
const behavioralEventsTable = base('BehavioralEvents')

/**
 * WorkSessions table operations
 */

export async function createWorkSession(
  data: Omit<WorkSessionFields, 'SessionID' | 'CreatedAt'>
): Promise<WorkSession | null> {
  try {
    const record = await workSessionsTable.create([
      {
        fields: data,
      },
    ])

    return {
      id: record[0].id,
      sessionId: record[0].get('SessionID') as number,
      userId: (record[0].get('User') as string[])?.[0] || '',
      date: record[0].get('Date') as string,
      serviceType: record[0].get('ServiceType') as WorkSession['serviceType'],
      status: record[0].get('Status') as WorkSession['status'],
      createdAt: record[0].get('CreatedAt') as string,
    }
  } catch (error) {
    console.error('Error creating WorkSession:', error)
    return null
  }
}

export async function getWorkSession(id: string): Promise<WorkSession | null> {
  try {
    const record = await workSessionsTable.find(id)
    
    return {
      id: record.id,
      sessionId: record.get('SessionID') as number,
      userId: (record.get('User') as string[])?.[0] || '',
      date: record.get('Date') as string,
      serviceType: record.get('ServiceType') as WorkSession['serviceType'],
      status: record.get('Status') as WorkSession['status'],
      createdAt: record.get('CreatedAt') as string,
    }
  } catch (error) {
    console.error('Error fetching WorkSession:', error)
    return null
  }
}

export async function updateWorkSession(
  id: string,
  updates: Partial<WorkSessionFields>
): Promise<boolean> {
  try {
    await workSessionsTable.update([
      {
        id,
        fields: updates,
      },
    ])
    return true
  } catch (error) {
    console.error('Error updating WorkSession:', error)
    return false
  }
}

/**
 * TimeBlocks table operations
 */

export async function createTimeBlock(
  data: Omit<TimeBlockFields, 'BlockID' | 'ActualDuration' | 'RoundedStartTime' | 'RoundedEndTime' | 'BillableDuration' | 'BillableHours'>
): Promise<TimeBlock | null> {
  try {
    const record = await timeBlocksTable.create([
      {
        fields: data,
      },
    ])

    return {
      id: record[0].id,
      blockId: record[0].get('BlockID') as number,
      workSessionId: (record[0].get('WorkSession') as string[])[0],
      startTime: record[0].get('StartTime') as string,
      endTime: record[0].get('EndTime') as string | undefined,
    }
  } catch (error) {
    console.error('Error creating TimeBlock:', error)
    return null
  }
}

export async function updateTimeBlock(
  id: string,
  updates: Partial<TimeBlockFields>
): Promise<TimeBlock | null> {
  try {
    const records = await timeBlocksTable.update([
      {
        id,
        fields: updates,
      },
    ])

    const record = records[0]
    
    return {
      id: record.id,
      blockId: record.get('BlockID') as number,
      workSessionId: (record.get('WorkSession') as string[])[0],
      startTime: record.get('StartTime') as string,
      endTime: record.get('EndTime') as string | undefined,
      actualDuration: record.get('ActualDuration') as number | undefined,
      roundedStartTime: record.get('RoundedStartTime') as string | undefined,
      roundedEndTime: record.get('RoundedEndTime') as string | undefined,
      billableDuration: record.get('BillableDuration') as number | undefined,
      billableHours: record.get('BillableHours') as number | undefined,
    }
  } catch (error) {
    console.error('Error updating TimeBlock:', error)
    return null
  }
}

export async function getTimeBlock(id: string): Promise<TimeBlock | null> {
  try {
    const record = await timeBlocksTable.find(id)
    
    return {
      id: record.id,
      blockId: record.get('BlockID') as number,
      workSessionId: (record.get('WorkSession') as string[])[0],
      startTime: record.get('StartTime') as string,
      endTime: record.get('EndTime') as string | undefined,
      actualDuration: record.get('ActualDuration') as number | undefined,
      roundedStartTime: record.get('RoundedStartTime') as string | undefined,
      roundedEndTime: record.get('RoundedEndTime') as string | undefined,
      billableDuration: record.get('BillableDuration') as number | undefined,
      billableHours: record.get('BillableHours') as number | undefined,
    }
  } catch (error) {
    console.error('Error fetching TimeBlock:', error)
    return null
  }
}

/**
 * BehavioralEvents table operations
 */

export async function createBehavioralEvent(
  data: Omit<BehavioralEventFields, 'EventID' | 'Date'>
): Promise<BehavioralEvent | null> {
  try {
    const record = await behavioralEventsTable.create([
      {
        fields: data,
      },
    ])

    return {
      id: record[0].id,
      eventId: record[0].get('EventID') as number,
      workSessionId: (record[0].get('WorkSession') as string[])[0],
      outcomeId: (record[0].get('Outcome') as string[])?.[0] || '',
      timestamp: record[0].get('Timestamp') as string,
      eventType: record[0].get('EventType') as BehavioralEvent['eventType'],
      promptCount: record[0].get('PromptCount') as number | undefined,
      comment: record[0].get('Comment') as string | undefined,
      date: record[0].get('Date') as string | undefined,
    }
  } catch (error) {
    console.error('Error creating BehavioralEvent:', error)
    return null
  }
}

export async function updateBehavioralEvent(
  id: string,
  updates: Partial<BehavioralEventFields>
): Promise<boolean> {
  try {
    await behavioralEventsTable.update([
      {
        id,
        fields: updates,
      },
    ])
    return true
  } catch (error) {
    console.error('Error updating BehavioralEvent:', error)
    return false
  }
}

/**
 * Query operations for summaries and reports
 */

export async function getTimeBlocksByDateRange(
  startDate: string,
  endDate: string
): Promise<TimeBlock[]> {
  try {
    const records = await timeBlocksTable
      .select({
        filterByFormula: `AND(
          IS_AFTER({StartTime}, '${startDate}'),
          IS_BEFORE({StartTime}, '${endDate}')
        )`,
      })
      .all()

    return records.map((record) => ({
      id: record.id,
      blockId: record.get('BlockID') as number,
      workSessionId: (record.get('WorkSession') as string[])[0],
      startTime: record.get('StartTime') as string,
      endTime: record.get('EndTime') as string | undefined,
      actualDuration: record.get('ActualDuration') as number | undefined,
      roundedStartTime: record.get('RoundedStartTime') as string | undefined,
      roundedEndTime: record.get('RoundedEndTime') as string | undefined,
      billableDuration: record.get('BillableDuration') as number | undefined,
      billableHours: record.get('BillableHours') as number | undefined,
    }))
  } catch (error) {
    console.error('Error fetching TimeBlocks:', error)
    return []
  }
}

export async function getBehavioralEventsByDate(
  date: string
): Promise<BehavioralEvent[]> {
  try {
    const records = await behavioralEventsTable
      .select({
        filterByFormula: `{Date} = '${date}'`,
      })
      .all()

    return records.map((record) => ({
      id: record.id,
      eventId: record.get('EventID') as number,
      workSessionId: (record.get('WorkSession') as string[])[0],
      outcomeId: (record.get('Outcome') as string[])?.[0] || '',
      timestamp: record.get('Timestamp') as string,
      eventType: record.get('EventType') as BehavioralEvent['eventType'],
      promptCount: record.get('PromptCount') as number | undefined,
      comment: record.get('Comment') as string | undefined,
      date: record.get('Date') as string | undefined,
    }))
  } catch (error) {
    console.error('Error fetching BehavioralEvents:', error)
    return []
  }
}

/**
 * Users table operations
 */

export async function getUsers(): Promise<User[]> {
  try {
    const records = await usersTable.select().all()
    
    return records.map((record: any, index: number) => ({
      id: record.id,
      userId: record.get('UserID') as number | undefined || index + 1,
      name: record.get('Name') as string || 'Unnamed User',
      email: record.get('Email') as string || `user${index + 1}@example.com`,
      role: record.get('Role') as User['role'] || 'Caregiver',
      createdAt: record.get('CreatedAt') as string | undefined,
    }))
  } catch (error) {
    console.error('Error fetching Users:', error)
    return []
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const record = await usersTable.find(id)
    
    return {
      id: record.id,
      userId: record.get('UserID') as number | undefined || 0,
      name: record.get('Name') as string || 'Unnamed User',
      email: record.get('Email') as string || 'user@example.com',
      role: record.get('Role') as User['role'] || 'Caregiver',
      createdAt: record.get('CreatedAt') as string | undefined,
    }
  } catch (error) {
    console.error('Error fetching User:', error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const records = await usersTable
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1,
      })
      .all()

    if (records.length === 0) return null

    const record = records[0]
    return {
      id: record.id,
      userId: record.get('UserID') as number | undefined || 0,
      name: record.get('Name') as string || 'Unnamed User',
      email: record.get('Email') as string || 'user@example.com',
      role: record.get('Role') as User['role'] || 'Caregiver',
      createdAt: record.get('CreatedAt') as string | undefined,
    }
  } catch (error) {
    console.error('Error fetching User by email:', error)
    return null
  }
}

/**
 * Outcomes table operations
 */

export async function getOutcomes(serviceType?: 'CLS' | 'Supported Employment'): Promise<Outcome[]> {
  try {
    const selectOptions = serviceType
      ? { filterByFormula: `{ServiceType} = '${serviceType}'`, sort: [{ field: 'Order', direction: 'asc' as const }] }
      : { sort: [{ field: 'Name', direction: 'asc' as const }] }

    const records = await outcomesTable.select(selectOptions).all()
    
    return records.map((record: any, index: number) => ({
      id: record.id,
      outcomeId: record.get('OutcomeID') as number | undefined || index + 1,
      title: record.get('Title') as string || record.get('Name') as string || 'Unnamed Outcome',
      description: record.get('Description') as string || record.get('Name') as string || '',
      serviceType: record.get('ServiceType') as Outcome['serviceType'] || serviceType || 'CLS',
      order: record.get('Order') as number | undefined || index + 1,
    }))
  } catch (error) {
    console.error('Error fetching Outcomes:', error)
    return []
  }
}

export async function getOutcome(id: string): Promise<Outcome | null> {
  try {
    const record = await outcomesTable.find(id)
    
    return {
      id: record.id,
      outcomeId: record.get('OutcomeID') as number | undefined || 0,
      title: record.get('Title') as string || record.get('Name') as string || 'Unnamed Outcome',
      description: record.get('Description') as string || record.get('Name') as string || '',
      serviceType: record.get('ServiceType') as Outcome['serviceType'] || 'CLS',
      order: record.get('Order') as number | undefined || 0,
    }
  } catch (error) {
    console.error('Error fetching Outcome:', error)
    return null
  }
}

// Export table references for direct access if needed
export { usersTable, outcomesTable, workSessionsTable, timeBlocksTable, behavioralEventsTable }
