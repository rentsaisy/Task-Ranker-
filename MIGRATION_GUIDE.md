# Simple Pomodoro Timer - Database Migration Guide

## Quick Migration (Recommended)

Run this SQL in your MySQL database to upgrade to the simplified timer:

```sql
-- Run this in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)
USE taskranker_db;

-- Backup existing data (optional but recommended)
-- CREATE TABLE pomodoro_sessions_backup AS SELECT * FROM pomodoro_sessions;
-- CREATE TABLE pomodoro_settings_backup AS SELECT * FROM pomodoro_settings;

-- Drop old complex tables
DROP TABLE IF EXISTS notification_jobs;
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS pomodoro_settings;

-- Create new simplified tables
CREATE TABLE pomodoro_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    duration_minutes INT NOT NULL COMMENT 'Timer duration in minutes',
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    paused_at DATETIME NULL,
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    time_remaining_seconds INT NULL COMMENT 'Seconds remaining when paused',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_user_sessions (user_id, created_at DESC),
    INDEX idx_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pomodoro_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    default_duration INT DEFAULT 25,
    enable_sound BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings for existing users
INSERT INTO pomodoro_settings (user_id, default_duration)
SELECT id, 25 FROM users
ON DUPLICATE KEY UPDATE default_duration = default_duration;
```

## Or Use the SQL File

You can also run the prepared SQL file:

```bash
mysql -u root -p taskranker_db < database_schema_pomodoro_simple.sql
```

## What Changed?

### Simplified Features:
- ✅ **Customizable timer** - Set any duration from 1-120 minutes
- ✅ **Task tracking** - Optional task association
- ✅ **Session history** - Track completed sessions and total time
- ✅ **Pause/Resume** - Full control over your timer
- ✅ **Persistent settings** - Save your preferred duration

### Removed Complexity:
- ❌ No more complex Pomodoro cycles (focus/break modes)
- ❌ No more server-side job scheduler
- ❌ No more notification jobs table
- ❌ Simpler database schema (2 tables instead of 3)

## New Timer Features

1. **Custom Duration**: Set any time between 1-120 minutes
2. **Quick Presets**: Buttons for common durations (5, 10, 15, 25, 30, 45, 60 minutes)
3. **Optional Task**: You can use the timer without selecting a task
4. **Daily Stats**: View completed sessions and total minutes for today
5. **Browser Notifications**: Get alerts when timer completes
6. **Sound Alerts**: Optional sound when timer finishes

## Testing

1. Navigate to Focus Mode in your app
2. Set a duration (e.g., 1 minute for testing)
3. Optionally select a task
4. Click Start
5. Watch the circular progress bar count down
6. Timer will complete automatically or you can Pause/Reset

Done! Your simplified timer is ready to use! 🎉
