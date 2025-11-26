# Pomodoro Feature - Installation Script

## 📦 Step 1: Install Required Packages

Run this command in your project root:

```bash
npm install twilio node-cron
```

Or if using pnpm:

```bash
pnpm add twilio node-cron
```

### Packages Being Installed:

1. **twilio** (^5.3.7)
   - Official Twilio SDK for Node.js
   - Used for sending/receiving WhatsApp messages
   - Includes webhook signature verification

2. **node-cron** (^3.0.3)
   - Simple cron-like job scheduler
   - Used for server-side Pomodoro session management
   - Runs notification checks every minute

### Optional Dev Dependencies:

```bash
npm install --save-dev @types/node-cron
```

---

## 🗄️ Step 2: Run Database Migration

Execute the SQL migration file to create Pomodoro tables:

### Option A: Using MySQL Command Line

```bash
# Navigate to project directory
cd "C:\Users\USER\OneDrive\Documents\Projects\Priority Task ML Web"

# Run migration (Windows PowerShell)
& "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root taskranker_db < database_schema_pomodoro.sql
```

### Option B: Using Laragon/phpMyAdmin

1. Open Laragon
2. Click "Database" button (or go to localhost/phpmyadmin)
3. Select `taskranker_db` database
4. Click "Import" tab
5. Choose file: `database_schema_pomodoro.sql`
6. Click "Go"

### Verify Migration Success

Run this query to check if tables were created:

```sql
SHOW TABLES LIKE 'pomodoro%';
```

You should see:
- pomodoro_sessions
- pomodoro_settings
- notification_jobs (also created)
- whatsapp_messages (also created)

---

## 🔧 Step 3: Configure Environment Variables

### Option A: Quick Setup (Development Mode)

Create `.env.local` file in project root with minimal config:

```env
# Database (existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db

# Pomodoro runs in MOCK MODE without these
# (WhatsApp messages will be logged to console only)
```

### Option B: Full Setup (with WhatsApp)

If you want real WhatsApp notifications:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Node Environment
NODE_ENV=development
```

**Get Twilio Credentials:**
1. Sign up at https://www.twilio.com
2. Go to Console Dashboard
3. Copy Account SID and Auth Token
4. Follow WhatsApp Sandbox setup in POMODORO_SETUP.md

---

## 👤 Step 4: Update User Phone Number

Add your WhatsApp number to your user account:

```sql
-- Replace with your actual WhatsApp number (include country code)
UPDATE users 
SET phone_number = '+6281234567890',
    whatsapp_verified = TRUE,
    timezone = 'Asia/Jakarta'
WHERE id = 1;
```

**Phone Number Format:**
- Must include country code with +
- No spaces or dashes
- Example: +6281234567890 (Indonesia)
- Example: +12025551234 (USA)

---

## 🚀 Step 5: Initialize Scheduler

The Pomodoro scheduler needs to start when your app starts.

### Create Initialization Endpoint

Create new file: `app/api/init/route.ts`

```typescript
import { initializePomodoroScheduler } from '@/lib/pomodoro-scheduler';
import { NextResponse } from 'next/server';

let schedulerInitialized = false;

export async function GET() {
  if (!schedulerInitialized) {
    initializePomodoroScheduler();
    schedulerInitialized = true;
    return NextResponse.json({ 
      message: 'Pomodoro scheduler initialized',
      status: 'started' 
    });
  }
  
  return NextResponse.json({ 
    message: 'Scheduler already running',
    status: 'active' 
  });
}
```

### Call on App Startup

Option 1: In root layout (`app/layout.tsx`):

```typescript
'use client'
import { useEffect } from 'react'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize Pomodoro scheduler
    fetch('/api/init').catch(console.error)
  }, [])
  
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

Option 2: In main page (`app/page.tsx`):

```typescript
useEffect(() => {
  fetch('/api/init').catch(console.error)
}, [])
```

---

## 🧭 Step 6: Add to Navigation

Update your sidebar to include Focus Mode:

**File: `components/sidebar.tsx`**

```typescript
// Add to imports
import { Clock } from "lucide-react"

// Add to menu items
const menuItems = [
  // ... existing items
  { id: 'focus-mode', label: 'Focus Mode', icon: Clock, description: 'Pomodoro Timer' },
  // ... rest of items
]
```

**File: `app/page.tsx`**

```typescript
// Add to imports
import FocusModePage from '@/components/pages/focus-mode'

// Add to page rendering
{currentPage === 'focus-mode' && <FocusModePage />}
```

---

## ✅ Step 7: Test the Installation

### 1. Start Development Server

```bash
npm run dev
```

### 2. Check Console for Scheduler

You should see:
```
🕐 Initializing Pomodoro Scheduler...
✅ Pomodoro Scheduler initialized
```

### 3. Navigate to Focus Mode

- Open http://localhost:3000
- Click "Focus Mode" in sidebar
- You should see the Pomodoro interface

### 4. Test Basic Functionality

**Without Twilio (Mock Mode):**
1. Select a task
2. Click "Start"
3. Timer should count down
4. Check browser console for mock WhatsApp messages

**With Twilio (Real Mode):**
1. Select a task
2. Click "Start"
3. Wait for session to complete
4. You should receive WhatsApp notification

### 5. Test Database

Check if session was created:

```sql
SELECT * FROM pomodoro_sessions 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'twilio'"

**Fix:**
```bash
npm install twilio
```

### Issue: "Cannot find module '@/lib/pomodoro-scheduler'"

**Fix:** Make sure all files were created. Check file paths:
- `lib/pomodoro-scheduler.ts`
- `lib/whatsapp-service.ts`

### Issue: Database connection error

**Fix:** Verify `.env.local` has correct database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db
```

### Issue: "Unknown column 'phone_number'"

**Fix:** Run the database migration again:
```bash
mysql -u root taskranker_db < database_schema_pomodoro.sql
```

### Issue: Scheduler not running

**Fix:** Ensure initialization endpoint is called. Check browser console for errors. Verify `/api/init` endpoint exists.

---

## 🎉 Installation Complete!

If all steps completed successfully, you should now have:

✅ Required packages installed
✅ Database tables created
✅ Environment configured
✅ User phone number set
✅ Scheduler initialized
✅ Navigation updated
✅ Feature ready to use

**Next Steps:**
1. Read `POMODORO_QUICK_REFERENCE.md` for usage guide
2. Check `POMODORO_SETUP.md` for Twilio configuration
3. Review `POMODORO_ARCHITECTURE.md` for technical details

**Need Help?**
- Check console logs for errors
- Verify database tables exist
- Test in mock mode first (without Twilio)
- Review troubleshooting section above

---

## 📚 Documentation Files

All documentation is in your project root:

- `POMODORO_ARCHITECTURE.md` - System architecture
- `POMODORO_SETUP.md` - Detailed setup guide
- `POMODORO_QUICK_REFERENCE.md` - API and commands
- `POMODORO_IMPLEMENTATION_SUMMARY.md` - Feature overview
- `database_schema_pomodoro.sql` - Database migration
- `.env.example` - Environment template

---

**Installation Time:** ~10-15 minutes
**Difficulty:** Intermediate
**Status:** Ready for Testing! 🚀
