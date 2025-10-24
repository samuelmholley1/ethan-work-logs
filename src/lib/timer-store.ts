import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { db } from './offline-db'

/**
 * Timer Store using Zustand
 * 
 * Manages active work session state with localStorage persistence
 * Handles clock in/out, time blocks, and behavioral events
 */

type ServiceType = 'CLS' | 'Supported Employment'

interface TimeBlock {
  id: string
  startTime: string
  endTime: string | null
}

interface TimerState {
  // Session State
  activeSessionId: string | null
  activeSessionDate: string | null
  activeServiceType: ServiceType | null
  userId: string
  
  // Time Block State
  activeTimeBlockId: string | null
  timeBlockStartTime: string | null
  
  // Timer State
  elapsedSeconds: number
  lastUpdateTime: number | null
  
  // Actions
  clockIn: (serviceType: ServiceType, userId: string) => Promise<void>
  clockOut: () => Promise<void>
  startTimeBlock: () => Promise<void>
  stopTimeBlock: () => Promise<void>
  
  // Behavioral Events
  logBehavioralEvent: (
    outcomeId: string,
    eventType: 'VP' | 'PP' | 'I' | 'U',
    promptCount: number,
    comment?: string
  ) => Promise<void>
  
  // Helpers
  updateElapsedTime: () => void
  reset: () => void
  isActive: () => boolean
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Initial State
      activeSessionId: null,
      activeSessionDate: null,
      activeServiceType: null,
      userId: 'default-user', // Will be replaced with actual user ID
      activeTimeBlockId: null,
      timeBlockStartTime: null,
      elapsedSeconds: 0,
      lastUpdateTime: null,

      // Clock In - Creates new work session
      clockIn: async (serviceType: ServiceType, userId: string) => {
        const state = get()
        
        // Prevent double clock-in (check again in case of race condition)
        if (state.activeSessionId) {
          console.warn('Already clocked in - race condition prevented')
          throw new Error('Already clocked in. Please clock out first.')
        }

        // Validate inputs
        if (!serviceType || !userId) {
          throw new Error('Service type and user ID are required')
        }

        // Validate service type
        const validServiceTypes: ServiceType[] = ['CLS', 'Supported Employment']
        if (!validServiceTypes.includes(serviceType)) {
          throw new Error(`Invalid service type: ${serviceType}`)
        }

        const sessionId = uuidv4()
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD

        try {
          // Create session in local DB
          await db.workSessions.add({
            id: sessionId,
            userId: userId,
            date: dateStr,
            serviceType: serviceType,
            status: 'Active',
            createdAt: now.toISOString(),
            syncStatus: 'pending',
          })

          // Automatically start first time block
          const timeBlockId = uuidv4()
          await db.timeBlocks.add({
            id: timeBlockId,
            workSessionId: sessionId,
            startTime: now.toISOString(),
            endTime: null,
            syncStatus: 'pending',
          })

          set({
            activeSessionId: sessionId,
            activeSessionDate: dateStr,
            activeServiceType: serviceType,
            userId: userId,
            activeTimeBlockId: timeBlockId,
            timeBlockStartTime: now.toISOString(),
            elapsedSeconds: 0,
            lastUpdateTime: Date.now(),
          })

          console.log('Clocked in:', { sessionId, serviceType, userId })
        } catch (error) {
          console.error('Error clocking in:', error)
          throw error
        }
      },

      // Clock Out - Ends session and final time block
      clockOut: async () => {
        const state = get()

        if (!state.activeSessionId) {
          console.warn('Not clocked in')
          throw new Error('Not clocked in')
        }

        const now = new Date()

        // Check for suspiciously long sessions (> 16 hours)
        if (state.elapsedSeconds > 16 * 60 * 60) {
          const hours = Math.floor(state.elapsedSeconds / 3600)
          console.warn(`Session is ${hours} hours long - possible forgotten clock-out`)
        }

        try {
          // Close active time block if exists
          if (state.activeTimeBlockId) {
            await db.timeBlocks.update(state.activeTimeBlockId, {
              endTime: now.toISOString(),
              syncStatus: 'pending',
            })
          }

          // Update session status
          await db.workSessions.update(state.activeSessionId, {
            status: 'Completed',
            syncStatus: 'pending',
          })

          // Reset state
          set({
            activeSessionId: null,
            activeSessionDate: null,
            activeServiceType: null,
            activeTimeBlockId: null,
            timeBlockStartTime: null,
            elapsedSeconds: 0,
            lastUpdateTime: null,
          })

          console.log('Clocked out')
        } catch (error) {
          console.error('Error clocking out:', error)
          throw error
        }
      },

      // Start Time Block - For resuming after breaks
      startTimeBlock: async () => {
        const state = get()

        if (!state.activeSessionId) {
          console.warn('No active session')
          return
        }

        if (state.activeTimeBlockId) {
          console.warn('Time block already active')
          return
        }

        const timeBlockId = uuidv4()
        const now = new Date()

        try {
          await db.timeBlocks.add({
            id: timeBlockId,
            workSessionId: state.activeSessionId,
            startTime: now.toISOString(),
            endTime: null,
            syncStatus: 'pending',
          })

          set({
            activeTimeBlockId: timeBlockId,
            timeBlockStartTime: now.toISOString(),
            lastUpdateTime: Date.now(),
          })

          console.log('Time block started:', timeBlockId)
        } catch (error) {
          console.error('Error starting time block:', error)
          throw error
        }
      },

      // Stop Time Block - For break periods
      stopTimeBlock: async () => {
        const state = get()

        if (!state.activeTimeBlockId) {
          console.warn('No active time block')
          return
        }

        const now = new Date()

        try {
          await db.timeBlocks.update(state.activeTimeBlockId, {
            endTime: now.toISOString(),
            syncStatus: 'pending',
          })

          set({
            activeTimeBlockId: null,
            timeBlockStartTime: null,
            lastUpdateTime: null,
          })

          console.log('Time block stopped')
        } catch (error) {
          console.error('Error stopping time block:', error)
          throw error
        }
      },

      // Log Behavioral Event
      logBehavioralEvent: async (
        outcomeId: string,
        eventType: 'VP' | 'PP' | 'I' | 'U',
        promptCount: number,
        comment?: string
      ) => {
        const state = get()

        if (!state.activeSessionId) {
          console.warn('No active session')
          return
        }

        // Sanitize comment to prevent XSS
        const sanitizedComment = comment
          ? comment
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#x27;')
              .replace(/\//g, '&#x2F;')
              .substring(0, 500) // Enforce max length
          : undefined

        const eventId = uuidv4()
        const now = new Date()

        try {
          await db.behavioralEvents.add({
            id: eventId,
            workSessionId: state.activeSessionId,
            outcomeId: outcomeId,
            timestamp: now.toISOString(),
            eventType: eventType,
            promptCount: promptCount,
            comment: sanitizedComment,
            syncStatus: 'pending',
          })

          console.log('Behavioral event logged:', { eventType, outcomeId, promptCount })
        } catch (error) {
          console.error('Error logging behavioral event:', error)
          throw error
        }
      },

      // Update elapsed time (called by UI every second)
      updateElapsedTime: () => {
        const state = get()
        
        if (!state.activeTimeBlockId || !state.lastUpdateTime) {
          return
        }

        const now = Date.now()
        const deltaSeconds = Math.floor((now - state.lastUpdateTime) / 1000)
        
        // Protect against computer sleep/wake - cap delta at 1 hour
        const cappedDelta = Math.min(deltaSeconds, 3600)
        
        if (deltaSeconds >= 1) {
          // Warn if session is suspiciously long (> 24 hours)
          const newTotal = state.elapsedSeconds + cappedDelta
          if (newTotal > 24 * 60 * 60) {
            console.warn('Timer has been running for more than 24 hours. Consider clocking out.')
          }
          
          set({
            elapsedSeconds: newTotal,
            lastUpdateTime: now,
          })
        }
      },

      // Reset store (for testing)
      reset: () => {
        set({
          activeSessionId: null,
          activeSessionDate: null,
          activeServiceType: null,
          activeTimeBlockId: null,
          timeBlockStartTime: null,
          elapsedSeconds: 0,
          lastUpdateTime: null,
        })
      },

      // Check if timer is active
      isActive: () => {
        const state = get()
        return state.activeSessionId !== null && state.activeTimeBlockId !== null
      },
    }),
    {
      name: 'ethan-timer-storage', // localStorage key
      partialize: (state) => ({
        // Only persist essential state
        activeSessionId: state.activeSessionId,
        activeSessionDate: state.activeSessionDate,
        activeServiceType: state.activeServiceType,
        userId: state.userId,
        activeTimeBlockId: state.activeTimeBlockId,
        timeBlockStartTime: state.timeBlockStartTime,
        elapsedSeconds: state.elapsedSeconds,
        lastUpdateTime: state.lastUpdateTime,
      }),
    }
  )
)
