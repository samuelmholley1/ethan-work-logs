# Airtable CSV Import Templates

Copy and paste these CSV values to quickly create all 5 tables in your new Airtable base.

---

## 1. Users Table

**Field Configuration:**
- Name (Single line text)
- Email (Email)
- Role (Single select: Admin, Caregiver, Viewer)
- Active (Checkbox)

**CSV Data:**
```csv
Name,Email,Role,Active
Ethan's Caregiver,caregiver@example.com,Caregiver,TRUE
```

---

## 2. Outcomes Table

**Field Configuration:**
- OutcomeName (Single line text)
- ServiceType (Single select: CLS, Supported Employment)
- Description (Long text)
- Active (Checkbox)

**CSV Data for CLS (Community Living Support):**
```csv
OutcomeName,ServiceType,Description,Active
"Demonstrate appropriate social behavior in community settings","CLS","Greet others appropriately, maintain personal space, use polite language",TRUE
"Follow safety rules in community outings","CLS","Look both ways before crossing, stay with caregiver, identify safe/unsafe situations",TRUE
"Make purchases independently with support","CLS","Count money, wait in line, interact with cashier, receive change",TRUE
"Use public facilities appropriately","CLS","Request restroom assistance, wash hands, maintain personal hygiene in public",TRUE
```

**Additional CSV for Supported Employment (add later if needed):**
```csv
OutcomeName,ServiceType,Description,Active
"Arrive to work on time","Supported Employment","Use alarm, manage morning routine, travel to workplace punctually",TRUE
"Follow workplace safety procedures","Supported Employment","Use protective equipment, report hazards, follow emergency protocols",TRUE
"Complete assigned tasks with minimal prompting","Supported Employment","Follow task list, ask for clarification when needed, maintain quality standards",TRUE
```

---

## 3. WorkSessions Table

**Field Configuration:**
- User (Link to Users table)
- Date (Date)
- ServiceType (Single select: CLS, Supported Employment)
- Status (Single select: in-progress, completed)
- TotalHours (Formula: see AIRTABLE_SCHEMA.md)
- TotalRoundedHours (Formula: see AIRTABLE_SCHEMA.md)

**CSV Data:**
```csv
User,Date,ServiceType,Status
```
*(Leave empty - sessions will be created by the app)*

---

## 4. TimeBlocks Table

**Field Configuration:**
- WorkSession (Link to WorkSessions table)
- StartTime (Date with time)
- EndTime (Date with time)
- RoundedStart (Formula: see AIRTABLE_SCHEMA.md)
- RoundedEnd (Formula: see AIRTABLE_SCHEMA.md)
- Duration (Formula: see AIRTABLE_SCHEMA.md)

**CSV Data:**
```csv
WorkSession,StartTime,EndTime
```
*(Leave empty - time blocks will be created by the app)*

---

## 5. BehavioralEvents Table

**Field Configuration:**
- WorkSession (Link to WorkSessions table)
- Outcome (Link to Outcomes table)
- Timestamp (Date with time)
- EventType (Single select: VP, PP, I, U)
- PromptCount (Number)
- Comment (Long text)

**CSV Data:**
```csv
WorkSession,Outcome,Timestamp,EventType,PromptCount,Comment
```
*(Leave empty - behavioral events will be created by the app)*

---

## Quick Setup Instructions

### Step 1: Create Airtable Base
1. Go to https://airtable.com
2. Click "Add a base" → "Start from scratch"
3. Name it "Ethan Work Logs"

### Step 2: Import Tables
For each table:

1. **Create Table:**
   - Click "+" to add a table
   - Name it (Users, Outcomes, WorkSessions, TimeBlocks, BehavioralEvents)

2. **Add Fields:**
   - Delete the default "Name" field
   - Add each field listed above with correct type
   - For "Single select" fields, add all the options listed
   - For "Link to another record" fields, select the correct table

3. **Import CSV Data:**
   - Click the dropdown next to table name
   - Select "CSV Import"
   - Paste the CSV data for that table
   - Map columns correctly
   - Import

4. **Add Formulas (if applicable):**
   - For WorkSessions and TimeBlocks, add formula fields
   - Copy formulas from AIRTABLE_SCHEMA.md

### Step 3: Get API Credentials
1. Go to https://airtable.com/create/tokens
2. Create a new token named "Ethan Work Logs"
3. Give it these scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
4. Select your "Ethan Work Logs" base
5. Click "Create token"
6. Copy the token (starts with `pat...`)

### Step 4: Get Base ID
1. Go to https://airtable.com/api
2. Click on "Ethan Work Logs"
3. Copy the Base ID from the URL (starts with `app...`)

### Step 5: Update Environment Variables
Create a `.env.local` file in your project root:

```env
AIRTABLE_API_KEY=pat_your_token_here
AIRTABLE_BASE_ID=app_your_base_id_here
```

Then update `/src/lib/airtable.ts`:

```typescript
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'placeholder_key'
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'placeholder_base'
```

---

## Verification Checklist

After setup, verify:

- [ ] All 5 tables created
- [ ] Users table has 1 row (your caregiver)
- [ ] Outcomes table has 4 rows (CLS outcomes)
- [ ] WorkSessions, TimeBlocks, BehavioralEvents tables are empty
- [ ] All "Link to another record" fields are connected correctly
- [ ] Formula fields are showing (empty is OK for now)
- [ ] API token created with correct scopes
- [ ] Base ID copied correctly
- [ ] `.env.local` file created with both values

---

## Alternative: Airtable Template Link

Once you set this up, you can share the base as a template:

1. In Airtable, click "Share" → "Share base"
2. Click "Create a shareable link to the entire base"
3. Toggle "Turn on template mode"
4. Copy the template link

This lets you recreate the base structure instantly in the future.

---

## Formulas Reference

### WorkSessions.TotalHours
```
SUM({TimeBlocks (from TimeBlocks)})
```

### WorkSessions.TotalRoundedHours
```
ROUND(SUM({TimeBlocks (from TimeBlocks)}), 2)
```

### TimeBlocks.RoundedStart
```
DATETIME_FORMAT(
  DATEADD(
    DATETIME_PARSE(DATETIME_FORMAT(StartTime, 'YYYY-MM-DD HH:00:00'), 'YYYY-MM-DD HH:mm:ss'),
    IF(MINUTE(StartTime) <= 7, 0,
       IF(MINUTE(StartTime) <= 22, 15,
          IF(MINUTE(StartTime) <= 37, 30,
             IF(MINUTE(StartTime) <= 52, 45, 60)))),
    'minutes'
  ),
  'YYYY-MM-DD HH:mm:ss'
)
```

### TimeBlocks.RoundedEnd
```
IF(EndTime,
  DATETIME_FORMAT(
    DATEADD(
      DATETIME_PARSE(DATETIME_FORMAT(EndTime, 'YYYY-MM-DD HH:00:00'), 'YYYY-MM-DD HH:mm:ss'),
      IF(MINUTE(EndTime) <= 7, 0,
         IF(MINUTE(EndTime) <= 22, 15,
            IF(MINUTE(EndTime) <= 37, 30,
               IF(MINUTE(EndTime) <= 52, 45, 60)))),
      'minutes'
    ),
    'YYYY-MM-DD HH:mm:ss'
  ),
  ''
)
```

### TimeBlocks.Duration
```
IF(AND(RoundedStart, RoundedEnd),
  ROUND(
    DATETIME_DIFF(
      DATETIME_PARSE(RoundedEnd, 'YYYY-MM-DD HH:mm:ss'),
      DATETIME_PARSE(RoundedStart, 'YYYY-MM-DD HH:mm:ss'),
      'hours'
    ),
    2
  ),
  ''
)
```

---

## Notes

- The app will work with placeholder values until Airtable is set up
- All data is stored locally first (offline-first architecture)
- When Airtable credentials are added, data syncs automatically
- You can add more Outcomes anytime by adding rows to the Outcomes table
- The formulas handle 15-minute rounding automatically per DDD requirements
