# 🍅 Focus Mode with Pomodoro Timer

> A complete Pomodoro timer implementation with server-side scheduling for TaskRanker ML Web.

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Usage](#-usage)
- [Customization](#-customization)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

Focus Mode brings the Pomodoro Technique to TaskRanker, helping users maintain focus and track productivity. Sessions are managed server-side with automatic scheduling and notifications.

### Key Features

- **Pomodoro Timer**: 25-min focus + 5-min breaks
- **Server-side Scheduling**: Sessions persist even if browser closes
- **Browser Notifications**: Alerts when sessions complete
- **Session History**: Track completed Pomodoros per day
- **Automatic Transitions**: Auto-schedule breaks and focus sessions
- **Pause/Resume**: Full session control
- **Task Integration**: Link Pomodoros to specific tasks

---

## ✨ Features

### Frontend
- ✅ Visual countdown timer
- ✅ Start/Pause/Resume controls
- ✅ Task selection dropdown
- ✅ Session statistics display
- ✅ Customizable durations

### Backend
- ✅ Scheduled job processing (node-cron)
- ✅ Session persistence (MySQL)
- ✅ Automatic break scheduling
- ✅ Database cleanup (30-day retention)

### Database
- ✅ Pomodoro sessions
- ✅ Notification jobs
- ✅ User settings

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, Next.js 16, TypeScript |
| **Styling** | TailwindCSS |
| **Backend** | Next.js API Routes |
| **Scheduler** | node-cron |
| **Database** | MySQL (via mysql2) |
| **Timer Logic** | Client-side with server backup |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install node-cron
```

### 2. Run Database Migration

```bash
mysql -u root -p taskranker_db < database_schema_pomodoro.sql
```

### 3. Configure Environment

```env
# .env.local
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db
```

### 4. Update User Timezone

```sql
UPDATE users 
SET timezone = 'Asia/Jakarta'
WHERE id = 1;
```

### 5. Start Development Server

```bash
npm run dev
```

**That's it!** 🎉 Navigate to Focus Mode from the sidebar.

---

## 📚 Documentation

| File | Description |
|------|-------------|
| **POMODORO_SETUP.md** | Installation and configuration guide |
| **POMODORO_ARCHITECTURE.md** | System design and data flow |
| **POMODORO_IMPLEMENTATION_SUMMARY.md** | Code overview and API docs |
| **POMODORO_DIAGRAMS.md** | Visual system diagrams |
| **POMODORO_QUICK_REFERENCE.md** | Commands and API reference |

---

## 📁 Project Structure

```
app/
  api/
    pomodoro/              # Pomodoro API routes
      [id]/
        route.ts           # Update/delete session
      create/route.ts      # Create new session
      active/route.ts      # Get active session
      settings/route.ts    # User settings
      stats/route.ts       # Session statistics
      
components/
  pages/
    focus-mode.tsx         # Main Pomodoro UI

lib/
  pomodoro-scheduler.ts    # Server-side job scheduler
  db.ts                    # Database connection

database_schema_pomodoro.sql  # Database tables
```

---

## 💻 Installation

### Prerequisites

- Node.js v18+
- MySQL 8+
- npm or pnpm

### Step-by-Step

1. Install packages: `npm install node-cron`
2. Run database migration
3. Configure environment variables
4. Initialize scheduler (auto-runs on server start)
5. Navigate to Focus Mode page

See **POMODORO_SETUP.md** for detailed instructions.

---

## 📖 Usage

### Via Web UI

1. **Navigate to Focus Mode** in sidebar
2. **Select a task** from dropdown
3. **Click Start** to begin 25-minute focus session
4. **Work until timer completes** (or pause if needed)
5. **Take a break** when prompted
6. **Repeat** (long break after 4 sessions)

**Expected Behavior:**
- Timer counts down visually
- Session saved to database
- Browser notification at completion
- Auto-scheduled break starts

---

## 🎨 Customization

### Change Timer Durations

Edit `components/pages/focus-mode.tsx`:

```typescript
const DEFAULT_SETTINGS = {
  focusDuration: 25,           // minutes
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4
}
```

### Add Custom Alarm

Place `alarm.mp3` in `public/` folder or update:

```typescript
alarmAudioRef.current = new Audio('/your-alarm.mp3')
```

### Adjust Data Retention

Edit `lib/pomodoro-scheduler.ts`:

```typescript
const daysToKeep = 30; // Change to your preference
```

---

## 🐛 Troubleshooting

### Timer doesn't appear
- Check that database migration ran successfully
- Verify user exists in `users` table
- Check browser console for errors

### Sessions not saving
- Verify database connection in `lib/db.ts`
- Check server logs for errors
- Confirm `pomodoro_sessions` table exists

### Scheduler not running
- Ensure server is running (`npm run dev`)
- Check logs for "Pomodoro Scheduler initialized"
- Verify node-cron is installed

### No browser notifications
- Grant notification permissions in browser
- Check notification API is supported
- Verify browser is in focus

---

## 🎉 Success!

Your Pomodoro Timer is now fully operational!

**What's Working:**
✅ Visual countdown timer  
✅ Session persistence  
✅ Automatic scheduling  
✅ Task integration  
✅ Statistics tracking  

**Next Steps:**
- Add more focus sessions
- Review your productivity stats
- Customize durations to fit your workflow
- Enable browser notifications for alerts

For more help, see the documentation files listed above.
