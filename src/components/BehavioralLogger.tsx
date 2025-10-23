'use client'

import { useEffect, useState } from 'react'
import { useTimerStore } from '@/lib/timer-store'
import { getOutcomes } from '@/lib/airtable'
import type { Outcome } from '@/types/worklog'

/**
 * Behavioral Logger Component
 * 
 * Rapid entry interface for logging behavioral events
 * Features stateful VP/PP buttons with counts and instant I/U buttons
 */

export default function BehavioralLogger() {
  const { activeSessionId, activeServiceType, logBehavioralEvent } = useTimerStore()

  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [promptCounts, setPromptCounts] = useState<Record<string, { VP: number; PP: number }>>({})
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string
    outcomeId: string
    eventType: string
    promptCount: number
    timestamp: Date
  }>>([])

  // Load outcomes when service type changes
  useEffect(() => {
    if (!activeServiceType) {
      setOutcomes([])
      setSelectedOutcome(null)
      return
    }

    const loadOutcomes = async () => {
      setLoading(true)
      try {
        const data = await getOutcomes(activeServiceType)
        setOutcomes(data)
        
        // Initialize prompt counts for each outcome
        const counts: Record<string, { VP: number; PP: number }> = {}
        data.forEach((outcome) => {
          counts[outcome.id] = { VP: 0, PP: 0 }
        })
        setPromptCounts(counts)
        
        // Auto-select first outcome if available
        if (data.length > 0 && !selectedOutcome) {
          setSelectedOutcome(data[0].id)
        }
      } catch (error) {
        console.error('Error loading outcomes:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOutcomes()
  }, [activeServiceType, selectedOutcome])

  // Auto-dismiss success toast after 2 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  // Log event helper
  const handleLogEvent = async (
    eventType: 'VP' | 'PP' | 'I' | 'U',
    outcomeId: string,
    promptCount: number = 0,
    eventComment?: string
  ) => {
    if (!activeSessionId) {
      alert('Please clock in first')
      return
    }

    try {
      await logBehavioralEvent(outcomeId, eventType, promptCount, eventComment)
      
      // Add to recent events history
      const newEvent = {
        id: Date.now().toString(),
        outcomeId,
        eventType,
        promptCount,
        timestamp: new Date(),
      }
      setRecentEvents((prev) => [newEvent, ...prev.slice(0, 4)]) // Keep last 5 events
      
      // Show success feedback
      setShowSuccess(true)
      
      // Haptic feedback (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      // Reset comment after logging
      if (eventComment) {
        setComment('')
        setShowCommentModal(false)
      }
    } catch (error) {
      console.error('Error logging event:', error)
      alert('Failed to log event')
    }
  }

  // Handle VP button
  const handleVP = (outcomeId: string) => {
    const currentCount = promptCounts[outcomeId]?.VP || 0
    
    // Max 99 prompts per type (reasonable limit)
    if (currentCount >= 99) {
      alert('Maximum prompt count reached (99). Please log the event.')
      return
    }
    
    const newCount = currentCount + 1
    setPromptCounts((prev) => ({
      ...prev,
      [outcomeId]: { ...prev[outcomeId], VP: newCount },
    }))
  }

  // Handle PP button
  const handlePP = (outcomeId: string) => {
    const currentCount = promptCounts[outcomeId]?.PP || 0
    
    // Max 99 prompts per type (reasonable limit)
    if (currentCount >= 99) {
      alert('Maximum prompt count reached (99). Please log the event.')
      return
    }
    
    const newCount = currentCount + 1
    setPromptCounts((prev) => ({
      ...prev,
      [outcomeId]: { ...prev[outcomeId], PP: newCount },
    }))
  }

  // Handle I button (Independent - log immediately)
  const handleI = async (outcomeId: string) => {
    const vpCount = promptCounts[outcomeId]?.VP || 0
    const ppCount = promptCounts[outcomeId]?.PP || 0
    const totalPrompts = vpCount + ppCount
    
    await handleLogEvent('I', outcomeId, totalPrompts)
    
    // Reset prompt counts for this outcome
    setPromptCounts((prev) => ({
      ...prev,
      [outcomeId]: { VP: 0, PP: 0 },
    }))
  }

  // Handle U button (Unsuccessful - log immediately)
  const handleU = async (outcomeId: string) => {
    const vpCount = promptCounts[outcomeId]?.VP || 0
    const ppCount = promptCounts[outcomeId]?.PP || 0
    const totalPrompts = vpCount + ppCount
    
    await handleLogEvent('U', outcomeId, totalPrompts)
    
    // Reset prompt counts for this outcome
    setPromptCounts((prev) => ({
      ...prev,
      [outcomeId]: { VP: 0, PP: 0 },
    }))
  }

  // Reset prompt counts for an outcome
  const handleResetCounts = (outcomeId: string) => {
    setPromptCounts((prev) => ({
      ...prev,
      [outcomeId]: { VP: 0, PP: 0 },
    }))
  }

  // Add comment to last event
  const handleAddComment = () => {
    setShowCommentModal(true)
  }

  if (!activeSessionId) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-gray-100 rounded-2xl p-8 text-center">
          <p className="text-gray-600">Clock in to start logging behavioral data</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-600">Loading outcomes...</p>
        </div>
      </div>
    )
  }

  if (outcomes.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-yellow-50 rounded-2xl p-8 text-center">
          <p className="text-yellow-800">
            No outcomes found for {activeServiceType}
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            Please add outcomes in Airtable
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-in">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Event logged!</span>
        </div>
      )}

      {/* Recent Events History */}
      {recentEvents.length > 0 && (
        <div className="mb-6 bg-blue-50 rounded-xl p-4 max-h-80 overflow-y-auto" aria-label="Recent events history">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Recent Events (Last 5)</h3>
          <div className="space-y-2">
            {recentEvents.map((event) => {
              const outcome = outcomes.find((o) => o.id === event.outcomeId)
              return (
                <div key={event.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded font-bold ${
                      event.eventType === 'I' ? 'bg-green-100 text-green-800' :
                      event.eventType === 'U' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {event.eventType}
                    </span>
                    <span className="text-gray-700">{outcome?.title || 'Unknown'}</span>
                    {event.promptCount > 0 && (
                      <span className="text-gray-500">({event.promptCount} prompts)</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Outcome Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Outcome:
        </label>
        {outcomes.length === 0 ? (
          <div className="w-full px-4 py-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl text-yellow-800 font-medium">
            {loading ? 'Loading outcomes...' : 'No outcomes found. Please check your Airtable setup.'}
          </div>
        ) : (
          <select
            value={selectedOutcome || ''}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:border-emerald-500 focus:outline-none"
          >
            {outcomes.map((outcome) => (
              <option key={outcome.id} value={outcome.id}>
                {outcome.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected Outcome Details */}
      {selectedOutcome && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {outcomes.find((o) => o.id === selectedOutcome)?.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {outcomes.find((o) => o.id === selectedOutcome)?.description}
          </p>

          {/* Prompt Counter Display */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {promptCounts[selectedOutcome]?.VP || 0}
              </div>
              <div className="text-xs text-gray-600">Verbal Prompts</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {promptCounts[selectedOutcome]?.PP || 0}
              </div>
              <div className="text-xs text-gray-600">Physical Prompts</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(promptCounts[selectedOutcome]?.VP || 0) +
                  (promptCounts[selectedOutcome]?.PP || 0)}
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>

          {/* Prompt Buttons (Stateful) */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => handleVP(selectedOutcome)}
              aria-label={`Add verbal prompt. Current count: ${promptCounts[selectedOutcome]?.VP || 0}`}
              className="px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-lg transition-colors relative active:scale-95"
            >
              VP
              {promptCounts[selectedOutcome]?.VP > 0 && (
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-purple-700 text-white rounded-full flex items-center justify-center text-sm font-bold" aria-hidden="true">
                  {promptCounts[selectedOutcome].VP}
                </span>
              )}
            </button>

            <button
              onClick={() => handlePP(selectedOutcome)}
              aria-label={`Add physical prompt. Current count: ${promptCounts[selectedOutcome]?.PP || 0}`}
              className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-colors relative active:scale-95"
            >
              PP
              {promptCounts[selectedOutcome]?.PP > 0 && (
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold" aria-hidden="true">
                  {promptCounts[selectedOutcome].PP}
                </span>
              )}
            </button>
          </div>

          {/* Outcome Buttons (Instant) */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => handleI(selectedOutcome)}
              aria-label="Log as Independent"
              className="px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors active:scale-95"
            >
              Independent (I)
            </button>

            <button
              onClick={() => handleU(selectedOutcome)}
              aria-label="Log as Unsuccessful"
              className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-colors active:scale-95"
            >
              Unsuccessful (U)
            </button>
          </div>

          {/* Reset & Comment Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => handleResetCounts(selectedOutcome)}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Reset Counts
            </button>
            <button
              onClick={handleAddComment}
              className="flex-1 px-4 py-3 bg-emerald-200 hover:bg-emerald-300 text-emerald-800 rounded-xl font-semibold transition-colors"
            >
              Add Comment
            </button>
          </div>
        </div>
      )}

      {/* Quick Reference Card */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-bold text-gray-900 mb-2 text-sm">Quick Reference:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li><strong>VP (Verbal Prompt):</strong> Verbal cue or instruction</li>
          <li><strong>PP (Physical Prompt):</strong> Physical guidance or touch</li>
          <li><strong>I (Independent):</strong> Task completed independently</li>
          <li><strong>U (Unsuccessful):</strong> Task not completed despite prompting</li>
        </ul>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Comment</h2>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add notes about this event..."
              className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-xl resize-none focus:border-emerald-500 focus:outline-none"
            />

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => {
                  setShowCommentModal(false)
                  setComment('')
                }}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Note: This is a simplified version
                  // In production, you'd re-log the last event with the comment
                  alert('Comment feature coming soon')
                  setShowCommentModal(false)
                  setComment('')
                }}
                className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
              >
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
