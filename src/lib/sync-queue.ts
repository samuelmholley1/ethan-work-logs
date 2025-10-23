import { db, type LocalWorkSession, type LocalTimeBlock, type LocalBehavioralEvent } from './offline-db'
import {
  createWorkSession,
  createTimeBlock,
  updateTimeBlock,
  createBehavioralEvent,
} from './airtable'

/**
 * Sync Queue System
 * 
 * Handles background synchronization of local data to Airtable
 * Implements retry logic and error handling
 */

let isSyncing = false
let syncInterval: NodeJS.Timeout | null = null

/**
 * Sync all pending work sessions to Airtable
 */
async function syncWorkSessions(): Promise<{ success: number; failed: number }> {
  const pendingSessions = await db.workSessions
    .where('syncStatus')
    .equals('pending')
    .toArray()

  let successCount = 0
  let failedCount = 0

  for (const session of pendingSessions) {
    try {
      const result = await createWorkSession({
        User: [session.userId],
        Date: session.date,
        ServiceType: session.serviceType,
        Status: session.status,
      })

      if (result) {
        await db.workSessions.update(session.id, {
          syncStatus: 'synced',
          airtableId: result.id,
          syncError: undefined,
        })
        successCount++
      } else {
        throw new Error('Failed to create session in Airtable')
      }
    } catch (error) {
      console.error('Error syncing WorkSession:', error)
      await db.workSessions.update(session.id, {
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error',
      })
      failedCount++
    }
  }

  return { success: successCount, failed: failedCount }
}

/**
 * Sync all pending time blocks to Airtable
 */
async function syncTimeBlocks(): Promise<{ success: number; failed: number }> {
  const pendingBlocks = await db.timeBlocks
    .where('syncStatus')
    .equals('pending')
    .toArray()

  let successCount = 0
  let failedCount = 0

  for (const block of pendingBlocks) {
    try {
      // Get the session to find its Airtable ID
      const session = await db.workSessions.get(block.workSessionId)
      if (!session?.airtableId) {
        // Session not synced yet, skip for now
        continue
      }

      if (block.airtableId && block.endTime) {
        // Block exists in Airtable, just update endTime
        const result = await updateTimeBlock(block.airtableId, {
          EndTime: block.endTime,
        })

        if (result) {
          await db.timeBlocks.update(block.id, {
            syncStatus: 'synced',
            syncError: undefined,
          })
          successCount++
        } else {
          throw new Error('Failed to update time block in Airtable')
        }
      } else {
        // Create new block
        const result = await createTimeBlock({
          WorkSession: [session.airtableId],
          StartTime: block.startTime,
          EndTime: block.endTime || undefined,
        })

        if (result) {
          await db.timeBlocks.update(block.id, {
            syncStatus: 'synced',
            airtableId: result.id,
            syncError: undefined,
          })
          successCount++
        } else {
          throw new Error('Failed to create time block in Airtable')
        }
      }
    } catch (error) {
      console.error('Error syncing TimeBlock:', error)
      await db.timeBlocks.update(block.id, {
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error',
      })
      failedCount++
    }
  }

  return { success: successCount, failed: failedCount }
}

/**
 * Sync all pending behavioral events to Airtable
 */
async function syncBehavioralEvents(): Promise<{ success: number; failed: number }> {
  const pendingEvents = await db.behavioralEvents
    .where('syncStatus')
    .equals('pending')
    .toArray()

  let successCount = 0
  let failedCount = 0

  for (const event of pendingEvents) {
    try {
      // Get the session to find its Airtable ID
      const session = await db.workSessions.get(event.workSessionId)
      if (!session?.airtableId) {
        // Session not synced yet, skip for now
        continue
      }

      const result = await createBehavioralEvent({
        WorkSession: [session.airtableId],
        Outcome: [event.outcomeId],
        Timestamp: event.timestamp,
        EventType: event.eventType,
        PromptCount: event.promptCount ?? undefined,
        Comment: event.comment || undefined,
      })

      if (result) {
        await db.behavioralEvents.update(event.id, {
          syncStatus: 'synced',
          airtableId: result.id,
          syncError: undefined,
        })
        successCount++
      } else {
        throw new Error('Failed to create behavioral event in Airtable')
      }
    } catch (error) {
      console.error('Error syncing BehavioralEvent:', error)
      await db.behavioralEvents.update(event.id, {
        syncStatus: 'error',
        syncError: error instanceof Error ? error.message : 'Unknown error',
      })
      failedCount++
    }
  }

  return { success: successCount, failed: failedCount }
}

/**
 * Main sync function - syncs all pending data
 */
export async function syncPendingData(): Promise<{
  success: boolean
  totalSynced: number
  totalFailed: number
  details: {
    workSessions: { success: number; failed: number }
    timeBlocks: { success: number; failed: number }
    behavioralEvents: { success: number; failed: number }
  }
}> {
  if (isSyncing) {
    console.log('Sync already in progress, skipping')
    return {
      success: false,
      totalSynced: 0,
      totalFailed: 0,
      details: {
        workSessions: { success: 0, failed: 0 },
        timeBlocks: { success: 0, failed: 0 },
        behavioralEvents: { success: 0, failed: 0 },
      },
    }
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log('Device is offline, skipping sync')
    return {
      success: false,
      totalSynced: 0,
      totalFailed: 0,
      details: {
        workSessions: { success: 0, failed: 0 },
        timeBlocks: { success: 0, failed: 0 },
        behavioralEvents: { success: 0, failed: 0 },
      },
    }
  }

  isSyncing = true

  try {
    // Sync in order: sessions first, then blocks and events
    const sessionsResult = await syncWorkSessions()
    const blocksResult = await syncTimeBlocks()
    const eventsResult = await syncBehavioralEvents()

    const totalSynced = sessionsResult.success + blocksResult.success + eventsResult.success
    const totalFailed = sessionsResult.failed + blocksResult.failed + eventsResult.failed

    console.log(`Sync complete: ${totalSynced} synced, ${totalFailed} failed`)

    // Update last sync time if successful
    if (totalSynced > 0 && typeof window !== 'undefined') {
      localStorage.setItem('lastSyncTime', new Date().toISOString())
    }

    return {
      success: true,
      totalSynced,
      totalFailed,
      details: {
        workSessions: sessionsResult,
        timeBlocks: blocksResult,
        behavioralEvents: eventsResult,
      },
    }
  } catch (error) {
    console.error('Sync error:', error)
    return {
      success: false,
      totalSynced: 0,
      totalFailed: 0,
      details: {
        workSessions: { success: 0, failed: 0 },
        timeBlocks: { success: 0, failed: 0 },
        behavioralEvents: { success: 0, failed: 0 },
      },
    }
  } finally {
    isSyncing = false
  }
}

/**
 * Start automatic background sync (every 30 seconds)
 */
export function startAutoSync() {
  if (syncInterval) {
    console.log('Auto-sync already running')
    return
  }

  console.log('Starting auto-sync (every 30 seconds)')

  // Initial sync
  syncPendingData().catch(console.error)

  // Set up interval
  syncInterval = setInterval(() => {
    if (typeof window !== 'undefined' && navigator.onLine) {
      syncPendingData().catch(console.error)
    }
  }, 30000) // Every 30 seconds

  // Sync when coming back online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('Device back online, triggering sync')
      syncPendingData().catch(console.error)
    })
  }
}

/**
 * Stop automatic background sync
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    console.log('Auto-sync stopped')
  }
}

/**
 * Retry all failed syncs
 */
export async function retryFailedSync(): Promise<void> {
  // Change all 'error' status back to 'pending'
  const [failedSessions, failedBlocks, failedEvents] = await Promise.all([
    db.workSessions.where('syncStatus').equals('error').toArray(),
    db.timeBlocks.where('syncStatus').equals('error').toArray(),
    db.behavioralEvents.where('syncStatus').equals('error').toArray(),
  ])

  await Promise.all([
    ...failedSessions.map((s) => db.workSessions.update(s.id, { syncStatus: 'pending' })),
    ...failedBlocks.map((b) => db.timeBlocks.update(b.id, { syncStatus: 'pending' })),
    ...failedEvents.map((e) => db.behavioralEvents.update(e.id, { syncStatus: 'pending' })),
  ])

  console.log(`Retrying ${failedSessions.length + failedBlocks.length + failedEvents.length} failed items`)

  // Trigger sync
  await syncPendingData()
}

/**
 * Check if there's pending data to sync
 */
export async function hasPendingData(): Promise<boolean> {
  const [pendingSessions, pendingBlocks, pendingEvents] = await Promise.all([
    db.workSessions.where('syncStatus').equals('pending').count(),
    db.timeBlocks.where('syncStatus').equals('pending').count(),
    db.behavioralEvents.where('syncStatus').equals('pending').count(),
  ])

  return pendingSessions + pendingBlocks + pendingEvents > 0
}

// Auto-start sync on import (client-side only)
if (typeof window !== 'undefined') {
  startAutoSync()
}
