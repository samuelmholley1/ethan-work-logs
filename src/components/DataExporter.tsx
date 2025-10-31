'use client'

import { useState, useEffect } from 'react'
import { downloadAsCSV, downloadAsJSON, type ExportData } from '@/lib/exporters'

interface DataExporterProps {
  data: ExportData
  includeBehavioral?: boolean
}

export function DataExporter({ data, includeBehavioral = true }: DataExporterProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  useEffect(() => {
    if (!feedback) return

    const timer = setTimeout(() => {
      setFeedback(null)
    }, 3000)

    return () => clearTimeout(timer)
  }, [feedback])

  const handleCSVExport = async () => {
    try {
      setIsExporting(true)
      const exportData = includeBehavioral ? data : { ...data, behavioralEvents: [] }
      downloadAsCSV(exportData)
      setFeedback({ type: 'success', message: 'Timesheet exported as CSV' })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleJSONExport = async () => {
    try {
      setIsExporting(true)
      const exportData = includeBehavioral ? data : { ...data, behavioralEvents: [] }
      downloadAsJSON(exportData)
      setFeedback({ type: 'success', message: 'Timesheet exported as JSON' })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleCSVExport}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Export data as CSV for spreadsheet applications"
        >
          {isExporting ? '⏳ Exporting...' : '📊 Export as CSV'}
        </button>
        <button
          onClick={handleJSONExport}
          disabled={isExporting}
          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Export data as JSON for data portability"
        >
          {isExporting ? '⏳ Exporting...' : '📋 Export as JSON'}
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mt-3 px-4 py-3 rounded-md text-sm font-medium transition-opacity ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? '✓ ' : '⚠ '}
          {feedback.message}
        </div>
      )}
    </>
  )
}
