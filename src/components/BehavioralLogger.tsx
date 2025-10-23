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
    const newCount = (promptCounts[outcomeId]?.VP || 0) + 1
    setPromptCounts((prev) => ({
      ...prev,
      [outcomeId]: { ...prev[outcomeId], VP: newCount },
    }))
  }

  // Handle PP button
  const handlePP = (outcomeId: string) => {
    const newCount = (promptCounts[outcomeId]?.PP || 0) + 1
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
      {/* Outcome Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Outcome:
        </label>
        <select
          value={selectedOutcome || ''}
          onChange={(e) => setSelectedOutcome(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:border-emerald-500 focus:outline-none"
        >
          {outcomes.map((outcome) => (
            <option key={outcome.id} value={outcome.id}>
              {outcome.outcomeName}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Outcome Details */}
      {selectedOutcome && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {outcomes.find((o) => o.id === selectedOutcome)?.outcomeName}
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
              className="px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-lg transition-colors relative"
            >
              VP
              {promptCounts[selectedOutcome]?.VP > 0 && (
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-purple-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {promptCounts[selectedOutcome].VP}
                </span>
              )}
            </button>

            <button
              onClick={() => handlePP(selectedOutcome)}
              className="px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-colors relative"
            >
              PP
              {promptCounts[selectedOutcome]?.PP > 0 && (
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {promptCounts[selectedOutcome].PP}
                </span>
              )}
            </button>
          </div>

          {/* Outcome Buttons (Instant) */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => handleI(selectedOutcome)}
              className="px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors"
            >
              Independent (I)
            </button>

            <button
              onClick={() => handleU(selectedOutcome)}
              className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-lg transition-colors"
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
