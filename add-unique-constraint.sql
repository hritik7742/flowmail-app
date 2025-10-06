-- Add unique constraint to ensure no duplicate unique codes
-- Run this SQL in your Supabase SQL editor

-- Add unique constraint on unique_code column
ALTER TABLE users 
ADD CONSTRAINT unique_code_constraint UNIQUE (unique_code);

-- Create index for better performance on unique_code lookups
CREATE INDEX IF NOT EXISTS idx_users_unique_code ON users(unique_code);

-- Success message
SELECT 'Unique constraint added successfully - no duplicate codes possible!' as message;