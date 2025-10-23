# Ethan Work Logs - Implementation Plan
## Converting Liturgists App → Caregiver Time & Data Logger

**Date:** October 23, 2025  
**Approach:** Pragmatic, using existing Airtable infrastructure

---

## EXECUTIVE DECISION: Airtable vs PostgreSQL

**USING AIRTABLE** ✅ (CEO Decision - Correct)

### Why Airtable Wins:
1. **Already Integrated** - `/src/lib/airtable.ts` exists, just needs new schema
2. **Zero Infrastructure** - No PostgreSQL hosting costs or management
3. **Visual Data Access** - CEO can view/edit records in Airtable interface
4. **Built-in Features** - CSV export, API access, collaboration, backups
5. **Deployment Simplicity** - Vercel deploy stays simple (no DB provisioning)
6. **Performance** - 5 req/sec limit is 100x more than needed for single-user timer
7. **Cost** - Free tier sufficient vs. $20+/month for managed PostgreSQL
8. **Flexibility** - Schema changes in UI, no migrations needed

### Performance Reality Check:
- Timer runs client-side, only writes on Clock In/Out (~2-10 times/day)
- Behavioral events are button taps (~20-50 times/day)
- Total API calls: <100/day vs. 432,000/day limit (5/sec)
- **Verdict:** Massively over-provisioned for this use case

---

## AIRTABLE BASE SCHEMA

### Table 1: WorkSessions
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | Auto Number | Primary key |
| `Date` | Date | Session date |
| `ServiceType` | Single Select | "CLS" or "Supported Employment" |
| `TimeBlocks` | Linked Records | → TimeBlocks table |
| `BehavioralEvents` | Linked Records | → BehavioralEvents table |
| `CreatedAt` | Created Time | Auto-populated |

### Table 2: TimeBlocks
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | Auto Number | Primary key |
| `WorkSession` | Linked Record | → WorkSessions table |
| `StartTime` | Date (with time) | When timer started |
| `EndTime` | Date (with time) | When timer stopped (nullable) |
| `Duration` | Formula | `DATETIME_DIFF(EndTime, StartTime, 'minutes')` |
| `RoundedStart` | Formula | Round down to 15-min |
| `RoundedEnd` | Formula | Round up to 15-min |
| `RoundedDuration` | Formula | Calculated from rounded times |

### Table 3: BehavioralEvents
| Field Name | Type | Description |
|------------|------|-------------|
| `id` | Auto Number | Primary key |
| `WorkSession` | Linked Record | → WorkSessions table |
| `Timestamp` | Date (with time) | When event logged |
| `EventType` | Single Select | "VP", "PP", "I", "U" |
| `PromptCount` | Number | Number of prompts (nullable) |
| `Comment` | Long Text | Optional notes |

---

## PHASE 1: Foundation & Cleanup (Week 1)

### Objectives:
- Remove all liturgist-specific code
- Rebrand to "Ethan's Work Logger"
- Configure Airtable base

### Tasks:

#### 1.1 Delete Liturgist Code
```
DELETE:
- /src/admin/liturgists.ts
- /src/admin/README.md
- /src/types/liturgist.ts
- /src/app/schedule/page.tsx (entire folder)
- /src/app/signup/page.tsx (entire folder)
- /src/app/archive/page.tsx (entire folder)
- /src/app/admin/page.tsx
- /src/app/api/services/route.ts (entire folder)
- /src/app/api/signup/route.ts (entire folder)
- /src/components/PasswordGate.tsx (if not needed)
```

#### 1.2 Create New Airtable Base
- Base Name: "Ethan Work Logs"
- Create 3 tables with schema above
- Set up linked records between tables
- Configure formulas for duration calculations
- Get Base ID and API key

#### 1.3 Update Airtable Configuration
- Update `/src/lib/airtable.ts` with new Base ID
- Create TypeScript types in `/src/types/worklog.ts`
- Test connection with dummy data

#### 1.4 Rebrand Application
- Update `/src/app/layout.tsx`: Title → "Ethan's Work Logger"
- Update `/src/app/page.tsx`: Clean slate UI
- Remove Header.tsx or update branding
- Update metadata, favicon, site.webmanifest

**Deliverable:** Clean Next.js app connected to new Airtable base

---

## PHASE 2: Core Timer Functionality (Week 2)

### Objectives:
- Build "big button" time tracking
- Implement live timer with client state
- Create server actions for Airtable writes

### Tasks:

#### 2.1 Install Dependencies
```bash
yarn add zustand date-fns zod
```

#### 2.2 State Management
Create `/src/lib/store.ts`:
```typescript
interface TimerState {
  activeSessionId: string | null;
  activeTimeBlockId: string | null;
  isTimerRunning: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  serviceType: 'CLS' | 'Supported Employment' | null;
}
```

#### 2.3 Timer UI Component
Update `/src/app/page.tsx`:
- Single large button (state-aware)
  - Not running: "Clock In" (green)
  - Running: "Clock Out" (red)
- Live timer display above button (HH:MM:SS)
- Service type selection modal (shows before Clock In)
- Minimalist design, mobile-first

#### 2.4 Server Actions
Create `/src/app/actions.ts`:

**`startSession(serviceType)`**
- Creates WorkSession record in Airtable
- Creates TimeBlock record with StartTime
- Returns session ID and timeblock ID

**`stopSession(timeBlockId)`**
- Updates TimeBlock record with EndTime
- Calculates duration
- Returns success

#### 2.5 Timer Logic
- Use `useEffect` with `setInterval` for live timer
- Store start time in Zustand + localStorage (crash recovery)
- Auto-save timer state every 30 seconds

**Deliverable:** Functional time tracking interface

---

## PHASE 3: Behavioral Data Logging (Week 3)

### Objectives:
- Build button grid for event logging
- Implement prompt counter UI
- Add comment functionality

### Tasks:

#### 3.1 Behavioral Logger Component
Create `/src/components/BehavioralLogger.tsx`:

**Layout:**
```
┌─────────────────────────────┐
│  Behavioral Data Logger     │
├─────────────────────────────┤
│  [ VP ]  [ PP ]  [ I ]  [ U ]│
│                              │
│  [Add Comment to Last Event] │
└─────────────────────────────┘
```

**VP/PP Button Behavior:**
1. Tap button → shows "+1" indicator
2. Rapid taps increment counter
3. After 2 seconds of inactivity → auto-submit with count
4. Visual feedback during counting state

**I/U Button Behavior:**
1. Tap button → instant submit (no counting)
2. Brief visual confirmation

#### 3.2 Server Action for Events
Add to `/src/app/actions.ts`:

**`logBehavioralEvent(sessionId, eventType, promptCount?, comment?)`**
- Creates BehavioralEvent record in Airtable
- Links to active WorkSession
- Returns success

#### 3.3 Comment Modal
- Simple textarea overlay
- "Save" and "Cancel" buttons
- Updates most recent event record

**Deliverable:** Real-time behavioral data capture

---

## PHASE 4: Manual Entry System (Week 4)

### Objectives:
- Enable retroactive data entry
- Support multiple time blocks per session

### Tasks:

#### 4.1 Install Form Libraries
```bash
yarn add react-hook-form react-datepicker
yarn add -D @types/react-datepicker
```

#### 4.2 Manual Entry Page
Create `/src/app/manual-entry/page.tsx`:

**Form Fields:**
- Date picker (session date)
- Service type dropdown
- Dynamic time block list:
  - Start time picker
  - End time picker
  - "Add Another Block" button
  - "Remove Block" button
- Submit button

**Form Validation:**
- End time must be after start time
- No overlapping blocks
- All fields required

#### 4.3 Form Submission
- Creates WorkSession in Airtable
- Creates multiple TimeBlock records
- Links records properly
- Redirects to summary page

**Deliverable:** Retroactive entry capability

---

## PHASE 5: Data Processing & Summary (Week 5)

### Objectives:
- Implement 15-minute rounding logic
- Build data summary page
- Prepare data for PDF generation

### Tasks:

#### 5.1 Time Rounding Utility
Create `/src/lib/rounding.ts`:

```typescript
import { roundDown, roundUp } from 'date-fns';

export function apply15MinuteRounding(timeBlocks: TimeBlock[]) {
  return timeBlocks.map(block => ({
    ...block,
    roundedStart: roundDown(block.startTime, { nearestTo: 15 }),
    roundedEnd: roundUp(block.endTime, { nearestTo: 15 }),
  }));
}
```

**Rules:**
- Start times → round DOWN to :00, :15, :30, :45
- End times → round UP to :00, :15, :30, :45
- Example: 10:08 AM → 10:00 AM, 3:22 PM → 3:30 PM

#### 5.2 Summary Page
Create `/src/app/summary/page.tsx`:

**Timesheet Section:**
- Fetch TimeBlocks for selected week from Airtable
- Apply rounding utility
- Display table:
  - Date | Time In | Time Out | Duration
- Calculate weekly total hours

**Behavioral Data Section:**
- Fetch BehavioralEvents for selected day/week
- Group by EventType
- Display tallies:
  - VP: 6 (15 prompts total)
  - PP: 2 (3 prompts total)
  - I: 10
  - U: 3

**Filters:**
- Week selector (date range)
- Service type filter
- Export to PDF buttons

**Deliverable:** Data ready for form population

---

## PHASE 6: PDF Generation - Timesheet (Week 6)

### Objectives:
- Generate pixel-perfect timesheet PDFs
- Match IMG_0583.jpeg template exactly

### Tasks:

#### 6.1 Install PDF Dependencies
```bash
yarn add playwright-core chrome-aws-lambda
```

#### 6.2 Timesheet Template Component
Create `/src/components/pdf/TimesheetTemplate.tsx`:

**Requirements:**
- Replicate IMG_0583.jpeg layout using Tailwind
- Print-optimized CSS (A4 page size)
- Include all form fields:
  - Employee name, dates, signature line
  - Daily time entries table
  - Total hours calculation
- Exact spacing, fonts, borders

**Approach:**
- Use HTML tables for layout
- Tailwind for styling
- CSS Grid for precise positioning
- `@media print` styles

#### 6.3 Hidden Template Route
Create `/src/app/pdf-templates/timesheet/[week]/page.tsx`:
- Fetches data from Airtable for specified week
- Applies rounding
- Renders TimesheetTemplate component
- No navigation/UI chrome (print-ready)

#### 6.4 PDF Generation API
Create `/src/app/api/generate-pdf/timesheet/route.ts`:

```typescript
import { chromium } from 'playwright-core';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto(`${process.env.NEXT_PUBLIC_URL}/pdf-templates/timesheet/${week}`);
  const pdf = await page.pdf({ format: 'A4' });
  
  await browser.close();
  
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="timesheet-${week}.pdf"`,
    },
  });
}
```

**Deliverable:** Downloadable timesheet PDFs

---

## PHASE 7: PDF Generation - Behavioral Data Sheet (Week 7)

### Objectives:
- Generate multi-page behavioral data sheet
- Match "Template of ELIJAH WRIGHT DATA SHEET 1915I CLS.pdf"

### Tasks:

#### 7.1 Behavioral Data Sheet Template
Create `/src/components/pdf/BehavioralDataSheetTemplate.tsx`:

**Layout Requirements:**
- Multi-page document (one month)
- Header on each page:
  - Consumer name
  - Month/Year
  - Service type (CLS/1915i)
- Grid structure:
  - Rows: Behavioral outcomes/goals
  - Columns: Days of month (1-31)
  - Cells: Event tally (e.g., "VP/6")
- Footer: Signatures, dates

**Technical Approach:**
- Fetch month's worth of BehavioralEvents from Airtable
- Group by day and event type
- Generate tallies with prompt counts
- Use CSS Grid for table layout
- Page breaks for multi-page layout
- Consistent headers/footers

#### 7.2 Hidden Template Route
Create `/src/app/pdf-templates/behavioral-sheet/[month]/page.tsx`:
- Fetches data for specified month
- Processes tallies
- Renders BehavioralDataSheetTemplate
- Multi-page layout support

#### 7.3 PDF Generation API
Create `/src/app/api/generate-pdf/behavioral-sheet/route.ts`:
- Similar to timesheet API
- Handles multi-page rendering
- Ensures consistent page breaks

**Deliverable:** High-fidelity behavioral data sheet PDFs

---

## IMPLEMENTATION SEQUENCE (7 Weeks)

### Week 1: Foundation
- [ ] Delete liturgist code
- [ ] Create Airtable base with 3 tables
- [ ] Update `/src/lib/airtable.ts`
- [ ] Create TypeScript types
- [ ] Rebrand UI

### Week 2: Timer
- [ ] Install zustand, date-fns
- [ ] Build timer state management
- [ ] Create big button UI
- [ ] Implement server actions
- [ ] Test Clock In/Out flow

### Week 3: Behavioral Logging
- [ ] Build BehavioralLogger component
- [ ] Implement VP/PP prompt counter
- [ ] Add I/U instant logging
- [ ] Create comment functionality
- [ ] Test event creation

### Week 4: Manual Entry
- [ ] Install react-hook-form, react-datepicker
- [ ] Build manual entry form
- [ ] Implement dynamic time blocks
- [ ] Add form validation
- [ ] Test retroactive entry

### Week 5: Summary & Processing
- [ ] Create rounding utility
- [ ] Build summary page
- [ ] Implement week/day filters
- [ ] Test data accuracy
- [ ] Verify calculations

### Week 6: Timesheet PDF
- [ ] Install Playwright
- [ ] Build timesheet template
- [ ] Create hidden route
- [ ] Implement PDF API
- [ ] Test PDF accuracy vs. template

### Week 7: Behavioral Sheet PDF
- [ ] Build behavioral sheet template
- [ ] Implement multi-page layout
- [ ] Create PDF API
- [ ] Test multi-page generation
- [ ] Final QA on both PDFs

---

## CRITICAL SUCCESS FACTORS

### 1. PDF Template Accuracy
- **Risk:** Generated PDFs don't match physical forms exactly
- **Mitigation:** 
  - Build HTML templates first, get CEO approval
  - Side-by-side comparison with original templates
  - Iterate on spacing/fonts before automation

### 2. Time Rounding Precision
- **Risk:** Incorrect rounding affects payroll/billing
- **Mitigation:**
  - Unit tests for rounding function
  - Manual verification with sample data
  - CEO review of rounded times

### 3. Timer Reliability
- **Risk:** Browser crash/refresh loses active timer
- **Mitigation:**
  - Store timer state in localStorage
  - Auto-save every 30 seconds
  - Recovery prompt on page load

### 4. Airtable Rate Limits
- **Risk:** API calls exceed 5/second limit
- **Mitigation:**
  - Debounce rapid operations
  - Batch updates where possible
  - Client-side caching

### 5. Mobile UX
- **Risk:** App used primarily on phone, must be touch-friendly
- **Mitigation:**
  - Mobile-first design
  - Large touch targets (min 44px)
  - Test on actual iOS/Android devices

---

## TECHNICAL STACK

### Frontend
- **Framework:** Next.js 13+ (App Router)
- **Styling:** Tailwind CSS
- **State:** Zustand (timer state)
- **Forms:** react-hook-form
- **Date/Time:** date-fns, react-datepicker

### Backend
- **Database:** Airtable (3 tables)
- **API:** Next.js Server Actions
- **PDF Generation:** Playwright + Chrome

### DevOps
- **Hosting:** Vercel
- **Environment:** Node.js 18+
- **Package Manager:** Yarn Berry (node-modules linker)

---

## DEPENDENCIES TO INSTALL

```bash
# State & Utilities
yarn add zustand date-fns zod

# Forms & Date Pickers
yarn add react-hook-form react-datepicker
yarn add -D @types/react-datepicker

# PDF Generation
yarn add playwright-core chrome-aws-lambda

# Airtable (already installed, verify version)
yarn add airtable
```

---

## ENVIRONMENT VARIABLES

```env
# Airtable
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_new_base_id

# App URL (for PDF generation)
NEXT_PUBLIC_URL=http://localhost:3000  # Dev
NEXT_PUBLIC_URL=https://ethan-work-logs.samuelholley.com  # Prod
```

---

## POST-LAUNCH CONSIDERATIONS

### Phase 8 (Optional Enhancements)
- **Dashboard:** Weekly/monthly analytics
- **Export:** CSV download of all data
- **Notifications:** Reminder to clock out
- **Offline Mode:** PWA with service worker
- **Backup:** Automated Airtable backups to Google Drive

### Maintenance
- **Monitoring:** Vercel analytics, error tracking
- **Backups:** Weekly Airtable CSV exports
- **Updates:** Quarterly dependency updates
- **Support:** CEO can edit data directly in Airtable

---

## COST ANALYSIS

| Service | Monthly Cost |
|---------|-------------|
| Airtable (Free Tier) | $0 |
| Vercel (Hobby) | $0 |
| Domain | $12/year = $1/mo |
| **Total** | **$1/month** |

**vs. PostgreSQL Approach:**
- Managed PostgreSQL: $20-50/month
- **Savings: $19-49/month**

---

## SUCCESS METRICS

1. ✅ Timer accurately tracks work sessions
2. ✅ Behavioral events logged with <2 taps
3. ✅ PDFs match physical forms exactly
4. ✅ Manual entry completes in <2 minutes
5. ✅ App loads in <3 seconds on mobile
6. ✅ Zero data loss incidents
7. ✅ CEO can use without technical support

---

## APPROVAL CHECKLIST

Before beginning Phase 1:
- [ ] CEO approves Airtable approach
- [ ] Airtable base structure confirmed
- [ ] PDF template samples available for reference
- [ ] Timeline acceptable (7 weeks)
- [ ] Budget approved ($0 infrastructure costs)

**READY TO BEGIN PHASE 1 UPON APPROVAL**
