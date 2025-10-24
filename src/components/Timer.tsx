'use client'

import { useEffect, useState } from 'react'
import { useTimerStore } from '@/lib/timer-store'
import { hasPendingData } from '@/lib/sync-queue'

/**
 * Timer Component
 * 
 * Main timer interface with Clock In/Out functionality
 * Shows live elapsed time, service type selection, and sync status
 */

export default function Timer() {
  const {
    activeSessionId,
    activeServiceType,
    activeTimeBlockId,
    elapsedSeconds,
    userId,
    clockIn,
    clockOut,
    startTimeBlock,
    stopTimeBlock,
    updateElapsedTime,
    isActive,
  } = useTimerStore()

  const [showServiceModal, setShowServiceModal] = useState(false)
  const [pendingSync, setPendingSync] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isBreak, setIsBreak] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Prevent double-clicks

  // Update elapsed time every second
  useEffect(() => {
    const active = isActive()
    if (!active) return

    const interval = setInterval(() => {
      updateElapsedTime()
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSessionId, activeTimeBlockId, updateElapsedTime, isActive])

  // Check for pending sync data and update last sync time
  useEffect(() => {
    const checkSync = async () => {
      const pending = await hasPendingData()
      setPendingSync(pending)
      
      // If not pending, we just synced successfully
      if (!pending) {
        try {
          const lastSync = localStorage.getItem('lastSyncTime')
          if (lastSync) {
            setLastSyncTime(new Date(lastSync))
          }
        } catch (e) {
          console.warn('Failed to read lastSyncTime from localStorage:', e)
        }
      }
    }

    checkSync()
    const interval = setInterval(checkSync, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-dismiss success toast after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  // Update break status
  useEffect(() => {
    setIsBreak(!!activeSessionId && !activeTimeBlockId)
  }, [activeSessionId, activeTimeBlockId])

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Handle Clock In button
  const handleClockIn = () => {
    setShowServiceModal(true)
  }

  // Handle service type selection
  const handleServiceSelect = async (serviceType: 'CLS' | 'Supported Employment') => {
    if (isLoading) return // Prevent double-clicks
    
    setIsLoading(true)
    try {
      await clockIn(serviceType, userId)
      setShowServiceModal(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error clocking in:', error)
      alert(error instanceof Error ? error.message : 'Failed to clock in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Clock Out button
  const handleClockOut = async () => {
    if (isLoading) return // Prevent double-clicks
    
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const timeWorked = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    
    if (!confirm(`Clock out and end this work session?\n\nTime worked: ${timeWorked}\n\nThis action cannot be undone.`)) return

    setIsLoading(true)
    try {
      await clockOut()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error clocking out:', error)
      alert(error instanceof Error ? error.message : 'Failed to clock out. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Start Break
  const handleStartBreak = async () => {
    if (isLoading) return // Prevent double-clicks
    
    setIsLoading(true)
    try {
      await stopTimeBlock()
    } catch (error) {
      console.error('Error starting break:', error)
      alert(error instanceof Error ? error.message : 'Failed to start break. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle End Break
  const handleEndBreak = async () => {
    if (isLoading) return // Prevent double-clicks
    
    setIsLoading(true)
    try {
      await startTimeBlock()
    } catch (error) {
      console.error('Error ending break:', error)
      alert(error instanceof Error ? error.message : 'Failed to end break. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-in">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Success! Data saved.</span>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Online/Offline Indicator */}
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            />
            <span className="text-sm text-gray-600">
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>

          {/* Sync Status */}
          {pendingSync && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-sm text-gray-600">Syncing...</span>
            </div>
          )}
        </div>

        {/* Last Sync Time */}
        {lastSyncTime && !pendingSync && (
          <div className="text-xs text-gray-500 text-right">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Timer Display */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        {activeSessionId ? (
          <>
            {/* Service Type Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                {activeServiceType}
              </span>
            </div>

            {/* Elapsed Time */}
            <div className="text-center mb-6">
              <div className="text-6xl font-mono font-bold text-gray-900 mb-2">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-sm text-gray-500">
                {isBreak ? 'On Break' : 'Active Time'}
              </div>
            </div>

            {/* Break Controls */}
            {!isBreak ? (
              <button
                onClick={handleStartBreak}
                disabled={isLoading}
                className={`w-full mb-4 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                {isLoading ? 'Processing...' : 'Start Break'}
              </button>
            ) : (
              <button
                onClick={handleEndBreak}
                disabled={isLoading}
                className={`w-full mb-4 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isLoading ? 'Processing...' : 'End Break'}
              </button>
            )}

            {/* Clock Out Button */}
            <button
              onClick={handleClockOut}
              disabled={isLoading}
              className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {isLoading ? 'Processing...' : 'Clock Out'}
            </button>
          </>
        ) : (
          <>
            {/* Clock In State */}
            <div className="text-center mb-6">
              <div className="text-6xl font-mono font-bold text-gray-300 mb-2">
                00:00:00
              </div>
              <div className="text-sm text-gray-500">Not Clocked In</div>
            </div>

            {/* Clock In Button */}
            <button
              onClick={handleClockIn}
              className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Clock In
            </button>
          </>
        )}
      </div>

      {/* Service Type Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Select Service Type
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Choose the type of service for this work session
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleServiceSelect('CLS')}
                disabled={isLoading}
                className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isLoading ? 'Starting...' : 'Community Living Support'}
              </button>

              <button
                onClick={() => handleServiceSelect('Supported Employment')}
                disabled={isLoading}
                className={`w-full px-6 py-4 rounded-xl font-semibold text-lg transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isLoading ? 'Starting...' : 'Supported Employment'}
              </button>
            </div>

            <button
              onClick={() => setShowServiceModal(false)}
              disabled={isLoading}
              className={`w-full mt-4 px-6 py-3 rounded-xl font-semibold transition-colors ${
                isLoading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
