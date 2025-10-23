# Quick Start Guide

Welcome to the Ethan Work Logger! This guide will get you up and running in 10 minutes.

---

## Step 1: Install Dependencies (2 minutes)

Open Terminal and navigate to the project:

```bash
cd /Users/samuelholley/Projects/ethan-work-logs.samuelholley.com
```

Install all packages:

```bash
npm install
```

You should see:
```
added 320 packages, and audited 321 packages in 15s
```

---

## Step 2: Start Development Server (1 minute)

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Ready in 2.3s
```

Open your browser to: **http://localhost:3000**

---

## Step 3: Test Offline Mode (2 minutes)

### Timer Test:
1. Click **"Clock In"** button
2. Select **"Community Living Support"**
3. Watch the timer count up (00:00:01, 00:00:02, etc.)
4. Click **"Start Break"**
5. Timer stops (you're on break)
6. Click **"End Break"**
7. Timer resumes
8. Click **"Clock Out"**
9. Confirm and timer resets

### Behavioral Logger Test:
1. Clock in first (timer must be active)
2. Click **"Behavioral Logger"** tab
3. Select an outcome from dropdown
4. Click **"VP"** button 2 times (see badge show "2")
5. Click **"PP"** button 1 time (see badge show "1")
6. Click **"Independent (I)"** button
7. Notice counts reset to 0

### Check Local Data:
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab
3. Expand **IndexedDB** → **ethan-work-logs-db**
4. Click **workSessions** → See your session data
5. Click **timeBlocks** → See your time blocks
6. Click **behavioralEvents** → See your logged events

**✅ Success!** The app works fully offline. Data is saved locally.

---

## Step 4: Set Up Airtable (5 minutes)

### Create Airtable Base:
1. Go to https://airtable.com/workspace (login/signup if needed)
2. Click **"+ Add a base"** → **"Start from scratch"**
3. Name it: **"Ethan Work Logs"**

### Import Tables:
Open `AIRTABLE_CSV_TEMPLATES.md` in this project and follow the detailed instructions.

**Quick version:**
1. Create **Users** table → Import 1 row (your name/email)
2. Create **Outcomes** table → Import 4 rows (CLS goals)
3. Create **WorkSessions** table → Leave empty
4. Create **TimeBlocks** table → Leave empty
5. Create **BehavioralEvents** table → Leave empty

### Get API Credentials:
1. Go to https://airtable.com/create/tokens
2. Click **"Create new token"**
3. Name: **"Ethan Work Logs"**
4. Scopes: **data.records:read** + **data.records:write**
5. Access: Select your **"Ethan Work Logs"** base
6. Click **"Create token"**
7. Copy the token (starts with `pat...`)

### Get Base ID:
1. Go to https://airtable.com/api
2. Click your **"Ethan Work Logs"** base
3. Look at the URL: `https://airtable.com/app1234567890abcd/api/docs`
4. Copy the Base ID: `app1234567890abcd`

### Create Environment File:
In your project folder, create a new file named `.env.local`:

```bash
# In Terminal:
nano .env.local
```

Paste this (with your real values):
```env
AIRTABLE_API_KEY=pat_your_actual_token_here
AIRTABLE_BASE_ID=app_your_actual_base_id_here
```

Save (Ctrl+O, Enter, Ctrl+X)

### Update airtable.ts:
Open `/src/lib/airtable.ts` and change lines 8-9:

**Before:**
```typescript
const AIRTABLE_API_KEY = 'placeholder_key'
const AIRTABLE_BASE_ID = 'placeholder_base'
```

**After:**
```typescript
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'placeholder_key'
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'placeholder_base'
```

### Restart Server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Step 5: Test Airtable Sync (2 minutes)

1. Clock in again
2. Work for 30 seconds
3. Log a behavioral event (VP + I)
4. Clock out
5. Wait 30 seconds for background sync
6. Go to Airtable → Check **WorkSessions** table
7. You should see your session!
8. Check **TimeBlocks** table → See your time blocks
9. Check **BehavioralEvents** table → See your VP/I event

**✅ Success!** Data is syncing to Airtable!

---

## Troubleshooting

### TypeScript Errors in VS Code?
Run: `npm install` to install all types.

### "Cannot find module 'react'" error?
Run: `npm install` to install dependencies.

### Timer not starting?
Check browser console (F12) for errors.

### No data in Airtable?
1. Check `.env.local` file exists
2. Verify API key and Base ID are correct
3. Check browser console for API errors
4. Make sure you waited 30 seconds for sync

### Sync failing?
1. Check you're online (see green indicator)
2. Check Airtable API token has correct scopes
3. Check Base ID matches your base
4. Look for red "Syncing..." indicator

---

## Daily Usage

### Start Your Shift:
1. Open app: http://localhost:3000
2. Click "Clock In"
3. Select service type (CLS or Supported Employment)
4. Timer starts automatically

### During Your Shift:
- **Take a break**: Click "Start Break"
- **Resume work**: Click "End Break"
- **Log behavior**: Switch to "Behavioral Logger" tab
  - Select outcome
  - Press VP/PP as needed
  - Press I when independent or U when unsuccessful

### End Your Shift:
1. Click "Clock Out"
2. Confirm
3. Data syncs to Airtable within 30 seconds

### View Your Data:
Go to Airtable → "Ethan Work Logs" base → Check all tables

---

## Features Overview

### Timer Tab ⏱️
- **Clock In/Out**: One-tap time tracking
- **Service Type**: CLS or Supported Employment
- **Break Management**: Pause/resume timer
- **Live Display**: See elapsed time in HH:MM:SS
- **Status Indicators**: Online/Offline, Sync status

### Behavioral Logger Tab 📊
- **Outcome Selection**: Choose from your goals
- **Prompt Tracking**: VP (Verbal) and PP (Physical)
- **Success Logging**: I (Independent) or U (Unsuccessful)
- **Count Display**: See total prompts before logging
- **Quick Reset**: Clear counts with one tap

### Offline Mode 💾
- **Works Everywhere**: No internet required
- **Auto Sync**: Data uploads when online
- **Never Lose Data**: Everything saved locally first

---

## What's Next?

### Phase 3 (Coming Soon):
- 📄 **PDF Reports**: Generate timesheets and data sheets
- 📅 **Weekly View**: See Tue-Mon billing week summaries
- 📧 **Email Reports**: Send PDFs directly
- 📊 **Analytics**: Visual charts of outcomes

### Phase 4 (Future):
- 🔒 **Authentication**: Secure login
- 👥 **Multi-User**: Multiple caregivers
- 📱 **PWA**: Install as mobile app
- 🔔 **Notifications**: Clock-out reminders

---

## Support

### Documentation:
- `AIRTABLE_CSV_TEMPLATES.md` - Detailed Airtable setup
- `AIRTABLE_SCHEMA.md` - Database structure reference
- `PHASE_2_COMPLETE.md` - Technical summary
- `IMPLEMENTATION_PLAN.md` - Full roadmap

### Data Location:
- **Local**: DevTools → Application → IndexedDB → `ethan-work-logs-db`
- **Cloud**: Airtable → "Ethan Work Logs" base

### Reset Everything:
If you need to start fresh:
1. DevTools → Application → IndexedDB → Delete `ethan-work-logs-db`
2. DevTools → Application → Local Storage → Delete `ethan-timer-storage`
3. Refresh page

---

## Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

---

## Success Checklist

- [ ] Dependencies installed (`npm install` ran successfully)
- [ ] Dev server running (`npm run dev`)
- [ ] App loads at http://localhost:3000
- [ ] Can clock in/out
- [ ] Timer counts up correctly
- [ ] Can log behavioral events
- [ ] DevTools shows data in IndexedDB
- [ ] Airtable base created
- [ ] CSV data imported (Users + Outcomes)
- [ ] API credentials obtained
- [ ] `.env.local` file created
- [ ] Data syncing to Airtable

---

**🎉 You're all set!** Start tracking your work with confidence.
