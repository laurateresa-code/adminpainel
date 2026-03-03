import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://luzsdqmqnwjwgssubgsa.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enNkcW1xbndqd2dzc3ViZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzY0MTYsImV4cCI6MjA4NjMxMjQxNn0.xqHESzNSL776PLlPzfjPAu1I-VimMfM6Icp8v3VHX1s'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
