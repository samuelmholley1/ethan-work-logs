'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  onClose: (id: string) => void
}

/**
 * Toast Component
 * 
 * Extracted from ticket_numberer and enhanced for Work Logger
 * 
 * Features:
 * - 4 notification types: info, success, warning, error
 * - Auto-dismiss with configurable duration
 * - Persistent errors (user must dismiss manually)
 * - Action buttons for interactive notifications
 * - Smooth animations (slide-in from right)
 * - Accessibility: ARIA labels, role="alert", live regions
 */
function Toast({ id, type, title, message, duration = 5000, persistent = false, action, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true)

    // Auto-dismiss only if not persistent
    if (!persistent) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, persistent])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 300) // Match animation duration
  }

  const handleAction = () => {
    if (action?.onClick) {
      action.onClick()
      handleClose()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    switch (type) {
      case 'success': return 'text-green-900'
      case 'error': return 'text-red-900'
      case 'warning': return 'text-yellow-900'
      default: return 'text-blue-900'
    }
  }

  return (
    <div
      className={`pointer-events-auto relative flex w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getBgColor()}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start w-full">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {title}
          </p>
          {message && (
            <p className="mt-1 text-sm text-gray-600">
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={handleAction}
              className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
            >
              {action.label}
            </button>
          )}
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message?: string
    duration?: number
    persistent?: boolean
    action?: {
      label: string
      onClick: () => void
    }
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          persistent={toast.persistent}
          action={toast.action}
          onClose={onRemove}
        />
      ))}
    </div>
  )
}

// Toast API
class ToastManager {
  private toasts: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message?: string
    duration?: number
    persistent?: boolean
    action?: {
      label: string
      onClick: () => void
    }
  }> = []
  private listeners: Array<(toasts: typeof this.toasts) => void> = []

  subscribe(listener: (toasts: typeof this.toasts) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  show(
    type: 'info' | 'success' | 'warning' | 'error', 
    title: string, 
    message?: string, 
    options?: {
      duration?: number
      persistent?: boolean
      action?: {
        label: string
        onClick: () => void
      }
    }
  ) {
    const id = Math.random().toString(36).substr(2, 9)
    const duration = options?.duration || (type === 'error' && options?.persistent !== false ? Infinity : 5000)
    
    this.toasts.push({ 
      id, 
      type, 
      title, 
      message, 
      duration,
      persistent: options?.persistent ?? (type === 'error'),
      action: options?.action
    })
    this.notify()

    // Auto-remove after duration + animation time (if not persistent)
    if (duration !== Infinity) {
      setTimeout(() => {
        this.remove(id)
      }, duration + 300)
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  info(title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    this.show('info', title, message, { ...options, persistent: false })
  }

  success(title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    this.show('success', title, message, { ...options, persistent: false })
  }

  warning(title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) {
    this.show('warning', title, message, { ...options, persistent: false })
  }

  error(title: string, message?: string, options?: { duration?: number; persistent?: boolean; action?: { label: string; onClick: () => void } }) {
    this.show('error', title, message, { persistent: true, ...options })
  }

  // Helper method to clear all toasts
  clear() {
    this.toasts = []
    this.notify()
  }
}

export const toast = new ToastManager()
