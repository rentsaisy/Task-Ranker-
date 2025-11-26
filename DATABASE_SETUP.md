# Database Setup Instructions

## Prerequisites
- Laragon installed (includes Apache, MySQL, and phpMyAdmin)
- MySQL running on localhost

## Step-by-Step Setup

### 1. Start Laragon
1. Open Laragon
2. Click **Start All** to start Apache and MySQL services

### 2. Create Database via phpMyAdmin
1. In Laragon, click **Database** button (opens phpMyAdmin)
2. Click on **SQL** tab at the top
3. Copy all the SQL code from `database_schema.sql` below and paste it into the SQL query box
4. Click **Go** to execute

### Complete Database Schema

```sql
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

-- Insert default user (password is 'student123')
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
```

This will:
- Create a database named `taskranker_db`
- Create `users` table for authentication
- Create `task_types` table with 10 default task types (each with difficulty and weight)
- Create `tasks` table linked to task_types via foreign key
- Insert a default user (email: student@example.com, password: student123)
- Insert 10 task types with difficulty/weight settings
- Insert 3 sample tasks

### 3. Verify Database Configuration
Database connection is configured in the API routes with these settings:
```javascript
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "taskranker_db",
}
```

**Note:** Default Laragon MySQL configuration uses `root` user with no password.

### 4. Test the Connection
1. Make sure your Next.js dev server is running: `npm run dev`
2. Open your browser to `http://localhost:3000`
3. You should see the dashboard with task form
4. The task type dropdown should load with 10 task types from database

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(255) | User's display name |
| email | VARCHAR(255) | User email (unique) |
| password_hash | VARCHAR(255) | Hashed password |
| created_at | TIMESTAMP | Record creation time |

### Task Types Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(255) | Task type name |
| default_difficulty | INT | Default difficulty (1-10) |
| default_weight | INT | Default weight (1-10) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Tasks Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| title | VARCHAR(255) | Task name/title |
| due_date | DATE | Task due date |
| task_type_id | INT | Foreign key to task_types |
| priority_score | DECIMAL(10,2) | ML calculated priority (0-100) |
| status | ENUM | 'pending', 'in_progress', 'completed' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## API Endpoints

### Task Types API (`/api/task-types`)
- **GET**: Fetch all task types with difficulty and weight
- **POST**: Create new task type
  - Body: `{ name: string, default_difficulty: number, default_weight: number }`
- **PUT**: Update existing task type
  - Body: `{ id: number, name: string, default_difficulty: number, default_weight: number }`
- **DELETE**: Delete task type
  - Query param: `?id=123`

### Tasks API (`/api/tasks`)
- **GET**: Fetch all tasks with task type names (ordered by priority DESC)
- **POST**: Create new task (auto-calculates priority using ML model)
  - Body: `{ name: string, deadline: string, task_type_id: number }`
- **PUT**: Update existing task (recalculates priority)
  - Body: `{ id: number, name: string, deadline: string, task_type_id: number }`
- **DELETE**: Delete task
  - Query param: `?id=123`

### Profile API (`/api/profile`)
- **GET**: Fetch user profile
- **POST**: Update user profile
  - Body: `{ name: string }`

## Troubleshooting

### Cannot connect to database
- Make sure MySQL is running in Laragon (click Start All)
- Check that database name is `taskranker_db`
- Verify database credentials in API routes (host: localhost, user: root, password: empty)

### Task types not loading
- Open phpMyAdmin (Laragon → Database button)
- Verify the `task_types` table exists and has data
- Check browser console for API errors at `/api/task-types`
- Ensure the task_types table has at least 1 record

### Tasks not saving
- Verify the `tasks` table exists in phpMyAdmin
- Check that `task_type_id` foreign key is properly set up
- Ensure Python ML model is installed (see ML_SETUP_GUIDE.md)
- Check browser console for API errors

### Priority not calculating
- Install Python packages: `cd ml_model && pip install -r requirements.txt`
- Test ML model: `python ml_model/task_priority_model.py '{"due_date": "2025-12-01", "difficulty": 8, "weight": 9}'`
- Check that the ML model returns a priority score

## Features

### Task Type Management
- Navigate to "Input Task Type" page in sidebar
- Create custom task types with difficulty (1-10) and weight (1-10)
- Edit or delete existing task types
- Task types are used in task creation form

### ML Priority Calculation
- When creating a task, select a task type
- The system gets difficulty and weight from the task type
- Python Random Forest model calculates priority (0-100) based on:
  - Deadline urgency (days until due)
  - Task difficulty (from task type)
  - Task weight (from task type)
- Priority is automatically saved to database

### Database Integration
All features are connected to the database:
- ✅ Dashboard: Shows real tasks from database
- ✅ Task List: Full CRUD operations
- ✅ Task Types: Manage types with difficulty/weight
- ✅ Focus Mode: Loads tasks from database
- ✅ ML Priority: Calculates and stores in database

## Next Steps

Once the database is set up:
1. Create your own task types in "Input Task Type" page
2. Add tasks using the dashboard form (selects from your task types)
3. View ML-calculated priorities in the task list
4. Use Focus Mode to work on high-priority tasks
5. Install Python packages for ML functionality
