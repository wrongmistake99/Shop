// src/config/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;      // ← service_role key

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'Make sure SUPABASE_URL and SUPABASE_KEY are set in Render Dashboard → Environment Variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Optional public client (if needed later)
export const supabasePublic = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY || supabaseKey
);