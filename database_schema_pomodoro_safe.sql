-- =====================================================
-- Pomodoro Timer Database Schema (Safe Migration)
-- =====================================================

-- Update users table to include timezone (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Jakarta' COMMENT 'User timezone for scheduling';

-- Index for timezone lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_timezone ON users(timezone);

-- =====================================================
-- Pomodoro Sessions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    
    -- Session details
    mode ENUM('focus', 'short_break', 'long_break') NOT NULL DEFAULT 'focus',
    duration INT NOT NULL COMMENT 'Duration in minutes',
    session_number INT NOT NULL DEFAULT 1 COMMENT 'Which session in the current cycle (1-4)',
    
    -- Timing
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    paused_at DATETIME NULL,
    resumed_at DATETIME NULL,
    completed_at DATETIME NULL,
    
    -- Status
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    actual_duration INT NULL COMMENT 'Actual minutes worked (excluding pauses)',
    pause_duration INT DEFAULT 0 COMMENT 'Total minutes paused',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_user_sessions ON pomodoro_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_sessions ON pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions ON pomodoro_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_session_date ON pomodoro_sessions(user_id, DATE(created_at));

-- =====================================================
-- Notification Jobs Table (Server-side scheduling)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pomodoro_session_id INT NULL,
    task_id INT NULL,
    
    -- Job details
    job_type ENUM('pomodoro_end', 'break_end', 'reminder') NOT NULL,
    scheduled_at DATETIME NOT NULL COMMENT 'When to execute this job',
    executed_at DATETIME NULL,
    
    -- Status
    status ENUM('pending', 'executed', 'failed', 'cancelled') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT NULL,
    
    -- Payload
    notification_data JSON NULL COMMENT 'Additional data for the notification',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pomodoro_session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for job processing
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs ON notification_jobs(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_user_jobs ON notification_jobs(user_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_jobs ON notification_jobs(pomodoro_session_id);
CREATE INDEX IF NOT EXISTS idx_pending_jobs ON notification_jobs(status, scheduled_at);

-- =====================================================
-- Pomodoro Settings Table (User preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS pomodoro_settings (
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
    enable_auto_start_pomodoros BOOLEAN DEFAULT FALSE,
    
    -- Reminder settings
    reminder_before_end INT DEFAULT 1 COMMENT 'Minutes before session end to send reminder',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- Sample Data / Initial Settings
-- =====================================================

-- Insert default Pomodoro settings for existing users (if they don't have settings)
INSERT IGNORE INTO pomodoro_settings (user_id, focus_duration, short_break_duration, long_break_duration, sessions_before_long_break)
SELECT id, 25, 5, 15, 4
FROM users
WHERE id NOT IN (SELECT user_id FROM pomodoro_settings);

-- =====================================================
-- Views for Analytics
-- =====================================================

-- Daily Pomodoro Statistics View
CREATE OR REPLACE VIEW daily_pomodoro_stats AS
SELECT 
    user_id,
    DATE(created_at) as session_date,
    COUNT(*) as total_sessions,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
    SUM(CASE WHEN status = 'completed' AND mode = 'focus' THEN actual_duration ELSE 0 END) as total_focus_minutes,
    AVG(CASE WHEN status = 'completed' AND mode = 'focus' THEN actual_duration END) as avg_focus_duration
FROM pomodoro_sessions
GROUP BY user_id, DATE(created_at);

-- Task Productivity View (combines tasks with Pomodoro data)
CREATE OR REPLACE VIEW task_productivity AS
SELECT 
    t.id as task_id,
    t.user_id,
    t.title as task_title,
    t.priority_score,
    COUNT(ps.id) as pomodoro_count,
    SUM(CASE WHEN ps.status = 'completed' THEN ps.actual_duration ELSE 0 END) as total_minutes_spent,
    MAX(ps.created_at) as last_worked_on
FROM tasks t
LEFT JOIN pomodoro_sessions ps ON t.id = ps.task_id
GROUP BY t.id, t.user_id, t.title, t.priority_score;

-- =====================================================
-- Triggers for Auto-Completion
-- =====================================================

-- Automatically mark notification jobs as cancelled when session is cancelled
DELIMITER //
CREATE TRIGGER IF NOT EXISTS cancel_jobs_on_session_cancel
AFTER UPDATE ON pomodoro_sessions
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE notification_jobs
        SET status = 'cancelled'
        WHERE pomodoro_session_id = NEW.id
          AND status = 'pending';
    END IF;
END//
DELIMITER ;

-- =====================================================
-- Success Message
-- =====================================================
SELECT 'Pomodoro Timer Database Schema Created Successfully!' as Status;
