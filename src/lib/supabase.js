import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin operations use the same client — RLS policies gate access by
// auth.role() = 'authenticated' (admin session) or explicit anon INSERT grants.
// The service role key must never be bundled into the frontend.
export const supabaseAdmin = supabase
