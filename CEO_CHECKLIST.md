# CEO Action Items Checklist

## Immediate Actions (Do Now)

### ✅ Install Dependencies
```bash
cd /Users/samuelholley/Projects/ethan-work-logs.samuelholley.com
npm install
```
- [ ] Navigate to project folder
- [ ] Run `npm install`
- [ ] Wait for ~320 packages to install
- [ ] Verify no errors in terminal

### ✅ Test Offline Mode
```bash
npm run dev
```
- [ ] Run development server
- [ ] Open http://localhost:3000
- [ ] Click "Clock In" → Select CLS
- [ ] Watch timer count up
- [ ] Click "Behavioral Logger" tab
- [ ] Press VP/PP/I buttons
- [ ] Check DevTools → IndexedDB → See data

**Expected Result:** App works, data saves locally, no Airtable needed yet.

---

## Airtable Setup (30 Minutes)

### 1. Create Airtable Base
- [ ] Go to https://airtable.com (login/signup)
- [ ] Click "+ Add a base" → "Start from scratch"
- [ ] Name it: **"Ethan Work Logs"**

### 2. Create Users Table
- [ ] Create table named **"Users"**
- [ ] Delete default "Name" field
- [ ] Add field: **Name** (Single line text)
- [ ] Add field: **Email** (Email)
- [ ] Add field: **Role** (Single select: Admin, Caregiver, Viewer)
- [ ] Add field: **Active** (Checkbox)
- [ ] Import CSV from `AIRTABLE_CSV_TEMPLATES.md` (1 row)
- [ ] Verify: 1 user row shows

### 3. Create Outcomes Table
- [ ] Create table named **"Outcomes"**
- [ ] Add field: **OutcomeName** (Single line text)
- [ ] Add field: **ServiceType** (Single select: CLS, Supported Employment)
- [ ] Add field: **Description** (Long text)
- [ ] Add field: **Active** (Checkbox)
- [ ] Import CSV from `AIRTABLE_CSV_TEMPLATES.md` (4 rows)
- [ ] Verify: 4 CLS outcome rows show

### 4. Create WorkSessions Table
- [ ] Create table named **"WorkSessions"**
- [ ] Add field: **User** (Link to Users table)
- [ ] Add field: **Date** (Date)
- [ ] Add field: **ServiceType** (Single select: CLS, Supported Employment)
- [ ] Add field: **Status** (Single select: in-progress, completed)
- [ ] Add field: **TotalHours** (Formula - see AIRTABLE_SCHEMA.md)
- [ ] Add field: **TotalRoundedHours** (Formula - see AIRTABLE_SCHEMA.md)
- [ ] Leave table empty (app will populate)

### 5. Create TimeBlocks Table
- [ ] Create table named **"TimeBlocks"**
- [ ] Add field: **WorkSession** (Link to WorkSessions table)
- [ ] Add field: **StartTime** (Date with time)
- [ ] Add field: **EndTime** (Date with time)
- [ ] Add field: **RoundedStart** (Formula - see AIRTABLE_SCHEMA.md)
- [ ] Add field: **RoundedEnd** (Formula - see AIRTABLE_SCHEMA.md)
- [ ] Add field: **Duration** (Formula - see AIRTABLE_SCHEMA.md)
- [ ] Leave table empty (app will populate)

### 6. Create BehavioralEvents Table
- [ ] Create table named **"BehavioralEvents"**
- [ ] Add field: **WorkSession** (Link to WorkSessions table)
- [ ] Add field: **Outcome** (Link to Outcomes table)
- [ ] Add field: **Timestamp** (Date with time)
- [ ] Add field: **EventType** (Single select: VP, PP, I, U)
- [ ] Add field: **PromptCount** (Number)
- [ ] Add field: **Comment** (Long text)
- [ ] Leave table empty (app will populate)

---

## Get API Credentials

### 7. Create API Token
- [ ] Go to https://airtable.com/create/tokens
- [ ] Click "Create new token"
- [ ] Name: **"Ethan Work Logs"**
- [ ] Add scope: **data.records:read**
- [ ] Add scope: **data.records:write**
- [ ] Add scope: **schema.bases:read**
- [ ] Select base: **"Ethan Work Logs"**
- [ ] Click "Create token"
- [ ] Copy token (starts with `pat...`)
- [ ] Save in secure location (you'll need it next)

### 8. Get Base ID
- [ ] Go to https://airtable.com/api
- [ ] Click on **"Ethan Work Logs"** base
- [ ] Look at URL: `https://airtable.com/app1234567890abcd/api/docs`
- [ ] Copy Base ID: `app1234567890abcd` (starts with `app...`)
- [ ] Save in secure location

---

## Configure Project

### 9. Create Environment File
```bash
# In project root folder, create .env.local
touch .env.local
nano .env.local
```

Paste this (with your real values):
```env
AIRTABLE_API_KEY=pat_your_actual_token_here
AIRTABLE_BASE_ID=app_your_actual_base_id_here
```

- [ ] Create `.env.local` file in project root
- [ ] Add `AIRTABLE_API_KEY=pat...` line
- [ ] Add `AIRTABLE_BASE_ID=app...` line
- [ ] Save file
- [ ] **DO NOT commit this file to git!**

### 10. Update airtable.ts
Open `/src/lib/airtable.ts` and change lines 8-9:

**FROM:**
```typescript
const AIRTABLE_API_KEY = 'placeholder_key'
const AIRTABLE_BASE_ID = 'placeholder_base'
```

**TO:**
```typescript
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'placeholder_key'
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'placeholder_base'
```

- [ ] Open `/src/lib/airtable.ts`
- [ ] Find lines 8-9
- [ ] Update to use `process.env.AIRTABLE_API_KEY`
- [ ] Update to use `process.env.AIRTABLE_BASE_ID`
- [ ] Save file

---

## Test Integration

### 11. Restart Server
```bash
# Stop server (Ctrl+C in terminal)
npm run dev
# Server restarts with new environment variables
```

- [ ] Stop development server (Ctrl+C)
- [ ] Start it again (`npm run dev`)
- [ ] Verify no errors in terminal

### 12. Test End-to-End
- [ ] Open http://localhost:3000
- [ ] Clock in with CLS
- [ ] Wait 1 minute (let timer run)
- [ ] Switch to Behavioral Logger
- [ ] Select first outcome
- [ ] Press VP 2 times
- [ ] Press I button
- [ ] Clock out
- [ ] Wait 30 seconds for sync

### 13. Verify Data in Airtable
- [ ] Go to Airtable → "Ethan Work Logs" base
- [ ] Open **WorkSessions** table → See 1 row
- [ ] Open **TimeBlocks** table → See 1 row
- [ ] Open **BehavioralEvents** table → See 1 row
- [ ] Check **TotalHours** in WorkSessions shows ~0.02 hours
- [ ] Check **Duration** in TimeBlocks shows ~0.02 hours

**✅ Success!** If you see data in all 3 tables, sync is working!

---

## Production Deployment (Optional)

### 14. Deploy to Vercel
- [ ] Push code to GitHub
- [ ] Go to https://vercel.com (login with GitHub)
- [ ] Click "Import Project"
- [ ] Select your GitHub repo
- [ ] Add environment variables:
  - `AIRTABLE_API_KEY`
  - `AIRTABLE_BASE_ID`
- [ ] Click "Deploy"
- [ ] Wait 2 minutes
- [ ] Test at your-project.vercel.app

---

## Troubleshooting

### Problem: TypeScript errors in VS Code
**Solution:** Run `npm install` to install all types

### Problem: "Cannot find module 'react'" error
**Solution:** Run `npm install` to install dependencies

### Problem: Timer not starting
**Solution:** Check browser console (F12) for errors

### Problem: No data in Airtable
**Solutions:**
1. Check `.env.local` file exists in project root
2. Verify API key and Base ID are correct
3. Check browser console for API errors
4. Make sure you waited 30 seconds for sync
5. Check you're online (green indicator in app)

### Problem: Sync failing
**Solutions:**
1. Check Airtable API token has correct scopes
2. Verify Base ID matches your base
3. Check table names match exactly (case-sensitive)
4. Look for red "Syncing..." indicator
5. Check browser console for detailed error

### Problem: Formulas showing "#ERROR!"
**Solutions:**
1. Check formula syntax matches `AIRTABLE_SCHEMA.md`
2. Verify field names are correct (case-sensitive)
3. Make sure linked fields exist
4. Test with sample data

---

## Daily Usage Checklist

### Morning:
- [ ] Open app
- [ ] Clock in
- [ ] Select service type

### During Day:
- [ ] Start break when needed
- [ ] End break when resuming
- [ ] Log behavioral events as they happen
- [ ] Check sync status (green online indicator)

### End of Day:
- [ ] Clock out
- [ ] Wait for final sync
- [ ] Verify data in Airtable

---

## Next Steps (After Setup Complete)

### Phase 3: PDF Reports
- [ ] Wait for AI agent to build PDF generation
- [ ] Test weekly timesheet PDF
- [ ] Test behavioral data sheet PDF
- [ ] Review PDF templates match DDD requirements

### Phase 4: Polish
- [ ] Add authentication (if needed for multiple users)
- [ ] Set up clock-out reminders
- [ ] Enable push notifications
- [ ] Install as PWA on phone

---

## Success Metrics

You'll know it's working when:
- ✅ Timer counts up smoothly
- ✅ Break buttons pause/resume timer
- ✅ Behavioral logger shows outcomes
- ✅ VP/PP buttons increment counts
- ✅ I/U buttons reset counts and log event
- ✅ Green "Online" indicator shows
- ✅ Data appears in Airtable within 30 seconds
- ✅ Formulas calculate durations correctly
- ✅ No errors in browser console

---

## Support Resources

- **QUICKSTART.md** - Simple 10-minute setup guide
- **AIRTABLE_CSV_TEMPLATES.md** - Copy/paste CSV data
- **AIRTABLE_SCHEMA.md** - Detailed schema reference
- **PHASE_2_COMPLETE.md** - Technical summary
- **Browser Console** - F12 or Cmd+Option+I for errors
- **Airtable API Docs** - https://airtable.com/api

---

## Completion Checklist

### Phase 1: Local Development ✅
- [x] Code structure complete
- [x] Offline database working
- [x] Timer UI functional
- [x] Behavioral logger functional

### Phase 2: Airtable Integration (You Are Here)
- [ ] Airtable base created
- [ ] 5 tables configured
- [ ] CSV data imported
- [ ] API credentials obtained
- [ ] Environment variables set
- [ ] End-to-end test passed

### Phase 3: Production Ready
- [ ] PDF generation working
- [ ] Reports tested
- [ ] Deployed to Vercel
- [ ] Used in production

---

**Current Status:** Ready for Airtable setup

**Estimated Time:** 30 minutes

**Next Action:** Create Airtable base and import CSV data

**Goal:** See real-time data sync from app → Airtable
