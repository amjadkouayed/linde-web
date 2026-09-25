'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { friendlyError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions are directly reachable POST endpoints. proxy.ts does not
 * protect them — a matcher change can silently drop coverage — so every action
 * here re-reads the session itself, and RLS is the backstop underneath.
 */

export type ActionResult = { error: string | null }

const ROLES = ['student', 'senior'] as const
const SENIOR_STATUSES = ['rentner', 'rentnerin', 'berufstaetig'] as const

// The database enforces the same bounds with a trigger (0012); checking here
// too gives a clear message instead of a refused insert.
const MIN_AGE = 18
const MAX_AGE = 100
const MAX_AVAILABILITY_LENGTH = 500
const MAX_DESCRIPTION_LENGTH = 1000

function parseInterests(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? '')
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean)
    .slice(0, 20)
}

/**
 * A photo path is only accepted from the caller's own storage folder. The
 * database refuses anything else too (0010); checking here as well turns that
 * into a clean "no photo" rather than a failed save.
 */
function ownAvatarPath(raw: FormDataEntryValue | null, userId: string): string | null {
  const path = String(raw ?? '')
  return path.startsWith(`${userId}/`) ? path : null
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = String(formData.get('role') ?? '')
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: 'Bitte wählen Sie aus, ob Sie studieren oder Seniorin bzw. Senior sind.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) {
    return { error: 'Bitte geben Sie Ihren Namen an.' }
  }
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(username)) {
    return { error: 'Bitte wählen Sie einen Nutzernamen mit 3 bis 30 Zeichen.' }
  }

  // The UI collects an age; we store the birth year, because an age column is
  // silently wrong from the person's next birthday onwards.
  const age = Number(formData.get('age'))
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return { error: `Bitte geben Sie ein Alter zwischen ${MIN_AGE} und ${MAX_AGE} an.` }
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
    return { error: 'Bitte geben Sie eine fünfstellige Postleitzahl an.' }
  }
  const city = String(formData.get('city') ?? '').trim()
  if (!city) {
    return { error: 'Bitte geben Sie Ihren Ort an.' }
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  // A second tab, or the back button, should return to the app rather than
  // attempting another insert.
  if (existingProfile) redirect('/discover')

  // profiles.id IS the auth user id, so the row can only ever be the caller's.
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    role: role as (typeof ROLES)[number],
    name,
    username,
    birth_year: birthYear,
    status,
    postal_code: postalCode,
    city,
    bio: String(formData.get('bio') ?? '').trim() || null,
    interests: parseInterests(formData.get('interests')),
    study_field: role === 'student'
      ? String(formData.get('study_field') ?? '').trim() || null
      : null,
    avatar_path: ownAvatarPath(formData.get('avatar_path'), user.id),
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Dieser Nutzername ist bereits vergeben. Bitte wählen Sie einen anderen.' }
    }
    return { error: friendlyError(error) }
  }

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
  if (availability.length > MAX_AVAILABILITY_LENGTH) {
    return { error: `Die Verfügbarkeit darf höchstens ${MAX_AVAILABILITY_LENGTH} Zeichen lang sein.` }
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Die Beschreibung darf höchstens ${MAX_DESCRIPTION_LENGTH} Zeichen lang sein.` }
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

  if (error) return { error: friendlyError(error) }

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
    return { error: 'Bitte geben Sie eine fünfstellige Postleitzahl an.' }
  }
  const city = String(formData.get('city') ?? '').trim()
  if (!city) {
    return { error: 'Bitte geben Sie Ihren Ort an.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ postal_code: postalCode, city })
    .eq('id', user.id)

  if (error) return { error: friendlyError(error) }

  refresh()
  return { error: null }
}

/** Bio and interests, editable in Profil. Name, age and role stay as onboarded. */
export async function updateMyAbout(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bio = String(formData.get('bio') ?? '').trim()
  if (bio.length > 1000) {
    return { error: 'Der Text über Sie darf höchstens 1000 Zeichen lang sein.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ bio: bio || null, interests: parseInterests(formData.get('interests')) })
    .eq('id', user.id)

  if (error) return { error: friendlyError(error) }

  refresh()
  return { error: null }
}

/**
 * Delete the caller's own card. RLS scopes the statement to their row, so the
 * .eq() is intent rather than protection. The screen confirms first: deleting
 * removes them from everyone's Discover, which is not obvious from the word.
 * Existing connections are untouched — taking your card down is not the same as
 * cutting off the people you already agreed to meet.
 */
export async function deleteMyOffer(): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('offers').delete().eq('user_id', user.id)
  if (error) return { error: friendlyError(error) }

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

/**
 * There was no way out of the app at all before this. It matters for more than
 * tidiness: on a shared or borrowed device, no sign-out means the next person
 * is signed in as you.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Set the profile photo, then delete the one it replaces. The bucket is public,
 * so an old photo left behind would stay reachable by its URL indefinitely —
 * "change my photo" has to mean the old one is gone.
 */
export async function updateMyAvatar(path: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const next = ownAvatarPath(path, user.id)
  if (!next) return { error: 'Das Foto konnte nicht gespeichert werden.' }

  const { data: before } = await supabase.from('profiles').select('avatar_path').eq('id', user.id).maybeSingle()

  const { error } = await supabase.from('profiles').update({ avatar_path: next }).eq('id', user.id)
  if (error) return { error: friendlyError(error) }

  if (before?.avatar_path && before.avatar_path !== next) {
    await supabase.storage.from('avatars').remove([before.avatar_path])
  }

  refresh()
  return { error: null }
}

/** Remove the photo entirely — the file, not just the reference to it. */
export async function removeMyAvatar(): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: before } = await supabase.from('profiles').select('avatar_path').eq('id', user.id).maybeSingle()

  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', user.id)
  if (error) return { error: friendlyError(error) }

  if (before?.avatar_path) await supabase.storage.from('avatars').remove([before.avatar_path])

  refresh()
  return { error: null }
}

/**
 * Art. 17: delete the account and everything attached to it.
 *
 * Storage first, because the database cascade cannot reach it: every file in
 * the caller's avatar folder, including any orphaned by an interrupted upload.
 * Then delete_my_account(), which removes the auth user and cascades through
 * profile, offer, connections, messages and view log.
 */
export async function deleteMyAccount(): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: files } = await supabase.storage.from('avatars').list(user.id, { limit: 1000 })
  if (files?.length) {
    await supabase.storage.from('avatars').remove(files.map((f) => `${user.id}/${f.name}`))
  }

  const { error } = await supabase.rpc('delete_my_account')
  if (error) return { error: 'Das Löschen hat nicht geklappt. Bitte versuchen Sie es noch einmal.' }

  // The user no longer exists; clear the cookie so the browser does not keep
  // presenting a session for someone who is gone.
  await supabase.auth.signOut()
  redirect('/?geloescht=1')
}
