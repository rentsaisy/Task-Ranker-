-- =====================================================
-- Discord Integration Database Setup for TaskRanker
-- Run this in phpMyAdmin SQL tab or command line
-- =====================================================

USE taskranker_db;

-- =====================================================
-- Step 1: Add discord_user_id column to users table
-- =====================================================
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = 'taskranker_db'
   AND TABLE_NAME = 'users'
   AND COLUMN_NAME = 'discord_user_id') = 0,
  "ALTER TABLE users ADD COLUMN discord_user_id VARCHAR(20) NULL COMMENT 'Discord User ID for bot notifications';",
  "SELECT 'Column discord_user_id already exists' AS message;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- Step 2: Add index for discord_user_id lookup
-- =====================================================
SET @indexExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = 'taskranker_db' 
                    AND TABLE_NAME = 'users' 
                    AND INDEX_NAME = 'idx_discord_user_id');
SET @sqlStmt = IF(@indexExists = 0, 
                  'CREATE INDEX idx_discord_user_id ON users(discord_user_id)',
                  'SELECT "Index idx_discord_user_id exists"');
PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- Step 3: Verify Installation
-- =====================================================
SELECT 
    '✅ Discord Integration Setup Complete!' AS Status,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'taskranker_db' 
     AND TABLE_NAME = 'users' 
     AND COLUMN_NAME = 'discord_user_id') AS discord_user_id_column_exists,
    (SELECT COUNT(*) FROM users WHERE discord_user_id IS NOT NULL) AS users_with_discord;
