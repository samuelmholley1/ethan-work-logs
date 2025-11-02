# Common Issues & Quick Fixes

## 🔥 **PRODUCTION TROUBLESHOOTING GUIDE**

---

## Issue: "Already have an active session" error

**Cause:** Session in Airtable still marked as Active

**Fix:**
1. Open Airtable WorkSessions table
2. Find today's session for user
3. Change Status from 'Active' to 'Completed'
4. Try clocking in again

**Prevention:** Always clock out properly

---

## Issue: Timer shows wrong time after returning to app

**Cause:** Device went to sleep, timer calculation off

**Fix:**
1. Clock out
2. Go to Manual Entry page
3. Enter correct times manually
4. Clock in again for new session

**Prevention:** None - this is a known limitation. Use manual entry if gone for long periods.

---

## Issue: "Invalid session ID" when starting break

**Cause:** Session was deleted from Airtable or doesn't exist

**Fix:**
1. Clock out (will show error but try anyway)
2. Clear browser cache/localStorage
3. Refresh page
4. Clock in again

**Tech Fix:**
```javascript
// In browser console:
localStorage.removeItem('ethan-timer-storage')
location.reload()
```

---

## Issue: PDF shows no data

**Cause:** Data not syncing to Airtable (shouldn't happen with new direct API approach)

**Fix:**
1. Check Airtable tables directly
2. If data is there, try PDF export again
3. If data missing, log manually via Manual Entry page

**Prevention:** Always verify clock in/out shows success message

---

## Issue: Can't clock in - no response

**Cause:** Internet connection issue or Airtable API down

**Fix:**
1. Check internet connection
2. Try refreshing page
3. Check if Airtable status page shows issues
4. Use Manual Entry as backup

**Tech Check:**
```bash
# Test Airtable API
curl https://api.airtable.com/v0/meta/bases -H "Authorization: Bearer YOUR_KEY"
```

---

## Issue: Behavioral event logged but not showing in PDF

**Cause:** Event not linked to session, or wrong date filter

**Fix:**
1. Check Airtable BehavioralEvents table
2. Verify event has WorkSessions link
3. Check if event timestamp matches session date
4. Try exporting PDF for different date range

---

## Issue: Edited time on Summary page not saving

**Cause:** Time validation failed or network error

**Fix:**
1. Check that end time is after start time
2. Check that times are reasonable (not 24+ hours apart)
3. Check browser console for errors
4. Try editing again with valid times

---

## Issue: Vercel deployment failed

**Cause:** Build error or environment variables missing

**Fix:**
1. Check Vercel deployment logs
2. Verify all environment variables set in Vercel dashboard:
   - AIRTABLE_API_KEY
   - AIRTABLE_BASE_ID
   - AIRTABLE_WORKSESSIONS_TABLE_ID
   - AIRTABLE_TIMEBLOCKS_TABLE_ID
   - AIRTABLE_BEHAVIORALEVENTS_TABLE_ID
   - AIRTABLE_USERS_TABLE_ID
   - AIRTABLE_OUTCOMES_TABLE_ID
   - PASSWORD
3. Re-deploy from Vercel dashboard

---

## Issue: Duplicate sessions in Airtable

**Cause:** User clicked Clock In multiple times quickly, or duplicate prevention failed

**Fix:**
1. Identify duplicate sessions in Airtable
2. Delete the duplicate(s) with fewer/no time blocks
3. Keep the one with most data
4. Mark correct one as Active or Completed as appropriate

**Prevention:** Wait for success message before clicking again

---

## Issue: Times showing in wrong timezone in PDF

**Cause:** Timezone mismatch between browser and Airtable

**Fix:**
1. Check browser timezone settings
2. Verify times in Airtable are correct
3. All times should be stored as ISO 8601 with timezone
4. May need to adjust time block times manually in Airtable

---

## Issue: "Failed to create time block" on clock in

**Cause:** Session created but time block failed

**Fix:**
1. Find the session in Airtable (should exist with Status='Active')
2. Note the session ID
3. In browser console:
```javascript
// Manual create time block
fetch('/api/time-blocks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'SESSION_ID_HERE',
    startTime: new Date().toISOString()
  })
}).then(r => r.json()).then(console.log)
```
4. Or use Manual Entry to log time after the fact

---

## Emergency Recovery: Nuclear Option

If everything is broken:

```javascript
// 1. Clear local state
localStorage.clear()

// 2. Refresh
location.reload()

// 3. Use Manual Entry for all time logging until fixed
```

Then:
1. Check Airtable for any orphaned Active sessions → mark Completed
2. Check for any time blocks without EndTime → set to now or delete
3. Start fresh with clock in

---

## Monitoring Checklist

**Daily checks:**
- [ ] Any Active sessions from previous days? (should be Completed)
- [ ] Any time blocks without EndTime from previous days? (data error)
- [ ] Any behavioral events without WorkSessions link? (orphaned)

**Weekly checks:**
- [ ] Review Vercel deployment logs for errors
- [ ] Check Airtable API usage (stay under rate limits)
- [ ] Test full clock in/out flow on production

---

## When to Escalate

Contact developer if:
1. Airtable API consistently failing (check status page first)
2. Vercel deployment won't build (check logs)
3. Data corruption in Airtable (duplicate sessions, missing time blocks)
4. Critical bug preventing time logging (use Manual Entry as workaround)

---

## Developer Quick Debugging

**Check Vercel logs:**
```bash
vercel logs ethan-work-logs --follow
```

**Check Airtable directly:**
1. WorkSessions: Filter by Status='Active' and Date=today
2. TimeBlocks: Filter by EndTime is empty
3. BehavioralEvents: Filter by today's Timestamp

**Check API health:**
```bash
# Test session creation
curl -X POST https://ethan-work-logs.vercel.app/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-11-01","serviceType":"CLS","userId":"USER_ID"}'
```

**Rollback if needed:**
```bash
git revert HEAD
git push origin main
```
