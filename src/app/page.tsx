'use client'

import { useState, useEffect } from 'react'
import { useTimerStore } from '@/lib/timer-store'
import BehavioralLogger from '@/components/BehavioralLogger'

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'timer' | 'logger'>('timer')
  
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
  const [isBreak, setIsBreak] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Update elapsed time every second
  useEffect(() => {
    const active = isActive()
    if (!active) return

    const interval = setInterval(() => {
      updateElapsedTime()
    }, 1000)

    return () => clearInterval(interval)
  }, [activeSessionId, activeTimeBlockId, updateElapsedTime, isActive])

  // Update break status
  useEffect(() => {
    setIsBreak(!!activeSessionId && !activeTimeBlockId)
  }, [activeSessionId, activeTimeBlockId])

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Format elapsed time as HH:MM:SS
  const formatElapsed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Format duration nicely
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  // Handle Clock In
  const handleClockIn = () => {
    setShowServiceModal(true)
  }

  // Handle service type selection
  const handleServiceSelect = async (serviceType: 'CLS' | 'Supported Employment') => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await clockIn(serviceType, userId)
      setShowServiceModal(false)
    } catch (error) {
      console.error('Error clocking in:', error)
      alert(error instanceof Error ? error.message : 'Failed to clock in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Clock Out
  const handleClockOut = async () => {
    if (isLoading) return
    
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const timeWorked = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    
    if (!confirm(`Clock out and end this work session?\n\nTime worked: ${timeWorked}\n\nThis action cannot be undone.`)) return

    setIsLoading(true)
    try {
      await clockOut()
    } catch (error) {
      console.error('Error clocking out:', error)
      alert(error instanceof Error ? error.message : 'Failed to clock out. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Start Break
  const handleStartBreak = async () => {
    if (isLoading) return
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
    if (isLoading) return
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

  if (activeTab === 'logger') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-emerald-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-emerald-900">Ethan Work Logger</h1>
                <p className="text-sm text-emerald-700">Time & Behavioral Data Tracking</p>
              </div>
              <div className="flex gap-2">
                <a href="/summary" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  📊 Summary
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm">
            <button
              onClick={() => setActiveTab('timer')}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              ⏱️ Timer
            </button>
            <button
              onClick={() => setActiveTab('logger')}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-colors bg-emerald-500 text-white"
            >
              📊 Behavioral Logger
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 pb-8">
          <BehavioralLogger />
        </div>
      </div>
    )
  }

  // Timer Tab (Main View)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Clock Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Time Clock</h1>
            <p className="text-gray-600 text-sm mt-1">Elijah Wright - CLS</p>
          </div>

          {/* Current Time Display */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white text-center mb-6">
            <div className="text-5xl font-bold font-mono mb-2">{formatTime(currentTime)}</div>
            <div className="text-sm opacity-90">{formatDate(currentTime)}</div>
          </div>

          {/* Elapsed Duration (if clocked in) */}
          {activeSessionId && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center mb-6">
              <p className="text-gray-600 text-sm font-medium mb-2">
                {isBreak ? 'On Break' : 'Time Worked'}
              </p>
              <div className="text-4xl font-bold font-mono text-green-600">{formatElapsed(elapsedSeconds)}</div>
              {activeServiceType && (
                <p className="text-xs text-gray-500 mt-2">Service: {activeServiceType}</p>
              )}
            </div>
          )}

          {/* Clock In/Out Button */}
          <button
            onClick={activeSessionId ? handleClockOut : handleClockIn}
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 active:scale-95 ${
              activeSessionId
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : (activeSessionId ? '⏹️ Clock Out' : '▶️ Clock In')}
          </button>

          {/* Break Button (if clocked in) */}
          {activeSessionId && (
            <button
              onClick={isBreak ? handleEndBreak : handleStartBreak}
              disabled={isLoading}
              className={`w-full mt-3 py-3 px-6 rounded-xl font-semibold text-white transition-colors ${
                isBreak
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : (isBreak ? '▶️ End Break' : '☕ Start Break')}
            </button>
          )}

          {/* Status Indicator */}
          <div className="mt-6 p-4 rounded-lg bg-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className={`text-lg font-semibold ${activeSessionId ? 'text-green-600' : 'text-gray-600'}`}>
              {activeSessionId ? (isBreak ? '☕ On Break' : '🟢 Clocked In') : '⚪ Clocked Out'}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          <a
            href="/summary"
            className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-semibold text-gray-900">Summary</div>
          </a>
          <button
            onClick={() => setActiveTab('logger')}
            className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-semibold text-gray-900">Behavioral</div>
          </button>
        </div>
      </div>

      {/* Service Type Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Service Type</h2>
            <p className="text-sm text-gray-600 mb-6">Choose the type of service for this work session</p>

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