# 🚀 Vercel Deployment Guide# 🚀 Vercel Deployment Instructions



## Prerequisites## Step 1: Push Code to GitHub



✅ **Code pushed to GitHub** - Done!  ```bash

✅ **Airtable base created** - Follow `AIRTABLE_CSV_TEMPLATES.md`  git add .

✅ **API credentials ready** - Get from Airtablegit commit -m "Add Airtable integration"

git push origin main

---```



## Step-by-Step Deployment---



### 1. Go to Vercel## Step 2: Deploy to Vercel



Visit: https://vercel.com1. **Go to:** https://vercel.com

2. **Sign in** with GitHub

**Sign in with GitHub** (recommended for easy integration)3. **Click "Add New Project"**

4. **Import your repository:** `samuelmholley1/liturgists.ukiahumc.org`

---5. **Click "Deploy"** (don't add env vars yet, we'll do that next)



### 2. Import Project---



1. Click **"Add New..."** → **"Project"**## Step 3: Add Environment Variables in Vercel

2. Find your repository: **`liturgists.ukiahumc.org`**

3. Click **"Import"**After your first deployment:



---1. **Go to your project** in Vercel dashboard

2. **Click "Settings"** tab

### 3. Configure Project3. **Click "Environment Variables"** in left sidebar

4. **Add these THREE variables:**

#### Framework Preset:

- **Auto-detected:** Next.js ✅### Variable 1:

- Keep default settings- **Name:** `AIRTABLE_PAT_TOKEN`

- **Value:** `[YOUR_PAT_TOKEN - starts with pat...]`

#### Root Directory:- **Environment:** Check all boxes (Production, Preview, Development)

- Leave as `.` (root)- Click "Save"



#### Build Settings:### Variable 2:

- **Build Command:** `npm run build` (auto-detected)- **Name:** `AIRTABLE_BASE_ID`

- **Output Directory:** `.next` (auto-detected)- **Value:** `[YOUR_BASE_ID_HERE - starts with app...]`

- **Install Command:** `npm install` (auto-detected)- **Environment:** Check all boxes (Production, Preview, Development)

- Click "Save"

---

### Variable 3:

### 4. Add Environment Variables- **Name:** `AIRTABLE_TABLE_NAME`

- **Value:** `liturgists.ukiahumc.org`

**CRITICAL:** Add these before deploying!- **Environment:** Check all boxes (Production, Preview, Development)

- Click "Save"

Click **"Environment Variables"** section:

---

#### Variable 1: AIRTABLE_API_KEY

- **Name:** `AIRTABLE_API_KEY`## Step 4: Redeploy

- **Value:** `pat_your_actual_token_here`

- **Environment:** Production, Preview, Development (check all)After adding environment variables:



#### Variable 2: AIRTABLE_BASE_ID1. **Go to "Deployments"** tab

- **Name:** `AIRTABLE_BASE_ID`2. **Find your latest deployment**

- **Value:** `app_your_actual_base_id_here`3. **Click the three dots** (...) menu

- **Environment:** Production, Preview, Development (check all)4. **Click "Redeploy"**

5. **Check "Use existing Build Cache"**

**Where to get these values:**6. **Click "Redeploy"**

- API Key: https://airtable.com/create/tokens (starts with `pat...`)

- Base ID: https://airtable.com/api → Select your base (starts with `app...`)---



---## Step 5: Test Your Live Site!



### 5. DeployOnce redeployed:

1. Visit your production URL (something like `liturgists-ukiahumc-org.vercel.app`)

Click **"Deploy"** button2. Try signing up

3. Check your Airtable - the data should appear!

**Wait 2-3 minutes** for build to complete

---

---

## 🎉 YOU'RE LIVE!

### 6. Test Your Deployment

Your site is now deployed and connected to Airtable. Every signup will be saved automatically!

Visit your Vercel URL and test:

- [ ] Timer works (clock in/out)---

- [ ] Behavioral logger shows outcomes from Airtable

- [ ] Data syncs to Airtable within 30 seconds## 🔄 Future Updates

- [ ] Offline mode works (disconnect internet)

Whenever you make code changes:

---```bash

git add .

## Quick Referencegit commit -m "Your change description"

git push origin main

### Environment Variables:```

```env

AIRTABLE_API_KEY=pat_your_tokenVercel will automatically redeploy! 🚀

AIRTABLE_BASE_ID=app_your_base_id
```

### Monitoring:
- Vercel Dashboard → Deployments → Logs
- Check Airtable for synced data

### Rollback:
- Deployments tab → Previous deployment → "Promote to Production"

---

**GitHub Repo:** https://github.com/samuelmholley1/liturgists.ukiahumc.org

**Current Status:** ✅ Ready for Deployment
