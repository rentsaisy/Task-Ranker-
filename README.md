# Task Ranker

Task Ranker is a productivity web application designed to help users manage tasks, track focus sessions, and prioritize work using machine learning. Built with Next.js, TypeScript, and modern UI components, it offers features for task management, Pomodoro focus mode, and intelligent priority calculation.

## Features

- **Task Management**: Add, edit, and delete tasks with deadlines and types.
- **Task Types**: Define custom task types with default difficulty and weight.
- **Priority Calculation**: Uses a machine learning model to rank tasks by priority.
- **Focus Mode**: Pomodoro timer with session tracking and daily statistics.
- **Profile**: Manage user profile and settings.
- **Responsive UI**: Modern, mobile-friendly design using custom components.

## Folder Structure

```
├── app/
│   ├── api/           # API routes (auth, tasks, pomodoro, ml, etc.)
│   ├── login/         # Login page
│   ├── register/      # Register page
│   ├── ...            # Main layout and pages
├── components/
│   ├── pages/         # Page-level React components
│   ├── ui/            # Reusable UI components
│   ├── ...            # Dashboard, forms, modals, etc.
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and database logic
├── ml_model/          # Python ML model and requirements
├── public/            # Static assets
├── styles/            # Global CSS
├── ...                # Config and setup files
```

## How It Works

- **Task Management**: Users create tasks, assign types, and set deadlines. Task types can be customized for difficulty and weight.
- **Priority Calculation**: When a task is added, the backend calls a Python ML model (`ml_model/task_priority_model.py`) to calculate and refresh priorities.
- **Focus Mode**: Users can start Pomodoro sessions, track work/break durations, and view total hours worked today. Stats are updated live.
- **Profile & Settings**: Users can update their profile and configure Pomodoro settings.

## Machine Learning

- The ML model is written in Python and located in `ml_model/`. It uses task data to predict and rank priorities.
- Requirements for the ML model are listed in `ml_model/requirements.txt`.

## Getting Started

1. **Install dependencies**:
   ```sh
   pnpm install
   ```
2. **Run the development server**:
   ```sh
   pnpm dev
   ```
3. **Set up the ML model**:
   - Install Python dependencies from `ml_model/requirements.txt`.
   - Ensure the Python scripts are executable and API routes are configured to call them.

## API Routes

- `/api/auth/login` & `/api/auth/register`: User authentication
- `/api/tasks`: Task CRUD operations
- `/api/task-types`: Manage task types
- `/api/ml/calculate-priority`: ML priority calculation
- `/api/pomodoro/*`: Pomodoro actions (start, pause, resume, stats, etc.)
- `/api/profile`: User profile

## Customization

- UI components are in `components/ui/` and can be customized for branding or layout.
- Pomodoro and task logic can be adjusted in `lib/` and `app/api/pomodoro/`.

## Contributing

Pull requests and suggestions are welcome! Please open issues for bugs or feature requests.

## License

MIT

---

For more details, see the code comments and individual module documentation.
