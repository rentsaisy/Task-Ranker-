-- =====================================================
-- WhatsApp Task Reminder Database Setup for TaskRanker
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
-- Step 2: Update tasks table (add status if not exist)
-- =====================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'taskranker_db'
   AND TABLE_NAME = 'tasks'
   AND COLUMN_NAME = 'status') = 0,
  "ALTER TABLE tasks ADD COLUMN status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending';",
  "SELECT 'Column status already exists' AS message;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- Step 3: Create WhatsApp Messages Log Table
-- =====================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
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
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 4: Create Scheduled Task Reminders Table
-- =====================================================
CREATE TABLE IF NOT EXISTS task_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    
    -- Reminder details
    reminder_type ENUM('daily', 'task_due', 'manual') NOT NULL,
    scheduled_at DATETIME NOT NULL,
    sent_at DATETIME NULL,
    
    -- Status
    status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Step 5: Create Indexes
-- =====================================================

-- Check and create indexes for whatsapp_messages
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

SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'whatsapp_messages' 
                    AND INDEX_NAME = 'idx_commands');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_commands ON whatsapp_messages(is_command, command_processed)',
                  'SELECT "Index idx_commands exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Indexes for task_reminders
SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'task_reminders' 
                    AND INDEX_NAME = 'idx_scheduled_reminders');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_scheduled_reminders ON task_reminders(scheduled_at, status)',
                  'SELECT "Index idx_scheduled_reminders exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- Step 6: Verify Installation
-- =====================================================
SELECT 
    '✅ WhatsApp Task Reminder Setup Complete!' AS Status,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taskranker_db' AND TABLE_NAME = 'whatsapp_messages') AS whatsapp_messages_exists,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taskranker_db' AND TABLE_NAME = 'task_reminders') AS task_reminders_exists,
    (SELECT COUNT(*) FROM users WHERE phone_number IS NOT NULL) AS users_with_phone;

-- Show all tables in database
SHOW TABLES;
