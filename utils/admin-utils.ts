// utils/admin-utils.ts

// Assumes a shared Supabase admin client is exported from './supabase.ts'
// For example:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
import { supabase } from './supabase';

/**
 * Updates a user's verification status to 'verified'.
 * This is useful for approving a user after they have provided necessary documents.
 * @param userId The UUID of the user to promote.
 * @returns The updated user profile.
 */
export async function promoteUserToVerified(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ verification_status: 'verified' })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error(`Error promoting user ${userId} to verified:`, error);
    throw new Error(`Could not promote user: ${error.message}`);
  }
  return data;
}

/**
 * Resets a user's verification status to 'pending'.
 * This can be used if a user's verification needs to be re-evaluated.
 * @param userId The UUID of the user to demote.
 * @returns The updated user profile.
 */
export async function demoteUserToGuest(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ verification_status: 'pending' })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error(`Error demoting user ${userId} to guest/pending:`, error);
    throw new Error(`Could not demote user: ${error.message}`);
  }
  return data;
}

/**
 * Retrieves the role for a specific user from their profile.
 * @param userId The UUID of the user.
 * @returns The user's role as a string (e.g., 'user', 'admin').
 */
export async function getUserRole(userId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    // If the profile doesn't exist, they have a default role.
    if (error.code === 'PGRST116') {
      return 'user';
    }
    console.error(`Error fetching role for user ${userId}:`, error);
    throw new Error('Could not fetch user role.');
  }

  return profile?.role || 'user'; // Default to 'user' if role is null
}

/**
 * Checks if a user has admin privileges based on their role.
 * @param userId The UUID of the user to check.
 * @returns A boolean indicating if the user is an admin or super_admin.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  // A user is considered an admin if their role is 'admin' or 'super_admin'.
  return role === 'admin' || role === 'super_admin';
}