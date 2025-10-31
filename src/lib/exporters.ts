/**
 * Data Export Utilities
 * Handles CSV and JSON export functionality for timesheet and behavioral data
 */

export interface ExportData {
  sessions: Array<{
    date: string
    serviceType: string
    timeIn: string
    timeOut: string
    duration: string
    durationMinutes: number
  }>
  behavioralEvents?: Array<{
    date: string
    timestamp: string
    eventType: string
    promptCount?: number
  }>
  weekStart: string
  weekEnd: string
  totalMinutes: number
}

/**
 * Convert export data to CSV format
 */
export function exportToCSV(data: ExportData): string {
  const lines: string[] = []

  // Header with metadata
  lines.push(`Timesheet Export - Week of ${data.weekStart}`)
  lines.push(`Exported: ${new Date().toLocaleString()}`)
  lines.push('')

  // Timesheet section
  lines.push('TIME ENTRIES')
  lines.push('Date,Service Type,Time In,Time Out,Duration')

  data.sessions.forEach((session) => {
    lines.push(
      `"${session.date}","${session.serviceType}","${session.timeIn}","${session.timeOut}","${session.duration}"`
    )
  })

  // Summary
  lines.push('')
  lines.push(`Weekly Total (hours),${(data.totalMinutes / 60).toFixed(2)}`)
  lines.push('')

  // Behavioral data if included
  if (data.behavioralEvents && data.behavioralEvents.length > 0) {
    lines.push('BEHAVIORAL EVENTS')
    lines.push('Date,Timestamp,Event Type,Prompt Count')

    data.behavioralEvents.forEach((event) => {
      lines.push(
        `"${event.date}","${event.timestamp}","${event.eventType}","${event.promptCount || ''}"`
      )
    })
  }

  return lines.join('\n')
}

/**
 * Convert export data to JSON format
 */
export function exportToJSON(data: ExportData): string {
  const exportObject = {
    metadata: {
      exportedAt: new Date().toISOString(),
      weekStart: data.weekStart,
      weekEnd: data.weekEnd,
      totalMinutes: data.totalMinutes,
      totalHours: parseFloat((data.totalMinutes / 60).toFixed(2)),
    },
    sessions: data.sessions,
    behavioralEvents: data.behavioralEvents || [],
  }

  return JSON.stringify(exportObject, null, 2)
}

/**
 * Generate CSV Blob for download
 */
export function generateCSVBlob(data: ExportData): Blob {
  const csv = exportToCSV(data)
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Generate JSON Blob for download
 */
export function generateJSONBlob(data: ExportData): Blob {
  const json = exportToJSON(data)
  return new Blob([json], { type: 'application/json;charset=utf-8;' })
}

/**
 * Trigger browser download
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export to CSV and trigger download
 */
export function downloadAsCSV(data: ExportData, filename?: string): void {
  const blob = generateCSVBlob(data)
  const finalFilename = filename || `timesheet-${data.weekStart}.csv`
  triggerDownload(blob, finalFilename)
}

/**
 * Export to JSON and trigger download
 */
export function downloadAsJSON(data: ExportData, filename?: string): void {
  const blob = generateJSONBlob(data)
  const finalFilename = filename || `timesheet-${data.weekStart}.json`
  triggerDownload(blob, finalFilename)
}
