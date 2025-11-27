# Pomodoro Work & Break Timer - Setup Instructions

## 🎯 What's New

The Pomodoro timer now supports **work and break cycles**:
- ⏱️ Customizable work duration (15-60 minutes recommended)
- ☕ Customizable break duration (3-15 minutes recommended)
- 🔄 Automatic transition from work to break
- ⚙️ Option to auto-start break sessions
- 🎨 Visual distinction between work (blue) and break (green) sessions
- 📊 Only work sessions count toward daily statistics

## ✅ Features

### Work Session
- Select a task to work on (optional)
- Set custom work duration
- Timer tracks productivity
- Counts toward daily completed sessions

### Break Session
- Automatic transition after work completes
- Set custom break duration
- Option to auto-start or manually start
- Does not track task association

### Session Cycle
1. **Work** → Complete → Notification → **Break** (idle)
2. **Break** → Complete → Notification → **Work** (idle)
3. Repeat!

## 🗄️ Database Migration Required

Before using the new work/break features, you **MUST** run the database migration:

### Option 1: Using MySQL Command Line
```bash
mysql -u root -p taskranker_db < database_schema_pomodoro_simple.sql
```

### Option 2: Using phpMyAdmin (Laragon)
1. Open Laragon
2. Click "Database" button to open phpMyAdmin
3. Select `taskranker_db` database
4. Click "SQL" tab
5. Copy and paste contents of `database_schema_pomodoro_simple.sql`
6. Click "Go"

### Option 3: Manual SQL Execution

Run this SQL in your MySQL client:

```sql
-- Drop old tables if they exist
DROP TABLE IF EXISTS pomodoro_notification_jobs;
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS pomodoro_settings;

-- Create simplified pomodoro_sessions table
CREATE TABLE pomodoro_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  task_id INT NULL,
  duration_minutes INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NULL,
  paused_at DATETIME NULL,
  status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
  time_remaining_seconds INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  INDEX idx_user_status (user_id, status),
  INDEX idx_user_created (user_id, created_at)
);

-- Create pomodoro_settings table
CREATE TABLE pomodoro_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  default_duration INT DEFAULT 25,
  enable_sound BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🎮 How to Use

### 1. Set Your Preferences
- **Work Duration**: Choose 15, 25, 30, 45, or 60 minutes (or custom)
- **Break Duration**: Choose 3, 5, 10, or 15 minutes (or custom)
- **Auto-start Break**: Toggle if you want breaks to start automatically

### 2. Start Work Session
- Optionally select a task from your task list
- Click "Start Work" button
- Focus on your task until timer completes

### 3. Take a Break
- When work completes, you'll get a notification
- Timer switches to break mode (green)
- Click "Start Break" (or wait for auto-start if enabled)
- Relax and recharge!

### 4. Repeat the Cycle
- After break, timer switches back to work mode (blue)
- Select next task and continue!

## 🔔 Notifications

### Browser Notifications
- **Work Complete**: "Work Complete! 🎉 - Time for a X minute break"
- **Break Complete**: "Break Over! ⚡ - Ready for another X minute work session?"

### Sound Alerts
- Optional completion sound when timer finishes
- Can be enabled/disabled in settings panel

## 📊 Statistics Tracking

- **Completed Sessions**: Only work sessions count
- **Total Minutes**: Sum of completed work session durations
- **Daily Stats**: Reset at midnight
- Displayed at the top of the timer page

## ⚙️ Settings Panel

Access via gear icon when timer is idle:
- Enable/disable completion sound
- Enable/disable browser notifications
- Toggle auto-start break option
- Save preferences to database

## 🎨 Visual Indicators

### Work Session (Blue Theme)
- 🎯 "Work Session" badge
- Blue circular progress
- "Stay Focused" status text

### Break Session (Green Theme)
- ☕ "Break Time" badge  
- Green circular progress
- "Take a Break" status text

## 💡 Tips

1. **Classic Pomodoro**: 25 min work + 5 min break
2. **Extended Focus**: 45 min work + 10 min break
3. **Quick Sprints**: 15 min work + 3 min break
4. **Deep Work**: 60 min work + 15 min break

## 🔧 Troubleshooting

### Timer not saving to database?
- Check that you've run the SQL migration
- Verify database connection in `.env.local`
- Check browser console for API errors

### Notifications not showing?
- Click "Enable Browser Notifications" in settings
- Check browser notification permissions
- Ensure browser supports notifications

### Stats not updating?
- Stats only update after **work sessions** complete
- Break sessions don't count toward statistics
- Check that you're completing sessions (not canceling)

## 🚀 Development Server

The server is running at: **http://localhost:3000**

Navigate to Focus Mode to use the timer!
