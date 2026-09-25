import 'server-only'

import { cacheLife } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { Database, Tables } from '@/lib/supabase/database.types'

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
export type OfferStats = Tables<'my_offer_stats'>
/** A discover card with an approximate distance attached. */
export type NearbyCard = Database['public']['Functions']['discover']['Returns'][number]
export type RequestCard = {
  profile_id: string
  name: string
  role: string
  bio: string | null
  interests: string[]
  study_field: string | null
  avatar_path: string | null
  status: string | null
  age: number
  offer_id: string
  availability: string
  description: string
  city: string
  postal_code: string
  created_at: string
  username: string
}

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
 * Resolve a postal code to its place name. Used to confirm what someone typed
 * ("80331 → München"), which is free typo protection, and to tell an unknown
 * code apart from a genuinely empty result.
 */
export async function lookupPostalCode(plz: string): Promise<{ plz: string; city: string } | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('postal_codes')
    .select('plz, city')
    .eq('plz', plz)
    .maybeSingle()

  return data
}

/**
 * Published offers of the opposite role within a radius, nearest first.
 *
 * One database function does the whole thing — the role, published and
 * not-already-connected filters plus the distance maths — so the mobile app
 * makes the same call and gets the same answer, and no distance arithmetic
 * lives in either client. It returns a rounded distance and never coordinates.
 */
export async function searchNearby(plz: string, radiusKm: number): Promise<NearbyCard[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('discover', {
    search_plz: plz,
    radius_km: radiusKm,
  })

  if (error) throw error
  return data ?? []
}

/** Views this week and open requests, for "Mein Angebot". */
export async function getMyOfferStats(): Promise<OfferStats | null> {
  const supabase = await createClient()

  // The view is scoped to the caller by construction, so there is nothing to
  // filter here and no way to ask for someone else's numbers.
  const { data } = await supabase.from('my_offer_stats').select('*').maybeSingle()
  return data
}

/**
 * The request screen, by username. Read from profiles rather than
 * discover_feed so the page still opens once a request exists; the caller
 * checks the role, and app.can_connect refuses anyone ineligible anyway.
 */
export async function getRequestCard(profileId: string): Promise<RequestCard | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, name, role, bio, interests, study_field, avatar_path, status, birth_year, city, postal_code')
    .eq('username', profileId)
    .maybeSingle()

  if (!profile) return null

  const { data: offer } = await supabase
    .from('offers')
    .select('id, availability, description, created_at')
    .eq('user_id', profile.id)
    .eq('is_published', true)
    .maybeSingle()

  if (!offer) return null

  return {
    profile_id: profile.id,
    username: profile.username,
    name: profile.name,
    role: profile.role,
    bio: profile.bio,
    interests: profile.interests,
    study_field: profile.study_field,
    avatar_path: profile.avatar_path,
    status: profile.status,
    age: new Date().getFullYear() - profile.birth_year,
    offer_id: offer.id,
    availability: offer.availability,
    description: offer.description,
    city: profile.city,
    postal_code: profile.postal_code,
    created_at: offer.created_at,
  }
}
