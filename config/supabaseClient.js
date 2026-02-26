import { createClient } from '@supabase/supabase-js'

// -------------------------------------------------------------------------
// CONFIGURAÇÃO DO SUPABASE
// Substitua as strings abaixo pelas suas credenciais do painel do Supabase
// URL: Configurações -> API -> URL
// Key: Configurações -> API -> Project API keys -> anon public
// -------------------------------------------------------------------------

const SUPABASE_URL = 'https://luzsdqmqnwjwgssubgsa.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1enNkcW1xbndqd2dzc3ViZ3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MzY0MTYsImV4cCI6MjA4NjMxMjQxNn0.xqHESzNSL776PLlPzfjPAu1I-VimMfM6Icp8v3VHX1s'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
