import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sgesmpcdrzfgmgyewbak.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZXNtcGNkcnpmZ21neWV3YmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODQ4ODIsImV4cCI6MjA3NTg2MDg4Mn0.AW6D29GxP6bpcxNI1tn3ERYkK9_A8pbpweRfXgqo3mU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)