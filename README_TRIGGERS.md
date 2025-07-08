# Database Triggers Setup

This script sets up database triggers in Supabase to automatically notify your webhook handler when new profiles or uploads are created.

## Prerequisites

1. **Environment Variables**: Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (not anon key!)
   - `DB_WEBHOOK_SECRET`: A secret key for webhook authentication

2. **Dependencies**: Install the required packages:
   ```bash
   npm install
   ```

## Running the Script

### Option 1: Using tsx (recommended)
```bash
npm run setup-triggers
```

### Option 2: Using ts-node with ESM loader
```bash
npm run setup-triggers-node
```

### Option 3: Direct execution
```bash
npx tsx scripts/setup-db-triggers.ts
```

## What the Script Does

The script creates two database triggers:

1. **notify_new_profile**: Triggers when a new user profile is created
2. **notify_new_upload**: Triggers when a new file upload is created

Both triggers send HTTP requests to your Supabase Edge Function webhook handler with the new record data.

## Troubleshooting

- **Missing environment variables**: Make sure `.env.local` exists and contains all required variables
- **Permission errors**: Ensure you're using the SERVICE_ROLE_KEY, not the anon key
- **Trigger creation fails**: Check that your Supabase project has the necessary extensions enabled

## Security Note

The `DB_WEBHOOK_SECRET` should be a strong, random string that matches the secret used in your webhook handler for authentication.