import { createClient } from '@supabase/supabase-js'

// Using dummy keys for now as they haven't been provided by the user yet.
// In a real scenario, these would come from import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
