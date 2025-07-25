-- Complete script to create demo-dialogs table and setup for Dialog Saver app
-- Run this in your Supabase SQL editor

-- First, create the demo-dialogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "demo-dialogs" (
    id BIGSERIAL PRIMARY KEY,
    text TEXT,
    image_url TEXT,
    user_id TEXT, -- Using TEXT to allow both UUIDs and 'anonymous-user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing demo-dialogs table (if table already existed)
ALTER TABLE "demo-dialogs" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "demo-dialogs" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "demo-dialogs" ADD COLUMN IF NOT EXISTS user_id TEXT; -- Changed to TEXT to allow 'anonymous-user'
ALTER TABLE "demo-dialogs" ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing rows to have current timestamp if created_at is null
UPDATE "demo-dialogs" SET created_at = NOW() WHERE created_at IS NULL;
UPDATE "demo-dialogs" SET updated_at = NOW() WHERE updated_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demo_dialogs_user_id ON "demo-dialogs"(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_dialogs_created_at ON "demo-dialogs"(created_at DESC);

-- Enable Row Level Security
ALTER TABLE "demo-dialogs" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable all operations for demo-dialogs" ON "demo-dialogs";
DROP POLICY IF EXISTS "Users can view own dialogs" ON "demo-dialogs";
DROP POLICY IF EXISTS "Users can insert own dialogs" ON "demo-dialogs";
DROP POLICY IF EXISTS "Users can update own dialogs" ON "demo-dialogs";
DROP POLICY IF EXISTS "Users can delete own dialogs" ON "demo-dialogs";

-- Create policies that work with custom authentication (no auth.uid())
-- Allow all users to view ALL dialogs (shared viewing)
CREATE POLICY "Allow read access to demo-dialogs" ON "demo-dialogs"
    FOR SELECT USING (true);

-- Allow users to insert dialogs
CREATE POLICY "Allow insert access to demo-dialogs" ON "demo-dialogs"
    FOR INSERT WITH CHECK (true);

-- Allow users to update only their own dialogs
CREATE POLICY "Allow update access to demo-dialogs" ON "demo-dialogs"
    FOR UPDATE USING (true);

-- Allow users to delete only their own dialogs  
CREATE POLICY "Allow delete access to demo-dialogs" ON "demo-dialogs"
    FOR DELETE USING (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE "demo-dialogs";
