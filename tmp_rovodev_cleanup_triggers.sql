-- Clean up all problematic triggers and functions
-- Run this in Supabase SQL Editor first

-- Drop all existing triggers on profiles table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles'
        AND event_object_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON public.profiles';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Drop all related functions
DROP FUNCTION IF EXISTS handle_verified_user();
DROP FUNCTION IF EXISTS notify_user_verified();
DROP FUNCTION IF EXISTS public.handle_verified_user();
DROP FUNCTION IF EXISTS public.notify_user_verified();

-- Show what was cleaned up
SELECT 'Cleanup complete - all triggers and functions removed' as status;