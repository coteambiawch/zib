-- SQL script to create the dialogs table for Dialog Saver app
-- Run this in your Supabase SQL editor

-- First, let's check if the table exists and what columns it has
-- If you get errors, it means the table structure is different

-- Drop existing table if you want to recreate it completely (CAREFUL: This deletes all data!)
-- DROP TABLE IF EXISTS "demo-dialogs";

-- Create the demo-dialogs table (note: using quotes because of hyphen in name)
CREATE TABLE IF NOT EXISTS "demo-dialogs" (
    id BIGSERIAL PRIMARY KEY,
    text TEXT,
    image_url TEXT,
    user_id UUID REFERENCES custom_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists but missing columns, add them:
-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demo-dialogs' AND column_name = 'created_at') THEN
        ALTER TABLE "demo-dialogs" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demo-dialogs' AND column_name = 'updated_at') THEN
        ALTER TABLE "demo-dialogs" ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demo-dialogs' AND column_name = 'user_id') THEN
        ALTER TABLE "demo-dialogs" ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'demo-dialogs' AND column_name = 'image_url') THEN
        ALTER TABLE "demo-dialogs" ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demo_dialogs_user_id ON "demo-dialogs"(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_dialogs_created_at ON "demo-dialogs"(created_at DESC);

-- Enable Row Level Security
ALTER TABLE "demo-dialogs" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for demo-dialogs table
-- Users can view only their own dialogs
CREATE POLICY "Users can view own dialogs" ON "demo-dialogs"
    FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Users can insert their own dialogs
CREATE POLICY "Users can insert own dialogs" ON "demo-dialogs"
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Users can update their own dialogs
CREATE POLICY "Users can update own dialogs" ON "demo-dialogs"
    FOR UPDATE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Users can delete their own dialogs
CREATE POLICY "Users can delete own dialogs" ON "demo-dialogs"
    FOR DELETE USING (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_demo_dialogs_updated_at 
    BEFORE UPDATE ON "demo-dialogs" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for the table (optional - for real-time updates)
ALTER PUBLICATION supabase_realtime ADD TABLE "demo-dialogs";

-- Insert some sample data (optional - remove if you don't want sample data)
-- INSERT INTO "demo-dialogs" (text, user_id) VALUES 
-- ('Welcome to Dialog Saver! This is your first dialog.', NULL),
-- ('You can add text, images, or both to your dialogs.', NULL),
-- ('All your dialogs are saved securely in the cloud.', NULL);
