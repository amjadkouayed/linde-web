'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions are directly reachable POST endpoints. proxy.ts does not
 * protect them — a matcher change can silently drop coverage — so every action
 * here re-reads the session itself, and RLS is the backstop underneath.
 */

export type ActionResult = { error: string | null }

const ROLES = ['student', 'senior'] as const
const SENIOR_STATUSES = ['rentner', 'rentnerin', 'berufstaetig'] as const

// The database only bounds birth_year for sanity — anything involving the
// current year is not immutable and cannot live in a CHECK without going stale.
// The actual policy lives here.
const MIN_AGE = 16
const MAX_AGE = 120

function parseInterests(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? '')
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean)
    .slice(0, 20)
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = String(formData.get('role') ?? '')
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: 'Bitte wähle aus, ob du Studierende:r oder Senior:in bist.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) {
    return { error: 'Bitte gib deinen Namen an.' }
  }

  // The UI collects an age; we store the birth year, because an age column is
  // silently wrong from the person's next birthday onwards.
  const age = Number(formData.get('age'))
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return { error: `Bitte gib ein Alter zwischen ${MIN_AGE} und ${MAX_AGE} an.` }
  }
  const birthYear = new Date().getFullYear() - age

  // Only seniors carry one, and the database enforces that too.
  const rawStatus = String(formData.get('status') ?? '')
  const status =
    role === 'senior' && SENIOR_STATUSES.includes(rawStatus as (typeof SENIOR_STATUSES)[number])
      ? (rawStatus as (typeof SENIOR_STATUSES)[number])
      : null

  // Location lives on the person, not on the card (0005): the discover filter
  // is pre-filled from it, and someone who has not written an offer yet still
  // has to be able to search. Postal code only — never a street or a number.
  const postalCode = String(formData.get('postal_code') ?? '').trim()
  if (!/^\d{5}$/.test(postalCode)) {
    return { error: 'Bitte gib eine gültige fünfstellige Postleitzahl an.' }
  }
  const city = String(formData.get('city') ?? '').trim()
  if (!city) {
    return { error: 'Bitte gib deinen Ort an.' }
  }

  // profiles.id IS the auth user id, so the row can only ever be the caller's.
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    role: role as (typeof ROLES)[number],
    name,
    birth_year: birthYear,
    status,
    postal_code: postalCode,
    city,
    bio: String(formData.get('bio') ?? '').trim() || null,
    interests: parseInterests(formData.get('interests')),
    study_field: role === 'student'
      ? String(formData.get('study_field') ?? '').trim() || null
      : null,
  })

  if (error) return { error: error.message }

  refresh()
  redirect('/discover')
}

/**
 * "Meine Karte" — the offer. One per person (unique on user_id), so this
 * upserts rather than branching on whether one already exists.
 *
 * The location is NOT here: since 0005 it lives on the profile, so the offer
 * form shows it pre-filled and a change to it goes through updateMyLocation.
 */
export async function updateMyCard(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const availability = String(formData.get('availability') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  if (!availability || !description) {
    return { error: 'Verfügbarkeit und Beschreibung dürfen nicht leer sein.' }
  }

  const { error } = await supabase.from('offers').upsert(
    {
      user_id: user.id,
      availability,
      description,
      is_published: formData.get('is_published') === 'on',
    },
    { onConflict: 'user_id' },
  )

  if (error) return { error: error.message }

  // getCurrentProfile caches in the browser, so refresh the router to pick the
  // edit up immediately rather than waiting out its 30s stale window.
  refresh()
  return { error: null }
}

/**
 * Where the person is. Asked once in onboarding, editable in Profil, and shown
 * pre-filled in the offer form. lat/lng stay untouched here: they are the
 * centroid of the postal code, derived from the postal_codes table, never
 * something a client sends.
 */
export async function updateMyLocation(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postalCode = String(formData.get('postal_code') ?? '').trim()
  if (!/^\d{5}$/.test(postalCode)) {
    return { error: 'Bitte gib eine gültige fünfstellige Postleitzahl an.' }
  }
  const city = String(formData.get('city') ?? '').trim()
  if (!city) {
    return { error: 'Bitte gib deinen Ort an.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ postal_code: postalCode, city })
    .eq('id', user.id)

  if (error) return { error: error.message }

  refresh()
  return { error: null }
}

/**
 * Register that someone looked at an offer, for "34 Aufrufe diese Woche".
 *
 * The primary key is (offer_id, viewer_id, viewed_on), so a repeat view on the
 * same day conflicts and is ignored rather than inflating the count. Viewing
 * your own offer is refused by the policy, so a duplicate-key or RLS error here
 * is expected and not worth surfacing to the reader of a profile.
 */
/**
 * Edit the profile itself. Role is deliberately absent: it is chosen once at
 * onboarding and decides who you see, so changing it later would strand your
 * existing connections on the wrong side of the app.
 */
export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Bitte gib deinen Namen an.' }

  const age = Number(formData.get('age'))
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return { error: `Bitte gib ein Alter zwischen ${MIN_AGE} und ${MAX_AGE} an.` }
  }

  const rawStatus = String(formData.get('status') ?? '')
  const status = SENIOR_STATUSES.includes(rawStatus as (typeof SENIOR_STATUSES)[number])
    ? (rawStatus as (typeof SENIOR_STATUSES)[number])
    : null

  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      birth_year: new Date().getFullYear() - age,
      bio: String(formData.get('bio') ?? '').trim() || null,
      interests: parseInterests(formData.get('interests')),
      study_field: String(formData.get('study_field') ?? '').trim() || null,
      ...(status ? { status } : {}),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  refresh()
  return { error: null }
}

/**
 * Delete the caller's own card. RLS scopes the statement to their row, so the
 * .eq() is intent rather than protection. The screen confirms first: deleting
 * removes them from everyone's Discover, which is not obvious from the word.
 */
export async function deleteMyOffer(): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('offers').delete().eq('user_id', user.id)
  if (error) return { error: error.message }

  refresh()
  return { error: null }
}

export async function recordOfferView(offerId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('offer_views')
    .insert({ offer_id: offerId, viewer_id: user.id })
}
