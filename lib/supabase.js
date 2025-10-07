import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key'

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                              process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' &&
                              process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

// Create mock clients for development when credentials are missing
const createMockClient = () => ({
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ data: [], error: null }),
    delete: () => ({ data: [], error: null }),
    eq: () => ({ data: [], error: null }),
    single: () => ({ data: null, error: { message: 'Environment variables not configured' } })
  }),
  auth: {
    getUser: () => ({ data: { user: null }, error: null }),
    signIn: () => ({ data: { user: null }, error: null }),
    signOut: () => ({ error: null })
  }
})

// Client for browser usage
export const supabase = hasValidSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : createMockClient()

// Admin client for server-side operations
export const supabaseAdmin = hasValidSupabaseConfig ? createClient(supabaseUrl, supabaseServiceKey) : createMockClient()