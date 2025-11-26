# Pomodoro Feature - Quick Reference

## 🎯 Feature Overview

**Focus Mode with Pomodoro Timer + WhatsApp Bot Integration**

- Visual countdown timer on web app
- Server-side scheduling (works even if browser closes)
- WhatsApp notifications via Twilio
- Bot commands: START, STOP, STATUS
- Session history and analytics
- Auto-transition between focus and break modes

---

## 📂 File Structure

```
Priority Task ML Web/
├── app/api/
│   ├── pomodoro/
│   │   ├── start/route.ts      # Start new session
│   │   ├── stop/route.ts       # Cancel session
│   │   ├── pause/route.ts      # Pause timer
│   │   ├── resume/route.ts     # Resume timer
│   │   └── status/route.ts     # Get current status
│   └── whatsapp/
│       └── webhook/route.ts    # Handle incoming messages
│
├── lib/
│   ├── whatsapp-service.ts     # WhatsApp/Twilio integration
│   ├── pomodoro-scheduler.ts   # Server-side job scheduler
│   └── db.ts                   # Database connection
│
├── components/pages/
│   └── focus-mode.tsx          # Frontend Pomodoro UI
│
├── database_schema_pomodoro.sql # Database migrations
├── POMODORO_ARCHITECTURE.md     # Technical architecture
├── POMODORO_SETUP.md            # Setup instructions
└── POMODORO_QUICK_REFERENCE.md  # This file
```

---

## 🗄️ Database Tables

### `pomodoro_sessions`
Stores all Pomodoro sessions
- **Columns:** id, user_id, task_id, mode, session_number, start_time, end_time, status, etc.
- **Status values:** scheduled, active, paused, completed, cancelled

### `notification_jobs`
Server-side scheduled notifications
- **Columns:** id, user_id, pomodoro_session_id, job_type, scheduled_at, status, etc.
- **Job types:** pomodoro_end, break_end, daily_summary

### `pomodoro_settings`
User preferences
- **Columns:** user_id, focus_duration, short_break_duration, long_break_duration, etc.

### `whatsapp_messages`
Message log for debugging
- **Columns:** id, user_id, direction, message_body, status, etc.

---

## 🔌 API Endpoints

### Start Pomodoro
```http
POST /api/pomodoro/start
Content-Type: application/json

{
  "userId": 1,
  "taskId": 5,
  "mode": "focus",
  "duration": 25,
  "sessionNumber": 1
}
```

### Get Status
```http
GET /api/pomodoro/status?userId=1
```

### Pause Session
```http
POST /api/pomodoro/pause
Content-Type: application/json

{
  "userId": 1,
  "sessionId": 123
}
```

### Stop Session
```http
POST /api/pomodoro/stop
Content-Type: application/json

{
  "userId": 1,
  "sessionId": 123
}
```

### WhatsApp Webhook
```http
POST /api/whatsapp/webhook
Content-Type: application/x-www-form-urlencoded

From=whatsapp:+628123456789
Body=START
MessageSid=SM1234567890abcdef
```

---

## 📱 WhatsApp Bot Commands

| Command | Action |
|---------|--------|
| `START` | Start Pomodoro for highest-priority task |
| `STOP` | Cancel active Pomodoro session |
| `STATUS` | Show today's completed sessions |
| `HELP` | Display available commands |

---

## 🎨 Frontend Component Usage

```tsx
import FocusModePage from '@/components/pages/focus-mode'

// Use in your routing/navigation
<FocusModePage />
```

**Component Features:**
- Task selection dropdown
- Big countdown timer
- Start/Pause/Resume/Reset buttons
- Session progress display (1/4, 2/4, etc.)
- Today's statistics cards
- Editable Pomodoro settings

---

## 🔧 Configuration

### Environment Variables (`.env.local`)

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Database (existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db
```

### User Phone Number Setup

```sql
UPDATE users 
SET phone_number = '+6281234567890',
    whatsapp_verified = TRUE,
    timezone = 'Asia/Jakarta'
WHERE id = 1;
```

---

## 🧪 Testing Checklist

### Local Development
- [ ] Database tables created
- [ ] Environment variables set
- [ ] Phone number added to user account
- [ ] Scheduler initialized
- [ ] Focus Mode page accessible

### Twilio Integration
- [ ] Twilio account created
- [ ] WhatsApp sandbox joined
- [ ] Test message sent successfully
- [ ] Webhook URL configured (use ngrok for local)

### Functionality
- [ ] Start Pomodoro from web UI
- [ ] Timer counts down correctly
- [ ] Pause/Resume works
- [ ] WhatsApp notification received
- [ ] Bot commands work (START, STOP, STATUS)
- [ ] Session saved to database

---

## 📊 How It Works

### 1. User starts Pomodoro on web
```
User clicks Start
  ↓
Frontend calls /api/pomodoro/start
  ↓
Backend creates session in DB
  ↓
Backend schedules notification job
  ↓
Frontend displays countdown timer
```

### 2. Session ends (server-side)
```
Scheduler checks jobs every minute
  ↓
Finds job with scheduled_at <= NOW
  ↓
Executes job: Send WhatsApp message
  ↓
Updates session status to 'completed'
  ↓
Auto-creates next break/focus session
```

### 3. User sends WhatsApp command
```
User sends "START" to Twilio number
  ↓
Twilio forwards to /api/whatsapp/webhook
  ↓
Backend parses command
  ↓
Starts Pomodoro for highest-priority task
  ↓
Sends confirmation message back
```

---

## 🐛 Common Issues

### No WhatsApp notifications
**Fix:** Check phone number format, verify Twilio credentials, ensure `whatsapp_verified = TRUE`

### Timer not working
**Fix:** Check browser console for errors, verify API endpoints are accessible

### Scheduler not running
**Fix:** Ensure `initializePomodoroScheduler()` is called on app startup

### Webhook 403 error
**Fix:** In development, set `NODE_ENV=development` to skip signature verification

---

## 🚀 Production Checklist

- [ ] Replace node-cron with BullMQ + Redis
- [ ] Use Meta WhatsApp Cloud API (not Twilio sandbox)
- [ ] Add retry logic for failed notifications
- [ ] Implement rate limiting on webhook
- [ ] Add monitoring/logging (Sentry, DataDog)
- [ ] Use proper job queue dashboard
- [ ] Enable HTTPS for webhook
- [ ] Add proper error handling
- [ ] Implement WebSocket for real-time timer sync
- [ ] Add analytics dashboard

---

## 📚 Additional Resources

- **Architecture:** See `POMODORO_ARCHITECTURE.md`
- **Setup Guide:** See `POMODORO_SETUP.md`
- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **Meta WhatsApp API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **node-cron:** https://www.npmjs.com/package/node-cron
- **BullMQ:** https://docs.bullmq.io/

---

## 💡 Tips

1. **Use mock mode** during development (no Twilio credentials needed)
2. **Test with ngrok** before deploying to production
3. **Start with short durations** (e.g., 1-2 minutes) for testing
4. **Check database logs** to debug scheduler issues
5. **Use browser DevTools** to inspect API calls
6. **Read Twilio logs** in their console for delivery issues

---

## 🎉 Success Metrics

Track these KPIs:
- Total Pomodoro sessions completed
- Average focus time per day
- Task completion rate
- WhatsApp message delivery rate
- Bot command usage frequency
- User retention in Focus Mode

---

**Need Help?**
Check the full documentation or reach out to the development team!
