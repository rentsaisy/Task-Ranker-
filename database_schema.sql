-- Database setup for Task Prioritization System
-- Run these commands in phpMyAdmin or Laragon's MySQL

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS taskranker_db;
USE taskranker_db;

-- Users table for profile and authentication
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Types table for managing task categories with difficulty and weight
CREATE TABLE IF NOT EXISTS task_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  default_difficulty INT NOT NULL CHECK (default_difficulty BETWEEN 1 AND 10),
  default_weight INT NOT NULL CHECK (default_weight BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tasks table for task management
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  due_date DATE NOT NULL,
  task_type_id INT,
  priority_score DECIMAL(10, 2) DEFAULT 0,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_type_id) REFERENCES task_types(id) ON DELETE SET NULL
);

-- Insert default user (password is 'student123' - change this after first login)
INSERT INTO users (email, password_hash, name) VALUES 
('student@example.com', '$2a$10$rQZ9vXqJ5YqJxKj3xGqYxOYxYqJ5YqJxKj3xGqYxOYxYqJ5YqJxKj', 'Student')
ON DUPLICATE KEY UPDATE name=name;

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

-- Sample tasks (optional)
INSERT INTO tasks (title, due_date, task_type_id, priority_score) VALUES
('Complete project documentation', '2025-12-15', 2, 85.50),
('Prepare presentation slides', '2025-12-10', 9, 72.30),
('Code review and testing', '2025-12-20', 2, 68.00)
ON DUPLICATE KEY UPDATE title=title;
