# Focus Mode with Pomodoro Timer & WhatsApp Bot Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/Next.js)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Focus Mode Component                                     │  │
│  │  - Task Selection                                         │  │
│  │  - Countdown Timer (UI only)                             │  │
│  │  - Start/Pause/Resume/Reset Controls                     │  │
│  │  - Session Progress Display                               │  │
│  │  - Browser Alarm Sound                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▼                                   │
│                   API Calls (fetch/axios)                        │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Next.js API Routes)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/pomodoro/start    - Start session + schedule       │  │
│  │  /api/pomodoro/pause    - Pause session                  │  │
│  │  /api/pomodoro/complete - Mark session complete          │  │
│  │  /api/pomodoro/stop     - Cancel session                 │  │
│  │  /api/pomodoro/status   - Get current session status     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/whatsapp/webhook  - Handle incoming WA messages    │  │
│  │  Commands: START, STOP, STATUS                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ PomodoroScheduler│  │ WhatsAppService  │  │ TaskService  │ │
│  │ - Job Queue      │  │ - Twilio API     │  │ - Task CRUD  │ │
│  │ - Timer Logic    │  │ - Send Messages  │  │ - Priority   │ │
│  │ - Session Mgmt   │  │ - Handle Replies │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (MySQL)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  users: id, name, email, phoneNumber (WhatsApp)          │  │
│  │  tasks: id, userId, name, taskType, deadline, priority   │  │
│  │  pomodoro_sessions: id, userId, taskId, mode, times      │  │
│  │  notification_jobs: id, userId, type, scheduledAt        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Twilio WhatsApp API / Meta WhatsApp Cloud API           │  │
│  │  - Send outgoing messages                                 │  │
│  │  - Receive webhook callbacks                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. **Dual-Timer System**
- **Frontend Timer**: Visual countdown for immediate UI feedback
- **Backend Scheduler**: Server-side job scheduling ensures reminders even if browser closes

### 2. **Pomodoro Flow**
1. User selects task and starts Pomodoro
2. Backend creates `pomodoro_sessions` record and schedules notification
3. Frontend displays countdown timer
4. When session ends:
   - Play browser alarm (if tab is open)
   - Backend sends WhatsApp reminder
   - Auto-switch to break mode
5. After 4 focus sessions, trigger long break

### 3. **WhatsApp Bot Commands**
- **START**: Begin Pomodoro for highest-priority task
- **STOP**: Cancel current session
- **STATUS**: Show today's completed sessions

### 4. **Persistence & Reliability**
- Sessions stored in database
- Jobs scheduled server-side with node-cron or job queue
- Graceful handling of browser closure
- Webhook security with signature verification

## Database Schema

See `database_schema_pomodoro.sql` for complete implementation.

## Component Interaction Flow

```
User Action → Frontend Component → API Endpoint → Scheduler Service
                                                         ↓
                                              Schedule Job (node-cron)
                                                         ↓
                                            Wait until endTime
                                                         ↓
                                            Execute Job:
                                            1. Send WhatsApp message
                                            2. Update session as complete
                                            3. Schedule next break/focus
```

## Technology Stack

- **Frontend**: React 19, Next.js 16, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: MySQL with mysql2
- **Scheduler**: node-cron (or BullMQ for production)
- **WhatsApp**: Twilio WhatsApp API
- **Audio**: HTML5 Audio API for browser alarms

## Security Considerations

1. **Webhook Verification**: Validate Twilio signatures
2. **Phone Number Privacy**: Store encrypted phone numbers
3. **Rate Limiting**: Prevent WhatsApp spam
4. **User Authentication**: Verify userId in all API calls
5. **Job Isolation**: Ensure jobs don't interfere with each other

## Scalability Notes

For production environments:
- Replace node-cron with Redis-backed job queue (BullMQ)
- Use WebSocket for real-time timer sync across devices
- Implement push notifications as fallback
- Cache active sessions in Redis
- Add retry logic for failed WhatsApp deliveries
