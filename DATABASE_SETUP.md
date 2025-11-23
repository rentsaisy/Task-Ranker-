# Database Setup Instructions

## Prerequisites
- XAMPP installed (includes Apache, MySQL, and phpMyAdmin)
- MySQL running on localhost

## Step-by-Step Setup

### 1. Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services

### 2. Create Database via phpMyAdmin
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click on **SQL** tab at the top
3. Open the file `database_schema.sql` from this project
4. Copy all the SQL code and paste it into the SQL query box
5. Click **Go** to execute

This will:
- Create a database named `task_prioritization`
- Create `users` table with columns: id, name, image, created_at, updated_at
- Create `tasks` table with columns: id, name, deadline, difficulty, weight, priority, created_at, updated_at
- Insert a default user (ID: 1, Name: "Student")
- Insert 3 sample tasks (optional)

### 3. Verify Database Configuration
Check that your `.env.local` file has these settings:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=task_prioritization
```

**Note:** Default XAMPP MySQL configuration uses `root` user with no password.

### 4. Test the Connection
1. Make sure your Next.js dev server is running: `npm run dev`
2. Open your browser to `http://localhost:3001` (or your configured port)
3. Click on the profile icon - it should load data from the database
4. Try updating your profile name and picture

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(255) | User's display name |
| image | LONGTEXT | Profile picture (base64 data URL) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Tasks Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(255) | Task name/title |
| deadline | DATE | Task due date |
| difficulty | INT | Difficulty level (1-5) |
| weight | INT | Task weight/importance (1-5) |
| priority | DECIMAL(10,2) | Calculated priority score |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## API Endpoints

### Profile API (`/api/profile`)
- **GET**: Fetch user profile (user ID 1)
- **POST**: Create or update user profile
  - Body: `{ name: string, image: string }`

### Tasks API (`/api/tasks`)
- **GET**: Fetch all tasks (ordered by priority DESC)
- **POST**: Create new task
  - Body: `{ name: string, deadline: string, difficulty: number, weight: number, priority: number }`
- **PUT**: Update existing task
  - Body: `{ id: number, name: string, deadline: string, difficulty: number, weight: number, priority: number }`
- **DELETE**: Delete task
  - Query param: `?id=123`

## Troubleshooting

### Cannot connect to database
- Make sure MySQL is running in XAMPP
- Check that database name is `task_prioritization`
- Verify `.env.local` credentials match your MySQL setup

### Profile not loading
- Open phpMyAdmin and verify the `users` table exists
- Check that there's a user with ID = 1
- Check browser console for API errors

### Tasks not saving
- Verify the `tasks` table exists in phpMyAdmin
- Check browser console for API errors
- Ensure all required fields are provided (name, deadline, difficulty, weight)

## Migration from localStorage

If you had previous data in localStorage:
1. The old profile data will not automatically migrate
2. You'll need to manually re-enter your profile information
3. Tasks stored in localStorage will need to be re-created using the new database system

## Next Steps

Once the database is set up, you can:
1. Update other components to use `/api/tasks` for task management
2. Add user authentication to support multiple users
3. Implement task filtering and search functionality
4. Add task categories or tags in the database schema
