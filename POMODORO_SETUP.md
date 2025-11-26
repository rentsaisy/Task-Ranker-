# Focus Mode with Pomodoro Timer & WhatsApp Bot - Setup Guide

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MySQL** database (Laragon or any MySQL server)
3. **Twilio Account** (for WhatsApp API)
4. **npm** or **pnpm** package manager

## 🚀 Installation Steps

### 1. Install Required Dependencies

```bash
# Install Node.js packages
npm install twilio node-cron

# Or with pnpm
pnpm add twilio node-cron
```

### 2. Database Setup

Run the SQL migration to create Pomodoro tables:

```bash
# In MySQL/Laragon, execute:
mysql -u root -p taskranker_db < database_schema_pomodoro.sql
```

Or manually run the SQL file in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)

### 3. Twilio WhatsApp Configuration

#### a. Create Twilio Account
1. Go to [Twilio.com](https://www.twilio.com/)
2. Sign up for free trial (get $15 credit)
3. Verify your email and phone number

#### b. Set up WhatsApp Sandbox
1. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join the sandbox:
   - Send `join <your-sandbox-code>` to Twilio's WhatsApp number
   - Example: `join happy-tiger-123`
3. Note down the sandbox WhatsApp number (e.g., `+1 415 523 8886`)

#### c. Get Twilio Credentials
1. Go to **Console Dashboard**
2. Copy your:
   - **Account SID**
   - **Auth Token**
3. Note the **Twilio WhatsApp number** from sandbox

#### d. Configure Webhook
1. In Twilio Console, go to **Messaging** → **Settings** → **WhatsApp Sandbox**
2. Set **When a message comes in** to:
   ```
   https://your-domain.com/api/whatsapp/webhook
   ```
3. Method: `POST`
4. For local development, use **ngrok**:
   ```bash
   ngrok http 3000
   # Copy the https URL and append /api/whatsapp/webhook
   ```

### 4. Environment Variables

Create or update `.env.local`:

```env
# Database (existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 5. Update User Phone Numbers

Add WhatsApp phone numbers to user accounts:

```sql
-- Update your user's phone number
UPDATE users 
SET phone_number = '+6281234567890',  -- Your WhatsApp number with country code
    whatsapp_verified = TRUE,
    timezone = 'Asia/Jakarta'
WHERE id = 1;
```

### 6. Initialize Scheduler

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

### 1. Test WhatsApp Connection

```bash
# Send test message via Twilio Console
# Or use curl:
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "Body=Hello from TaskRanker!" \
  --data-urlencode "To=whatsapp:+6281234567890" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

### 2. Test Focus Mode Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to Focus Mode page (update sidebar navigation if needed)

3. Select a task and click **Start**

4. Verify:
   - Timer counts down
   - Session created in database
   - WhatsApp notification received (if configured)

### 3. Test WhatsApp Bot Commands

Send these messages to your Twilio WhatsApp number:

- `START` - Start Pomodoro for highest priority task
- `STOP` - Cancel active session
- `STATUS` - View today's statistics

## 📱 WhatsApp Bot Commands Reference

| Command | Description |
|---------|-------------|
| `START` | Begin Pomodoro session for your highest-priority task |
| `STOP` | Cancel the current active session |
| `STATUS` | Show today's completed sessions and active task |
| `HELP` | Display available commands |

## 🔧 Troubleshooting

### Issue: "Twilio credentials not found"

**Solution:** The app runs in mock mode without Twilio. WhatsApp messages will be logged to console instead. Add credentials to `.env.local` for real functionality.

### Issue: No WhatsApp notifications received

**Checklist:**
1. ✅ Phone number in database matches WhatsApp number exactly
2. ✅ `whatsapp_verified` is `TRUE` in users table
3. ✅ Twilio credentials are correct in `.env.local`
4. ✅ Joined Twilio WhatsApp sandbox
5. ✅ Webhook URL is configured correctly

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

### Customize WhatsApp Messages

Edit templates in `lib/whatsapp-service.ts`:

```typescript
const MESSAGE_TEMPLATES = {
  POMODORO_END: (taskName: string) => 
    `⏰ Your custom message here...`,
  // ... customize other templates
}
```

## 🚀 Production Deployment

### 1. Replace node-cron with BullMQ (recommended for production)

```bash
npm install bullmq ioredis
```

### 2. Use Meta WhatsApp Cloud API (for production)

- More reliable than Twilio
- Higher rate limits
- Better pricing for scale
- Setup: https://developers.facebook.com/docs/whatsapp/cloud-api

### 3. Add Job Queue Dashboard

```bash
npm install bull-board
```

Monitor scheduled jobs via web UI.

### 4. Enable Browser Notifications

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

Your Focus Mode with Pomodoro Timer and WhatsApp Bot is now ready to use!

**Features enabled:**
- ✅ Visual Pomodoro timer with Start/Pause/Resume controls
- ✅ Server-side session scheduling
- ✅ WhatsApp notifications on session completion
- ✅ WhatsApp bot commands (START, STOP, STATUS)
- ✅ Session history and analytics
- ✅ Automatic break transitions

For questions or issues, check the architecture documentation in `POMODORO_ARCHITECTURE.md`.
