// ✅ Database triggers setup script for Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.DB_WEBHOOK_SECRET;

if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
  console.error('❌ Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createNewProfileTrigger() {
  console.log('🚀 Creating "notify_new_profile" trigger...');

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

  const { error } = await supabase.rpc('execute_sql', { sql_statement: triggerSql });

  if (error) throw new Error(`❌ Failed to create trigger: ${error.message}`);
  console.log('✅ Trigger "notify_new_profile" created successfully!');
}

async function createUploadsTrigger() {
  console.log('🚀 Creating "notify_new_upload" trigger...');

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

  const { error } = await supabase.rpc('execute_sql', { sql_statement: triggerSql });

  if (error) throw new Error(`❌ Failed to create trigger: ${error.message}`);
  console.log('✅ Trigger "notify_new_upload" created successfully!');
}

async function main() {
  console.log('👋 Script started...');
  try {
    await createNewProfileTrigger();
    await createUploadsTrigger();
    console.log('🏁 All triggers created successfully.');
    process.exit(0);
  } catch (err: any) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();