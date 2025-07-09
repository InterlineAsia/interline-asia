-- Manual Setup Script for Supabase SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- 1. Enable HTTP extension for webhooks
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Ensure verified column exists in profiles table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'verified'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added verified column to profiles table';
  ELSE
    RAISE NOTICE 'verified column already exists in profiles table';
  END IF;
END $$;

-- 3. Drop any existing triggers and functions
DROP TRIGGER IF EXISTS send_verified_alert ON public.profiles;
DROP TRIGGER IF EXISTS notify_verified_user ON public.profiles;
DROP FUNCTION IF EXISTS handle_verified_user();
DROP FUNCTION IF EXISTS notify_user_verified();

-- 4. Create the working trigger function
CREATE OR REPLACE FUNCTION public.handle_verified_user()
RETURNS TRIGGER AS $$
DECLARE
  webhook_response RECORD;
BEGIN
  -- Only proceed if verified changed to true
  IF NEW.verified = TRUE AND (OLD.verified IS DISTINCT FROM NEW.verified) THEN
    
    BEGIN
      -- Call the Edge Function webhook
      SELECT INTO webhook_response * FROM http_post(
        'https://nxreyyxbuwxjfmtvdkji.supabase.co/functions/v1/send-verified-alert',
        jsonb_build_object(
          'type', 'UPDATE',
          'table', 'profiles',
          'record', jsonb_build_object(
            'id', NEW.id::text,
            'full_name', NEW.full_name,
            'email', NEW.email,
            'verified', NEW.verified
          ),
          'old_record', jsonb_build_object(
            'verified', OLD.verified
          )
        )::text,
        'application/json'
      );
      
      -- Log success
      RAISE NOTICE 'Verification webhook called: status=%, response=%', 
        webhook_response.status, 
        left(webhook_response.content, 200);
        
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to call verification webhook: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the trigger
CREATE TRIGGER send_verified_alert
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verified_user();

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_verified_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_verified_user() TO authenticated;

-- 7. Test the setup with a sample update
-- Create/update a test user
INSERT INTO public.profiles (id, full_name, email, verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Robo Test User',
  'robo.test@example.com',
  false
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  verified = false;

-- Trigger the notification (this should send email to admin@interlineasia.com)
UPDATE public.profiles 
SET verified = true 
WHERE id = '00000000-0000-0000-0000-000000000001'
AND verified = false;

-- Check the result
SELECT id, full_name, email, verified, updated_at
FROM public.profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Show current trigger status
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'send_verified_alert';

-- Show function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_verified_user' 
AND routine_schema = 'public';