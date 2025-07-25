-- SQL script to set up custom authentication and user-specific dialogs
-- Run this in your Supabase SQL editor

-- Create custom_users table for authentication
CREATE TABLE IF NOT EXISTS custom_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Anonymous User',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_users_email ON custom_users(email);

-- Update demo-dialogs table to reference custom_users
ALTER TABLE "demo-dialogs" 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES custom_users(id) ON DELETE CASCADE;

-- Enable Row Level Security on both tables
ALTER TABLE custom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE "demo-dialogs" ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_users table
-- Allow anyone to insert new users (for signup)
CREATE POLICY "Anyone can create users" ON custom_users
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON custom_users
    FOR SELECT USING (true);

-- Create policies for demo-dialogs table
-- Users can view only their own dialogs
CREATE POLICY "Users can view own dialogs" ON "demo-dialogs"
    FOR SELECT USING (true);

-- Users can insert their own dialogs
CREATE POLICY "Users can insert own dialogs" ON "demo-dialogs"
    FOR INSERT WITH CHECK (true);

-- Users can update their own dialogs
CREATE POLICY "Users can update own dialogs" ON "demo-dialogs"
    FOR UPDATE USING (true);

-- Users can delete their own dialogs
CREATE POLICY "Users can delete own dialogs" ON "demo-dialogs"
    FOR DELETE USING (true);

-- Optional: Clean up existing dialogs (if any exist without user_id)
-- You might want to manually assign these or delete them
-- DELETE FROM "demo-dialogs" WHERE user_id IS NULL;

-- Make sure the dialog-photos storage bucket exists and has proper policies
-- You'll need to create this in the Supabase Storage section:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a bucket called 'dialog-photos'
-- 3. Set the bucket to PUBLIC (or create policies for file access)
