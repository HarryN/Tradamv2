-- 014_enable_realtime.sql
-- Enables Supabase Realtime for disputes and dispute_messages

BEGIN;

-- Check if the publication exists, if not create it (Supabase usually has it by default but good to be safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE dispute_messages;

COMMIT;
