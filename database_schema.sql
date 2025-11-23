-- Database setup for Task Prioritization System
-- Run these commands in phpMyAdmin

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS task_prioritization;
USE task_prioritization;

-- Users table for profile and authentication
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tasks table for task management
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  deadline DATE NOT NULL,
  difficulty INT NOT NULL,
  weight INT NOT NULL,
  priority DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default user (password is 'student123' - change this after first login)
INSERT INTO users (id, email, password, name, image) VALUES 
(1, 'student@example.com', '$2a$10$rQZ9vXqJ5YqJxKj3xGqYxOYxYqJ5YqJxKj3xGqYxOYxYqJ5YqJxKj', 'Student', NULL);

-- Sample tasks (optional)
INSERT INTO tasks (name, deadline, difficulty, weight, priority) VALUES
('Complete project documentation', '2024-06-15', 3, 5, 85.50),
('Prepare presentation slides', '2024-06-10', 2, 4, 72.30),
('Code review and testing', '2024-06-20', 4, 3, 68.00);
