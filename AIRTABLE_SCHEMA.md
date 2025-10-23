# Airtable Base Setup for Ethan Work Logs

## Base Configuration
- **Base Name:** Ethan Work Logs
- **Base Color:** Blue or Green (your preference)
- **Tables:** 5 (Users, Outcomes, WorkSessions, TimeBlocks, BehavioralEvents)

---

## TABLE 1: Users (NEW - Multi-User Support)

### Purpose
Stores caregiver accounts. Future-proofs the app for multi-user coordination.

### Fields

| Field Name | Field Type | Configuration | Description |
|------------|------------|---------------|-------------|
| `UserID` | Auto Number | - | Primary key (auto-generated) |
| `Name` | Single Line Text | Required | Full name (e.g., "Ethan") |
| `Email` | Email | Required, Unique | Login email |
| `Password` | Single Line Text | Required | Hashed password (use bcrypt) |
| `Role` | Single Select | Options: "Caregiver", "Admin" | User role |
| `CreatedAt` | Created time | GMT | Auto-populated timestamp |
| `WorkSessions` | Link to another record | → WorkSessions table | All sessions created by this user |

### View Setup
- **Default View:** Grid view, sorted by Name
- **Caregivers Only:** Filter where Role = "Caregiver"

### Initial Data
```
User 1:
  Name: Ethan
  Email: ethan@worklog.app
  Password: (hash of temporary password - change on first login)
  Role: Caregiver
```

---

## TABLE 2: Outcomes (NEW - Behavioral Tracking Context)

### Purpose
Stores the specific behavioral outcomes/goals that events are logged against. Required for accurate form generation.

### Fields

| Field Name | Field Type | Configuration | Description |
|------------|------------|---------------|-------------|
| `OutcomeID` | Auto Number | - | Primary key (auto-generated) |
| `Title` | Single Line Text | Required | Short title (e.g., "Social Activity") |
| `Description` | Long Text | Required | Full outcome text from behavioral plan |
| `ServiceType` | Single Select | Options: "CLS", "Supported Employment" | Which service this outcome applies to |
| `Order` | Number | Required, 1-10 | Display order in UI |
| `BehavioralEvents` | Link to another record | → BehavioralEvents table | All events logged for this outcome |

### View Setup
- **Default View:** Grid view, sorted by Order
- **CLS Outcomes:** Filter where ServiceType = "CLS"
- **Supported Employment Outcomes:** Filter where ServiceType = "Supported Employment"

### Initial Data (CLS Example)
```
Outcome 1:
  Title: Social Activity
  Description: Elijah will participate in an integrated social activity at least 2x/week
  ServiceType: CLS
  Order: 1

Outcome 2:
  Title: Life Skills
  Description: Elijah will complete daily living skills tasks with minimal prompting
  ServiceType: CLS
  Order: 2

Outcome 3:
  Title: Communication
  Description: Elijah will initiate conversation with peers during community outings
  ServiceType: CLS
  Order: 3

Outcome 4:
  Title: Independence
  Description: Elijah will make independent choices throughout the day
  ServiceType: CLS
  Order: 4
```

---

## TABLE 3: WorkSessions (UPDATED)

### Purpose
Stores each work session (typically one per day, but can have multiple sessions per day if needed).

### Fields

| Field Name | Field Type | Configuration | Description |
|------------|------------|---------------|-------------|
| `SessionID` | Auto Number | - | Primary key (auto-generated) |
| `User` | Link to another record | → Users table, Required | **NEW:** Caregiver who created this session |
| `Date` | Date | Date only, no time | The day of the work session |
| `ServiceType` | Single Select | Options: "CLS", "Supported Employment" | Type of service provided |
| `TimeBlocks` | Link to another record | → TimeBlocks table, Allow linking to multiple records | All time blocks for this session |
| `BehavioralEvents` | Link to another record | → BehavioralEvents table, Allow linking to multiple records | All behavioral events logged during session |
| `CreatedAt` | Created time | GMT | Auto-populated timestamp |
| `Status` | Single Select | Options: "Active", "Completed" | Track if session is ongoing |

### View Setup
- **Default View:** Grid view, sorted by Date (newest first)
- **Active Sessions:** Filter where Status = "Active"
- **This Week:** Filter where Date is within this week

---

## TABLE 4: TimeBlocks

### Purpose
Stores individual time tracking periods within a session. Allows for non-contiguous work (e.g., break for lunch).

### Fields

| Field Name | Field Type | Configuration | Formula/Notes |
|------------|------------|---------------|---------------|
| `BlockID` | Auto Number | - | Primary key |
| `WorkSession` | Link to another record | → WorkSessions table | Parent session |
| `StartTime` | Date | Include time of day, Use GMT | When clock in was pressed |
| `EndTime` | Date | Include time of day, Use GMT, Allow blank | When clock out was pressed (null if ongoing) |
| `ActualDuration` | Formula | `IF(EndTime, DATETIME_DIFF(EndTime, StartTime, 'minutes'), 0)` | Raw minutes worked |
| `RoundedStartTime` | Formula | See formula below | Start time rounded DOWN to nearest 15 min |
| `RoundedEndTime` | Formula | See formula below | End time rounded UP to nearest 15 min |
| `BillableDuration` | Formula | `IF(RoundedEndTime, DATETIME_DIFF(RoundedEndTime, RoundedStartTime, 'minutes'), 0)` | Rounded duration in minutes |
| `BillableHours` | Formula | `BillableDuration / 60` | Duration in decimal hours |

### Formulas for Time Rounding

**RoundedStartTime** (Round DOWN to nearest 15 minutes):
```
IF(
  StartTime,
  DATETIME_PARSE(
    DATETIME_FORMAT(StartTime, 'YYYY-MM-DD') & ' ' &
    HOUR(StartTime) & ':' &
    IF(MINUTE(StartTime) < 15, '00',
      IF(MINUTE(StartTime) < 30, '15',
        IF(MINUTE(StartTime) < 45, '30', '45')
      )
    ) & ':00',
    'YYYY-MM-DD HH:mm:ss'
  ),
  BLANK()
)
```

**RoundedEndTime** (Round UP to nearest 15 minutes):
```
IF(
  EndTime,
  DATETIME_PARSE(
    DATETIME_FORMAT(EndTime, 'YYYY-MM-DD') & ' ' &
    IF(
      MINUTE(EndTime) = 0,
      HOUR(EndTime) & ':00',
      IF(
        MINUTE(EndTime) <= 15,
        HOUR(EndTime) & ':15',
        IF(
          MINUTE(EndTime) <= 30,
          HOUR(EndTime) & ':30',
          IF(
            MINUTE(EndTime) <= 45,
            HOUR(EndTime) & ':45',
            MOD(HOUR(EndTime) + 1, 24) & ':00'
          )
        )
      )
    ) & ':00',
    'YYYY-MM-DD HH:mm:ss'
  ),
  BLANK()
)
```

### View Setup
- **Default View:** Grouped by WorkSession, sorted by StartTime
- **Active Timers:** Filter where EndTime is blank
- **This Week:** Filter where StartTime is within this week

---

## TABLE 5: BehavioralEvents (UPDATED)

### Purpose
Logs specific behavioral data points during a work session. Each event is now linked to a specific outcome.

### Fields

| Field Name | Field Type | Configuration | Description |
|------------|------------|---------------|-------------|
| `EventID` | Auto Number | - | Primary key |
| `WorkSession` | Link to another record | → WorkSessions table | Parent session |
| `Outcome` | Link to another record | → Outcomes table, Required | **NEW:** Which outcome this event applies to |
| `Timestamp` | Date | Include time of day, Use GMT | When event was logged |
| `EventType` | Single Select | Options: "VP", "PP", "I", "U" | Type of behavioral event |
| `PromptCount` | Number | Integer, Allow blank | Number of prompts (for VP/PP) |
| `Comment` | Long text | Enable rich text formatting | Optional notes about event |
| `Date` | Formula | `DATETIME_FORMAT(Timestamp, 'YYYY-MM-DD')` | Extract date for filtering |

### Event Type Legend
- **VP:** Verbal Prompt
- **PP:** Physical Prompt
- **I:** Independent
- **U:** (Define based on your needs)

### View Setup
- **Default View:** Sorted by Timestamp (newest first)
- **By Event Type:** Grouped by EventType
- **Today:** Filter where Date = TODAY()
- **This Week:** Filter where Timestamp is within this week

---

## LINKED RECORD RELATIONSHIPS

```
WorkSessions (1) ←→ (Many) TimeBlocks
WorkSessions (1) ←→ (Many) BehavioralEvents
```

### Setup Instructions:
1. Create all three tables first (with just SessionID, BlockID, EventID fields)
2. Add the "Link to another record" fields:
   - In TimeBlocks: Add "WorkSession" field → link to WorkSessions
   - In BehavioralEvents: Add "WorkSession" field → link to WorkSessions
3. Go to WorkSessions table:
   - Airtable will auto-create "TimeBlocks" and "BehavioralEvents" linked fields
   - Rename them if needed
4. Add all other fields (Date, ServiceType, StartTime, etc.)
5. Add formulas last (after all base fields exist)

---

## SAMPLE DATA FOR TESTING

### WorkSession 1
- Date: 2025-10-23
- ServiceType: CLS
- Status: Completed

### TimeBlocks for Session 1
- Block 1:
  - StartTime: 2025-10-23 09:08:00
  - EndTime: 2025-10-23 12:22:00
  - RoundedStartTime: 2025-10-23 09:00:00
  - RoundedEndTime: 2025-10-23 12:30:00
  - BillableDuration: 210 minutes (3.5 hours)

- Block 2:
  - StartTime: 2025-10-23 13:15:00
  - EndTime: 2025-10-23 16:47:00
  - RoundedStartTime: 2025-10-23 13:00:00
  - RoundedEndTime: 2025-10-23 17:00:00
  - BillableDuration: 240 minutes (4.0 hours)

### BehavioralEvents for Session 1
- Event 1: VP, PromptCount: 3, Timestamp: 09:30:00
- Event 2: PP, PromptCount: 1, Timestamp: 10:15:00
- Event 3: I, Timestamp: 11:00:00
- Event 4: VP, PromptCount: 2, Timestamp: 14:30:00
- Event 5: I, Timestamp: 15:00:00
- Event 6: U, Timestamp: 16:00:00

---

## ENVIRONMENT VARIABLES

After creating the base, add these to your `.env.local`:

```env
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX  # Get from https://airtable.com/create/tokens
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX  # Get from base URL or API docs
```

### How to Get Credentials:

1. **API Key:**
   - Go to https://airtable.com/create/tokens
   - Click "Create new token"
   - Name: "Ethan Work Logs API"
   - Scopes: `data.records:read`, `data.records:write`
   - Access: Select your base
   - Copy the token (starts with `pat`)

2. **Base ID:**
   - Open your base in Airtable
   - Look at URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - Copy the `appXXXXXXXXXXXXXX` part

---

## VIEWS TO CREATE

### WorkSessions Table
- **All Sessions** (default)
- **Active Sessions** (Status = "Active")
- **This Week** (Date is within this week)
- **This Month** (Date is within this month)
- **By Service Type** (Grouped by ServiceType)

### TimeBlocks Table
- **All Blocks** (default)
- **Active Timers** (EndTime is empty)
- **This Week** (StartTime is within this week)
- **By Session** (Grouped by WorkSession)

### BehavioralEvents Table
- **All Events** (default)
- **Today** (Date = TODAY())
- **This Week** (Timestamp is within this week)
- **By Event Type** (Grouped by EventType)
- **VP/PP Only** (EventType is "VP" or "PP")

---

## SETUP CHECKLIST

- [ ] Create Airtable account (if needed)
- [ ] Create new base named "Ethan Work Logs"
- [ ] Create WorkSessions table with all fields
- [ ] Create TimeBlocks table with all fields
- [ ] Create BehavioralEvents table with all fields
- [ ] Set up linked record relationships
- [ ] Add formulas for time rounding
- [ ] Add formulas for duration calculations
- [ ] Create all views listed above
- [ ] Add sample data for testing
- [ ] Generate API token with proper scopes
- [ ] Copy Base ID from URL
- [ ] Add credentials to `.env.local`
- [ ] Test API connection from Next.js app

---

## NEXT STEPS

After completing this setup:
1. Update `/src/lib/airtable.ts` with new base ID
2. Create TypeScript types in `/src/types/worklog.ts`
3. Test connection with a simple API call
4. Begin building timer UI (Phase 2)
