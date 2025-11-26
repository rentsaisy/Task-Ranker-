-- Database Migration for Task Ranker ML Web
-- Run this in Laragon phpMyAdmin or MySQL command line

USE taskranker_db;

-- Create task_types table
CREATE TABLE IF NOT EXISTS task_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  default_difficulty INT NOT NULL CHECK (default_difficulty BETWEEN 1 AND 10),
  default_weight INT NOT NULL CHECK (default_weight BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modify tasks table to use task_type_id and remove difficulty/weight
-- First, add the new columns
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_type_id INT,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS priority_score DECIMAL(10, 2) DEFAULT 0;

-- Update existing data (copy name to title, deadline to due_date, priority to priority_score)
UPDATE tasks 
SET title = name, 
    due_date = deadline, 
    priority_score = priority 
WHERE title IS NULL;

-- Add foreign key constraint
ALTER TABLE tasks 
ADD CONSTRAINT fk_task_type 
FOREIGN KEY (task_type_id) REFERENCES task_types(id) ON DELETE SET NULL;

-- Insert default task types
INSERT INTO task_types (name, default_difficulty, default_weight) VALUES
('Homework', 5, 6),
('Project', 8, 9),
('Assignment', 6, 7),
('Exam Preparation', 9, 10),
('Reading', 3, 4),
('Lab Work', 7, 8),
('Research', 8, 7),
('Group Work', 6, 6),
('Presentation', 7, 8),
('Quiz Preparation', 5, 5)
ON DUPLICATE KEY UPDATE name=name;

-- Show the results
SELECT * FROM task_types;
SELECT * FROM tasks;
