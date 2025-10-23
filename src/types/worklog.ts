// Type definitions for Ethan Work Logs application

export type ServiceType = 'CLS' | 'Supported Employment'
export type EventType = 'VP' | 'PP' | 'I' | 'U'
export type SessionStatus = 'Active' | 'Completed'
export type UserRole = 'Caregiver' | 'Admin'

/**
 * User represents a caregiver or admin account
 */
export interface User {
  id: string
  userId?: number // Airtable auto-number
  name: string
  email: string
  role: UserRole
  createdAt?: string
  // Password is intentionally not included (security)
}

/**
 * Outcome represents a behavioral goal/outcome from the care plan
 */
export interface Outcome {
  id: string
  outcomeId?: number // Airtable auto-number
  title: string // Short title (e.g., "Social Activity")
  description: string // Full outcome text
  serviceType: ServiceType
  order: number // Display order (1-10)
}

/**
 * WorkSession represents a single work session (typically one per day)
 */
export interface WorkSession {
  id: string
  sessionId?: number // Airtable auto-number
  userId: string // Link to User
  date: string // ISO date string (YYYY-MM-DD)
  serviceType: ServiceType
  status: SessionStatus
  createdAt?: string
  // Linked records (populated when fetched with expanded records)
  user?: User
  timeBlocks?: TimeBlock[]
  behavioralEvents?: BehavioralEvent[]
}

/**
 * TimeBlock represents a continuous period of work within a session
 * Supports non-contiguous work (e.g., lunch breaks)
 */
export interface TimeBlock {
  id: string
  blockId?: number // Airtable auto-number
  workSessionId: string // Link to WorkSession
  startTime: string // ISO datetime string
  endTime?: string | null // ISO datetime string (null if timer is running)
  // Calculated fields from Airtable formulas
  actualDuration?: number // Minutes (raw)
  roundedStartTime?: string // Rounded down to nearest 15 min
  roundedEndTime?: string | null // Rounded up to nearest 15 min
  billableDuration?: number // Minutes (rounded)
  billableHours?: number // Decimal hours
}

/**
 * BehavioralEvent represents a specific data point logged during work
 */
export interface BehavioralEvent {
  id: string
  eventId?: number // Airtable auto-number
  workSessionId: string // Link to WorkSession
  outcomeId: string // Link to Outcome (NEW)
  timestamp: string // ISO datetime string
  eventType: EventType
  promptCount?: number | null // Number of prompts (for VP/PP)
  comment?: string | null // Optional notes
  date?: string // Extracted date from timestamp (YYYY-MM-DD)
  // Linked record (populated when fetched with expanded records)
  outcome?: Outcome
}

/**
 * Airtable field mapping interfaces
 * These match the actual field names in Airtable
 */

export interface UserFields {
  'UserID'?: number
  'Name': string
  'Email': string
  'Password': string // Hashed
  'Role': UserRole
  'CreatedAt'?: string
  'WorkSessions'?: string[] // Array of WorkSession record IDs
}

export interface OutcomeFields {
  'OutcomeID'?: number
  'Title': string
  'Description': string
  'ServiceType': ServiceType
  'Order': number
  'BehavioralEvents'?: string[] // Array of BehavioralEvent record IDs
}

export interface WorkSessionFields {
  'SessionID'?: number
  'User': string[] // Array with single User record ID (NEW)
  'Date': string
  'ServiceType': ServiceType
  'Status': SessionStatus
  'TimeBlocks'?: string[] // Array of TimeBlock record IDs
  'BehavioralEvents'?: string[] // Array of BehavioralEvent record IDs
  'CreatedAt'?: string
}

export interface TimeBlockFields {
  'BlockID'?: number
  'WorkSession': string[] // Array with single WorkSession record ID
  'StartTime': string
  'EndTime'?: string
  'ActualDuration'?: number
  'RoundedStartTime'?: string
  'RoundedEndTime'?: string
  'BillableDuration'?: number
  'BillableHours'?: number
}

export interface BehavioralEventFields {
  'EventID'?: number
  'WorkSession': string[] // Array with single WorkSession record ID
  'Outcome': string[] // Array with single Outcome record ID (NEW)
  'Timestamp': string
  'EventType': EventType
  'PromptCount'?: number
  'Comment'?: string
  'Date'?: string
}

/**
 * Request/Response types for API and Server Actions
 */

export interface StartSessionRequest {
  serviceType: ServiceType
  date?: string // Optional, defaults to today
}

export interface StartSessionResponse {
  sessionId: string
  timeBlockId: string
  startTime: string
}

export interface StopSessionRequest {
  timeBlockId: string
}

export interface StopSessionResponse {
  timeBlockId: string
  endTime: string
  duration: number // Minutes
}

export interface LogEventRequest {
  sessionId: string
  eventType: EventType
  promptCount?: number
  comment?: string
}

export interface LogEventResponse {
  eventId: string
  timestamp: string
}

/**
 * Manual entry types
 */

export interface ManualTimeBlock {
  startTime: string
  endTime: string
}

export interface ManualEntryRequest {
  date: string
  serviceType: ServiceType
  timeBlocks: ManualTimeBlock[]
}

/**
 * Summary and reporting types
 */

export interface TimesheetRow {
  date: string
  timeBlocks: {
    startTime: string
    endTime: string
    roundedStartTime: string
    roundedEndTime: string
    billableHours: number
  }[]
  totalHours: number
}

export interface TimesheetSummary {
  weekStart: string
  weekEnd: string
  rows: TimesheetRow[]
  totalWeekHours: number
}

export interface BehavioralEventTally {
  eventType: EventType
  count: number
  totalPrompts?: number // Sum of all prompt counts for VP/PP
}

export interface BehavioralSummary {
  date: string
  serviceType?: ServiceType
  tallies: BehavioralEventTally[]
  events: BehavioralEvent[] // Full event list for details
}
