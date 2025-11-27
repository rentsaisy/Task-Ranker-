-- =====================================================
-- Pomodoro Timer Database Schema
-- =====================================================

-- Update users table for timezone
ALTER TABLE users 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Jakarta' COMMENT 'User timezone for scheduling';

-- Index for timezone lookups
CREATE INDEX idx_timezone ON users(timezone);

-- =====================================================
-- Pomodoro Sessions Table
-- =====================================================
CREATE TABLE pomodoro_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    
    -- Session details
    mode ENUM('focus', 'short_break', 'long_break') NOT NULL DEFAULT 'focus',
    session_number INT NOT NULL DEFAULT 1 COMMENT 'Which Pomodoro in the cycle (1-4)',
    
    -- Time tracking
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    actual_end_time DATETIME NULL COMMENT 'Actual completion time if different from scheduled',
    duration_minutes INT NOT NULL COMMENT 'Planned duration in minutes',
    
    -- Status
    status ENUM('scheduled', 'active', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    paused_at DATETIME NULL,
    paused_duration_seconds INT DEFAULT 0 COMMENT 'Total time spent paused',
    
    -- Completion tracking
    completed_successfully BOOLEAN DEFAULT FALSE,
    interrupted BOOLEAN DEFAULT FALSE COMMENT 'Whether user stopped early',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_user_sessions ON pomodoro_sessions(user_id, created_at DESC);
CREATE INDEX idx_task_sessions ON pomodoro_sessions(task_id, created_at DESC);
CREATE INDEX idx_status ON pomodoro_sessions(status, end_time);
CREATE INDEX idx_active_sessions ON pomodoro_sessions(user_id, status, end_time);

-- =====================================================
-- Notification Jobs Table (Server-side scheduler)
-- =====================================================
CREATE TABLE notification_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Target user and session
    user_id INT NOT NULL,
    pomodoro_session_id INT NULL COMMENT 'Related Pomodoro session if applicable',
    task_id INT NULL,
    
    -- Job details
    job_type ENUM('pomodoro_end', 'break_end', 'daily_summary', 'task_reminder') NOT NULL,
    scheduled_at DATETIME NOT NULL COMMENT 'When to execute this job',
    
    -- Status tracking
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    attempts INT DEFAULT 0 COMMENT 'Number of execution attempts',
    max_attempts INT DEFAULT 3,
    
    -- Execution tracking
    executed_at DATETIME NULL,
    completed_at DATETIME NULL,
    error_message TEXT NULL,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pomodoro_session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for job processing
CREATE INDEX idx_scheduled_jobs ON notification_jobs(scheduled_at, status);
CREATE INDEX idx_user_jobs ON notification_jobs(user_id, scheduled_at DESC);
CREATE INDEX idx_session_jobs ON notification_jobs(pomodoro_session_id);
CREATE INDEX idx_pending_jobs ON notification_jobs(status, scheduled_at);

-- =====================================================
-- Pomodoro Settings Table (User preferences)
-- =====================================================
CREATE TABLE pomodoro_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- Duration settings (in minutes)
    focus_duration INT DEFAULT 25,
    short_break_duration INT DEFAULT 5,
    long_break_duration INT DEFAULT 15,
    sessions_before_long_break INT DEFAULT 4,
    
    -- Notification preferences
    enable_browser_sound BOOLEAN DEFAULT TRUE,
    enable_auto_start_breaks BOOLEAN DEFAULT TRUE,
    enable_auto_start_focus BOOLEAN DEFAULT FALSE COMMENT 'Auto start next focus after break',
    
    -- Advanced settings
    strict_mode BOOLEAN DEFAULT FALSE COMMENT 'Prevent pausing during focus',
    daily_goal_sessions INT DEFAULT 8 COMMENT 'Target Pomodoros per day',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Insert default Pomodoro settings for existing users
INSERT INTO pomodoro_settings (user_id, focus_duration, short_break_duration, long_break_duration)
SELECT id, 25, 5, 15 FROM users
ON DUPLICATE KEY UPDATE focus_duration = focus_duration;

-- =====================================================
-- Useful Queries
-- =====================================================

-- Get user's Pomodoro statistics for today
-- SELECT 
--     COUNT(*) as total_sessions,
--     SUM(CASE WHEN mode = 'focus' AND completed_successfully THEN 1 ELSE 0 END) as completed_focus,
--     SUM(duration_minutes) as total_minutes
-- FROM pomodoro_sessions
-- WHERE user_id = ? 
--   AND DATE(start_time) = CURDATE()
--   AND status = 'completed';

-- Get pending notification jobs
-- SELECT * FROM notification_jobs
-- WHERE status = 'pending' 
--   AND scheduled_at <= NOW()
-- ORDER BY scheduled_at ASC
-- LIMIT 10;

-- Get active Pomodoro session for user
-- SELECT ps.*, t.name as task_name
-- FROM pomodoro_sessions ps
-- JOIN tasks t ON ps.task_id = t.id
-- WHERE ps.user_id = ?
--   AND ps.status IN ('active', 'paused')
-- ORDER BY ps.start_time DESC
-- LIMIT 1;
