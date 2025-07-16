// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
// Use fallback values for build time when env vars might not be available
export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);