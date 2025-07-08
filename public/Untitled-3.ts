// scripts/setup-db-triggers.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.DB_WEBHOOK_SECRET;

if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// This function is now more reusable as it doesn't exit the process.
// It throws an error on failure, which the caller can handle.
async function createNewProfileTrigger() {
  console.log('🚀 Setting up trigger for new profiles...');

  const webhookUrl = 'https://nxreyyxbuwxjfmtvdkji.functions.supabase.co/db-webhook-handler';

  const triggerSql = `
    CREATE OR REPLACE TRIGGER notify_new_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE supabase_functions.http_request(
      '${webhookUrl}',
      'POST',
      '{"Content-type":"application/json", "x-webhook-secret": "${webhookSecret}"}',
      '{"type": "INSERT", "table": "profiles", "record": ' || row_to_json(NEW) || '}',
      '1000'
    );
  `;

  const { error } = await supabase.rpc('execute_sql', {
    sql_statement: triggerSql,
  });

  if (error) {
    // Throw an error to be caught by the main execution block.
    throw new Error(`Failed to create trigger: ${error.message}`);
  }

  console.log('✅ Trigger "notify_new_profile" created successfully!');
}

/**
 * Creates a trigger to notify on new document uploads.
 */
async function createUploadsTrigger() {
  console.log('🚀 Setting up trigger for new uploads...');

  const webhookUrl = 'https://nxreyyxbuwxjfmtvdkji.functions.supabase.co/db-webhook-handler';

  const triggerSql = `
    CREATE OR REPLACE TRIGGER notify_new_upload
    AFTER INSERT ON public.uploads
    FOR EACH ROW
    EXECUTE PROCEDURE supabase_functions.http_request(
      '${webhookUrl}',
      'POST',
      '{"Content-type":"application/json", "x-webhook-secret": "${webhookSecret}"}',
      '{"type": "INSERT", "table": "uploads", "record": ' || row_to_json(NEW) || '}',
      '1000'
    );
  `;

  const { error } = await supabase.rpc('execute_sql', {
    sql_statement: triggerSql,
  });

  if (error) {
    throw new Error(`Failed to create uploads trigger: ${error.message}`);
  }

  console.log('✅ Trigger "notify_new_upload" created successfully!');
}

// Main execution wrapper
async function main() {
  console.log('👋 Script has started...');
  try {
    await createNewProfileTrigger();
    await createUploadsTrigger();
  } catch (err: any) {
    console.error('❌ An error occurred during trigger setup:', err.message || err);
    process.exit(1); // Exit with an error code
  }
}

main().then(() => {
  console.log('🏁 Script finished.');
  process.exit(0); // Exit with a success code
});