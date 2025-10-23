import { startOfDay, endOfDay, format, addDays, subDays } from 'date-fns'

/**
 * Billing Week Utilities
 * 
 * CRITICAL: Billing weeks run Tuesday to Monday (not standard Mon-Sun or Sun-Sat)
 * This matches the timesheet requirements from IMG_0583.jpeg
 */

export interface BillingWeek {
  start: Date // Tuesday at 00:00:00
  end: Date // Monday at 23:59:59
  label: string // e.g., "Week of Tue, Oct 21 - Mon, Oct 27"
  weekNumber: number // Week number of the year
}

/**
 * Get the billing week for any given date
 * @param date The date to find the billing week for (defaults to today)
 * @returns BillingWeek object with start, end, and label
 */
export function getBillingWeek(date: Date = new Date()): BillingWeek {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate days from the most recent Tuesday
  let daysFromTuesday: number
  
  if (dayOfWeek === 0) {
    // Sunday - previous Tuesday was 5 days ago
    daysFromTuesday = 5
  } else if (dayOfWeek === 1) {
    // Monday - previous Tuesday was 6 days ago
    daysFromTuesday = 6
  } else {
    // Tuesday through Saturday (2-6)
    // Tuesday itself is 0 days from Tuesday
    daysFromTuesday = dayOfWeek - 2
  }

  // Get the Tuesday that starts this billing week
  const weekStart = startOfDay(subDays(date, daysFromTuesday))
  
  // Get the Monday that ends this billing week (6 days after Tuesday)
  const weekEnd = endOfDay(addDays(weekStart, 6))

  // Calculate week number (approximate)
  const weekNumber = Math.ceil(
    (weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 
    (7 * 24 * 60 * 60 * 1000)
  )

  return {
    start: weekStart,
    end: weekEnd,
    label: `Week of ${format(weekStart, 'EEE, MMM d')} - ${format(weekEnd, 'EEE, MMM d')}`,
    weekNumber
  }
}

/**
 * Get the previous billing week
 */
export function getPreviousBillingWeek(currentWeek?: BillingWeek): BillingWeek {
  const referenceDate = currentWeek?.start || new Date()
  const previousWeekDate = subDays(referenceDate, 7)
  return getBillingWeek(previousWeekDate)
}

/**
 * Get the next billing week
 */
export function getNextBillingWeek(currentWeek?: BillingWeek): BillingWeek {
  const referenceDate = currentWeek?.start || new Date()
  const nextWeekDate = addDays(referenceDate, 7)
  return getBillingWeek(nextWeekDate)
}

/**
 * Check if a date falls within a specific billing week
 */
export function isInBillingWeek(date: Date, week: BillingWeek): boolean {
  const checkDate = startOfDay(date)
  return checkDate >= week.start && checkDate <= week.end
}

/**
 * Get all dates in a billing week
 * @returns Array of 7 dates (Tuesday through Monday)
 */
export function getBillingWeekDates(week: BillingWeek): Date[] {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(week.start, i))
  }
  return dates
}

/**
 * Format a billing week for display
 */
export function formatBillingWeekLabel(week: BillingWeek, includeYear = false): string {
  if (includeYear) {
    return `${format(week.start, 'EEE, MMM d, yyyy')} - ${format(week.end, 'EEE, MMM d, yyyy')}`
  }
  
  // If same month
  if (week.start.getMonth() === week.end.getMonth()) {
    return `${format(week.start, 'EEE, MMM d')} - ${format(week.end, 'd, yyyy')}`
  }
  
  // If different months
  return `${format(week.start, 'EEE, MMM d')} - ${format(week.end, 'EEE, MMM d, yyyy')}`
}

/**
 * Get billing week range as ISO date strings (for database queries)
 */
export function getBillingWeekRange(date?: Date): { start: string; end: string } {
  const week = getBillingWeek(date)
  return {
    start: week.start.toISOString(),
    end: week.end.toISOString()
  }
}

/**
 * Check if today is within the current billing week
 */
export function isCurrentBillingWeek(week: BillingWeek): boolean {
  return isInBillingWeek(new Date(), week)
}

/**
 * Get a list of recent billing weeks for navigation
 * @param count Number of weeks to return (default 4)
 * @param startFrom Starting date (default today)
 */
export function getRecentBillingWeeks(count = 4, startFrom: Date = new Date()): BillingWeek[] {
  const weeks: BillingWeek[] = []
  let currentWeek = getBillingWeek(startFrom)
  
  weeks.push(currentWeek)
  
  for (let i = 1; i < count; i++) {
    currentWeek = getPreviousBillingWeek(currentWeek)
    weeks.push(currentWeek)
  }
  
  return weeks
}

/**
 * Parse a billing week label back to dates (useful for URL params)
 * Format: "YYYY-MM-DD" (the Tuesday start date)
 */
export function parseBillingWeekFromString(dateString: string): BillingWeek | null {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    // Verify it's actually a Tuesday
    if (date.getDay() !== 2) {
      // If not Tuesday, find the billing week for this date
      return getBillingWeek(date)
    }
    
    return getBillingWeek(date)
  } catch {
    return null
  }
}

/**
 * Convert billing week to URL-friendly string
 */
export function billingWeekToString(week: BillingWeek): string {
  return format(week.start, 'yyyy-MM-dd')
}
