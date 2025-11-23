# Setup Instructions for Task Ranker

## Database Setup in Laragon

1. **Start Laragon**
   - Open Laragon and click "Start All" to start Apache and MySQL

2. **Create Database**
   - You've already created `taskranker_db` - great!

3. **Import Database Schema**
   - Open phpMyAdmin (click "Database" in Laragon or go to http://localhost/phpmyadmin)
   - Select `taskranker_db` from the left sidebar
   - Click on "SQL" tab at the top
   - Copy and paste the contents from `database_schema.sql` (starting from the "CREATE TABLE" statements)
   - Click "Go" to execute

4. **Verify Tables Created**
   - In phpMyAdmin, select `taskranker_db`
   - You should see two tables: `users` and `tasks`

## Environment Variables

Your `.env.local` file is already configured with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskranker_db
```

## Run the Application

1. Install dependencies (if not done):
   ```
   pnpm install
   ```

2. Start the development server:
   ```
   pnpm dev
   ```

3. Open http://localhost:3000

## Troubleshooting

### Registration Not Working?

Check the following:

1. **MySQL is running in Laragon**
   - Green indicator in Laragon window

2. **Database exists**
   - Open phpMyAdmin
   - Look for `taskranker_db` in the left sidebar

3. **Tables are created**
   - Click on `taskranker_db`
   - You should see `users` and `tasks` tables

4. **Check browser console and terminal**
   - Browser console (F12) will show frontend errors
   - Terminal running `pnpm dev` will show backend errors
   - Look for specific error messages like "ECONNREFUSED" or "ER_NO_SUCH_TABLE"

### Common Errors

- **ECONNREFUSED**: MySQL is not running. Start Laragon.
- **ER_BAD_DB_ERROR**: Database doesn't exist. Create `taskranker_db` in phpMyAdmin.
- **ER_NO_SUCH_TABLE**: Tables not created. Run the SQL from `database_schema.sql`.
- **ER_ACCESS_DENIED**: Wrong database credentials. Check `.env.local`.
