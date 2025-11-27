-- Add image column to users table for profile pictures
USE taskranker_db;

ALTER TABLE users ADD COLUMN IF NOT EXISTS image LONGTEXT NULL;
