# 🕐 Ethan Work Logger# Liturgist Signup - Ukiah United Methodist Church



> **Offline-first time tracking and behavioral data logging for caregivers**A modern Next.js web application for managing liturgist signups for worship services at Ukiah United Methodist Church. Features a beautiful calendar interface, multiple signup roles, and real-time Airtable integration.



A production-ready caregiver logging system with automatic Airtable sync, built with Next.js 14, TypeScript, and Dexie.js.## 🌟 Features



---### User-Facing

- **Interactive Pinned Calendar** - Month view that follows you as you scroll

## ✨ Features- **Three Signup Types Per Service**:

  - Main Liturgist

### ⏱️ Timer  - Backup Liturgist

- Clock in/out with one tap  - Church Attendance tracking

- Service type selection (CLS / Supported Employment)- **Calendar-Service Sync** - Hover over services to highlight dates on calendar

- Live elapsed time display (HH:MM:SS)- **Click-to-Scroll** - Click calendar dates to jump to that service

- Break management (pause/resume)- **Responsive Design** - Works beautifully on desktop, tablet, and mobile

- Automatic time block tracking- **Real-time Data** - All signups saved instantly to Airtable



### 📊 Behavioral Logger### Admin Features

- Outcome-based event logging- **Liturgist Directory** (`/admin`) - Complete contact list with copy-to-clipboard

- Stateful prompt tracking (VP/PP)- **Airtable Backend** - View and manage all data in spreadsheet format

- Instant success logging (I/U)- **Email Integration** - All liturgist emails organized and accessible

- Count badges and quick reset

- Haptic feedback## 🏗️ Technology Stack



### 💾 Offline-First- **Next.js 14** - React framework with App Router

- Works without internet connection- **React 18** - UI library with hooks

- All data saved locally first (IndexedDB)- **TypeScript** - Full type safety

- Automatic sync every 30 seconds when online- **Tailwind CSS** - Utility-first styling

- Never lose data- **Airtable** - Database and backend

- Sync status indicators- **npm** - Package management

- **Vercel** - Deployment platform

### 📅 DDD Compliant

- Tue-Mon billing weeks (not standard Mon-Sun)## 📁 Project Structure

- 15-minute time rounding

- Outcome-based data collection```

- Multi-user ready from day onesrc/

├── app/

---│   ├── page.tsx           # Main signup interface (pinned calendar + services)

│   ├── layout.tsx         # Root layout

## 🚀 Quick Start│   ├── admin/

│   │   └── page.tsx       # Liturgist directory (/admin)

### 1. Install Dependencies│   ├── schedule/

```bash│   │   └── page.tsx       # Legacy schedule view

npm install│   ├── signup/

```│   │   └── page.tsx       # Legacy signup page

│   └── api/

### 2. Start Development Server│       ├── signup/

```bash│       │   └── route.ts   # POST endpoint for new signups

npm run dev│       └── services/

```│           └── route.ts   # GET endpoint for fetching services

├── admin/

Open http://localhost:3000│   ├── liturgists.ts      # Master liturgist contact list (10 people)

│   └── README.md          # Admin directory documentation

### 3. Test Locally (No Airtable Required)├── components/

- Clock in → Timer starts│   └── Header.tsx         # (Currently unused)

- Log events → Data saves to IndexedDB├── lib/

- Clock out → Session complete│   └── airtable.ts        # Airtable SDK wrapper and helper functions

└── types/

### 4. Set Up Airtable (Optional)    └── liturgist.ts       # TypeScript type definitions

See **[CEO_CHECKLIST.md](CEO_CHECKLIST.md)** for detailed setup instructions.

public/

---├── logo-for-church-larger.jpg  # Church logo

└── sw.js                       # Service worker (PWA support)

## 📖 Documentation```



| Document | Purpose | Read Time |## 🚀 Getting Started

|----------|---------|-----------|

| **[QUICKSTART.md](QUICKSTART.md)** | 10-minute setup guide | 5 min |### Prerequisites

| **[CEO_CHECKLIST.md](CEO_CHECKLIST.md)** | Step-by-step action items | 10 min |

| **[AIRTABLE_CSV_TEMPLATES.md](AIRTABLE_CSV_TEMPLATES.md)** | Copy/paste CSV data | 5 min |- Node.js 18+

| **[SUMMARY.md](SUMMARY.md)** | Executive summary | 5 min |- npm or yarn

| **[PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)** | Technical details | 15 min |- Airtable account (free tier works)

| **[AIRTABLE_SCHEMA.md](AIRTABLE_SCHEMA.md)** | Database schema | 10 min |

### Installation

---

1. **Clone the repository**

## 🏗️ Architecture   ```bash

   git clone https://github.com/samuelmholley1/liturgists.ukiahumc.org.git

```   cd liturgists.ukiahumc.org

┌─────────────────────────────────────────────────────┐   ```

│                   USER INTERFACE                    │

│  ┌──────────────┐         ┌───────────────────┐   │2. **Install dependencies**

│  │    Timer     │         │ Behavioral Logger │   │   ```bash

│  │  Component   │         │    Component      │   │   npm install

│  └──────┬───────┘         └────────┬──────────┘   │   ```

│         └──────────┬───────────────┘               │

└────────────────────┼─────────────────────────────┬─┘3. **Set up environment variables**

                     ▼                              │   

            ┌────────────────┐                      │   Create `.env.local` in the root directory:

            │ Zustand Store  │◄─────────────────────┘   ```env

            │ (timer-store)  │  localStorage   AIRTABLE_PAT_TOKEN=your_pat_token_here

            └────────┬───────┘  persistence   AIRTABLE_BASE_ID=your_base_id_here

                     ▼   AIRTABLE_TABLE_NAME=liturgists.ukiahumc.org

            ┌────────────────┐   ```

            │   IndexedDB    │  Dexie.js

            │  (offline-db)  │  5 tables4. **Run the development server**

            └────────┬───────┘   ```bash

                     ▼   npm run dev

            ┌────────────────┐   ```

            │  Sync Queue    │  Every 30s

            │ (sync-queue)   │  Auto-retry5. **Open in browser**

            └────────┬───────┘   Navigate to [http://localhost:3000](http://localhost:3000)

                     ▼

            ┌────────────────┐### Available Scripts

            │  Airtable API  │  REST API

            │  (airtable)    │  5 tables- `npm run dev` - Start development server

            └────────────────┘- `npm run build` - Build for production

```- `npm start` - Start production server

- `npm run lint` - Run ESLint

---- `npm run type-check` - Run TypeScript type checking



## 🗄️ Database Schema## 🗄️ Airtable Setup



### Airtable Tables (5):### Table Structure

1. **Users** - Caregivers and admin users

2. **Outcomes** - Behavioral goals (filtered by service type)Your Airtable base should have a table named `liturgists.ukiahumc.org` with these fields:

3. **WorkSessions** - Clock in/out records

4. **TimeBlocks** - Time tracking with breaks| Field Name | Field Type | Options |

5. **BehavioralEvents** - VP, PP, I, U events|------------|------------|---------|

| Service Date | Date | Date only |

### IndexedDB Tables (5):| Display Date | Single line text | - |

- Same structure as Airtable| Name | Single line text | - |

- Additional fields: `syncStatus`, `syncError`, `airtableId`| Email | Email | - |

| Phone | Phone number | - |

---| Role | Single select | Liturgist, Backup, Attendance |

| Attendance Status | Single select | Yes, No, Maybe |

## 🛠️ Tech Stack| Notes | Long text | - |

| Submitted At | Date | Include time |

| Category | Technology |

|----------|-----------|### Getting Credentials

| Framework | Next.js 14 (App Router) |

| Language | TypeScript |1. **PAT Token**: https://airtable.com/create/tokens

| Styling | Tailwind CSS |   - Create token with `data.records:read` and `data.records:write` scopes

| State Management | Zustand |   - Add access to your base

| Offline Storage | Dexie.js (IndexedDB) |

| Database | Airtable |2. **Base ID**: https://airtable.com/api

| Date Utils | date-fns |   - Click on your base

| PDF Generation | @react-pdf/renderer |   - Find the Base ID (starts with `app...`)

| Deployment | Vercel |

See `AIRTABLE_SETUP.md` for detailed instructions.

---

## 🌐 Deployment

## 📂 Project Structure

### Vercel (Recommended)

```

src/1. **Push code to GitHub**

├── app/   ```bash

│   ├── layout.tsx              # Root layout   git add .

│   └── page.tsx                # Main app page   git commit -m "Ready for deployment"

├── components/   git push origin main

│   ├── Timer.tsx               # Timer UI   ```

│   └── BehavioralLogger.tsx    # Behavioral logger UI

├── lib/2. **Deploy to Vercel**

│   ├── offline-db.ts           # IndexedDB schema   - Visit https://vercel.com

│   ├── sync-queue.ts           # Background sync   - Import your GitHub repository

│   ├── timer-store.ts          # Zustand store   - Add environment variables (see `VERCEL_DEPLOYMENT.md`)

│   ├── billing-week.ts         # Tue-Mon calculations   - Deploy!

│   └── airtable.ts             # Airtable API wrapper

└── types/Environment variables needed:

    └── worklog.ts              # TypeScript types- `AIRTABLE_PAT_TOKEN`

```- `AIRTABLE_BASE_ID`

- `AIRTABLE_TABLE_NAME`

---

## 👥 Liturgist Data

## 📊 Data Flow

The app tracks **10 liturgists**:

### Clock In Flow:

```**Regular (6):**

User clicks "Clock In"- Kay Lieberknecht

  → Select service type (CLS / Supported Employment)- Linda Nagel

  → timer-store.clockIn(serviceType, userId)- Lori

  → Create WorkSession in IndexedDB (syncStatus: 'pending')- Doug Pratt

  → Create first TimeBlock in IndexedDB (syncStatus: 'pending')- Gwen Hardage-Vergeer

  → Update Zustand state (activeSessionId, elapsedSeconds)- Mikey Pitts KLMP

  → Persist to localStorage

  → UI updates (timer starts counting)**Occasional (4):**

  → [30s later] Sync queue wakes up- Paula Martin

  → Create WorkSession in Airtable- Patrick Okey

  → Update IndexedDB (syncStatus: 'synced', airtableId: 'rec123')- Vicki Okey

  → Create TimeBlock in Airtable (linked to WorkSession)- Chad Raugewitz

  → Update IndexedDB (syncStatus: 'synced')

```All contact information is stored in `/src/admin/liturgists.ts`



### Behavioral Event Flow:## 📚 Key Files Explained

```

User selects outcome### `/src/app/page.tsx`

  → Press VP button 2x (count shows "2")Main interface with:

  → Press PP button 1x (count shows "1")- Pinned calendar at top

  → Press I button- Service list with 3 signup options each

  → timer-store.logBehavioralEvent('I', outcomeId, promptCount: 3)- Modal signup forms

  → Create BehavioralEvent in IndexedDB (syncStatus: 'pending')- Real-time Airtable integration

  → Reset prompt counts to 0

  → UI updates (haptic feedback)### `/src/lib/airtable.ts`

  → [30s later] Sync queue syncs to AirtableAirtable connection layer:

```- `submitSignup()` - Save new signup

- `getSignups()` - Fetch all signups

---- Handles API authentication



## 🎯 Key Features### `/src/app/api/signup/route.ts`

POST endpoint for signup submissions

### Critical Business Rules ✅- Validates data

- **Tue-Mon Billing Weeks** (not standard Mon-Sun)- Submits to Airtable

- **15-Minute Time Rounding** (via Airtable formulas)- Returns success/error

- **Outcome-Based Events** (required selection)

- **Multi-User Support** (Users table ready)### `/src/app/api/services/route.ts`

GET endpoint for fetching services

### CTO Optimizations ✅- Queries Airtable

1. Offline-first with Dexie.js- Groups signups by service date

2. Stateful prompt buttons (VP/PP counts)- Returns organized service data

3. Clock-out safeguards (confirmation)

4. Tue-Mon billing week utilities### `/src/admin/liturgists.ts`

5. Outcomes linked to eventsStatic liturgist directory with helper functions:

6. Hybrid PDF strategy (ready)- `getAllLiturgists()`

7. Multi-user preparation- `getRegularLiturgists()`

- `getOccasionalLiturgists()`

---- `getAllEmails()`



## 🧪 Testing## 🔒 Security Notes



### Local Testing (No Airtable):- **Never commit `.env.local`** - Already in `.gitignore`

```bash- **PAT tokens are sensitive** - GitHub will block pushes containing them

npm run dev- **Admin page has no auth** - Consider adding password protection later

```

1. Clock in → Timer starts## 🐛 Troubleshooting

2. Log events → Data saves to IndexedDB

3. Check DevTools → Application → IndexedDB → `ethan-work-logs-db`### "Cannot connect to Airtable"

- Check your PAT token is valid

### With Airtable:- Verify Base ID is correct

1. Set up Airtable base (see `AIRTABLE_CSV_TEMPLATES.md`)- Ensure table name matches exactly: `liturgists.ukiahumc.org`

2. Create `.env.local` with API credentials

3. Restart server### "Hydration errors"

4. Clock in → Wait 30s → Check Airtable for data- Dates are fixed to avoid SSR/client mismatches

- If you see hydration errors, check for `new Date()` calls

---

### "Services not loading"

## 🚢 Deployment- Check browser console for API errors

- Verify Airtable credentials in environment variables

### Vercel (Recommended):- Try running `npm run dev` and check terminal output

```bash

# 1. Push to GitHub## 📖 Documentation Files

git push origin main

- `AIRTABLE_SETUP.md` - Detailed Airtable configuration

# 2. Import to Vercel- `VERCEL_DEPLOYMENT.md` - Step-by-step deployment guide

# Go to https://vercel.com- `src/admin/README.md` - Admin directory documentation

# Click "Import Project"

# Select GitHub repo## 🔮 Future Enhancements



# 3. Add Environment VariablesPotential additions:

AIRTABLE_API_KEY=pat_your_token_here- Password protection for admin page

AIRTABLE_BASE_ID=app_your_base_id_here- Email notifications when someone signs up

- Automatic reminder emails to liturgists

# 4. Deploy- Admin panel to manage services

# Click "Deploy" button- Export to PDF/print view

```- Google Calendar integration

- SMS notifications

---

## 📞 Contact

## 📈 Roadmap

**Ukiah United Methodist Church**  

### ✅ Phase 1: Foundation (Complete)270 N. Pine St., Ukiah, CA 95482  

- [x] Delete liturgist codePhone: 707.462.3360  

- [x] Rebrand to Ethan Work LoggerWebsite: [ukiahumc.org](https://ukiahumc.org)

- [x] Create Airtable schema

- [x] Update TypeScript types## 📄 License



### ✅ Phase 2: Core Infrastructure (Complete)Private - For Ukiah United Methodist Church use only

- [x] Offline database with Dexie.js

- [x] Sync queue system---

- [x] Timer component

- [x] Behavioral logger component**Built with ❤️ for the Ukiah UMC community**
- [x] Main app page

### 🚧 Phase 3: Reports & PDF (Next)
- [ ] Weekly timesheet view
- [ ] Behavioral data summary
- [ ] PDF generation
- [ ] Email/download functionality

### 🚧 Phase 4: Polish (Future)
- [ ] Authentication
- [ ] Clock-out reminders
- [ ] Dark mode
- [ ] PWA features
- [ ] Push notifications

---

## 🐛 Troubleshooting

### TypeScript Errors?
```bash
npm install  # Install all dependencies and types
```

### Timer Not Starting?
1. Check browser console (F12) for errors
2. Verify React is installed: `npm list react`

### No Data in Airtable?
1. Check `.env.local` exists
2. Verify API key and Base ID are correct
3. Wait 30 seconds for sync
4. Check browser console for API errors

### Sync Failing?
1. Check you're online (green indicator)
2. Verify Airtable API token has correct scopes
3. Check table names match exactly (case-sensitive)
4. Look for errors in browser console

---

## 📝 License

Private - For Ethan's caregiver team only

---

## 🙏 Credits

Built with:
- Next.js by Vercel
- Dexie.js by David Fahlander
- Zustand by Poimandres
- Tailwind CSS by Tailwind Labs
- Airtable API

---

## 📞 Support

- Check **[QUICKSTART.md](QUICKSTART.md)** for setup help
- Read **[CEO_CHECKLIST.md](CEO_CHECKLIST.md)** for step-by-step tasks
- Review **[PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)** for technical details

---

**Current Status:** ✅ Phase 2 Complete - Ready for Testing

**Next Action:** Run `npm install` and follow [QUICKSTART.md](QUICKSTART.md)
