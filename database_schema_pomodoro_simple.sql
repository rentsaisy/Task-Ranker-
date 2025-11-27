-- =====================================================
-- Simple Pomodoro Timer Database Schema
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS notification_jobs;
DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS pomodoro_settings;

-- =====================================================
-- Pomodoro Sessions Table (Simplified)
-- =====================================================
CREATE TABLE pomodoro_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    
    -- Session details
    duration_minutes INT NOT NULL COMMENT 'Timer duration in minutes',
    
    -- Time tracking
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    paused_at DATETIME NULL,
    
    -- Status
    status ENUM('active', 'paused', 'completed', 'cancelled') DEFAULT 'active',
    time_remaining_seconds INT NULL COMMENT 'Seconds remaining when paused',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_user_sessions (user_id, created_at DESC),
    INDEX idx_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Pomodoro Settings Table (User preferences)
-- =====================================================
CREATE TABLE pomodoro_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    
    -- Default timer durations (in minutes)
    default_duration INT DEFAULT 25,
    
    -- Notification preferences
    enable_sound BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings for existing users
INSERT INTO pomodoro_settings (user_id, default_duration)
SELECT id, 25 FROM users
ON DUPLICATE KEY UPDATE default_duration = default_duration;

-- =====================================================
-- Useful Queries
-- =====================================================

-- Get user's completed sessions today
-- SELECT COUNT(*) as completed_today, 
--        SUM(duration_minutes) as total_minutes
-- FROM pomodoro_sessions
-- WHERE user_id = ? 
--   AND DATE(start_time) = CURDATE()
--   AND status = 'completed';

-- Get active session for user
-- SELECT * FROM pomodoro_sessions
-- WHERE user_id = ? AND status IN ('active', 'paused')
-- ORDER BY start_time DESC LIMIT 1;
