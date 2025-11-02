# Production Deployment Info

## Vercel Deployment

**Status:** ✅ Live and Deployed

**URL:** https://ethan-work-logs.samuelholley.com (or Vercel-assigned URL)

**Branch:** main (auto-deploys on push)

**Testing:** User primarily tests on Vercel production deployment

---

## Environment Variables

Ensure these are set in Vercel:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_WORKSESSIONS_TABLE_ID`
- `AIRTABLE_TIMEBLOCKS_TABLE_ID`
- `AIRTABLE_BEHAVIORALEVENTS_TABLE_ID`
- `AIRTABLE_USERS_TABLE_ID`
- `AIRTABLE_OUTCOMES_TABLE_ID`
- `NEXT_PUBLIC_BASE_URL`
- `PASSWORD` (for PasswordGate)

---

## Deployment Process

1. Push to main branch
2. Vercel auto-builds and deploys
3. Test on production URL
4. Monitor for errors in Vercel logs

---

## Critical Notes

- **NO LOCAL TESTING ASSUMPTIONS** - Everything tested on Vercel production
- **Direct API calls** - No offline functionality, requires internet
- **Airtable dependencies** - All features require Airtable API access
- **Mobile-first** - PWA designed for phone usage

---

## Recent Changes (Nov 2025)

- Removed IndexedDB + sync-queue (offline-first approach)
- Changed to direct Airtable API calls on all clock in/out operations
- All data saves immediately to Airtable or shows error
- Consistent architecture: homepage + manual entry use same API pattern
