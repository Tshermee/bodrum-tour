import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin operations use the same client — access is governed by RLS policies
// that check auth.uid() IN (SELECT id FROM admin_users).
export const supabaseAdmin = supabase
