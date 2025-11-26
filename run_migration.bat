@echo off
echo Running Database Migration...
echo.

cd /d "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin"
mysql -u root -p taskranker_db < "C:\Users\USER\OneDrive\Documents\Projects\Priority Task ML Web\database_migration.sql"

echo.
echo Migration complete!
pause
