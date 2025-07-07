// This is a conceptual example of a serverless function for secure login.
// It should be called by your client-side signIn function.
// File: /api/login-with-recaptcha.js

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client on the server with the service role key for security
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, token } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // You must store your secret key as an environment variable

  try {
    // 1. Verify the reCAPTCHA token with Google's API
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
    const recaptchaJson = await recaptchaRes.json();

    // 2. Check the verification result for success, score, and action
    if (!recaptchaJson.success || recaptchaJson.score < 0.5 || recaptchaJson.action !== 'login') {
      console.warn('reCAPTCHA verification failed:', recaptchaJson);
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }

    // 3. If reCAPTCHA is valid, proceed with Supabase sign-in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // 4. Return user data and session to the client
    return res.status(200).json({ user: data.user, session: data.session });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
}