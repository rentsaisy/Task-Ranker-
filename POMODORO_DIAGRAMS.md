# Pomodoro System - Visual Diagrams

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Focus Mode React Component                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │ │
│  │  │  Task   │  │  Timer  │  │ Session │  │ Controls│         │ │
│  │  │Selection│  │ Display │  │ Progress│  │  Start  │         │ │
│  │  └─────────┘  └─────────┘  └─────────┘  │Pause/Stop│        │ │
│  │                                           └─────────┘         │ │
│  │  🔔 Browser Alarm (HTML5 Audio)                               │ │
│  │  📢 Push Notifications (optional)                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS API ROUTES                         │
│  ┌───────────────────────┐    ┌───────────────────────────────┐   │
│  │   Pomodoro Routes     │    │    WhatsApp Webhook          │   │
│  │  /api/pomodoro/       │    │  /api/whatsapp/webhook       │   │
│  │  - start              │    │  - Handle incoming messages  │   │
│  │  - stop               │    │  - Parse commands            │   │
│  │  - pause/resume       │    │  - Verify signature          │   │
│  │  - status             │    └───────────────────────────────┘   │
│  └───────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Pomodoro         │  │ WhatsApp         │  │ Database        │  │
│  │ Scheduler        │  │ Service          │  │ Queries         │  │
│  │                  │  │                  │  │                 │  │
│  │ - node-cron      │  │ - Twilio API    │  │ - Sessions      │  │
│  │ - Job Queue      │  │ - Templates     │  │ - Users         │  │
│  │ - Transitions    │  │ - Logging       │  │ - Tasks         │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MYSQL DATABASE                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ pomodoro_        │  │ notification_    │  │ pomodoro_       │  │
│  │ sessions         │  │ jobs             │  │ settings        │  │
│  │                  │  │                  │  │                 │  │
│  │ - id             │  │ - id             │  │ - focus_dur     │  │
│  │ - user_id        │  │ - scheduled_at   │  │ - break_dur     │  │
│  │ - task_id        │  │ - status         │  │ - auto_start    │  │
│  │ - mode           │  │ - job_type       │  │                 │  │
│  │ - status         │  └──────────────────┘  └─────────────────┘  │
│  │ - times          │       ┌──────────────────┐                   │
│  └──────────────────┘       │ whatsapp_        │                   │
│                              │ messages         │                   │
│                              │ - direction      │                   │
│                              │ - message_body   │                   │
│                              │ - status         │                   │
│                              └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Twilio WhatsApp API                              │  │
│  │  📱 Send Messages    📥 Receive Messages    🔐 Webhooks      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Session Lifecycle Flow

```
┌─────────────┐
│   IDLE      │ ◄─── User hasn't started yet
└─────────────┘
      │
      │ User clicks "Start"
      │ POST /api/pomodoro/start
      ▼
┌─────────────┐
│   ACTIVE    │ ◄─── Timer running, user working
└─────────────┘
      │
      ├─────► User clicks "Pause" ────► ┌─────────────┐
      │                                  │   PAUSED    │
      │                                  └─────────────┘
      │                                         │
      │                                         │ User clicks "Resume"
      │                                         │
      │ ◄───────────────────────────────────────┘
      │
      │ Timer reaches 0:00
      │ OR scheduled_at time reached
      ▼
┌─────────────┐
│  COMPLETED  │ ◄─── Session finished successfully
└─────────────┘
      │
      │ Auto-transition
      ▼
┌─────────────┐
│    BREAK    │ ◄─── Short or long break
│  (ACTIVE)   │
└─────────────┘
      │
      │ Break ends
      ▼
┌─────────────┐
│   FOCUS     │ ◄─── Next focus session
│ (SCHEDULED) │
└─────────────┘


Alternative path:
ACTIVE/PAUSED ──► User clicks "Stop" ──► ┌─────────────┐
                                          │  CANCELLED  │
                                          └─────────────┘
```

---

## 📱 WhatsApp Bot Interaction Flow

```
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ Sends "START" via WhatsApp
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    TWILIO SERVER                              │
│  - Receives message                                           │
│  - Validates sender                                           │
│  - Forwards to webhook                                        │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ POST /api/whatsapp/webhook
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   WEBHOOK HANDLER                             │
│  1. Verify signature ✓                                       │
│  2. Parse command: "START"                                    │
│  3. Find user by phone number                                 │
│  4. Execute command                                           │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌─────────────────┐            ┌─────────────────────┐
│  Get Highest    │            │  Create Pomodoro    │
│  Priority Task  │            │  Session in DB      │
└─────────────────┘            └─────────────────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │  Schedule Job for   │
                               │  End Notification   │
                               └─────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   SEND CONFIRMATION                           │
│  "🎯 Pomodoro started!                                       │
│   Task: Advanced Calculus                                    │
│   Duration: 25 minutes"                                      │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ Via Twilio API
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│  Receives confirmation message                               │
└──────────────────────────────────────────────────────────────┘

... 25 minutes later ...

┌──────────────────────────────────────────────────────────────┐
│                   CRON SCHEDULER                              │
│  - Runs every minute                                          │
│  - Checks for due jobs                                        │
│  - Found job #123 scheduled_at <= NOW()                      │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  EXECUTE JOB                                  │
│  1. Get task details                                          │
│  2. Send WhatsApp message                                     │
│  3. Mark session complete                                     │
│  4. Create break session                                      │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                         USER                                  │
│  "⏰ Your Pomodoro for Advanced Calculus is finished.        │
│   Time for a break! 🎉"                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🕒 Timing Diagram (25-minute Pomodoro)

```
Time:  0        5        10       15       20       25
       ├────────┼────────┼────────┼────────┼────────┤
       │                                            │
       │          🎯 FOCUS MODE                    │
       │          User is working                   │
       │                                            │
Start  │                                            │  End
 ↓     │                                            │   ↓
[DB]   │                                            │  [JOB]
Insert │                                            │  Execute
Session│                                            │  Send WA
       │                                            │  Update DB
       └────────────────────────────────────────────┘
       
       ⏰ Scheduled notification job created
          scheduled_at = NOW() + 25 minutes

--- After 25 minutes ---

Time:  25       26       27       28       29       30
       ├────────┼────────┼────────┼────────┼────────┤
       │                                            │
       │          ☕ SHORT BREAK                    │
       │          5 minutes                         │
       │                                            │
       │                                            │
Break  │                                            │  End
Start  │                                            │  Break
 ↓     │                                            │   ↓
[DB]   │                                            │  [JOB]
Insert │                                            │  Execute
Break  │                                            │  Send WA
Session│                                            │  
       └────────────────────────────────────────────┘

--- Cycle repeats ---

Session 1: Focus 25min → Break 5min
Session 2: Focus 25min → Break 5min
Session 3: Focus 25min → Break 5min
Session 4: Focus 25min → LONG BREAK 15min
[Reset counter, start from Session 1]
```

---

## 📊 Database Relationships

```
┌─────────────┐
│   users     │
│ ─────────── │
│ id (PK)     │◄────────┐
│ name        │         │
│ email       │         │
│ phone_number│         │ user_id (FK)
│ whatsapp_   │         │
│  verified   │         │
└─────────────┘         │
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ pomodoro_   │  │notification_│  │ whatsapp_   │
│ sessions    │  │ jobs        │  │ messages    │
│ ─────────── │  │ ─────────── │  │ ─────────── │
│ id (PK)     │  │ id (PK)     │  │ id (PK)     │
│ user_id (FK)│  │ user_id (FK)│  │ user_id (FK)│
│ task_id (FK)│──┤pomodoro_    │  │ direction   │
│ mode        │  │ session_id  │  │ message_body│
│ start_time  │  │ job_type    │  │ status      │
│ end_time    │  │ scheduled_at│  │ sent_at     │
│ status      │  │ status      │  └─────────────┘
└─────────────┘  └─────────────┘
        │
        │ task_id (FK)
        ▼
┌─────────────┐
│   tasks     │
│ ─────────── │
│ id (PK)     │
│ user_id (FK)│
│ name        │
│ taskType    │
│ deadline    │
│ priority    │
└─────────────┘
```

---

## 🎮 Control Flow - User Actions

```
┌──────────────────────────────────────────────────────────┐
│                    USER INTERFACE                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Start   │  │  Pause   │  │  Resume  │  │   Stop   │ │
│  │  Button  │  │  Button  │  │  Button  │  │  Button  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────┘
       │             │             │             │
       │ onClick     │ onClick     │ onClick     │ onClick
       ▼             ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   POST   │  │   POST   │  │   POST   │  │   POST   │
│ /start   │  │ /pause   │  │ /resume  │  │  /stop   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌────────────────────────────────────────────────────────┐
│                    API HANDLER                          │
│  1. Validate userId                                    │
│  2. Check existing session                             │
│  3. Update database                                    │
│  4. Schedule/cancel notifications                      │
│  5. Return response                                    │
└────────────────────────────────────────────────────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌────────────────────────────────────────────────────────┐
│                     DATABASE                            │
│  UPDATE pomodoro_sessions                              │
│  SET status = 'active'/'paused'/'cancelled'            │
│  WHERE id = ? AND user_id = ?                          │
└────────────────────────────────────────────────────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌────────────────────────────────────────────────────────┐
│                   RESPONSE TO UI                        │
│  { success: true, sessionId: 123, status: 'active' }  │
└────────────────────────────────────────────────────────┘
       │             │             │             │
       ▼             ▼             ▼             ▼
┌────────────────────────────────────────────────────────┐
│                UPDATE UI STATE                          │
│  setStatus('active')                                   │
│  setRemainingSeconds(timer)                            │
│  Show appropriate buttons                              │
└────────────────────────────────────────────────────────┘
```

---

## 🔔 Notification Types Timeline

```
DAY VIEW:

8:00 AM  ─┐
          │ User opens app
          │ Sees 3 tasks
8:15 AM  ─┘
          
8:20 AM  ─┐
          │ Starts Pomodoro (Task 1)
          │ 📱 "Pomodoro started for Task 1"
8:25 AM  ─┘

8:45 AM  ─┐
          │ Session ends
          │ 📱 "⏰ Pomodoro finished! Time for break"
8:50 AM  ─┘

8:50 AM  ─┐
          │ Break starts (auto)
8:55 AM  ─┘

8:55 AM  ─┐
          │ Break ends
          │ 📱 "✅ Break over! Ready for next session?"
9:00 AM  ─┘

... pattern repeats for 4 sessions ...

11:00 AM ─┐
          │ 4th session complete
          │ 📱 "🎉 4 sessions done! Long break time!"
11:15 AM ─┘

... end of day ...

8:00 PM  ─┐
          │ Daily summary sent
          │ 📱 "📊 Today: 8 sessions, 200 minutes"
8:05 PM  ─┘
```

This visual documentation helps understand how all the components work together! 🎨
