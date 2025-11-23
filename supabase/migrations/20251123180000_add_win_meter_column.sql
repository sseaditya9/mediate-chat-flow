-- Add latest_win_meter column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS latest_win_meter JSONB DEFAULT NULL;

-- Grant access to authenticated users
GRANT SELECT, UPDATE ON conversations TO authenticated;
GRANT SELECT, UPDATE ON conversations TO service_role;
