-- SQL Trigger for sending verified user alerts
-- This trigger calls the send-verified-alert Edge Function when a user is verified

-- First, create the function that will call the Edge Function
CREATE OR REPLACE FUNCTION notify_user_verified()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  http_response RECORD;
BEGIN
  -- Only proceed if verification_status changed to 'verified'
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    
    -- Construct the webhook URL (replace YOUR_PROJECT_REF with your actual Supabase project reference)
    -- You'll need to update this URL with your actual project reference
    webhook_url := 'https://nxreyyxbuwxjfmtvdkji.supabase.co/functions/v1/send-verified-alert';
    
    -- Prepare the payload
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'profiles',
      'record', jsonb_build_object(
        'id', NEW.id::text,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'verification_status', NEW.verification_status
      ),
      'old_record', jsonb_build_object(
        'verification_status', OLD.verification_status
      )
    );
    
    -- Make HTTP request to Edge Function
    -- Note: This requires the http extension to be enabled
    BEGIN
      SELECT INTO http_response * FROM http_post(
        webhook_url,
        payload::text,
        'application/json'
      );
      
      -- Log the response (optional)
      RAISE NOTICE 'Webhook response: status=%, content=%', 
        http_response.status, 
        http_response.content;
        
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to call webhook: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_notify_user_verified ON public.profiles;

CREATE TRIGGER trigger_notify_user_verified
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_verified();

-- Enable the http extension (required for making HTTP requests from PostgreSQL)
-- Note: This needs to be run by a superuser or someone with the right permissions
CREATE EXTENSION IF NOT EXISTS http;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT EXECUTE ON FUNCTION notify_user_verified() TO postgres;

-- Instructions for setup:
-- 1. Replace 'YOUR_PROJECT_REF' in the webhook_url with your actual Supabase project reference
-- 2. Deploy the Edge Function first: supabase functions deploy send-verified-alert
-- 3. Run this SQL in your Supabase SQL Editor
-- 4. Test by updating a user's verification_status to 'verified'