import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key'

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                              process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' &&
                              process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

// Create a proper chainable mock client
const createChainableMock = (finalResult = { data: [], error: null }) => {
  const mock = {
    select: () => createChainableMock(finalResult),
    insert: () => createChainableMock(finalResult),
    update: () => createChainableMock(finalResult),
    delete: () => createChainableMock(finalResult),
    eq: () => createChainableMock(finalResult),
    neq: () => createChainableMock(finalResult),
    gt: () => createChainableMock(finalResult),
    gte: () => createChainableMock(finalResult),
    lt: () => createChainableMock(finalResult),
    lte: () => createChainableMock(finalResult),
    like: () => createChainableMock(finalResult),
    ilike: () => createChainableMock(finalResult),
    is: () => createChainableMock(finalResult),
    in: () => createChainableMock(finalResult),
    contains: () => createChainableMock(finalResult),
    containedBy: () => createChainableMock(finalResult),
    rangeGt: () => createChainableMock(finalResult),
    rangeGte: () => createChainableMock(finalResult),
    rangeLt: () => createChainableMock(finalResult),
    rangeLte: () => createChainableMock(finalResult),
    rangeAdjacent: () => createChainableMock(finalResult),
    overlaps: () => createChainableMock(finalResult),
    textSearch: () => createChainableMock(finalResult),
    match: () => createChainableMock(finalResult),
    not: () => createChainableMock(finalResult),
    or: () => createChainableMock(finalResult),
    filter: () => createChainableMock(finalResult),
    order: () => createChainableMock(finalResult),
    limit: () => createChainableMock(finalResult),
    range: () => createChainableMock(finalResult),
    abortSignal: () => createChainableMock(finalResult),
    single: () => finalResult,
    maybeSingle: () => finalResult,
    csv: () => finalResult,
    geojson: () => finalResult,
    explain: () => finalResult,
    rollback: () => createChainableMock(finalResult),
    returns: () => createChainableMock(finalResult),
    then: (resolve, reject) => Promise.resolve(finalResult).then(resolve, reject),
    catch: (reject) => Promise.resolve(finalResult).catch(reject),
    finally: (callback) => Promise.resolve(finalResult).finally(callback)
  }
  return mock
}

// Create mock clients for development when credentials are missing
const createMockClient = () => ({
  from: () => createChainableMock(),
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