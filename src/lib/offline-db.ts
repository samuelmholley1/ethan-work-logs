import Dexie, { Table } from 'dexie'

/**
 * Local database schema for offline-first functionality
 * All data is written here first, then synced to Airtable when online
 */

export type SyncStatus = 'pending' | 'synced' | 'error'

export interface LocalWorkSession {
  id: string // UUID
  userId: string // Link to user
  date: string // ISO date string (YYYY-MM-DD)
  serviceType: 'CLS' | 'Supported Employment'
  status: 'Active' | 'Completed'
  createdAt: string // ISO datetime
  syncStatus: SyncStatus
  airtableId?: string // Set after successful sync
  syncError?: string // Error message if sync failed
}

export interface LocalTimeBlock {
  id: string // UUID
  workSessionId: string // Link to local WorkSession
  startTime: string // ISO datetime
  endTime?: string | null // ISO datetime (null if timer running)
  syncStatus: SyncStatus
  airtableId?: string
  syncError?: string
}

export interface LocalBehavioralEvent {
  id: string // UUID
  workSessionId: string // Link to local WorkSession
  outcomeId: string // Link to Outcome (from Airtable)
  timestamp: string // ISO datetime
  eventType: 'VP' | 'PP' | 'I' | 'U'
  promptCount?: number | null
  comment?: string | null
  syncStatus: SyncStatus
  airtableId?: string
  syncError?: string
}

/**
 * Cached data from Airtable (read-only)
 * These are fetched when online and cached for offline use
 */

export interface CachedUser {
  id: string // Airtable record ID
  name: string
  email: string
  role: 'Caregiver' | 'Admin'
  lastSynced: string // ISO datetime
}

export interface CachedOutcome {
  id: string // Airtable record ID
  title: string
  description: string
  serviceType: 'CLS' | 'Supported Employment'
  order: number
  lastSynced: string
}

/**
 * Dexie database class
 */
class OfflineDatabase extends Dexie {
  // Local data (will be synced)
  workSessions!: Table<LocalWorkSession>
  timeBlocks!: Table<LocalTimeBlock>
  behavioralEvents!: Table<LocalBehavioralEvent>
  
  // Cached reference data (read-only)
  cachedUsers!: Table<CachedUser>
  cachedOutcomes!: Table<CachedOutcome>

  constructor() {
    super('EthanWorkLogsDB')
    
    this.version(1).stores({
      // Local data with sync tracking
      workSessions: 'id, date, userId, syncStatus, airtableId',
      timeBlocks: 'id, workSessionId, startTime, syncStatus, airtableId',
      behavioralEvents: 'id, workSessionId, outcomeId, timestamp, syncStatus, airtableId',
      
      // Cached reference data
      cachedUsers: 'id, email',
      cachedOutcomes: 'id, serviceType, order'
    })
  }
}

export const db = new OfflineDatabase()

/**
 * Helper functions for common operations
 */

/**
 * Get all pending items that need to be synced
 */
export async function getPendingSync() {
  const [sessions, blocks, events] = await Promise.all([
    db.workSessions.where('syncStatus').equals('pending').toArray(),
    db.timeBlocks.where('syncStatus').equals('pending').toArray(),
    db.behavioralEvents.where('syncStatus').equals('pending').toArray()
  ])

  return {
    workSessions: sessions,
    timeBlocks: blocks,
    behavioralEvents: events,
    totalPending: sessions.length + blocks.length + events.length
  }
}

/**
 * Get items that failed to sync
 */
export async function getFailedSync() {
  const [sessions, blocks, events] = await Promise.all([
    db.workSessions.where('syncStatus').equals('error').toArray(),
    db.timeBlocks.where('syncStatus').equals('error').toArray(),
    db.behavioralEvents.where('syncStatus').equals('error').toArray()
  ])

  return {
    workSessions: sessions,
    timeBlocks: blocks,
    behavioralEvents: events,
    totalFailed: sessions.length + blocks.length + events.length
  }
}

/**
 * Clear all local data (use with caution!)
 */
export async function clearAllLocalData() {
  await Promise.all([
    db.workSessions.clear(),
    db.timeBlocks.clear(),
    db.behavioralEvents.clear()
  ])
}

/**
 * Clear cached reference data (will be refetched next time online)
 */
export async function clearCachedData() {
  await Promise.all([
    db.cachedUsers.clear(),
    db.cachedOutcomes.clear()
  ])
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [
    totalSessions,
    totalBlocks,
    totalEvents,
    pendingCount,
    failedCount,
    cachedUserCount,
    cachedOutcomeCount
  ] = await Promise.all([
    db.workSessions.count(),
    db.timeBlocks.count(),
    db.behavioralEvents.count(),
    (await getPendingSync()).totalPending,
    (await getFailedSync()).totalFailed,
    db.cachedUsers.count(),
    db.cachedOutcomes.count()
  ])

  return {
    local: {
      workSessions: totalSessions,
      timeBlocks: totalBlocks,
      behavioralEvents: totalEvents
    },
    sync: {
      pending: pendingCount,
      failed: failedCount,
      synced: totalSessions + totalBlocks + totalEvents - pendingCount - failedCount
    },
    cache: {
      users: cachedUserCount,
      outcomes: cachedOutcomeCount
    }
  }
}

/**
 * Export all data as JSON (for debugging or manual backup)
 */
export async function exportAllData() {
  const [sessions, blocks, events, users, outcomes] = await Promise.all([
    db.workSessions.toArray(),
    db.timeBlocks.toArray(),
    db.behavioralEvents.toArray(),
    db.cachedUsers.toArray(),
    db.cachedOutcomes.toArray()
  ])

  return {
    exportedAt: new Date().toISOString(),
    workSessions: sessions,
    timeBlocks: blocks,
    behavioralEvents: events,
    cachedUsers: users,
    cachedOutcomes: outcomes
  }
}
