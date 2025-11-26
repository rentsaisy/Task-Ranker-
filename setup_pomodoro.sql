-- =====================================================
-- Complete Pomodoro Database Setup for TaskRanker
-- Run this in phpMyAdmin SQL tab or command line
-- =====================================================

USE taskranker_db;

-- =====================================================
-- Step 1: Update users table (add phone fields if not exist)
-- =====================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'taskranker_db'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'phone_number') = 0,
  "ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL COMMENT 'WhatsApp phone number with country code';",
  "SELECT 'Column phone_number already exists' AS message;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'taskranker_db'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'whatsapp_verified') = 0,
  "ALTER TABLE users ADD COLUMN whatsapp_verified BOOLEAN DEFAULT FALSE;",
  "SELECT 'Column whatsapp_verified already exists' AS message;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'taskranker_db'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'timezone') = 0,
  "ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Jakarta';",
  "SELECT 'Column timezone already exists' AS message;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- Step 2: Create Pomodoro Sessions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    
    -- Session details
    mode ENUM('focus', 'short_break', 'long_break') NOT NULL DEFAULT 'focus',
    duration INT NOT NULL COMMENT 'Duration in minutes',
    session_number INT NOT NULL DEFAULT 1,
    
    -- Timing
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    paused_at DATETIME NULL,
    resumed_at DATETIME NULL,
    completed_at DATETIME NULL,
    
    -- Status
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    actual_duration INT NULL,
    pause_duration INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 3: Create Notification Jobs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pomodoro_session_id INT NULL,
    task_id INT NULL,
    
    -- Job details
    job_type ENUM('pomodoro_end', 'break_end', 'reminder') NOT NULL,
    scheduled_at DATETIME NOT NULL,
    executed_at DATETIME NULL,
    
    -- Status
    status ENUM('pending', 'executed', 'failed', 'cancelled') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT NULL,
    notification_data JSON NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pomodoro_session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 4: Create Pomodoro Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS pomodoro_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- Duration settings (minutes)
    focus_duration INT DEFAULT 25,
    short_break_duration INT DEFAULT 5,
    long_break_duration INT DEFAULT 15,
    sessions_before_long_break INT DEFAULT 4,
    
    -- Notification preferences
    enable_whatsapp_notifications BOOLEAN DEFAULT TRUE,
    enable_browser_sound BOOLEAN DEFAULT TRUE,
    enable_auto_start_breaks BOOLEAN DEFAULT TRUE,
    enable_auto_start_pomodoros BOOLEAN DEFAULT FALSE,
    reminder_before_end INT DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 5: Create WhatsApp Messages Log Table
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
    twilio_sid VARCHAR(50) NULL,
    status VARCHAR(20) NULL,
    error_code INT NULL,
    error_message TEXT NULL,
    
    -- Command processing
    is_command BOOLEAN DEFAULT FALSE,
    command_type VARCHAR(50) NULL,
    command_processed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    sent_at DATETIME NOT NULL,
    delivered_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pomodoro_session_id) REFERENCES pomodoro_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 6: Create Indexes (only if tables are new)
-- =====================================================

-- Check and create indexes for pomodoro_sessions
SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'pomodoro_sessions' 
                    AND INDEX_NAME = 'idx_user_sessions');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_user_sessions ON pomodoro_sessions(user_id, created_at DESC)',
                  'SELECT "Index idx_user_sessions exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'pomodoro_sessions' 
                    AND INDEX_NAME = 'idx_task_sessions');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_task_sessions ON pomodoro_sessions(task_id)',
                  'SELECT "Index idx_task_sessions exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'pomodoro_sessions' 
                    AND INDEX_NAME = 'idx_active_sessions');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_active_sessions ON pomodoro_sessions(user_id, status)',
                  'SELECT "Index idx_active_sessions exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Indexes for notification_jobs
SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'notification_jobs' 
                    AND INDEX_NAME = 'idx_scheduled_jobs');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_scheduled_jobs ON notification_jobs(scheduled_at, status)',
                  'SELECT "Index idx_scheduled_jobs exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'notification_jobs' 
                    AND INDEX_NAME = 'idx_pending_jobs');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_pending_jobs ON notification_jobs(status, scheduled_at)',
                  'SELECT "Index idx_pending_jobs exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Indexes for whatsapp_messages
SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'whatsapp_messages' 
                    AND INDEX_NAME = 'idx_user_messages');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_user_messages ON whatsapp_messages(user_id, sent_at DESC)',
                  'SELECT "Index idx_user_messages exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- Step 7: Insert default settings for existing users
-- =====================================================
INSERT IGNORE INTO pomodoro_settings (user_id, focus_duration, short_break_duration, long_break_duration, sessions_before_long_break)
SELECT id, 25, 5, 15, 4
FROM users;

-- =====================================================
-- Step 8: Verify Installation
-- =====================================================
SELECT 
    '✅ Pomodoro Database Setup Complete!' AS Status,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taskranker_db' AND TABLE_NAME = 'pomodoro_sessions') AS pomodoro_sessions_exists,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taskranker_db' AND TABLE_NAME = 'notification_jobs') AS notification_jobs_exists,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taskranker_db' AND TABLE_NAME = 'pomodoro_settings') AS pomodoro_settings_exists,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taskranker_db' AND TABLE_NAME = 'whatsapp_messages') AS whatsapp_messages_exists,
    (SELECT COUNT(*) FROM pomodoro_settings) AS users_with_settings;

-- Show all tables in database
SHOW TABLES;
