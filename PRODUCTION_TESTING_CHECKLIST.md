# Production Testing Checklist - Ethan Work Logs

**Production URL**: https://ethan-work-logs.samuelholley.com  
**Testing Date**: October 29, 2025  
**Deployment**: Commit 364da89 (successful)  
**Tester**: CEO

---

## ✅ Deployment Status

- [x] **Site is live** - https://ethan-work-logs.samuelholley.com responding
- [x] **Latest commit deployed** - 364da89 (redeploy after NPM 502 error)
- [x] **Critical fixes included**:
  - [x] Timer counting bug fix (useEffect dependencies)
  - [x] Environment variable naming standardization (Airtable sync)

---

## Testing Instructions

### How to Test:
1. Open production URL: https://ethan-work-logs.samuelholley.com
2. Open browser DevTools (F12 or Cmd+Option+I on Mac)
3. Go to Console tab to monitor Airtable sync
4. Follow each workflow below
5. Check off each item as you test
6. Report any failures immediately

---

## Core Workflows

### 1. Clock In Workflow ⏱️

**Expected Behavior**: Timer starts counting, service selector appears, data syncs to Airtable

- [ ] **Open app** - Shows "Not Clocked In" with 00:00:00
- [ ] **Click "Clock In" button** - Button becomes disabled momentarily
- [ ] **Verify timer starts** - Should show 00:00:01, 00:00:02, 00:00:03...
- [ ] **Check console** - Should see "Clocked in: {object}" with sessionId
- [ ] **Service selector appears** - CLS and Supported Employment buttons show
- [ ] **Select a service** - Can select either CLS or Supported Employment
- [ ] **Check Airtable sync** - Console should show successful sync (no 404 errors)
- [ ] **Verify can't clock in twice** - Clock In button should be hidden/disabled

**🔴 CRITICAL**: If timer stays at 00:00:00, this is the bug we fixed. Report immediately.  
**🔴 CRITICAL**: If console shows 404 errors with "placeholder_base", env variables not working.

---

### 2. Behavioral Logging Workflow 📊

**Expected Behavior**: Can log behavioral events while clocked in, data syncs to Airtable

- [ ] **Switch to Behavioral Logger tab** - Click "📊 Behavioral Logger" button
- [ ] **Outcomes load** - Should see list of behavioral outcomes (e.g., "Follow Instructions", etc.)
- [ ] **Select an outcome** - Click on one of the outcomes
- [ ] **VP/PP/I/U buttons appear** - Four logging buttons show
- [ ] **Click VP button** - Should see success toast "Logged: [Outcome] - VP"
- [ ] **Check count updated** - VP count should show 1/VP
- [ ] **Try PP button** - Should see "Logged: [Outcome] - PP"
- [ ] **Try I button** - Should see "Logged: [Outcome] - I"
- [ ] **Try U button** - Should see "Logged: [Outcome] - U"
- [ ] **Check recent events** - Should see list of recent events with timestamps
- [ ] **Test comment** - Click comment icon, add note, verify saves
- [ ] **Check Airtable sync** - Console should show behavioral event syncs

**🟡 MEDIUM**: If outcomes don't load, check Airtable connection.  
**🟢 NICE**: If comments work, this is bonus functionality.

---

### 3. Break Workflow ☕

**Expected Behavior**: Break pauses timer, end break resumes, no data loss

- [ ] **While clocked in, click "Start Break"** - Button should appear when clocked in
- [ ] **Verify timer pauses** - Timer should stop incrementing
- [ ] **Check status** - Should show "On Break" indicator
- [ ] **Wait 5 seconds** - Timer should remain frozen
- [ ] **Click "End Break"** - Resume button appears
- [ ] **Verify timer resumes** - Should continue from where it paused
- [ ] **Check no data loss** - Previous behavioral events still visible
- [ ] **Check Airtable** - Break should be recorded

**🟢 LOW**: Break functionality is supplementary, not critical path.

---

### 4. Clock Out Workflow 🏁

**Expected Behavior**: Shows confirmation, saves all data, clears state, syncs to Airtable

- [ ] **Click "Clock Out" button** - Should be available after clocking in
- [ ] **Confirmation appears** - Shows total time worked
- [ ] **Verify time accurate** - Should match timer display (rounded to 15 min)
- [ ] **Click confirm** - Completes clock out
- [ ] **Check success toast** - "Session ended successfully" message
- [ ] **Verify state cleared** - Timer resets to 00:00:00
- [ ] **Check "Not Clocked In" status** - Back to initial state
- [ ] **Check Airtable sync** - Console shows session saved
- [ ] **Check local storage cleared** - DevTools > Application > Local Storage should be clean

**🔴 CRITICAL**: If session doesn't save to Airtable, this is a blocker.

---

### 5. Summary/Export Workflow 📄

**Expected Behavior**: Summary page shows data, week navigation works, PDFs generate

- [ ] **Click "📊 Summary" button** - Navigate to summary page
- [ ] **Check timesheet section** - Should show work sessions
- [ ] **Check behavioral tally** - Should show VP/PP/I/U counts by outcome
- [ ] **Week navigation** - "Previous Week" and "Next Week" buttons work
- [ ] **Select different week** - Data updates for selected week
- [ ] **Click "Download Timesheet PDF"** - PDF generation starts
- [ ] **Verify PDF downloads** - File downloads with proper name
- [ ] **Open PDF** - Timesheet matches physical template (IMG_2608.jpg)
- [ ] **Check PDF data accuracy** - Times, dates, durations correct
- [ ] **15-minute rounding** - Times rounded properly (5:20 → 5:15, 5:23 → 5:30)
- [ ] **Click "Download Behavioral PDF"** - Behavioral sheet generates
- [ ] **Open behavioral PDF** - Matches physical template (IMG_2609.jpg)
- [ ] **Check behavioral data** - VP/PP/I/U counts accurate

**🔴 CRITICAL**: PDF generation is the #1 feature requirement. Must work flawlessly.  
**🔴 CRITICAL**: PDFs must match physical templates exactly.

---

### 6. Manual Entry Workflow ✍️

**Expected Behavior**: Can create past entries, validation works, syncs to Airtable

- [ ] **Click "+ Manual Entry" button** - Navigate to manual entry page
- [ ] **Select a date** - Pick a past date (within 1 year)
- [ ] **Add time block** - Fill in start time, end time, outcome
- [ ] **Try invalid time** - End time before start time (should error)
- [ ] **Try future date** - Should be blocked
- [ ] **Try date > 1 year ago** - Should be blocked
- [ ] **Add valid entry** - Proper date and times
- [ ] **Submit** - Should see success message
- [ ] **Check Airtable** - Manual entry synced
- [ ] **Return to summary** - Manual entry appears in timesheet

**🟡 MEDIUM**: Manual entry is important for retroactive logging.

---

### 7. Offline Workflow 🔌

**Expected Behavior**: Works offline, queues data, syncs when online

- [ ] **While clocked in, go offline** - Turn off WiFi or use DevTools offline mode
- [ ] **Check offline indicator** - Should show "Offline" status
- [ ] **Log behavioral event** - Should still work locally
- [ ] **Check toast** - "Saved locally - will sync when online"
- [ ] **Try to generate PDF** - Should show warning "PDFs require internet"
- [ ] **Go back online** - Turn WiFi back on
- [ ] **Check auto-sync** - Should see "Syncing..." then "Synced"
- [ ] **Verify no data loss** - All offline events now in Airtable
- [ ] **PDF generation works** - Can now generate PDFs

**🟢 NICE**: Offline functionality is excellent but not critical for first use.

---

### 8. Error/Edge Case Handling 🛡️

**Expected Behavior**: Graceful error handling, helpful messages

- [ ] **Invalid input** - Enter letters in time field (should prevent or error)
- [ ] **Very long name** - Enter 500 character outcome name (should truncate)
- [ ] **XSS attempt** - Try `<script>alert('xss')</script>` in comment (should escape)
- [ ] **Rapid clicks** - Click behavioral logging buttons 10x fast (should handle)
- [ ] **Empty session** - Clock in then immediately clock out (should handle)
- [ ] **Browser refresh** - Refresh page while clocked in (should restore state)
- [ ] **Multiple tabs** - Open app in 2 tabs, clock in both (should sync state)

**🟡 MEDIUM**: Edge cases are important for production robustness.

---

## Browser Compatibility

Test on multiple browsers (if available):

- [ ] **Chrome** (Desktop)
- [ ] **Safari** (Desktop)
- [ ] **Firefox** (Desktop)
- [ ] **Edge** (Desktop)
- [ ] **Safari** (iOS - iPhone/iPad)
- [ ] **Chrome** (Android)

**🟡 MEDIUM**: Primary browser is most important, others nice to have.

---

## Performance Testing

- [ ] **Initial load time** - App loads in < 3 seconds
- [ ] **Timer performance** - No lag or stuttering
- [ ] **Behavioral logging speed** - Events log instantly
- [ ] **PDF generation time** - < 10 seconds for normal week
- [ ] **Large dataset** - Test with 100+ behavioral events (speed acceptable?)

**🟢 LOW**: Performance is good, but not critical for MVP.

---

## Success Criteria

### ✅ PASS (Ready for Production)
- Timer counts correctly ✓
- Airtable sync working ✓
- Behavioral logging functional ✓
- Clock in/out workflow complete ✓
- PDFs generate and match templates ✓
- No critical errors in console ✓

### ⚠️ CONDITIONAL PASS (Minor Issues)
- Offline mode has glitches (can launch anyway)
- Some browsers have quirks (primary browser works)
- Edge cases exist but rare (can fix later)

### ❌ FAIL (Needs Fixes)
- Timer doesn't count (critical bug)
- Airtable sync fails (can't save data)
- PDFs don't generate (core requirement missing)
- App crashes or unusable (major stability issue)

---

## Reporting Results

### If Everything Passes ✅
Reply: "PRODUCTION TESTING COMPLETE - ALL SYSTEMS GO ✅"

Include:
- Which browser(s) you tested
- Any minor quirks noticed
- Overall impression

### If Issues Found ❌
Reply: "PRODUCTION TESTING - ISSUES FOUND ⚠️"

For each issue, provide:
1. **Severity**: Critical 🔴 / Medium 🟡 / Low 🟢
2. **Workflow**: Which section above
3. **What happened**: Describe the issue
4. **Console errors**: Copy/paste any errors from DevTools console
5. **Screenshots**: If helpful

Example:
```
🔴 CRITICAL - Timer Workflow
- Timer stays at 00:00:00 after clock in
- Console error: "TypeError: Cannot read property 'activeSessionId' of undefined"
- Screenshot: [attach]
```

---

## Next Steps After Testing

### If All Tests Pass:
1. App is production-ready ✅
2. Begin Week 1 component extraction (Modal, Progress, Toast)
3. Schedule with CTO for component extraction kickoff

### If Critical Issues Found:
1. CSE fixes critical bugs immediately
2. Redeploy fixed version
3. Retest critical workflows
4. Proceed once stable

### If Minor Issues Found:
1. Document issues in GitHub Issues
2. Triage: Fix now vs. fix in Week 1-4
3. Proceed with component extraction if app usable

---

## Testing Notes

**Date Tested**: _________________  
**Tester Name**: _________________  
**Browser Used**: _________________  
**Overall Result**: ⭐⭐⭐⭐⭐ (1-5 stars)

**Additional Comments**:
```
[Write any additional observations, suggestions, or feedback here]
```

---

**READY TO TEST!** 🚀

Open https://ethan-work-logs.samuelholley.com and start with Workflow #1 (Clock In).
