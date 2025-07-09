# Supabase Edge Function Setup Instructions

## 1. Deploy the Edge Function

First, make sure you have the Supabase CLI installed and logged in:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (replace with your project reference)
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the Edge Function:

```bash
# Deploy the send-verified-alert function
supabase functions deploy send-verified-alert

# Set the BREVO_API_KEY environment variable
supabase secrets set BREVO_API_KEY=your_brevo_api_key_here
```

## 2. Update the SQL Trigger

1. Open `supabase/sql/send-verified-alert-trigger.sql`
2. Replace `YOUR_PROJECT_REF` with your actual Supabase project reference
3. The URL should look like: `https://abcdefghijklmnop.supabase.co/functions/v1/send-verified-alert`

## 3. Run the SQL Trigger

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `send-verified-alert-trigger.sql`
4. Execute the SQL

## 4. Test the Setup

You can test the trigger by updating a user's verification status:

```sql
-- Test the trigger (replace with actual user ID)
UPDATE public.profiles 
SET verification_status = 'verified' 
WHERE id = 'some-user-uuid-here' 
AND verification_status != 'verified';
```

## 5. Monitor Function Logs

You can monitor the Edge Function logs in your Supabase Dashboard:

1. Go to Edge Functions
2. Click on `send-verified-alert`
3. Check the Logs tab to see function execution

## Environment Variables Required

Make sure these environment variables are set in your Supabase project:

- `BREVO_API_KEY`: Your Brevo (Sendinblue) API key

## Troubleshooting

1. **HTTP Extension Error**: If you get an error about the `http` extension, you may need to enable it manually in your Supabase project settings.

2. **Permission Errors**: Make sure the trigger function has the necessary permissions to make HTTP requests.

3. **Function Not Found**: Ensure the Edge Function is deployed and the URL in the trigger is correct.

4. **Email Not Sending**: Check that your BREVO_API_KEY is correctly set and valid.