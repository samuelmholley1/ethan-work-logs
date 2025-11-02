import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Timer Store using Zustand
 * 
 * Manages active work session state with localStorage persistence
 * Handles clock in/out, time blocks via direct API calls to Airtable
 * NO IndexedDB - all data saved immediately to Airtable
 */

type ServiceType = 'CLS' | 'Supported Employment'

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
  syncFromAirtable: () => Promise<void>
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

      // Clock In - Creates new work session via API
      clockIn: async (serviceType: ServiceType, userId: string) => {
        const state = get()
        
        // Prevent double clock-in
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

        const now = new Date()
        const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD

        try {
          // Create session in Airtable
          const sessionResponse = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: dateStr,
              serviceType: serviceType,
              userId: userId,
              status: 'Active',
            }),
          })

          if (!sessionResponse.ok) {
            const error = await sessionResponse.json()
            // Handle specific errors
            if (sessionResponse.status === 409) {
              throw new Error('You already have an active session. Please clock out first.')
            }
            if (sessionResponse.status === 504) {
              throw new Error('Connection timeout. Please check your internet and try again.')
            }
            throw new Error(error.error || 'Failed to clock in. Please try again.')
          }

          const sessionData = await sessionResponse.json()
          const sessionId = sessionData.sessionId

          // Automatically start first time block
          const timeBlockResponse = await fetch('/api/time-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sessionId,
              startTime: now.toISOString(),
            }),
          })

          if (!timeBlockResponse.ok) {
            const error = await timeBlockResponse.json()
            throw new Error(error.error || 'Clocked in but failed to start timer. Please contact support.')
          }

          const timeBlockData = await timeBlockResponse.json()
          const timeBlockId = timeBlockData.id

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
          // Re-throw with user-friendly message
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Failed to clock in. Please check your connection and try again.')
        }
      },

      // Clock Out - Ends session and final time block via API
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
          // Show warning but allow clock out
        }

        try {
          // Close active time block if exists
          if (state.activeTimeBlockId) {
            const blockResponse = await fetch('/api/time-blocks', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                timeBlockId: state.activeTimeBlockId,
                endTime: now.toISOString(),
              }),
            })

            if (!blockResponse.ok) {
              const error = await blockResponse.json()
              throw new Error(error.error || 'Failed to save your time. Please try again.')
            }
          }

          // Update session status to Completed
          const sessionResponse = await fetch('/api/sessions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: state.activeSessionId,
              status: 'Completed',
            }),
          })

          if (!sessionResponse.ok) {
            const error = await sessionResponse.json()
            throw new Error(error.error || 'Failed to complete clock out. Please try again.')
          }

          // Reset state only after successful API calls
          set({
            activeSessionId: null,
            activeSessionDate: null,
            activeServiceType: null,
            activeTimeBlockId: null,
            timeBlockStartTime: null,
            elapsedSeconds: 0,
            lastUpdateTime: null,
          })

          console.log('Clocked out successfully')
        } catch (error) {
          console.error('Error clocking out:', error)
          // Re-throw with user-friendly message
          if (error instanceof Error) {
            throw error
          }
          throw new Error('Failed to clock out. Please check your connection and try again.')
        }
      },

      // Start Time Block - For resuming after breaks via API
      startTimeBlock: async () => {
        const state = get()

        if (!state.activeSessionId) {
          console.warn('No active session')
          throw new Error('No active session')
        }

        if (state.activeTimeBlockId) {
          console.warn('Time block already active')
          throw new Error('Time block already active')
        }

        const now = new Date()

        try {
          const response = await fetch('/api/time-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: state.activeSessionId,
              startTime: now.toISOString(),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to start time block')
          }

          const data = await response.json()
          const timeBlockId = data.id

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

      // Stop Time Block - For break periods via API
      stopTimeBlock: async () => {
        const state = get()

        if (!state.activeTimeBlockId) {
          console.warn('No active time block')
          throw new Error('No active time block')
        }

        const now = new Date()

        try {
          const response = await fetch('/api/time-blocks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timeBlockId: state.activeTimeBlockId,
              endTime: now.toISOString(),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to stop time block')
          }

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

      // Log Behavioral Event via API
      logBehavioralEvent: async (
        outcomeId: string,
        eventType: 'VP' | 'PP' | 'I' | 'U',
        promptCount: number,
        comment?: string
      ) => {
        const state = get()

        if (!state.activeSessionId) {
          console.warn('No active session')
          throw new Error('No active session - please clock in first')
        }

        const now = new Date()

        try {
          const response = await fetch('/api/behavioral-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: state.activeSessionId,
              outcomeId: outcomeId,
              timestamp: now.toISOString(),
              eventType: eventType,
              promptCount: promptCount,
              notes: comment, // API expects 'notes' not 'comment'
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to log behavioral event')
          }

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

      // Sync state from Airtable - for multi-device support
      syncFromAirtable: async () => {
        const state = get()
        const userId = state.userId || 'default-user'
        const date = new Date().toISOString().split('T')[0]

        try {
          const response = await fetch(`/api/sessions?userId=${userId}&date=${date}`)
          
          if (!response.ok) {
            console.warn('Failed to sync from Airtable:', response.status)
            return
          }

          const data = await response.json()
          
          if (!data.session) {
            // No active session in Airtable - clear local state if we think we're clocked in
            if (state.activeSessionId) {
              console.log('No active session in Airtable - clearing local state')
              set({
                activeSessionId: null,
                activeSessionDate: null,
                activeServiceType: null,
                activeTimeBlockId: null,
                timeBlockStartTime: null,
                elapsedSeconds: 0,
                lastUpdateTime: null,
              })
            }
            return
          }

          // Active session exists in Airtable
          const { id, serviceType, activeTimeBlockId } = data.session

          // Update local state if different
          if (state.activeSessionId !== id) {
            console.log('Syncing session from Airtable:', id)
            set({
              activeSessionId: id,
              activeSessionDate: date,
              activeServiceType: serviceType,
              activeTimeBlockId: activeTimeBlockId || null,
              timeBlockStartTime: activeTimeBlockId ? new Date().toISOString() : null,
              lastUpdateTime: Date.now(),
            })
          } else if (state.activeTimeBlockId !== activeTimeBlockId) {
            // Session same but time block changed (break started/ended on another device)
            console.log('Syncing time block from Airtable:', activeTimeBlockId)
            set({
              activeTimeBlockId: activeTimeBlockId || null,
              timeBlockStartTime: activeTimeBlockId ? new Date().toISOString() : null,
            })
          }
        } catch (error) {
          console.error('Error syncing from Airtable:', error)
          // Don't throw - sync is non-critical
        }
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
