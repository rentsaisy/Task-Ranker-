# Focus Mode with Pomodoro Timer - Setup Guide

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MySQL** database (Laragon or any MySQL server)
3. **npm** or **pnpm** package manager

## 🚀 Installation Steps

### 1. Install Required Dependencies

```bash
# Install Node.js packages
npm install node-cron

# Or with pnpm
pnpm add node-cron
```

### 2. Database Setup

Run the SQL migration to create Pomodoro tables:

```bash
# In MySQL/Laragon, execute:
mysql -u root -p taskranker_db < database_schema_pomodoro.sql
```

Or manually run the SQL file in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)

### 3. Environment Variables

Create or update `.env.local`:

```env
# Database (existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db
```

### 4. Update User Timezone

Add timezone to user accounts:

```sql
-- Update your user's timezone
UPDATE users 
SET timezone = 'Asia/Jakarta'
WHERE id = 1;
```

### 5. Initialize Scheduler

Update your main application entry point to start the scheduler.

Create or update `app/api/init/route.ts`:

```typescript
import { initializePomodoroScheduler } from '@/lib/pomodoro-scheduler';
import { NextResponse } from 'next/server';

// Initialize scheduler on app startup
let schedulerInitialized = false;

if (!schedulerInitialized) {
  initializePomodoroScheduler();
  schedulerInitialized = true;
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Pomodoro scheduler initialized',
    status: 'running' 
  });
}
```

Then call this endpoint once when your app starts, or add to `app/layout.tsx`:

```typescript
// app/layout.tsx
useEffect(() => {
  // Initialize scheduler
  fetch('/api/init').catch(console.error);
}, []);
```

## 🧪 Testing

### 1. Test Focus Mode Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to Focus Mode page (update sidebar navigation if needed)

3. Select a task and click **Start**

4. Verify:
   - Timer counts down
   - Session created in database
   - Notifications appear when session completes

## 🔧 Troubleshooting

### Issue: Timer doesn't sync across tabs

**Note:** Current implementation uses client-side timer for UI. For production, implement WebSocket for real-time sync, or use server-sent events (SSE).

### Issue: Scheduler not running

**Solution:** Ensure scheduler is initialized on app startup. Check server logs for "Pomodoro Scheduler initialized" message.

## 🎨 Customization

### Change Default Durations

Edit `components/pages/focus-mode.tsx`:

```typescript
const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,        // Change to your preference
  shortBreakDuration: 5,    // Change to your preference
  longBreakDuration: 15,    // Change to your preference
  sessionsBeforeLongBreak: 4,
}
```

### Add Custom Alarm Sound

1. Add `alarm.mp3` to `public/` folder
2. Or update audio path in `focus-mode.tsx`:
   ```typescript
   alarmAudioRef.current = new Audio('/your-alarm.mp3')
   ```

## 🚀 Production Deployment

### 1. Replace node-cron with BullMQ (recommended for production)

```bash
npm install bullmq ioredis
```

### 2. Add Job Queue Dashboard

```bash
npm install bull-board
```

Monitor scheduled jobs via web UI.

### 3. Enable Browser Notifications

Request permission in `focus-mode.tsx`:

```typescript
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

## 📊 Database Maintenance

### Clean up old sessions (automatic)

The scheduler automatically cleans up sessions older than 30 days at 3 AM daily.

To adjust retention period, edit `lib/pomodoro-scheduler.ts`:

```typescript
const daysToKeep = 30; // Change to your preference
```

### Manual cleanup

```sql
-- Delete sessions older than 60 days
DELETE FROM pomodoro_sessions 
WHERE status = 'completed' 
  AND start_time < DATE_SUB(NOW(), INTERVAL 60 DAY);
```

## 🎉 Success!

Your Focus Mode with Pomodoro Timer is now ready to use!

**Features enabled:**
- ✅ Visual Pomodoro timer with Start/Pause/Resume controls
- ✅ Server-side session scheduling
- ✅ Browser notifications on session completion
- ✅ Session history and analytics
- ✅ Automatic break transitions

For questions or issues, check the architecture documentation in `POMODORO_ARCHITECTURE.md`.
