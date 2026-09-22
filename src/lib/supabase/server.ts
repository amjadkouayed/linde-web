import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import type { Database } from './database.types'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Every query made through it carries the caller's JWT, so RLS is what decides
 * what comes back. Never swap this for a service-role client to "fix" a query
 * returning nothing — that disables the entire security model.
 */
export async function createClient() {
  // Async in Next 16.
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Components may not set cookies. proxy.ts refreshes the
            // session on every request, so ignoring this is safe.
          }
        },
      },
    },
  )
}
