// scripts/update-supabase-auth.js

// This script updates your Supabase project's authentication settings via the Admin API.
// It's designed to be run from your local machine or a secure server in a Node.js environment.

// Load environment variables from a .env.local file.
// Make sure .env.local contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
require('dotenv').config({ path: '.env.local' });

/**
 * Main function to update Supabase Auth configuration.
 * This function is self-invoking and runs immediately when the script is executed.
 */
(async function updateSupabaseAuthConfig() {
  try {
    // --- 1. Load and Validate Environment Variables ---
    console.log('Loading environment variables from .env.local...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Ensure the required variables are present before proceeding.
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env.local file.');
    }

    // --- 2. Extract Project Reference from URL ---
    // The project reference is the unique ID for your Supabase project,
    // which is the subdomain of your project URL.
    // e.g., for "https://xyz.supabase.co", the project ref is "xyz".
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    if (!projectRef) {
        throw new Error(`Could not extract project reference from SUPABASE_URL: ${supabaseUrl}`);
    }
    console.log(`Found project reference: ${projectRef}`);

    // --- 3. Construct the Admin API URL ---
    // This is the specific endpoint for updating Auth configuration for a project.
    const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

    // --- 4. Define the Configuration Payload ---
    // These are the security settings we want to update.
    const configPayload = {
      // Set the expiration time for one-time passwords (e.g., for email magic links)
      // to 600 seconds (10 minutes). This improves security by reducing the window
      // in which a compromised email could be used to log in.
      EMAIL_OTP_EXPIRY: 600,

      // Enable Have I Been Pwned? (HIBP) password protection. This checks user passwords
      // against a database of known leaked passwords and prevents them from using
      // compromised credentials, significantly strengthening account security.
      PASSWORD_HIBP_ENABLED: true,
    };

    console.log('\nAttempting to update Supabase Auth config with these settings:');
    console.log(JSON.stringify(configPayload, null, 2));

    // --- 5. Make the API Request using Fetch ---
    // We use a PUT request to update the configuration.
    // The 'Authorization' header uses the Service Role Key for admin-level access.
    // This key must be kept secret and never exposed on the client-side.
    console.log(`\nSending PUT request to the Supabase Admin API...`);
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configPayload),
    });

    // --- 6. Handle the API Response ---
    const data = await response.json();

    if (!response.ok) {
      // If the API returns an error, throw an error with the message from the API response.
      const errorMessage = data.message || 'An unknown error occurred.';
      throw new Error(`Supabase Admin API error (${response.status}): ${errorMessage}`);
    }

    console.log('\n✅ Supabase Auth configuration updated successfully!');
    console.log('--- Current Settings ---');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('\n❌ An error occurred while updating Supabase Auth configuration.');
    console.error(error.message);
    // Exit with a non-zero code to indicate failure, useful for CI/CD pipelines.
    process.exit(1);
  }
})();