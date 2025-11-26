-- =====================================================
-- Pomodoro Timer & WhatsApp Bot Database Schema
-- Safe migration that checks existing structures
-- =====================================================

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

-- Indexes for session queries (MySQL 8.0+)
CREATE INDEX idx_user_sessions ON pomodoro_sessions(user_id, created_at DESC);
CREATE INDEX idx_task_sessions ON pomodoro_sessions(task_id);
CREATE INDEX idx_active_sessions ON pomodoro_sessions(user_id, status);
CREATE INDEX idx_session_date ON pomodoro_sessions(user_id, created_at);

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
CREATE INDEX idx_scheduled_jobs ON notification_jobs(scheduled_at, status);
CREATE INDEX idx_user_jobs ON notification_jobs(user_id, scheduled_at DESC);
CREATE INDEX idx_session_jobs ON notification_jobs(pomodoro_session_id);
CREATE INDEX idx_pending_jobs ON notification_jobs(status, scheduled_at);

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
    enable_whatsapp_notifications BOOLEAN DEFAULT TRUE,
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
-- WhatsApp Messages Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pomodoro_session_id INT NULL,
    
    -- Message details
    direction ENUM('outgoing', 'incoming') NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    
    -- Twilio details
    twilio_sid VARCHAR(50) NULL COMMENT 'Twilio message SID',
    status VARCHAR(20) NULL COMMENT 'Twilio delivery status',
    error_code INT NULL,
    error_message TEXT NULL,
    
    -- Processing
    is_command BOOLEAN DEFAULT FALSE COMMENT 'Whether this is a bot command',
    command_type VARCHAR(50) NULL COMMENT 'Type of command (START, STOP, STATUS, etc.)',
    command_processed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    sent_at DATETIME NOT NULL,
    delivered_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pomodoro_session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for message queries
CREATE INDEX idx_user_messages ON whatsapp_messages(user_id, sent_at DESC);
CREATE INDEX idx_twilio_sid ON whatsapp_messages(twilio_sid);
CREATE INDEX idx_commands ON whatsapp_messages(is_command, command_processed);
CREATE INDEX idx_session_messages ON whatsapp_messages(pomodoro_session_id);

-- =====================================================
-- Insert default Pomodoro settings for existing users
-- =====================================================
INSERT IGNORE INTO pomodoro_settings (user_id, focus_duration, short_break_duration, long_break_duration, sessions_before_long_break)
SELECT id, 25, 5, 15, 4
FROM users
WHERE id NOT IN (SELECT user_id FROM pomodoro_settings);

SELECT 'Pomodoro Database Tables Created Successfully!' as Status;
