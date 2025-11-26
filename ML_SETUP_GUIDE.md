# Machine Learning Priority System Setup Guide

## ✅ What's Been Implemented

Your TaskRanker app now features a complete **Machine Learning-based Priority System**:

1. **Python ML Model** (`ml_model/task_priority_model.py`)
   - Uses Random Forest Regressor
   - Calculates priority (0-100) based on:
     - Days until deadline (urgency)
     - Task difficulty (1-10)
     - Task weight/importance (1-10)

2. **Database Integration**
   - All tasks stored in MySQL with ML-calculated `priority_score`
   - Task types store default difficulty/weight values
   - WhatsApp messages logged to database

3. **API Endpoints**
   - `/api/tasks` - Auto-calculates priority when creating/updating tasks
   - `/api/ml/calculate-priority` - Direct ML calculation endpoint
   - `/api/whatsapp/send-tasks` - Sends prioritized task list via WhatsApp

4. **Dashboard**
   - Fetches real tasks from database
   - Displays ML-calculated priorities
   - Shows statistics based on priority scores

5. **WhatsApp Integration**
   - Sends task lists sorted by ML priority
   - Bot commands: LIST, PRIORITY, TODAY, HELP

---

## 📦 Installation Steps

### Step 1: Install Python Dependencies

```powershell
# Navigate to ml_model directory
cd ml_model

# Install required packages
pip install -r requirements.txt

# Verify installation
python -c "import sklearn; import numpy; print('✅ Python packages installed successfully')"
```

### Step 2: Test ML Model

```powershell
# Test with sample task
python task_priority_model.py '{"due_date": "2025-12-01", "difficulty": 8, "weight": 9}'

# Expected output (approximate):
# {"priority": 85.67}
```

### Step 3: Install Python Dependencies

Create a virtual environment (optional but recommended):

```powershell
cd "C:\Users\USER\OneDrive\Documents\Projects\Priority Task ML Web\ml_model"
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Step 4: Start Development Server

```powershell
cd ..
npm run dev
```

### Step 5: Test the System

1. **Create a Task**:
   ```
   POST http://localhost:3000/api/tasks
   {
     "user_id": 1,
     "task_type_id": 1,
     "title": "Complete ML Assignment",
     "due_date": "2025-12-01"
   }
   ```

2. **Check Dashboard**:
   - Navigate to `http://localhost:3000`
   - Tasks should appear with ML-calculated priorities

3. **Test WhatsApp** (optional):
   - Send "LIST" command to bot
   - Receive task list sorted by priority

---

## 🧠 How the ML Model Works

### Input Features:
```python
{
  "due_date": "2025-12-01",  # Converted to days_until_due
  "difficulty": 8,            # 1-10 scale
  "weight": 9                 # 1-10 scale (importance)
}
```

### Priority Calculation:
1. **Urgency Score** (0-50 points):
   - Due today = 50 points
   - Due tomorrow = 40 points
   - Due in 3 days = 30 points
   - Due in 7 days = 20 points
   - Further out = fewer points

2. **Difficulty Score** (0-30 points):
   - Difficulty × 3
   - Harder tasks get higher priority

3. **Weight Score** (0-20 points):
   - Weight × 2
   - More important tasks prioritized

4. **Total**: 0-100 scale (normalized by ML model)

### Example Priorities:
```
Task                          | Days | Diff | Weight | Priority
------------------------------|------|------|--------|----------
Exam tomorrow                 |   1  |  10  |   10   |   95
Assignment due in 3 days      |   3  |   8  |   7    |   78
Project due next week         |   7  |   6  |   8    |   65
Reading due in 2 weeks        |  14  |   3  |   5    |   42
```

---

## 📊 Database Structure

### Tasks Table:
```sql
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_type_id INT,
    title VARCHAR(150) NOT NULL,
    due_date DATE NOT NULL,
    priority_score FLOAT,  -- ML-calculated (0-100)
    status ENUM('pending', 'completed', 'cancelled'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Task Types Table:
```sql
CREATE TABLE task_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    default_difficulty INT DEFAULT 5,  -- Used by ML model
    default_weight INT DEFAULT 5       -- Used by ML model
);
```

---

## 🔧 Troubleshooting

### Error: "Python is not installed or not in PATH"
```powershell
# Check Python installation
python --version

# If not installed, download from: https://www.python.org/downloads/
# Make sure to check "Add Python to PATH" during installation
```

### Error: "Module 'sklearn' not found"
```powershell
pip install scikit-learn numpy
```

### Error: "Failed to calculate priority"
- Check Python script path in `/api/ml/calculate-priority/route.ts`
- Verify Python packages are installed
- Check server logs for detailed error messages

### Tasks not showing in dashboard
- Verify database connection in `lib/db.ts`
- Check user_id matches in API calls
- Open browser console for errors

---

## 🚀 Next Steps

### 1. Add Authentication
Replace hardcoded `user_id = 1` with actual user authentication

### 2. Improve ML Model
- Collect real task completion data
- Retrain model with actual user patterns
- Add more features (task category, time of day, etc.)

### 3. Advanced Features
- Task dependencies (can't start task B before task A)
- Time-block scheduling (consider user's calendar)
- Collaborative tasks (shared with team members)
- Recurring tasks (daily, weekly, monthly)

### 4. Mobile App
- Build React Native app
- Push notifications for high-priority tasks
- Offline sync capability

---

## 📱 WhatsApp Commands

Once Twilio is configured:

- `LIST` - Get all incomplete tasks (sorted by priority)
- `PRIORITY` - Get only high-priority tasks (>70 score)
- `TODAY` - Get tasks due today
- `HELP` - Show available commands

---

## ✨ Success!

Your TaskRanker app now has:
- ✅ Python ML model for intelligent priority calculation
- ✅ Database-backed task management
- ✅ Real-time priority updates
- ✅ WhatsApp integration for reminders
- ✅ Modern React dashboard

**Happy tasking!** 🎯
