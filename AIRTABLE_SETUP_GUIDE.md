# 🎯 AIRTABLE SETUP GUIDE - Step by Step

**Time Required:** 15-20 minutes  
**You Will Create:** 5 tables in Airtable with sample data

---

## 📋 OVERVIEW

You need to:
1. Create a new Airtable base
2. Create 5 tables (Users, Outcomes, WorkSessions, TimeBlocks, BehavioralEvents)
3. Copy/paste CSV data into each table
4. Get your API credentials
5. Add credentials to `.env.local` file

---

## STEP 1: CREATE NEW AIRTABLE BASE

1. Go to **https://airtable.com**
2. Click **"Sign In"** (or create account if you don't have one)
3. Click **"+ Add a base"** or **"Create a base"**
4. Choose **"Start from scratch"**
5. Name it: **"Ethan Work Logger"**
6. Click **"Create base"**

✅ You now have an empty base!

---

## STEP 2: GET YOUR PERSONAL ACCESS TOKEN (PAT)

1. Click your **profile picture** (top right)
2. Click **"Developer hub"**
3. Click **"Personal access tokens"** in left sidebar
4. Click **"+ Create new token"**
5. Name it: **"Ethan Work Logger API"**
6. Under **"Add scopes"**, check these boxes:
   - ☑️ `data.records:read`
   - ☑️ `data.records:write`
   - ☑️ `schema.bases:read`
7. Under **"Add bases"**, select your **"Ethan Work Logger"** base
8. Click **"Create token"**
9. **COPY THE TOKEN** - You'll need this later!
   - It starts with `pat...`
   - **SAVE IT SOMEWHERE SAFE** - You can't see it again!

✅ You have your API token!

---

## STEP 3: CREATE TABLE 1 - USERS

### 3.1 Rename First Table
1. In your new base, you'll see a default table called "Table 1"
2. Click the **table name dropdown** (top left)
3. Click **"Rename table"**
4. Name it: **`Users`**
5. Press Enter

### 3.2 Set Up Columns
1. Click the **"+"** next to "Name" column to add fields
2. Create these fields **in this order**:

| Field Name | Field Type | Notes |
|------------|-----------|-------|
| Name | Single line text | (already exists) |
| Email | Email | |
| Role | Single select | Options: Caregiver, Manager, Admin |
| Active | Checkbox | |
| CreatedAt | Date | Include time |

### 3.3 Add Sample Data
Copy this CSV and paste into the table:

```csv
Name,Email,Role,Active,CreatedAt
Sam Holley,sam@example.com,Caregiver,true,2024-01-15
Ethan,ethan@example.com,Caregiver,true,2024-01-15
Admin User,admin@example.com,Admin,true,2024-01-15
```

**How to paste:**
1. Click the **first empty row** under your column headers
2. Press **Cmd+V** (Mac) or **Ctrl+V** (Windows)
3. Airtable will auto-import the data

✅ Users table complete!

---

## STEP 4: CREATE TABLE 2 - OUTCOMES

### 4.1 Create New Table
1. Click the **"+"** button next to "Users" tab at the top
2. Choose **"Create empty table"**
3. Name it: **`Outcomes`**

### 4.2 Set Up Columns

| Field Name | Field Type | Notes |
|------------|-----------|-------|
| OutcomeName | Single line text | (rename "Name" field) |
| Description | Long text | |
| ServiceType | Single select | Options: CLS, Supported Employment |
| Active | Checkbox | |
| CreatedAt | Date | Include time |

### 4.3 Add Sample Data
Copy this CSV and paste:

```csv
OutcomeName,Description,ServiceType,Active,CreatedAt
Medication Management,Client takes prescribed medication independently,CLS,true,2024-01-15
Personal Hygiene,Client completes hygiene routine (shower/brush teeth),CLS,true,2024-01-15
Meal Preparation,Client prepares meals safely,CLS,true,2024-01-15
Money Management,Client manages money for purchases,CLS,true,2024-01-15
Task Completion,Employee completes assigned work task,Supported Employment,true,2024-01-15
Following Instructions,Employee follows multi-step instructions,Supported Employment,true,2024-01-15
Social Interaction,Employee interacts appropriately with coworkers,Supported Employment,true,2024-01-15
Time Management,Employee arrives on time and manages breaks,Supported Employment,true,2024-01-15
```

✅ Outcomes table complete!

---

## STEP 5: CREATE TABLE 3 - WORK SESSIONS

### 5.1 Create New Table
1. Click **"+"** next to "Outcomes" tab
2. Choose **"Create empty table"**
3. Name it: **`WorkSessions`**

### 5.2 Set Up Columns

| Field Name | Field Type | Notes |
|------------|-----------|-------|
| SessionID | Autonumber | (rename "Name" field to this, change type to Autonumber) |
| User | Link to another record | Link to "Users" table |
| Date | Date | Date only (no time) |
| ServiceType | Single select | Options: CLS, Supported Employment |
| Status | Single select | Options: in-progress, completed, cancelled |
| TotalHours | Number | Decimal, 2 decimal places |
| CreatedAt | Date | Include time |
| UpdatedAt | Date | Include time |

### 5.3 Sample Data Structure
**DON'T paste data yet** - this table will be populated automatically by the app when you clock in/out.

Just create the columns above. The app will fill it when you use it!

✅ WorkSessions table complete!

---

## STEP 6: CREATE TABLE 4 - TIME BLOCKS

### 6.1 Create New Table
1. Click **"+"** next to "WorkSessions" tab
2. Choose **"Create empty table"**
3. Name it: **`TimeBlocks`**

### 6.2 Set Up Columns

| Field Name | Field Type | Notes |
|------------|-----------|-------|
| BlockID | Autonumber | (rename "Name" field, change to Autonumber) |
| WorkSession | Link to another record | Link to "WorkSessions" table |
| StartTime | Date | Include time |
| EndTime | Date | Include time |
| Duration | Number | Decimal, 2 decimal places (in hours) |
| CreatedAt | Date | Include time |
| UpdatedAt | Date | Include time |

### 6.3 Sample Data
**DON'T paste data yet** - this table will be auto-populated when you start/stop work and breaks.

✅ TimeBlocks table complete!

---

## STEP 7: CREATE TABLE 5 - BEHAVIORAL EVENTS

### 7.1 Create New Table
1. Click **"+"** next to "TimeBlocks" tab
2. Choose **"Create empty table"**
3. Name it: **`BehavioralEvents`**

### 7.2 Set Up Columns

| Field Name | Field Type | Notes |
|------------|-----------|-------|
| EventID | Autonumber | (rename "Name" field, change to Autonumber) |
| WorkSession | Link to another record | Link to "WorkSessions" table |
| Outcome | Link to another record | Link to "Outcomes" table |
| Timestamp | Date | Include time |
| EventType | Single select | Options: VP, PP, I, U |
| PromptCount | Number | Integer |
| Comment | Long text | |
| Date | Date | Date only (no time) |
| CreatedAt | Date | Include time |

### 7.3 Sample Data
**DON'T paste data yet** - this table will be auto-populated when you log behavioral events.

✅ BehavioralEvents table complete!

---

## STEP 8: GET YOUR BASE ID AND TABLE IDs

### 8.1 Get Base ID
1. Look at your browser URL bar
2. It looks like: `https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY/...`
3. The part after `/app` and before the next `/` is your **Base ID**
4. Example: `appAbc123Def456Ghi`
5. **COPY THIS** - you'll need it!

### 8.2 Get Table IDs
For each table, you need its Table ID:

1. Click on the **Users** table tab
2. Look at the URL: `https://airtable.com/appXXX/tblYYY/...`
3. The `tblYYY` part is the **Table ID**
4. **Write it down** like this:

```
USERS_TABLE_ID = tbl____________
OUTCOMES_TABLE_ID = tbl____________
WORK_SESSIONS_TABLE_ID = tbl____________
TIME_BLOCKS_TABLE_ID = tbl____________
BEHAVIORAL_EVENTS_TABLE_ID = tbl____________
```

**To get each one:**
- Click **Users** tab → copy the `tbl...` from URL
- Click **Outcomes** tab → copy the `tbl...` from URL
- Click **WorkSessions** tab → copy the `tbl...` from URL
- Click **TimeBlocks** tab → copy the `tbl...` from URL
- Click **BehavioralEvents** tab → copy the `tbl...` from URL

✅ You have all your IDs!

---

## STEP 9: CREATE YOUR .env.local FILE

1. **Open your project folder** in Finder:
   - Go to: `/Users/samuelholley/Projects/ethan-work-logs.samuelholley.com`

2. **Find the file** `.env.local.example`

3. **Duplicate it**:
   - Right-click → Duplicate
   - Rename the duplicate to: `.env.local` (remove the .example)

4. **Open `.env.local`** in TextEdit or VS Code

5. **Replace the placeholder values** with YOUR values:

```env
# Airtable Configuration
AIRTABLE_PAT_TOKEN=pat1234567890abcdefghijk
AIRTABLE_BASE_ID=appAbc123Def456Ghi

# Table IDs
USERS_TABLE_ID=tblUsers123456789
OUTCOMES_TABLE_ID=tblOutcomes123456
WORK_SESSIONS_TABLE_ID=tblWorkSessions12
TIME_BLOCKS_TABLE_ID=tblTimeBlocks1234
BEHAVIORAL_EVENTS_TABLE_ID=tblBehavioralEve1
```

6. **Save the file**

⚠️ **IMPORTANT:** 
- Replace ALL the placeholder values with YOUR actual values
- Do NOT commit this file to git (it's already in .gitignore)
- Keep this file secret!

✅ Environment variables configured!

---

## STEP 10: VERIFY YOUR SETUP

### ✅ Checklist - Make sure you have:

- [ ] Created Airtable base named "Ethan Work Logger"
- [ ] Created Personal Access Token (PAT) starting with `pat...`
- [ ] Created 5 tables:
  - [ ] Users (with 3 sample users)
  - [ ] Outcomes (with 8 sample outcomes)
  - [ ] WorkSessions (empty, columns created)
  - [ ] TimeBlocks (empty, columns created)
  - [ ] BehavioralEvents (empty, columns created)
- [ ] Copied Base ID (starts with `app...`)
- [ ] Copied all 5 Table IDs (each starts with `tbl...`)
- [ ] Created `.env.local` file with all values filled in
- [ ] Saved `.env.local` file

---

## 🎯 WHAT TO DO NEXT

**You're done with Airtable setup!**

Now I'll run the terminal commands to:
1. Install dependencies
2. Start the dev server
3. Test the app

**Just say:** "I'm done with Airtable, run the commands"

---

## 🆘 TROUBLESHOOTING

**Problem: Can't find Personal Access Token option**
- Make sure you're logged into Airtable.com
- Click your profile picture (top right)
- Look for "Developer hub" - if you don't see it, your account might need verification

**Problem: Can't see Table IDs in URL**
- Make sure you're looking at the full URL in the address bar
- The format is: `https://airtable.com/appXXX/tblYYY/viwZZZ`
- The `tblYYY` part is what you need

**Problem: CSV paste not working**
- Try pasting into the first empty row
- Make sure you copied the entire CSV block including headers
- Alternatively, manually type in the data

**Problem: Don't see "Link to another record" option**
- When creating a field, scroll down in the field type list
- It's near the bottom under "Link & Lookup"

**Problem: .env.local file won't save**
- Make sure you're editing `.env.local` not `.env.local.example`
- Save it in the project root folder
- Don't add extra spaces or quotes around values

---

## 📞 NEED HELP?

Just ask:
- "I can't find my Base ID"
- "How do I create a Personal Access Token?"
- "The CSV paste isn't working"
- "I made a mistake, how do I fix it?"
- "Show me a screenshot of what it should look like"

---

**Ready to continue? Say:** "Airtable setup complete!"
