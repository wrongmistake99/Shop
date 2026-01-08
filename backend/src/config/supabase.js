// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // ← we'll use service_role here

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in .env');
}

// Server-side client - use service_role key for full access (bypasses RLS)
// Do NOT use this pattern in client-side code!
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,     // Server doesn't need auto-refresh
    persistSession: false,       // No browser storage needed
    detectSessionInUrl: false    // Server context
  },
  global: {
    headers: {
      // Optional: helps Supabase identify your app
      'x-application-name': 'jurisonshop-backend'
    }
  }
});

// Optional: Create a separate public client if needed later (uses anon key)
export const supabasePublic = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseKey,
  { auth: { persistSession: false } }
);