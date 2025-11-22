-- Enable replication for all tables safely
-- This fixes issues where specific tables might have been excluded from the publication.

DO $$
BEGIN
  -- Ensure the publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables one by one, ignoring errors if they are already members
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION WHEN duplicate_object OR sqlstate '42710' THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
  EXCEPTION WHEN duplicate_object OR sqlstate '42710' THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN duplicate_object OR sqlstate '42710' THEN NULL; END;
END
$$;
