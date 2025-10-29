'use client'

import { useState, useEffect } from 'react'

interface ExportProgressProps {
  isOpen: boolean
  onClose: () => void
  steps: {
    id: string
    label: string
    status: 'pending' | 'active' | 'completed' | 'error'
    message?: string
    error?: string
  }[]
  title?: string
  canCancel?: boolean
  onCancel?: () => void
}

/**
 * ExportProgress Component
 * 
 * Extracted from ticket_numberer and adapted for Work Logger PDF generation
 * Shows step-by-step progress for long-running operations like PDF generation
 * 
 * Features:
 * - Visual progress steps with status indicators
 * - Animated spinner for active steps
 * - Error states with retry capability
 * - Cancel support for interruptible operations
 * - Accessibility: ARIA labels, live regions, keyboard navigation
 */
export default function ExportProgress({
  isOpen,
  onClose,
  steps,
  title = 'Processing',
  canCancel = false,
  onCancel
}: ExportProgressProps) {
  const [focusTrapRef, setFocusTrapRef] = useState<HTMLDivElement | null>(null)

  // Calculate overall progress
  const totalSteps = steps.length
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const hasError = steps.some(s => s.status === 'error')
  const isComplete = completedSteps === totalSteps && !hasError
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  // Focus trap and ESC key handling
  useEffect(() => {
    if (!isOpen || !focusTrapRef) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !canCancel) {
        e.preventDefault()
        onClose()
      }
    }

    // Focus first interactive element
    const firstButton = focusTrapRef.querySelector('button')
    if (firstButton) {
      firstButton.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusTrapRef, canCancel, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={setFocusTrapRef}
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-title"
          aria-describedby="progress-description"
        >
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="text-2xl font-bold text-emerald-600">⏱️ Work Logger</div>
              </div>
              <h3
                id="progress-title"
                className="text-lg font-bold text-gray-900"
              >
                {title}
              </h3>
              <p
                id="progress-description"
                className="mt-1 text-sm text-gray-500"
              >
                {isComplete
                  ? 'Operation completed successfully'
                  : hasError
                  ? 'An error occurred during processing'
                  : `Step ${completedSteps + 1} of ${totalSteps}`}
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="mb-6" role="region" aria-labelledby="overall-progress">
              <div className="sr-only" id="overall-progress">
                Overall Progress
              </div>
              <div
                className="w-full bg-gray-200 rounded-full h-2"
                role="progressbar"
                aria-valuenow={Math.round(progressPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${Math.round(progressPercentage)}% complete`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    hasError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Steps List */}
            <div
              className="space-y-4 mb-6"
              role="list"
              aria-label="Processing steps"
            >
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start"
                  role="listitem"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mr-3">
                    {step.status === 'completed' && (
                      <div
                        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                        aria-label="Completed"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {step.status === 'active' && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center"
                        aria-label="In progress"
                      >
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-600" />
                      </div>
                    )}
                    {step.status === 'error' && (
                      <div
                        className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                        aria-label="Error"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {step.status === 'pending' && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"
                        aria-label="Pending"
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {step.label}
                    </p>
                    {step.message && (
                      <p
                        className="mt-1 text-xs text-gray-500"
                        aria-live="polite"
                      >
                        {step.message}
                      </p>
                    )}
                    {step.error && (
                      <p
                        className="mt-1 text-xs text-red-600"
                        role="alert"
                        aria-live="assertive"
                      >
                        {step.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {canCancel && !isComplete && !hasError && (
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Cancel operation"
                >
                  Cancel
                </button>
              )}
              {(isComplete || hasError) && (
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  aria-label="Close dialog"
                >
                  {hasError ? 'Close' : 'Done'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
