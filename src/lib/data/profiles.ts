import 'server-only'

import { cacheLife } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/supabase/database.types'

/**
 * What may be cached here, and what may not.
 *
 * `use cache: private` keeps a result in the BROWSER only, never in a server
 * cache, and is the only cache scope allowed to read cookies — which the
 * Supabase client needs in order to send the user's JWT and have RLS apply. So
 * the signed-in user's own profile is cached; everything else is dynamic and
 * streams in behind a <Suspense> boundary.
 *
 * Do not reach for a plain `use cache` on a Supabase query. It cannot read
 * cookies, so the only way to make it work would be a service-role client,
 * which bypasses RLS entirely. Slow and correct beats fast and leaking.
 */

// Generated from the live schema by `npm run db:types` — never hand-write these,
// they drift the moment a column changes. View columns come back nullable
// because Postgres cannot prove otherwise through a view.
export type Profile = Tables<'profiles'>
export type Offer = Tables<'offers'>
export type DiscoverCard = Tables<'discover_feed'>

/** The signed-in user's profile, or null if they have not onboarded yet. */
export async function getCurrentProfile(): Promise<Profile | null> {
  'use cache: private'
  // stale must stay at 30s or more or this scope drops out of prefetching.
  cacheLife({ stale: 30, revalidate: 60, expire: 300 })

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return data
}

/** For screens that cannot render without a completed profile. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/onboarding')
  return profile
}

/** The signed-in user's own card, or null if they haven't written one. */
export async function getMyOffer(): Promise<Offer | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('offers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/**
 * Discover feed — one query, no N+1, nothing to filter client-side. The
 * discover_feed view already restricts this to published cards of the opposite
 * role that the caller has no connection with, and deliberately does not expose
 * coordinates.
 */
export async function getDiscoverFeed(interests?: string[]): Promise<DiscoverCard[]> {
  const supabase = await createClient()

  let query = supabase.from('discover_feed').select('*')
  if (interests?.length) {
    // Uses the GIN index on profiles.interests.
    query = query.overlaps('interests', interests)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  return data ?? []
}
