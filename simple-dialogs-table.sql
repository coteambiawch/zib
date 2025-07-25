-- Simple SQL query to create dialogs table
-- Copy and paste this into Supabase SQL Editor

CREATE TABLE "demo-dialogs" (
    id BIGSERIAL PRIMARY KEY,
    text TEXT,
    image_url TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE "demo-dialogs" ENABLE ROW LEVEL SECURITY;

-- Basic policy to allow all operations (adjust as needed)
CREATE POLICY "Enable all operations for demo-dialogs" ON "demo-dialogs"
    FOR ALL USING (true);
