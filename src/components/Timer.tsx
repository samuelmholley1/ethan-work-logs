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

  // Update elapsed time every second
  useEffect(() => {
    if (!isActive()) return

    const interval = setInterval(() => {
      updateElapsedTime()
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, updateElapsedTime])

  // Check for pending sync data
  useEffect(() => {
    const checkSync = async () => {
      const pending = await hasPendingData()
      setPendingSync(pending)
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
    try {
      await clockIn(serviceType, userId)
      setShowServiceModal(false)
    } catch (error) {
      console.error('Error clocking in:', error)
      alert('Failed to clock in. Please try again.')
    }
  }

  // Handle Clock Out button
  const handleClockOut = async () => {
    if (!confirm('Clock out and end this work session?')) return

    try {
      await clockOut()
    } catch (error) {
      console.error('Error clocking out:', error)
      alert('Failed to clock out. Please try again.')
    }
  }

  // Handle Start Break
  const handleStartBreak = async () => {
    try {
      await stopTimeBlock()
    } catch (error) {
      console.error('Error starting break:', error)
      alert('Failed to start break. Please try again.')
    }
  }

  // Handle End Break
  const handleEndBreak = async () => {
    try {
      await startTimeBlock()
    } catch (error) {
      console.error('Error ending break:', error)
      alert('Failed to end break. Please try again.')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Status Indicators */}
      <div className="flex items-center justify-between mb-6">
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
                className="w-full mb-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors"
              >
                Start Break
              </button>
            ) : (
              <button
                onClick={handleEndBreak}
                className="w-full mb-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
              >
                End Break
              </button>
            )}

            {/* Clock Out Button */}
            <button
              onClick={handleClockOut}
              className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Clock Out
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
                className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Community Living Support
              </button>

              <button
                onClick={() => handleServiceSelect('Supported Employment')}
                className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-colors"
              >
                Supported Employment
              </button>
            </div>

            <button
              onClick={() => setShowServiceModal(false)}
              className="w-full mt-4 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
