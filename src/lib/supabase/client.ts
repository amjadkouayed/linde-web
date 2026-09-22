'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './database.types'

/**
 * Browser client. Needed for exactly one thing: subscribing to Realtime for
 * chat. Everything else reads through the server client so data access stays
 * on the server.
 *
 * Realtime callers must re-authorise the socket when the access token rotates:
 *
 *   supabase.auth.onAuthStateChange((_event, session) => {
 *     supabase.realtime.setAuth(session?.access_token)
 *   })
 *
 * Without that the channel silently stops delivering messages after an hour —
 * the single most common "chat just stopped working" bug.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
