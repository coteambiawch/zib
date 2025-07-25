-- SQL script to add name field to existing custom_users table
-- Run this ONLY if you already have the custom_users table without the name field

-- Add name column to existing custom_users table
ALTER TABLE custom_users 
ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT 'Anonymous User';

-- Update existing users to have a default name (optional)
-- You can customize this query to set specific names for existing users
UPDATE custom_users 
SET name = 'User ' || SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)
WHERE name = 'Anonymous User' OR name IS NULL;

-- Alternative: Set all existing users to a generic name
-- UPDATE custom_users SET name = 'Existing User' WHERE name = 'Anonymous User' OR name IS NULL;
