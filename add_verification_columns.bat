@echo off
echo Adding verification columns to users table...
echo.

mysql -u root -p taskranker_db -e "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6), ADD COLUMN IF NOT EXISTS verification_code_expires DATETIME;"

echo.
echo Verification columns added successfully!
echo.
echo Checking table structure...
mysql -u root -p taskranker_db -e "DESCRIBE users;"

pause
