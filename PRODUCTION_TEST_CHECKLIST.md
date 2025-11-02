# Production Testing Checklist

## 🎯 Goal: Zero Troubleshooting Required

Test on: **Vercel Production Deployment**

---

## ✅ **CRITICAL PATH TESTS**

### 1. Clock In Flow
- [ ] Open homepage
- [ ] Click "Clock In"
- [ ] Select "Community Living Support"
- [ ] Verify: Success confirmation shown
- [ ] Verify: Timer starts counting
- [ ] **CHECK AIRTABLE:** Session created with Status='Active'
- [ ] **CHECK AIRTABLE:** Time block created with StartTime (no EndTime)
- [ ] Refresh page → timer should resume from localStorage

### 2. Break Flow
- [ ] While clocked in, click "Start Break"
- [ ] Verify: Timer stops, shows "On Break"
- [ ] **CHECK AIRTABLE:** Time block EndTime now populated
- [ ] Click "End Break"
- [ ] Verify: Timer resumes
- [ ] **CHECK AIRTABLE:** New time block created

### 3. Clock Out Flow
- [ ] Click "Clock Out"
- [ ] Verify: Confirmation modal shows total time worked
- [ ] Click confirm
- [ ] Verify: Success message, timer resets
- [ ] **CHECK AIRTABLE:** Final time block has EndTime
- [ ] **CHECK AIRTABLE:** Session Status='Completed'

### 4. Summary Page
- [ ] Navigate to /summary
- [ ] Verify: Today's session appears immediately
- [ ] Verify: Time blocks show correct times
- [ ] Verify: Total hours calculated correctly
- [ ] Click "Export Timesheet PDF"
- [ ] **CHECK PDF:** NCLR billing format (31 rows, yellow box)
- [ ] **CHECK PDF:** Today's times populated in correct row (day of month)

### 5. Behavioral Logging
- [ ] Clock in first
- [ ] Switch to "Behavioral Logger" tab
- [ ] Log an event (e.g., "Toileting" - VP, 0 prompts)
- [ ] Verify: Success message
- [ ] **CHECK AIRTABLE:** Event created with WorkSessions link
- [ ] Check summary page → event should appear in behavioral section
- [ ] Click "Export Behavioral PDF"
- [ ] **CHECK PDF:** Event appears in comments section

---

## 🛡️ **ERROR HANDLING TESTS**

### 6. Duplicate Clock-In Prevention
- [ ] Clock in successfully
- [ ] Try to clock in again (refresh page first)
- [ ] **EXPECTED:** Error: "You already have an active session"
- [ ] **VERIFY:** No duplicate session in Airtable

### 7. Offline Error Handling
- [ ] Turn off WiFi / enable airplane mode
- [ ] Try to clock in
- [ ] **EXPECTED:** User-friendly error about connection
- [ ] Turn WiFi back on
- [ ] Try again → should work

### 8. Invalid State Recovery
- [ ] Manually delete active session from Airtable (while app shows clocked in)
- [ ] Try to start break
- [ ] **EXPECTED:** Error: "Invalid session ID"
- [ ] App should handle gracefully (no crash)

---

## 📊 **DATA INTEGRITY TESTS**

### 9. Manual Entry Still Works
- [ ] Go to /manual-entry
- [ ] Enter yesterday's time: 9:00 AM - 5:00 PM, CLS
- [ ] Click "Log Time"
- [ ] **CHECK AIRTABLE:** Session created with Status='Completed'
- [ ] **CHECK AIRTABLE:** Time block created with both times
- [ ] Go to /summary → yesterday's entry should appear

### 10. Edit Timesheet Still Works
- [ ] Go to /summary
- [ ] Click "Edit Timesheet"
- [ ] Change a time (e.g., 9:00 AM → 9:15 AM)
- [ ] Click "Save Changes"
- [ ] **CHECK AIRTABLE:** Time block updated
- [ ] Refresh page → change persists

---

## 🔒 **VALIDATION TESTS**

### 11. Session Validation
- [ ] Open browser console
- [ ] Try to POST to /api/time-blocks with fake sessionId
- [ ] **EXPECTED:** 404 error "Invalid session ID"

### 12. Time Block Validation
- [ ] Try to create time block with endTime before startTime
- [ ] **EXPECTED:** 400 error "End time must be after start time"

---

## 📱 **MOBILE/PWA TESTS**

### 13. Mobile Experience
- [ ] Open on iPhone/Android
- [ ] Add to Home Screen
- [ ] Open from home screen icon
- [ ] Test full clock in/out flow on mobile
- [ ] Verify: Touch targets large enough
- [ ] Verify: No horizontal scrolling

### 14. Background/Foreground
- [ ] Clock in on mobile
- [ ] Switch to another app for 5 minutes
- [ ] Return to app
- [ ] **VERIFY:** Timer continues from correct time
- [ ] **VERIFY:** localStorage persists state

---

## 🎨 **UX/UI POLISH TESTS**

### 15. Visual Confirmation
- [ ] Clock in → see visual feedback
- [ ] Clock out → see confirmation modal
- [ ] Start/end break → see state change
- [ ] All buttons show loading state during API calls

### 16. PDF Export Buttons
- [ ] Go to /summary
- [ ] **VERIFY:** PDF buttons at TOP of page (not bottom)
- [ ] Both buttons easily accessible

---

## 🚨 **EDGE CASES**

### 17. Long Session Warning
- [ ] Clock in
- [ ] Manually set localStorage lastUpdateTime to 17 hours ago
- [ ] Refresh page
- [ ] **EXPECTED:** Warning about long session (logged to console)
- [ ] Clock out should still work

### 18. Midnight Crossing
- [ ] Clock in at 11:45 PM
- [ ] Wait until after midnight (or manually adjust times in Airtable)
- [ ] Clock out at 12:15 AM
- [ ] **VERIFY:** Session date is from clock-in date
- [ ] **VERIFY:** Time blocks span midnight correctly

---

## ✅ **PASS CRITERIA**

All checkboxes checked = **READY FOR ETHAN**

If any test fails:
1. Note the failure
2. Check Vercel logs for errors
3. Check Airtable for data corruption
4. Report issue for fix

---

## 🔧 **Quick Debugging**

**Check Airtable:**
- WorkSessions table → Status should be 'Active' or 'Completed'
- TimeBlocks table → Should have StartTime, EndTime (or null if active)
- BehavioralEvents table → Should link to WorkSessions

**Check Browser Console:**
- Any red errors?
- Check Network tab → API calls returning 200?

**Check localStorage:**
- Key: `ethan-timer-storage`
- Should have activeSessionId, activeTimeBlockId (if clocked in)

---

## 📞 **Support Checklist for Ethan**

If Ethan encounters issue:
1. "Are you connected to internet?"
2. "Try refreshing the page"
3. "Check if you have an active session in Airtable"
4. "Try clocking out and in again"
5. If all else fails: "Use manual entry page as backup"
